import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getModuleProgressByUserId, setModuleProgress } from "./db";
import { DriveCatalogSchema, type DriveCourse } from "../shared/learning";

const CATALOG_PATH = "/manus-storage/drive_courses_inventory_8a9ad92a.json";
let catalogCache: DriveCourse[] | null = null;

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
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
