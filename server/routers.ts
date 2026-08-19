import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { completeZipImport, createZipImport, failZipImport, getMediaTracks, getModuleProgressByUserId, getPdfTranslationDocument, getPdfTranslations, getVideoProcessingHistory, getVideoProcessingPreference, getZipImportByZipId, getZipImportsWithVideos, queuePdfTranslation, restartZipImport, reviewPdfVisualLocalization, savePdfVisualLocalization, setModuleProgress, setPdfTranslationPriority, setVideoProcessingPreference } from "./db";
import { DubbingSetupSchema, dubbingSetup, DriveCatalogSchema, getContentType, orderedModules, PdfTranslationDocumentSchema, PdfTranslationSetupSchema, PdfTranslationSummarySchema, pdfTranslationSetup, VideoProcessingSetupSchema, videoProcessingSetup, type DriveCourse } from "../shared/learning";
import { extractPublicDriveZip } from "./zipImport";
import { dispatchQueuedVideos, isProcessorConfigured, type VideoProcessorMode } from "./videoProcessorDispatch";
import { generateImage } from "./_core/imageGeneration";

const CATALOG_PATH = "/manus-storage/drive_courses_inventory_with_kinobody_d70d6ad9.json";
let catalogCache: DriveCourse[] | null = null;
const extractedVideoSchema = z.object({ id: z.number(), title: z.string(), storageUrl: z.string().nullable(), sourceMimeType: z.string(), mimeType: z.string().nullable(), sizeBytes: z.number().nullable(), sortOrder: z.number(), processingStatus: z.enum(["queued", "processing", "ready", "failed"]), processingMessage: z.string().nullable(), wasTranscoded: z.boolean() });
const zipImportSchema = z.object({ id: z.number(), zipId: z.string(), courseId: z.string(), sourceName: z.string(), sourceBytes: z.number().nullable(), status: z.enum(["processing", "ready", "failed"]), errorMessage: z.string().nullable(), videos: z.array(extractedVideoSchema) });
const mediaTrackSchema = z.object({ id: z.number(), extractedVideoId: z.number(), language: z.string(), kind: z.enum(["dubbed_video", "captions"]), label: z.string(), storageUrl: z.string(), mimeType: z.string(), provider: z.string() });
const videoProcessingHistorySchema = z.object({ id: z.number(), extractedVideoId: z.number(), title: z.string(), sourceName: z.string(), sourceMimeType: z.string(), status: z.enum(["queued", "processing", "ready", "failed"]), progressPercent: z.number().min(0).max(100), processingMode: z.enum(["local-worker", "persistent-worker"]).nullable(), message: z.string().nullable(), createdAt: z.date() });

function serializePdfTranslation(document: Awaited<ReturnType<typeof getPdfTranslations>>[number]) {
  return { id: document.id, courseId: document.courseId, moduleId: document.moduleId, sourceUrl: document.sourceUrl, sourceLanguage: document.sourceLanguage, targetLanguage: document.targetLanguage, status: document.status, processingMode: document.processingMode, priority: document.priority, reconstructedStorageUrl: document.reconstructedStorageUrl, pageCount: document.pageCount, errorMessage: document.errorMessage, preparedAt: document.preparedAt };
}

function serializePdfTranslationDocument(document: NonNullable<Awaited<ReturnType<typeof getPdfTranslationDocument>>>) {
  return {
    ...serializePdfTranslation(document),
    segments: document.segments.map((segment) => ({ id: segment.id, pageNumber: segment.pageNumber, segmentOrder: segment.segmentOrder, sourceText: segment.sourceText, translatedText: segment.translatedText })),
    visualLocalizations: document.visualLocalizations.map((visual) => ({ id: visual.id, pageNumber: visual.pageNumber, sourceImageUrl: visual.sourceImageUrl, localizedStorageUrl: visual.localizedStorageUrl, sourceText: visual.sourceText, translatedText: visual.translatedText, status: visual.status, provider: visual.provider, errorMessage: visual.errorMessage, reviewedAt: visual.reviewedAt })),
  };
}

