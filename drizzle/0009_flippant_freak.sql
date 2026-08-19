CREATE TABLE `pdf_visual_localizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pdfTranslationId` int NOT NULL,
	`pageNumber` int NOT NULL,
	`sourceImageUrl` varchar(1200) NOT NULL,
	`localizedStorageKey` varchar(1024),
	`localizedStorageUrl` varchar(1200),
	`sourceText` text NOT NULL,
	`translatedText` text NOT NULL,
	`status` enum('queued','rendering','review','ready','failed') NOT NULL DEFAULT 'queued',
	`provider` varchar(64) NOT NULL DEFAULT 'image-service',
	`errorMessage` text,
	`preparedByUserId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdf_visual_localizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `pdf_visual_localization_page_unique` UNIQUE(`pdfTranslationId`,`pageNumber`)
);
--> statement-breakpoint
ALTER TABLE `pdf_visual_localizations` ADD CONSTRAINT `pdf_visual_localizations_pdfTranslationId_pdf_translations_id_fk` FOREIGN KEY (`pdfTranslationId`) REFERENCES `pdf_translations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pdf_visual_localizations` ADD CONSTRAINT `pdf_visual_localizations_preparedByUserId_users_id_fk` FOREIGN KEY (`preparedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;