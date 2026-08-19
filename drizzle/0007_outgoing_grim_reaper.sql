CREATE TABLE `video_processing_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`extractedVideoId` int NOT NULL,
	`status` enum('queued','processing','ready','failed') NOT NULL,
	`progressPercent` int NOT NULL,
	`processingMode` enum('local-worker','persistent-worker'),
	`message` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `video_processing_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `video_processing_events` ADD CONSTRAINT `video_processing_events_extractedVideoId_extracted_videos_id_fk` FOREIGN KEY (`extractedVideoId`) REFERENCES `extracted_videos`(`id`) ON DELETE cascade ON UPDATE no action;