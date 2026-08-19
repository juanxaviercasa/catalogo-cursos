import { asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { extractedVideos, InsertUser, mediaTracks, moduleProgress, pdfTranslationSegments, pdfTranslations, pdfVisualLocalizations, users, videoProcessingEvents, videoProcessingPreferences, zipImports } from "../drizzle/schema";
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

export async function getMediaTracks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mediaTracks);
}

export async function getZipImportByZipId(zipId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(zipImports).where(eq(zipImports.zipId, zipId)).limit(1);
  return result[0];
}

export async function getZipImportById(importId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(zipImports).where(eq(zipImports.id, importId)).limit(1);
  return result[0];
}

export async function getExtractedVideoById(videoId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(extractedVideos).where(eq(extractedVideos.id, videoId)).limit(1);
  return result[0];
}

export type VideoProcessingMode = "local-worker" | "persistent-worker";

const processingProgress: Record<"queued" | "processing" | "ready" | "failed", number> = { queued: 10, processing: 60, ready: 100, failed: 100 };

const processingEventMessage: Record<"queued" | "processing" | "ready" | "failed", string> = {
  queued: "En cola para convertir a MP4 compatible.",
  processing: "Analizando códecs y preparando el MP4.",
  ready: "MP4 disponible para reproducirse.",
  failed: "La conversión no pudo completarse.",
};

export async function getVideoProcessingPreference() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(videoProcessingPreferences).orderBy(desc(videoProcessingPreferences.updatedAt)).limit(1);
  return result[0];
}

export async function setVideoProcessingPreference(input: { selectedMode: VideoProcessingMode; updatedByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  const existing = await getVideoProcessingPreference();
  if (existing) {
    await db.update(videoProcessingPreferences).set({ selectedMode: input.selectedMode, updatedByUserId: input.updatedByUserId }).where(eq(videoProcessingPreferences.id, existing.id));
  } else {
    await db.insert(videoProcessingPreferences).values(input);
  }
}

export async function setExtractedVideoProcessingStatus(input: {
  videoId: number;
  status: "queued" | "processing" | "ready" | "failed";
  message?: string | null;
  storage?: { key: string; url: string; mimeType: string; sizeBytes: number };
}) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  if (input.status === "ready" && !input.storage) throw new Error("Un vídeo listo debe incluir el MP4 almacenado.");

  await db.update(extractedVideos).set({
    processingStatus: input.status,
    processingMessage: input.message ?? null,
    storageKey: input.storage?.key,
    storageUrl: input.storage?.url,
    mimeType: input.storage?.mimeType,
    sizeBytes: input.storage?.sizeBytes,
    wasTranscoded: input.status === "ready" ? true : undefined,
    processedAt: input.status === "ready" ? new Date() : null,
  }).where(eq(extractedVideos.id, input.videoId));
  const preference = await getVideoProcessingPreference();
  await db.insert(videoProcessingEvents).values({
    extractedVideoId: input.videoId,
    status: input.status,
    progressPercent: processingProgress[input.status],
    processingMode: preference?.selectedMode ?? null,
    message: input.message ?? processingEventMessage[input.status],
  });
}

export async function getVideoProcessingHistory() {
  const db = await getDb();
  if (!db) return [];
  const [events, imports] = await Promise.all([
    db.select().from(videoProcessingEvents).orderBy(desc(videoProcessingEvents.createdAt), desc(videoProcessingEvents.id)).limit(250),
    getZipImportsWithVideos(),
  ]);
  const videosById = new Map(imports.flatMap((item) => item.videos.map((video) => [video.id, { video, sourceName: item.sourceName }] as const)));
  return events.flatMap((event) => {
    const context = videosById.get(event.extractedVideoId);
    return context ? [{ ...event, title: context.video.title, sourceMimeType: context.video.sourceMimeType, sourceName: context.sourceName }] : [];
  });
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
  const preference = await getVideoProcessingPreference();
  const importedVideos = await db.select().from(extractedVideos).where(eq(extractedVideos.zipImportId, input.importId));
  for (const video of importedVideos) {
    await db.insert(videoProcessingEvents).values({
      extractedVideoId: video.id,
      status: video.processingStatus,
      progressPercent: processingProgress[video.processingStatus],
      processingMode: preference?.selectedMode ?? null,
      message: video.processingMessage ?? (video.processingStatus === "ready" ? "Vídeo compatible disponible sin conversión." : processingEventMessage[video.processingStatus]),
    });
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

export type PdfTranslationStatus = "queued" | "extracting" | "translating" | "reconstructing" | "ready" | "failed";

export async function getPdfTranslations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pdfTranslations).orderBy(desc(pdfTranslations.updatedAt));
}