function serializeImportedVideo(video: Awaited<ReturnType<typeof getZipImportsWithVideos>>[number]["videos"][number]) {
  return {
    id: video.id,
    title: video.title,
    storageUrl: video.storageUrl,
    sourceMimeType: video.sourceMimeType,
    mimeType: video.mimeType,
    sizeBytes: video.sizeBytes,
    sortOrder: video.sortOrder,
    processingStatus: video.processingStatus,
    processingMessage: video.processingMessage,
    wasTranscoded: video.wasTranscoded,
  };
}

async function getCurrentVideoProcessingSetup() {
  const imports = await getZipImportsWithVideos();
  const availability = { queued: 0, processing: 0, ready: 0, failed: 0, transcoded: 0 };
  for (const video of imports.flatMap((item) => item.videos)) {
    availability[video.processingStatus] += 1;
    if (video.wasTranscoded && video.processingStatus === "ready") availability.transcoded += 1;
  }
  const pilotComplete = availability.transcoded > 0;
  const preference = await getVideoProcessingPreference();
  const selectedMode = preference?.selectedMode ?? null;
  const modeAvailability = { localWorker: isProcessorConfigured("local-worker"), persistentWorker: isProcessorConfigured("persistent-worker") };
  const hasConfiguredWorker = selectedMode === "local-worker" ? modeAvailability.localWorker : selectedMode === "persistent-worker" ? modeAvailability.persistentWorker : false;
  return {
    ...videoProcessingSetup,
    status: pilotComplete ? "pilot_ready" as const : "placeholder" as const,
    workerStatus: hasConfiguredWorker ? "configured" as const : pilotComplete ? "pilot_complete" as const : "not_configured" as const,
    activeMode: hasConfiguredWorker ? selectedMode : null,
    selectedMode,
    modeAvailability,
    availability,
  };
}

