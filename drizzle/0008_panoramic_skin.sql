CREATE TABLE `pdf_translation_segments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pdfTranslationId` int NOT NULL,
	`pageNumber` int NOT NULL,
	`segmentOrder` int NOT NULL,
	`sourceText` text NOT NULL,
	`translatedText` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pdf_translation_segments_id` PRIMARY KEY(`id`),
	CONSTRAINT `pdf_translation_segment_unique` UNIQUE(`pdfTranslationId`,`pageNumber`,`segmentOrder`)
);
--> statement-breakpoint
CREATE TABLE `pdf_translations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` varchar(128) NOT NULL,
	`moduleId` varchar(128) NOT NULL,
	`sourceUrl` varchar(1200) NOT NULL,
	`sourceLanguage` varchar(16) NOT NULL DEFAULT 'en',
	`targetLanguage` varchar(16) NOT NULL DEFAULT 'es',
	`status` enum('queued','extracting','translating','reconstructing','ready','failed') NOT NULL DEFAULT 'queued',
	`processingMode` enum('local-worker','persistent-worker') NOT NULL DEFAULT 'local-worker',
	`reconstructedStorageKey` varchar(1024),
	`reconstructedStorageUrl` varchar(1200),
	`pageCount` int,
	`errorMessage` text,
	`preparedByUserId` int,
	`preparedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdf_translations_id` PRIMARY KEY(`id`),
	CONSTRAINT `pdf_translations_course_module_unique` UNIQUE(`courseId`,`moduleId`)
);
--> statement-breakpoint
ALTER TABLE `pdf_translation_segments` ADD CONSTRAINT `pdf_translation_segments_pdfTranslationId_pdf_translations_id_fk` FOREIGN KEY (`pdfTranslationId`) REFERENCES `pdf_translations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pdf_translations` ADD CONSTRAINT `pdf_translations_preparedByUserId_users_id_fk` FOREIGN KEY (`preparedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;