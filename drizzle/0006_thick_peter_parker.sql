CREATE TABLE `video_processing_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`selectedMode` enum('local-worker','persistent-worker'),
	`updatedByUserId` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_processing_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `video_processing_preferences` ADD CONSTRAINT `video_processing_preferences_updatedByUserId_users_id_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;