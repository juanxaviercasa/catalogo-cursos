CREATE TABLE `module_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` varchar(128) NOT NULL,
	`moduleId` varchar(128) NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `module_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `module_progress_user_module_unique` UNIQUE(`userId`,`moduleId`)
);
--> statement-breakpoint
ALTER TABLE `module_progress` ADD CONSTRAINT `module_progress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;