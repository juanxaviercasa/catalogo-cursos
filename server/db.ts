import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { extractedVideos, InsertUser, moduleProgress, users, zipImports } from "../drizzle/schema";
import type { ExtractedVideo as ImportedVideo } from "./zipImport";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getModuleProgressByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(moduleProgress).where(eq(moduleProgress.userId, userId));
}

export async function setModuleProgress(input: {
  userId: number;
  courseId: string;
  moduleId: string;
  completed: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");

  const completedAt = input.completed ? new Date() : null;
  await db.insert(moduleProgress).values({ ...input, completedAt }).onDuplicateKeyUpdate({
    set: { courseId: input.courseId, completed: input.completed, completedAt },
  });
}

export async function getZipImportsWithVideos() {
  const db = await getDb();
  if (!db) return [];
  const imports = await db.select().from(zipImports);
  const videos = await db.select().from(extractedVideos).orderBy(asc(extractedVideos.sortOrder));
  return imports.map((item) => ({ ...item, videos: videos.filter((video) => video.zipImportId === item.id) }));
}

export async function getZipImportByZipId(zipId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(zipImports).where(eq(zipImports.zipId, zipId)).limit(1);
  return result[0];
}

export async function createZipImport(input: { zipId: string; courseId: string; sourceName: string; importedByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  await db.insert(zipImports).values(input);
  const created = await getZipImportByZipId(input.zipId);
  if (!created) throw new Error("No se pudo registrar la importación.");
  return created;
}

export async function completeZipImport(input: { importId: number; sourceBytes: number | null; videos: ImportedVideo[] }) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  for (const video of input.videos) {
    await db.insert(extractedVideos).values({ zipImportId: input.importId, ...video });
  }
  await db.update(zipImports).set({ status: "ready", sourceBytes: input.sourceBytes, importedAt: new Date(), errorMessage: null }).where(eq(zipImports.id, input.importId));
}

export async function failZipImport(importId: number, message: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(zipImports).set({ status: "failed", errorMessage: message.slice(0, 2000) }).where(eq(zipImports.id, importId));
}

export async function restartZipImport(importId: number) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  await db.update(zipImports).set({ status: "processing", errorMessage: null, sourceBytes: null }).where(eq(zipImports.id, importId));
}

// TODO: add feature queries here as your schema grows.
