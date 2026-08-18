ALTER TABLE `extracted_videos` MODIFY COLUMN `storageKey` varchar(1024);--> statement-breakpoint
ALTER TABLE `extracted_videos` MODIFY COLUMN `storageUrl` varchar(1200);--> statement-breakpoint
ALTER TABLE `extracted_videos` MODIFY COLUMN `mimeType` varchar(128);--> statement-breakpoint
ALTER TABLE `extracted_videos` MODIFY COLUMN `sizeBytes` int;