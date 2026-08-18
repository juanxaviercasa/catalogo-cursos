import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { completeZipImport, createZipImport, failZipImport, getModuleProgressByUserId, getZipImportByZipId, getZipImportsWithVideos, restartZipImport, setModuleProgress } from "./db";
import { DubbingSetupSchema, dubbingSetup, DriveCatalogSchema, getContentType, VideoProcessingSetupSchema, videoProcessingSetup, type DriveCourse } from "../shared/learning";
import { extractPublicDriveZip } from "./zipImport";

const CATALOG_PATH = "/manus-storage/drive_courses_inventory_8a9ad92a.json";
let catalogCache: DriveCourse[] | null = null;
const extractedVideoSchema = z.object({ id: z.number(), title: z.string(), storageUrl: z.string(), mimeType: z.string(), sizeBytes: z.number(), sortOrder: z.number() });
const zipImportSchema = z.object({ id: z.number(), zipId: z.string(), courseId: z.string(), sourceName: z.string(), sourceBytes: z.number().nullable(), status: z.enum(["processing", "ready", "failed"]), errorMessage: z.string().nullable(), videos: z.array(extractedVideoSchema) });

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
        videos: item.videos.map((video) => ({ id: video.id, title: video.title, storageUrl: video.storageUrl, mimeType: video.mimeType, sizeBytes: video.sizeBytes, sortOrder: video.sortOrder })),
      }));
    }),
    videoProcessingSetup: publicProcedure.output(VideoProcessingSetupSchema).query(() => videoProcessingSetup),
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
        return { ...imported, videos: imported.videos.map((video) => ({ id: video.id, title: video.title, storageUrl: video.storageUrl, mimeType: video.mimeType, sizeBytes: video.sizeBytes, sortOrder: video.sortOrder })) };
      }
      if (existing?.status === "processing") throw new Error("Este ZIP ya se está preparando. Espera a que finalice antes de reintentarlo.");

      if (existing?.status === "failed") await restartZipImport(existing.id);
      const importRecord = existing ?? await createZipImport({ zipId: zip.id, courseId: course.id, sourceName: zip.name, importedByUserId: ctx.user.id });
      try {
        const extracted = await extractPublicDriveZip({ zipId: zip.id, sourceName: zip.name, importId: importRecord.id });
        await completeZipImport({ importId: importRecord.id, sourceBytes: extracted.sourceBytes, videos: extracted.videos });
        const allImports = await getZipImportsWithVideos();
        const imported = allImports.find((item) => item.id === importRecord.id)!;
        return { ...imported, videos: imported.videos.map((video) => ({ id: video.id, title: video.title, storageUrl: video.storageUrl, mimeType: video.mimeType, sizeBytes: video.sizeBytes, sortOrder: video.sortOrder })) };
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