async function loadCatalog(origin: string): Promise<DriveCourse[]> {
  if (catalogCache) return catalogCache;
  const response = await fetch(`${origin}${CATALOG_PATH}`);
  if (!response.ok) throw new Error("No se pudo cargar el catálogo de cursos.");
  const payload = DriveCatalogSchema.safeParse(await response.json());
  if (!payload.success) throw new Error("El catálogo de cursos tiene un formato no válido.");
  catalogCache = payload.data;
  return catalogCache;
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  learning: router({
    catalog: publicProcedure.output(DriveCatalogSchema).query(async ({ ctx }) => {
      const host = ctx.req.get("host");
      const origin = host ? `${ctx.req.protocol}://${host}` : "http://localhost:3000";
      return loadCatalog(origin);
    }),
    progress: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      return getModuleProgressByUserId(ctx.user.id);
    }),
    setModuleProgress: protectedProcedure.input(z.object({
      courseId: z.string().min(1).max(128),
      moduleId: z.string().min(1).max(128),
      completed: z.boolean(),
    })).mutation(async ({ ctx, input }) => {
      await setModuleProgress({ userId: ctx.user.id, ...input });
      return { success: true } as const;
    }),
    zipImports: publicProcedure.output(z.array(zipImportSchema)).query(async () => {
      const imports = await getZipImportsWithVideos();
      return imports.map((item) => ({
        id: item.id,
        zipId: item.zipId,
        courseId: item.courseId,
        sourceName: item.sourceName,
        sourceBytes: item.sourceBytes,
        status: item.status,
        errorMessage: item.errorMessage,
        videos: item.videos.map(serializeImportedVideo),
      }));
    }),
    mediaTracks: publicProcedure.output(z.array(mediaTrackSchema)).query(async () => {
      const tracks = await getMediaTracks();
      return tracks.map((track) => ({ id: track.id, extractedVideoId: track.extractedVideoId, language: track.language, kind: track.kind, label: track.label, storageUrl: track.storageUrl, mimeType: track.mimeType, provider: track.provider }));
    }),
    videoProcessingSetup: publicProcedure.output(VideoProcessingSetupSchema).query(() => getCurrentVideoProcessingSetup()),
    videoProcessingHistory: adminProcedure.output(z.array(videoProcessingHistorySchema)).query(() => getVideoProcessingHistory()),
    setVideoProcessingMode: adminProcedure.input(z.object({ mode: z.enum(["local-worker", "persistent-worker"]) })).mutation(async ({ ctx, input }) => {
      await setVideoProcessingPreference({ selectedMode: input.mode, updatedByUserId: ctx.user.id });
      return getCurrentVideoProcessingSetup();
    }),
    dubbingSetup: publicProcedure.output(DubbingSetupSchema).query(() => dubbingSetup),
    pdfTranslationSetup: publicProcedure.output(PdfTranslationSetupSchema).query(() => pdfTranslationSetup),
    pdfTranslations: publicProcedure.output(z.array(PdfTranslationSummarySchema)).query(async () => (await getPdfTranslations()).map(serializePdfTranslation)),
    pdfTranslation: publicProcedure.input(z.object({ courseId: z.string().min(1).max(128), moduleId: z.string().min(1).max(128) })).output(PdfTranslationDocumentSchema.nullable()).query(async ({ input }) => {
      const document = await getPdfTranslationDocument(input.courseId, input.moduleId);
      return document ? serializePdfTranslationDocument(document) : null;
    }),
    preparePdfTranslation: adminProcedure.input(z.object({ courseId: z.string().min(1).max(128), moduleId: z.string().min(1).max(128), sourceUrl: z.string().url() })).output(PdfTranslationDocumentSchema.nullable()).mutation(async ({ ctx, input }) => {
      const document = await queuePdfTranslation({ ...input, preparedByUserId: ctx.user.id });
      return document ? serializePdfTranslationDocument(document) : null;
    }),
    setPdfTranslationPriority: adminProcedure.input(z.object({ id: z.number().int().positive(), priority: z.number().int().min(1).max(999) })).output(z.void()).mutation(async ({ input }) => {
      await setPdfTranslationPriority(input);
    }),
    prepareCoursePdfTranslations: adminProcedure.input(z.object({ courseId: z.string().min(1).max(128) })).output(z.object({ queued: z.number().int().nonnegative(), alreadyReady: z.number().int().nonnegative() })).mutation(async ({ ctx, input }) => {
      const host = ctx.req.get("host");
      const catalog = await loadCatalog(host ? `${ctx.req.protocol}://${host}` : "http://localhost:3000");
      const course = catalog.find((item) => item.id === input.courseId);
      if (!course) throw new Error("El curso solicitado no pertenece al catálogo autorizado.");
      const pdfs = orderedModules(course.children).filter((item) => getContentType(item) === "pdf");
      let queued = 0;
      let alreadyReady = 0;
      for (const pdf of pdfs) {
        const document = await queuePdfTranslation({ courseId: course.id, moduleId: pdf.id, sourceUrl: pdf.webViewLink, preparedByUserId: ctx.user.id });
        if (document?.status === "ready") alreadyReady += 1;
        else queued += 1;
      }
      return { queued, alreadyReady };
    }),
    localizePdfImage: adminProcedure.input(z.object({ courseId: z.string().min(1).max(128), moduleId: z.string().min(1).max(128), pageNumber: z.number().int().positive(), sourceImageUrl: z.string().min(1).max(1200), sourceText: z.string().min(1).max(8000), translatedText: z.string().min(1).max(8000) })).output(PdfTranslationDocumentSchema.nullable()).mutation(async ({ ctx, input }) => {
      if (!input.sourceImageUrl.includes("/manus-storage/")) throw new Error("La imagen de origen debe estar publicada en el almacenamiento gestionado del proyecto.");
      await savePdfVisualLocalization({ ...input, status: "rendering", provider: "image-service", preparedByUserId: ctx.user.id });
      const host = ctx.req.get("host");
      const origin = host ? `${ctx.req.protocol}://${host}` : "http://localhost:3000";
      const sourceImageUrl = input.sourceImageUrl.startsWith("http") ? input.sourceImageUrl : `${origin}${input.sourceImageUrl}`;
      try {
        const result = await generateImage({
          model: "MODEL_GPT_IMAGE_2",
          quality: "high",
          originalImages: [{ url: sourceImageUrl, mimeType: "image/png" }],
          prompt: `Edit the provided image. Replace only this visible English text: “${input.sourceText}”. Render this exact Spanish text in the same visual position, hierarchy, and style: “${input.translatedText}”. Preserve the people, objects, background, layout, colors, perspective, non-target text, and all other details. Do not add or remove content. The Spanish text must be clearly readable and spelled exactly as supplied.`,
        });
        const document = await savePdfVisualLocalization({ ...input, localizedStorageUrl: result.url ?? null, status: "review", provider: "image-service", preparedByUserId: ctx.user.id });
        return document ? serializePdfTranslationDocument(document) : null;
      } catch (error) {
        const message = error instanceof Error ? error.message : "La localización visual no pudo completarse.";
        await savePdfVisualLocalization({ ...input, status: "failed", provider: "image-service", errorMessage: message, preparedByUserId: ctx.user.id });
        throw new Error(message);
      }
    }),
    reviewPdfVisualLocalization: adminProcedure.input(z.object({ id: z.number().int().positive(), approved: z.boolean(), courseId: z.string().min(1).max(128), moduleId: z.string().min(1).max(128) })).output(PdfTranslationDocumentSchema.nullable()).mutation(async ({ input }) => {
      await reviewPdfVisualLocalization({ id: input.id, approved: input.approved });
      const document = await getPdfTranslationDocument(input.courseId, input.moduleId);
      return document ? serializePdfTranslationDocument(document) : null;
    }),
    prepareZip: adminProcedure.input(z.object({ zipId: z.string().min(1).max(128), courseId: z.string().min(1).max(128) })).output(zipImportSchema).mutation(async ({ ctx, input }) => {
      const host = ctx.req.get("host");
      const catalog = await loadCatalog(host ? `${ctx.req.protocol}://${host}` : "http://localhost:3000");
      const course = catalog.find((item) => item.id === input.courseId);
      const zip = course?.children.find((item) => item.id === input.zipId && getContentType(item) === "zip");
      if (!course || !zip) throw new Error("El archivo ZIP solicitado no pertenece al catálogo autorizado.");

      const existing = await getZipImportByZipId(zip.id);
      if (existing?.status === "ready") {
        const allImports = await getZipImportsWithVideos();
        const imported = allImports.find((item) => item.id === existing.id)!;
        return { ...imported, videos: imported.videos.map(serializeImportedVideo) };
      }
      if (existing?.status === "processing") throw new Error("Este ZIP ya se está preparando. Espera a que finalice antes de reintentarlo.");

      if (existing?.status === "failed") await restartZipImport(existing.id);
      const importRecord = existing ?? await createZipImport({ zipId: zip.id, courseId: course.id, sourceName: zip.name, importedByUserId: ctx.user.id });
      try {
        const extracted = await extractPublicDriveZip({ zipId: zip.id, sourceName: zip.name, importId: importRecord.id });
        await completeZipImport({ importId: importRecord.id, sourceBytes: extracted.sourceBytes, videos: extracted.videos });
        const allImports = await getZipImportsWithVideos();
        const imported = allImports.find((item) => item.id === importRecord.id)!;
        const preference = await getVideoProcessingPreference();
        await dispatchQueuedVideos(imported.videos.filter((video) => video.processingStatus === "queued").map((video) => ({ id: video.id, sourcePath: video.sourcePath })), (preference?.selectedMode ?? null) as VideoProcessorMode | null);
        return { ...imported, videos: imported.videos.map(serializeImportedVideo) };
      } catch (error) {
        const message = error instanceof Error ? error.message : "La importación falló.";
        await failZipImport(importRecord.id, message);
        throw new Error(message);
      }
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
