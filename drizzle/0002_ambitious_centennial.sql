CREATE TABLE `extracted_videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zipImportId` int NOT NULL,
	`sourcePath` varchar(1024) NOT NULL,
	`title` varchar(512) NOT NULL,
	`storageKey` varchar(1024) NOT NULL,
	`storageUrl` varchar(1200) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`sizeBytes` int NOT NULL,
	`sortOrder` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `extracted_videos_id` PRIMARY KEY(`id`),
	CONSTRAINT `extracted_videos_import_path_unique` UNIQUE(`zipImportId`,`sourcePath`)
);
--> statement-breakpoint
CREATE TABLE `zip_imports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zipId` varchar(128) NOT NULL,
	`courseId` varchar(128) NOT NULL,
	`sourceName` varchar(512) NOT NULL,
	`sourceBytes` int,
	`status` enum('processing','ready','failed') NOT NULL DEFAULT 'processing',
	`errorMessage` text,
	`importedByUserId` int NOT NULL,
	`importedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `zip_imports_id` PRIMARY KEY(`id`),
	CONSTRAINT `zip_imports_zip_unique` UNIQUE(`zipId`)
);
--> statement-breakpoint
ALTER TABLE `extracted_videos` ADD CONSTRAINT `extracted_videos_zipImportId_zip_imports_id_fk` FOREIGN KEY (`zipImportId`) REFERENCES `zip_imports`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `zip_imports` ADD CONSTRAINT `zip_imports_importedByUserId_users_id_fk` FOREIGN KEY (`importedByUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;