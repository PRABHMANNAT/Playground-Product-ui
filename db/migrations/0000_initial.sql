CREATE TABLE IF NOT EXISTS `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`created` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `contributors` (
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

CREATE TABLE IF NOT EXISTS `evidence` (
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

CREATE INDEX IF NOT EXISTS `evidence_project` ON `evidence` (`project`);
CREATE TABLE IF NOT EXISTS `experiments` (
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

CREATE INDEX IF NOT EXISTS `experiments_project` ON `experiments` (`project`);
CREATE TABLE IF NOT EXISTS `missions` (
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

CREATE INDEX IF NOT EXISTS `missions_owner` ON `missions` (`owner`);
CREATE TABLE IF NOT EXISTS `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`project` text NOT NULL,
	`package` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'aud' NOT NULL,
	`status` text DEFAULT 'Requested' NOT NULL,
	`stripe_session` text,
 `paid` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX IF NOT EXISTS `orders_owner` ON `orders` (`owner`);
CREATE TABLE IF NOT EXISTS `projects` (
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

CREATE INDEX IF NOT EXISTS `projects_owner` ON `projects` (`owner`);
CREATE TABLE IF NOT EXISTS `stripe_events` (
	`id` text PRIMARY KEY NOT NULL,
	`created` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `usage` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL
);


CREATE TABLE IF NOT EXISTS user (id TEXT PRIMARY KEY NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,emailVerified INTEGER NOT NULL DEFAULT 0,image TEXT,createdAt INTEGER NOT NULL,updatedAt INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS session (id TEXT PRIMARY KEY NOT NULL,expiresAt INTEGER NOT NULL,token TEXT NOT NULL UNIQUE,createdAt INTEGER NOT NULL,updatedAt INTEGER NOT NULL,ipAddress TEXT,userAgent TEXT,userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS session_user ON session(userId);
CREATE TABLE IF NOT EXISTS account (id TEXT PRIMARY KEY NOT NULL,accountId TEXT NOT NULL,providerId TEXT NOT NULL,userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,accessToken TEXT,refreshToken TEXT,idToken TEXT,accessTokenExpiresAt INTEGER,refreshTokenExpiresAt INTEGER,scope TEXT,password TEXT,createdAt INTEGER NOT NULL,updatedAt INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS account_user ON account(userId);
CREATE TABLE IF NOT EXISTS verification (id TEXT PRIMARY KEY NOT NULL,identifier TEXT NOT NULL,value TEXT NOT NULL,expiresAt INTEGER NOT NULL,createdAt INTEGER NOT NULL,updatedAt INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS verification_identifier ON verification(identifier);
CREATE TABLE IF NOT EXISTS auth_rate_limit (key TEXT PRIMARY KEY NOT NULL,count INTEGER NOT NULL,lastRequest INTEGER NOT NULL);
