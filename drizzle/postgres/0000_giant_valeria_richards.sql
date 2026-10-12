CREATE TYPE "public"."media_track_kind" AS ENUM('dubbed_video', 'captions');--> statement-breakpoint
CREATE TYPE "public"."pdf_translation_status" AS ENUM('queued', 'extracting', 'translating', 'reconstructing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."pdf_visual_status" AS ENUM('queued', 'rendering', 'review', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."video_event_status" AS ENUM('queued', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."video_processing_mode" AS ENUM('local-worker', 'persistent-worker');--> statement-breakpoint
CREATE TYPE "public"."video_processing_status" AS ENUM('queued', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."zip_import_status" AS ENUM('processing', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "extracted_videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"zipImportId" integer NOT NULL,
	"sourcePath" varchar(1024) NOT NULL,
	"title" varchar(512) NOT NULL,
	"sourceMimeType" varchar(128) DEFAULT 'video/mp4' NOT NULL,
	"storageKey" varchar(1024),
	"storageUrl" varchar(1200),
	"mimeType" varchar(128),
	"sizeBytes" integer,
	"sortOrder" integer NOT NULL,
	"processingStatus" "video_processing_status" DEFAULT 'ready' NOT NULL,
	"processingMessage" text,
	"wasTranscoded" boolean DEFAULT false NOT NULL,
	"processedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"extractedVideoId" integer NOT NULL,
	"language" varchar(16) NOT NULL,
	"kind" "media_track_kind" NOT NULL,
	"label" varchar(128) NOT NULL,
	"storageKey" varchar(1024) NOT NULL,
	"storageUrl" varchar(1200) NOT NULL,
	"mimeType" varchar(128) NOT NULL,
	"provider" varchar(64) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"courseId" varchar(128) NOT NULL,
	"moduleId" varchar(128) NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pdf_translation_segments" (
	"id" serial PRIMARY KEY NOT NULL,
	"pdfTranslationId" integer NOT NULL,
	"pageNumber" integer NOT NULL,
	"segmentOrder" integer NOT NULL,
	"sourceText" text NOT NULL,
	"translatedText" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pdf_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"courseId" varchar(128) NOT NULL,
	"moduleId" varchar(128) NOT NULL,
	"sourceUrl" varchar(1200) NOT NULL,
	"sourceLanguage" varchar(16) DEFAULT 'en' NOT NULL,
	"targetLanguage" varchar(16) DEFAULT 'es' NOT NULL,
	"status" "pdf_translation_status" DEFAULT 'queued' NOT NULL,
	"processingMode" "video_processing_mode" DEFAULT 'local-worker' NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"reconstructedStorageKey" varchar(1024),
	"reconstructedStorageUrl" varchar(1200),
	"pageCount" integer,
	"errorMessage" text,
	"preparedByUserId" integer,
	"preparedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pdf_visual_localizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"pdfTranslationId" integer NOT NULL,
	"pageNumber" integer NOT NULL,
	"sourceImageUrl" varchar(1200) NOT NULL,
	"localizedStorageKey" varchar(1024),
	"localizedStorageUrl" varchar(1200),
	"sourceText" text NOT NULL,
	"translatedText" text NOT NULL,
	"status" "pdf_visual_status" DEFAULT 'queued' NOT NULL,
	"provider" varchar(64) DEFAULT 'image-service' NOT NULL,
	"errorMessage" text,
	"preparedByUserId" integer,
	"reviewedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "video_processing_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"extractedVideoId" integer NOT NULL,
	"status" "video_event_status" NOT NULL,
	"progressPercent" integer NOT NULL,
	"processingMode" "video_processing_mode",
	"message" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_processing_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"selectedMode" "video_processing_mode",
	"updatedByUserId" integer,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zip_imports" (
	"id" serial PRIMARY KEY NOT NULL,
	"zipId" varchar(128) NOT NULL,
	"courseId" varchar(128) NOT NULL,
	"sourceName" varchar(512) NOT NULL,
	"sourceBytes" integer,
	"status" "zip_import_status" DEFAULT 'processing' NOT NULL,
	"errorMessage" text,
	"importedByUserId" integer NOT NULL,
	"importedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "extracted_videos" ADD CONSTRAINT "extracted_videos_zipImportId_zip_imports_id_fk" FOREIGN KEY ("zipImportId") REFERENCES "public"."zip_imports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_tracks" ADD CONSTRAINT "media_tracks_extractedVideoId_extracted_videos_id_fk" FOREIGN KEY ("extractedVideoId") REFERENCES "public"."extracted_videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_progress" ADD CONSTRAINT "module_progress_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdf_translation_segments" ADD CONSTRAINT "pdf_translation_segments_pdfTranslationId_pdf_translations_id_fk" FOREIGN KEY ("pdfTranslationId") REFERENCES "public"."pdf_translations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdf_translations" ADD CONSTRAINT "pdf_translations_preparedByUserId_users_id_fk" FOREIGN KEY ("preparedByUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdf_visual_localizations" ADD CONSTRAINT "pdf_visual_localizations_pdfTranslationId_pdf_translations_id_fk" FOREIGN KEY ("pdfTranslationId") REFERENCES "public"."pdf_translations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdf_visual_localizations" ADD CONSTRAINT "pdf_visual_localizations_preparedByUserId_users_id_fk" FOREIGN KEY ("preparedByUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_processing_events" ADD CONSTRAINT "video_processing_events_extractedVideoId_extracted_videos_id_fk" FOREIGN KEY ("extractedVideoId") REFERENCES "public"."extracted_videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_processing_preferences" ADD CONSTRAINT "video_processing_preferences_updatedByUserId_users_id_fk" FOREIGN KEY ("updatedByUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zip_imports" ADD CONSTRAINT "zip_imports_importedByUserId_users_id_fk" FOREIGN KEY ("importedByUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "extracted_videos_import_path_unique" ON "extracted_videos" USING btree ("zipImportId","sourcePath");--> statement-breakpoint
CREATE UNIQUE INDEX "media_tracks_video_language_kind_unique" ON "media_tracks" USING btree ("extractedVideoId","language","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "module_progress_user_module_unique" ON "module_progress" USING btree ("userId","moduleId");--> statement-breakpoint
CREATE UNIQUE INDEX "pdf_translation_segment_unique" ON "pdf_translation_segments" USING btree ("pdfTranslationId","pageNumber","segmentOrder");--> statement-breakpoint
CREATE UNIQUE INDEX "pdf_translations_course_module_unique" ON "pdf_translations" USING btree ("courseId","moduleId");--> statement-breakpoint
CREATE UNIQUE INDEX "pdf_visual_localization_page_unique" ON "pdf_visual_localizations" USING btree ("pdfTranslationId","pageNumber");--> statement-breakpoint
CREATE UNIQUE INDEX "zip_imports_zip_unique" ON "zip_imports" USING btree ("zipId");