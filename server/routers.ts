import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { completeZipImport, createZipImport, failZipImport, getMediaTracks, getModuleProgressByUserId, getZipImportByZipId, getZipImportsWithVideos, restartZipImport, setModuleProgress } from "./db";
import { DubbingSetupSchema, dubbingSetup, DriveCatalogSchema, getContentType, VideoProcessingSetupSchema, videoProcessingSetup, type DriveCourse } from "../shared/learning";
import { extractPublicDriveZip } from "./zipImport";
import { dispatchQueuedVideos } from "./videoProcessorDispatch";

const CATALOG_PATH = "/manus-storage/drive_courses_inventory_8a9ad92a.json";
let catalogCache: DriveCourse[] | null = null;
const extractedVideoSchema = z.object({ id: z.number(), title: z.string(), storageUrl: z.string().nullable(), sourceMimeType: z.string(), mimeType: z.string().nullable(), sizeBytes: z.number().nullable(), sortOrder: z.number(), processingStatus: z.enum(["queued", "processing", "ready", "failed"]), processingMessage: z.string().nullable(), wasTranscoded: z.boolean() });
const zipImportSchema = z.object({ id: z.number(), zipId: z.string(), courseId: z.string(), sourceName: z.string(), sourceBytes: z.number().nullable(), status: z.enum(["processing", "ready", "failed"]), errorMessage: z.string().nullable(), videos: z.array(extractedVideoSchema) });
const mediaTrackSchema = z.object({ id: z.number(), extractedVideoId: z.number(), language: z.string(), kind: z.enum(["dubbed_video", "captions"]), label: z.string(), storageUrl: z.string(), mimeType: z.string(), provider: z.string() });

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
  const configuredMode: "local-worker" | "persistent-worker" | null = process.env.VIDEO_PROCESSOR_MODE === "local-worker" || process.env.VIDEO_PROCESSOR_MODE === "persistent-worker" ? process.env.VIDEO_PROCESSOR_MODE : null;
  const hasConfiguredWorker = Boolean(configuredMode && process.env.VIDEO_PROCESSOR_URL && process.env.VIDEO_PROCESSOR_SHARED_SECRET);
  return {
    ...videoProcessingSetup,
    status: pilotComplete ? "pilot_ready" as const : "placeholder" as const,
    workerStatus: hasConfiguredWorker ? "configured" as const : pilotComplete ? "pilot_complete" as const : "not_configured" as const,
    activeMode: hasConfiguredWorker ? configuredMode : null,
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
    dubbingSetup: publicProcedure.output(DubbingSetupSchema).query(() => dubbingSetup),
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
        await dispatchQueuedVideos(imported.videos.filter((video) => video.processingStatus === "queued").map((video) => ({ id: video.id, sourcePath: video.sourcePath })));
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
