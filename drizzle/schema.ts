import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const moduleProgress = mysqlTable("module_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: varchar("courseId", { length: 128 }).notNull(),
  moduleId: varchar("moduleId", { length: 128 }).notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("module_progress_user_module_unique").on(table.userId, table.moduleId),
]);

export const zipImports = mysqlTable("zip_imports", {
  id: int("id").autoincrement().primaryKey(),
  zipId: varchar("zipId", { length: 128 }).notNull(),
  courseId: varchar("courseId", { length: 128 }).notNull(),
  sourceName: varchar("sourceName", { length: 512 }).notNull(),
  sourceBytes: int("sourceBytes"),
  status: mysqlEnum("status", ["processing", "ready", "failed"]).notNull().default("processing"),
  errorMessage: text("errorMessage"),
  importedByUserId: int("importedByUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  importedAt: timestamp("importedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("zip_imports_zip_unique").on(table.zipId),
]);

export const extractedVideos = mysqlTable("extracted_videos", {
  id: int("id").autoincrement().primaryKey(),
  zipImportId: int("zipImportId").notNull().references(() => zipImports.id, { onDelete: "cascade" }),
  sourcePath: varchar("sourcePath", { length: 1024 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  sourceMimeType: varchar("sourceMimeType", { length: 128 }).notNull().default("video/mp4"),
  storageKey: varchar("storageKey", { length: 1024 }),
  storageUrl: varchar("storageUrl", { length: 1200 }),
  mimeType: varchar("mimeType", { length: 128 }),
  sizeBytes: int("sizeBytes"),
  sortOrder: int("sortOrder").notNull(),
  processingStatus: mysqlEnum("processingStatus", ["queued", "processing", "ready", "failed"]).notNull().default("ready"),
  processingMessage: text("processingMessage"),
  wasTranscoded: boolean("wasTranscoded").notNull().default(false),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("extracted_videos_import_path_unique").on(table.zipImportId, table.sourcePath),
]);

export const videoProcessingPreferences = mysqlTable("video_processing_preferences", {
  id: int("id").autoincrement().primaryKey(),
  selectedMode: mysqlEnum("selectedMode", ["local-worker", "persistent-worker"]),
  updatedByUserId: int("updatedByUserId").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const videoProcessingEvents = mysqlTable("video_processing_events", {
  id: int("id").autoincrement().primaryKey(),
  extractedVideoId: int("extractedVideoId").notNull().references(() => extractedVideos.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["queued", "processing", "ready", "failed"]).notNull(),
  progressPercent: int("progressPercent").notNull(),
  processingMode: mysqlEnum("processingMode", ["local-worker", "persistent-worker"]),
  message: text("message"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const mediaTracks = mysqlTable("media_tracks", {
  id: int("id").autoincrement().primaryKey(),
  extractedVideoId: int("extractedVideoId").notNull().references(() => extractedVideos.id, { onDelete: "cascade" }),
  language: varchar("language", { length: 16 }).notNull(),
  kind: mysqlEnum("kind", ["dubbed_video", "captions"]).notNull(),
  label: varchar("label", { length: 128 }).notNull(),
  storageKey: varchar("storageKey", { length: 1024 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 1200 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("media_tracks_video_language_kind_unique").on(table.extractedVideoId, table.language, table.kind),
]);

export const pdfTranslations = mysqlTable("pdf_translations", {
  id: int("id").autoincrement().primaryKey(),
  courseId: varchar("courseId", { length: 128 }).notNull(),
  moduleId: varchar("moduleId", { length: 128 }).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 1200 }).notNull(),
  sourceLanguage: varchar("sourceLanguage", { length: 16 }).notNull().default("en"),
  targetLanguage: varchar("targetLanguage", { length: 16 }).notNull().default("es"),
  status: mysqlEnum("status", ["queued", "extracting", "translating", "reconstructing", "ready", "failed"]).notNull().default("queued"),
  processingMode: mysqlEnum("processingMode", ["local-worker", "persistent-worker"]).notNull().default("local-worker"),
  reconstructedStorageKey: varchar("reconstructedStorageKey", { length: 1024 }),
  reconstructedStorageUrl: varchar("reconstructedStorageUrl", { length: 1200 }),
  pageCount: int("pageCount"),
  errorMessage: text("errorMessage"),
  preparedByUserId: int("preparedByUserId").references(() => users.id, { onDelete: "set null" }),
  preparedAt: timestamp("preparedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("pdf_translations_course_module_unique").on(table.courseId, table.moduleId),
]);

export const pdfTranslationSegments = mysqlTable("pdf_translation_segments", {
  id: int("id").autoincrement().primaryKey(),
  pdfTranslationId: int("pdfTranslationId").notNull().references(() => pdfTranslations.id, { onDelete: "cascade" }),
  pageNumber: int("pageNumber").notNull(),
  segmentOrder: int("segmentOrder").notNull(),
  sourceText: text("sourceText").notNull(),
  translatedText: text("translatedText").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("pdf_translation_segment_unique").on(table.pdfTranslationId, table.pageNumber, table.segmentOrder),
]);

export const pdfVisualLocalizations = mysqlTable("pdf_visual_localizations", {
  id: int("id").autoincrement().primaryKey(),
  pdfTranslationId: int("pdfTranslationId").notNull().references(() => pdfTranslations.id, { onDelete: "cascade" }),
  pageNumber: int("pageNumber").notNull(),
  sourceImageUrl: varchar("sourceImageUrl", { length: 1200 }).notNull(),
  localizedStorageKey: varchar("localizedStorageKey", { length: 1024 }),
  localizedStorageUrl: varchar("localizedStorageUrl", { length: 1200 }),
  sourceText: text("sourceText").notNull(),
  translatedText: text("translatedText").notNull(),
  status: mysqlEnum("status", ["queued", "rendering", "review", "ready", "failed"]).notNull().default("queued"),
  provider: varchar("provider", { length: 64 }).notNull().default("image-service"),
  errorMessage: text("errorMessage"),
  preparedByUserId: int("preparedByUserId").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("pdf_visual_localization_page_unique").on(table.pdfTranslationId, table.pageNumber),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ModuleProgress = typeof moduleProgress.$inferSelect;
export type InsertModuleProgress = typeof moduleProgress.$inferInsert;
export type ZipImport = typeof zipImports.$inferSelect;
export type ExtractedVideo = typeof extractedVideos.$inferSelect;
export type MediaTrack = typeof mediaTracks.$inferSelect;
export type VideoProcessingPreference = typeof videoProcessingPreferences.$inferSelect;
export type VideoProcessingEvent = typeof videoProcessingEvents.$inferSelect;
export type PdfTranslation = typeof pdfTranslations.$inferSelect;
export type PdfTranslationSegment = typeof pdfTranslationSegments.$inferSelect;
export type PdfVisualLocalization = typeof pdfVisualLocalizations.$inferSelect;

// TODO: Add your tables here
