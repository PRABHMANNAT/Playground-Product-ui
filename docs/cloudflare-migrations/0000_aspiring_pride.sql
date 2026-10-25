CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contributors` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`domain` text NOT NULL,
	`experience` text NOT NULL,
	`profile` text NOT NULL,
	`rate` integer NOT NULL,
	`status` text DEFAULT 'Pending verification' NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`project` text NOT NULL,
	`kind` text NOT NULL,
	`claim` text NOT NULL,
	`source` text DEFAULT '' NOT NULL,
	`source_title` text DEFAULT '' NOT NULL,
	`origin` text DEFAULT 'User supplied' NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `evidence_project` ON `evidence` (`project`);--> statement-breakpoint
CREATE TABLE `experiments` (
	`id` text PRIMARY KEY NOT NULL,
	`project` text NOT NULL,
	`title` text NOT NULL,
	`hypothesis` text NOT NULL,
	`method` text NOT NULL,
	`metric` text NOT NULL,
	`threshold` text NOT NULL,
	`status` text DEFAULT 'Planned' NOT NULL,
	`result` text DEFAULT '' NOT NULL,
	`origin` text DEFAULT 'Template' NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `experiments_project` ON `experiments` (`project`);--> statement-breakpoint
CREATE TABLE `missions` (
	`id` text PRIMARY KEY NOT NULL,
	`project` text NOT NULL,
	`owner` text NOT NULL,
	`domain` text NOT NULL,
	`question` text NOT NULL,
	`audience` text NOT NULL,
	`budget` integer NOT NULL,
	`status` text DEFAULT 'Requested' NOT NULL,
	`feedback` text DEFAULT '' NOT NULL,
	`participant` text DEFAULT '' NOT NULL,
	`compensation` integer DEFAULT 0 NOT NULL,
	`cost` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `missions_owner` ON `missions` (`owner`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`project` text NOT NULL,
	`package` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'usd' NOT NULL,
	`status` text DEFAULT 'Requested' NOT NULL,
	`stripe_session` text,
	`created` text NOT NULL,
	FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `orders_owner` ON `orders` (`owner`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`audience` text NOT NULL,
	`sector` text NOT NULL,
	`url` text DEFAULT '' NOT NULL,
	`stage` text DEFAULT 'Idea' NOT NULL,
	`status` text DEFAULT 'Investigating' NOT NULL,
	`consent` integer DEFAULT 0 NOT NULL,
	`decision` text DEFAULT 'Undecided' NOT NULL,
	`rationale` text DEFAULT '' NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `projects_owner` ON `projects` (`owner`);--> statement-breakpoint
CREATE TABLE `stripe_events` (
	`id` text PRIMARY KEY NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `usage` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL
);