export async function getPdfTranslationDocument(courseId: string, moduleId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const document = (await db.select().from(pdfTranslations).where(eq(pdfTranslations.courseId, courseId)).limit(25)).find((item) => item.moduleId === moduleId);
  if (!document) return undefined;
  const segments = await db.select().from(pdfTranslationSegments).where(eq(pdfTranslationSegments.pdfTranslationId, document.id)).orderBy(asc(pdfTranslationSegments.pageNumber), asc(pdfTranslationSegments.segmentOrder));
  const visualLocalizations = await db.select().from(pdfVisualLocalizations).where(eq(pdfVisualLocalizations.pdfTranslationId, document.id)).orderBy(asc(pdfVisualLocalizations.pageNumber));
  return { ...document, segments, visualLocalizations };
}

export async function queuePdfTranslation(input: { courseId: string; moduleId: string; sourceUrl: string; preparedByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  const existing = await getPdfTranslationDocument(input.courseId, input.moduleId);
  if (existing?.status === "ready" || ["extracting", "translating", "reconstructing"].includes(existing?.status ?? "")) return existing;
  if (existing) {
    await db.update(pdfTranslations).set({ status: "queued", errorMessage: null, preparedByUserId: input.preparedByUserId }).where(eq(pdfTranslations.id, existing.id));
  } else {
    await db.insert(pdfTranslations).values({ ...input, status: "queued", processingMode: "local-worker" });
  }
  return getPdfTranslationDocument(input.courseId, input.moduleId);
}

export async function savePdfTranslationResult(input: {
  courseId: string;
  moduleId: string;
  sourceUrl: string;
  reconstructedStorageKey: string;
  reconstructedStorageUrl: string;
  pageCount: number;
  segments: Array<{ pageNumber: number; segmentOrder: number; sourceText: string; translatedText: string }>;
  preparedByUserId?: number | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  const existing = await getPdfTranslationDocument(input.courseId, input.moduleId);
  if (existing) {
    await db.update(pdfTranslations).set({ sourceUrl: input.sourceUrl, status: "ready", reconstructedStorageKey: input.reconstructedStorageKey, reconstructedStorageUrl: input.reconstructedStorageUrl, pageCount: input.pageCount, errorMessage: null, preparedByUserId: input.preparedByUserId ?? existing.preparedByUserId, preparedAt: new Date() }).where(eq(pdfTranslations.id, existing.id));
    await db.delete(pdfTranslationSegments).where(eq(pdfTranslationSegments.pdfTranslationId, existing.id));
  } else {
    await db.insert(pdfTranslations).values({ courseId: input.courseId, moduleId: input.moduleId, sourceUrl: input.sourceUrl, status: "ready", reconstructedStorageKey: input.reconstructedStorageKey, reconstructedStorageUrl: input.reconstructedStorageUrl, pageCount: input.pageCount, preparedByUserId: input.preparedByUserId ?? null, preparedAt: new Date() });
  }
  const document = await getPdfTranslationDocument(input.courseId, input.moduleId);
  if (!document) throw new Error("No se pudo guardar la traducción de PDF.");
  if (input.segments.length) await db.insert(pdfTranslationSegments).values(input.segments.map((segment) => ({ ...segment, pdfTranslationId: document.id })));
  return getPdfTranslationDocument(input.courseId, input.moduleId);
}

export async function savePdfVisualLocalization(input: {
  courseId: string;
  moduleId: string;
  pageNumber: number;
  sourceImageUrl: string;
  localizedStorageKey?: string | null;
  localizedStorageUrl?: string | null;
  sourceText: string;
  translatedText: string;
  status: "queued" | "rendering" | "review" | "ready" | "failed";
  provider: string;
  errorMessage?: string | null;
  preparedByUserId?: number | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  const document = await getPdfTranslationDocument(input.courseId, input.moduleId);
  if (!document) throw new Error("Prepara primero la traducción del PDF antes de localizar sus imágenes.");
  const existing = document.visualLocalizations.find((item) => item.pageNumber === input.pageNumber);
  const values = { sourceImageUrl: input.sourceImageUrl, localizedStorageKey: input.localizedStorageKey ?? null, localizedStorageUrl: input.localizedStorageUrl ?? null, sourceText: input.sourceText, translatedText: input.translatedText, status: input.status, provider: input.provider, errorMessage: input.errorMessage ?? null, preparedByUserId: input.preparedByUserId ?? null };
  if (existing) await db.update(pdfVisualLocalizations).set(values).where(eq(pdfVisualLocalizations.id, existing.id));
  else await db.insert(pdfVisualLocalizations).values({ ...values, pdfTranslationId: document.id, pageNumber: input.pageNumber });
  return getPdfTranslationDocument(input.courseId, input.moduleId);
}

export async function reviewPdfVisualLocalization(input: { id: number; approved: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible.");
  await db.update(pdfVisualLocalizations).set({ status: input.approved ? "ready" : "failed", reviewedAt: new Date(), errorMessage: input.approved ? null : "La variante visual requiere una nueva revisión." }).where(eq(pdfVisualLocalizations.id, input.id));
}

// TODO: add feature queries here as your schema grows.
