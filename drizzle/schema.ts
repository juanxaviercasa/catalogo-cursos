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
  storageKey: varchar("storageKey", { length: 1024 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 1200 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  sortOrder: int("sortOrder").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("extracted_videos_import_path_unique").on(table.zipImportId, table.sourcePath),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ModuleProgress = typeof moduleProgress.$inferSelect;
export type InsertModuleProgress = typeof moduleProgress.$inferInsert;
export type ZipImport = typeof zipImports.$inferSelect;
export type ExtractedVideo = typeof extractedVideos.$inferSelect;

// TODO: Add your tables here
