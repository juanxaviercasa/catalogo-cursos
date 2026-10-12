import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["user", "admin"]);
export const zipImportStatus = pgEnum("zip_import_status", ["processing", "ready", "failed"]);
export const videoProcessingStatus = pgEnum("video_processing_status", ["queued", "processing", "ready", "failed"]);
export const videoProcessingMode = pgEnum("video_processing_mode", ["local-worker", "persistent-worker"]);
export const videoEventStatus = pgEnum("video_event_status", ["queued", "processing", "ready", "failed"]);
export const mediaTrackKind = pgEnum("media_track_kind", ["dubbed_video", "captions"]);
export const pdfTranslationStatus = pgEnum("pdf_translation_status", ["queued", "extracting", "translating", "reconstructing", "ready", "failed"]);
export const pdfVisualStatus = pgEnum("pdf_visual_status", ["queued", "rendering", "review", "ready", "failed"]);

/** Core user table backing the Manus OAuth flow. */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRole("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
  lastSignedIn: timestamp("lastSignedIn", { mode: "date" }).defaultNow().notNull(),
});

export const moduleProgress = pgTable("module_progress", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: varchar("courseId", { length: 128 }).notNull(),
  moduleId: varchar("moduleId", { length: 128 }).notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completedAt", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  uniqueIndex("module_progress_user_module_unique").on(table.userId, table.moduleId),
]);

export const zipImports = pgTable("zip_imports", {
  id: serial("id").primaryKey(),
  zipId: varchar("zipId", { length: 128 }).notNull(),
  courseId: varchar("courseId", { length: 128 }).notNull(),
  sourceName: varchar("sourceName", { length: 512 }).notNull(),
  sourceBytes: integer("sourceBytes"),
  status: zipImportStatus("status").notNull().default("processing"),
  errorMessage: text("errorMessage"),
  importedByUserId: integer("importedByUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  importedAt: timestamp("importedAt", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  uniqueIndex("zip_imports_zip_unique").on(table.zipId),
]);

export const extractedVideos = pgTable("extracted_videos", {
  id: serial("id").primaryKey(),
  zipImportId: integer("zipImportId").notNull().references(() => zipImports.id, { onDelete: "cascade" }),
  sourcePath: varchar("sourcePath", { length: 1024 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  sourceMimeType: varchar("sourceMimeType", { length: 128 }).notNull().default("video/mp4"),
  storageKey: varchar("storageKey", { length: 1024 }),
  storageUrl: varchar("storageUrl", { length: 1200 }),
  mimeType: varchar("mimeType", { length: 128 }),
  sizeBytes: integer("sizeBytes"),
  sortOrder: integer("sortOrder").notNull(),
  processingStatus: videoProcessingStatus("processingStatus").notNull().default("ready"),
  processingMessage: text("processingMessage"),
  wasTranscoded: boolean("wasTranscoded").notNull().default(false),
  processedAt: timestamp("processedAt", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("extracted_videos_import_path_unique").on(table.zipImportId, table.sourcePath),
]);

export const videoProcessingPreferences = pgTable("video_processing_preferences", {
  id: serial("id").primaryKey(),
  selectedMode: videoProcessingMode("selectedMode"),
  updatedByUserId: integer("updatedByUserId").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const videoProcessingEvents = pgTable("video_processing_events", {
  id: serial("id").primaryKey(),
  extractedVideoId: integer("extractedVideoId").notNull().references(() => extractedVideos.id, { onDelete: "cascade" }),
  status: videoEventStatus("status").notNull(),
  progressPercent: integer("progressPercent").notNull(),
  processingMode: videoProcessingMode("processingMode"),
  message: text("message"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const mediaTracks = pgTable("media_tracks", {
  id: serial("id").primaryKey(),
  extractedVideoId: integer("extractedVideoId").notNull().references(() => extractedVideos.id, { onDelete: "cascade" }),
  language: varchar("language", { length: 16 }).notNull(),
  kind: mediaTrackKind("kind").notNull(),
  label: varchar("label", { length: 128 }).notNull(),
  storageKey: varchar("storageKey", { length: 1024 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 1200 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("media_tracks_video_language_kind_unique").on(table.extractedVideoId, table.language, table.kind),
]);

export const pdfTranslations = pgTable("pdf_translations", {
  id: serial("id").primaryKey(),
  courseId: varchar("courseId", { length: 128 }).notNull(),
  moduleId: varchar("moduleId", { length: 128 }).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 1200 }).notNull(),
  sourceLanguage: varchar("sourceLanguage", { length: 16 }).notNull().default("en"),
  targetLanguage: varchar("targetLanguage", { length: 16 }).notNull().default("es"),
  status: pdfTranslationStatus("status").notNull().default("queued"),
  processingMode: videoProcessingMode("processingMode").notNull().default("local-worker"),
  priority: integer("priority").notNull().default(100),
  reconstructedStorageKey: varchar("reconstructedStorageKey", { length: 1024 }),
  reconstructedStorageUrl: varchar("reconstructedStorageUrl", { length: 1200 }),
  pageCount: integer("pageCount"),
  errorMessage: text("errorMessage"),
  preparedByUserId: integer("preparedByUserId").references(() => users.id, { onDelete: "set null" }),
  preparedAt: timestamp("preparedAt", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  uniqueIndex("pdf_translations_course_module_unique").on(table.courseId, table.moduleId),
]);

export const pdfTranslationSegments = pgTable("pdf_translation_segments", {
  id: serial("id").primaryKey(),
  pdfTranslationId: integer("pdfTranslationId").notNull().references(() => pdfTranslations.id, { onDelete: "cascade" }),
  pageNumber: integer("pageNumber").notNull(),
  segmentOrder: integer("segmentOrder").notNull(),
  sourceText: text("sourceText").notNull(),
  translatedText: text("translatedText").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("pdf_translation_segment_unique").on(table.pdfTranslationId, table.pageNumber, table.segmentOrder),
]);

export const pdfVisualLocalizations = pgTable("pdf_visual_localizations", {
  id: serial("id").primaryKey(),
  pdfTranslationId: integer("pdfTranslationId").notNull().references(() => pdfTranslations.id, { onDelete: "cascade" }),
  pageNumber: integer("pageNumber").notNull(),
  sourceImageUrl: varchar("sourceImageUrl", { length: 1200 }).notNull(),
  localizedStorageKey: varchar("localizedStorageKey", { length: 1024 }),
  localizedStorageUrl: varchar("localizedStorageUrl", { length: 1200 }),
  sourceText: text("sourceText").notNull(),
  translatedText: text("translatedText").notNull(),
  status: pdfVisualStatus("status").notNull().default("queued"),
  provider: varchar("provider", { length: 64 }).notNull().default("image-service"),
  errorMessage: text("errorMessage"),
  preparedByUserId: integer("preparedByUserId").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewedAt", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
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
