ALTER TABLE `extracted_videos` ADD `sourceMimeType` varchar(128) DEFAULT 'video/mp4' NOT NULL;--> statement-breakpoint
ALTER TABLE `extracted_videos` ADD `processingStatus` enum('queued','processing','ready','failed') DEFAULT 'ready' NOT NULL;--> statement-breakpoint
ALTER TABLE `extracted_videos` ADD `processingMessage` text;--> statement-breakpoint
ALTER TABLE `extracted_videos` ADD `wasTranscoded` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `extracted_videos` ADD `processedAt` timestamp;