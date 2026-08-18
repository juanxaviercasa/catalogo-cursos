CREATE TABLE `media_tracks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`extractedVideoId` int NOT NULL,
	`language` varchar(16) NOT NULL,
	`kind` enum('dubbed_video','captions') NOT NULL,
	`label` varchar(128) NOT NULL,
	`storageKey` varchar(1024) NOT NULL,
	`storageUrl` varchar(1200) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`provider` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_tracks_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_tracks_video_language_kind_unique` UNIQUE(`extractedVideoId`,`language`,`kind`)
);
--> statement-breakpoint
ALTER TABLE `media_tracks` ADD CONSTRAINT `media_tracks_extractedVideoId_extracted_videos_id_fk` FOREIGN KEY (`extractedVideoId`) REFERENCES `extracted_videos`(`id`) ON DELETE cascade ON UPDATE no action;