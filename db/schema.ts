import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const projects = sqliteTable('projects', {
    id: text('id').primaryKey(), owner: text('owner').notNull(), name: text('name').notNull(),
    description: text('description').notNull(), audience: text('audience').notNull(), sector: text('sector').notNull(),
    url: text('url').notNull().default(''), stage: text('stage').notNull().default('Idea'),
    status: text('status').notNull().default('Investigating'), consent: integer('consent').notNull().default(0),
    decision: text('decision').notNull().default('Undecided'), rationale: text('rationale').notNull().default(''),
    created: text('created').notNull(), updated: text('updated').notNull(),
}, t => [index('projects_owner').on(t.owner)]);
export const evidence = sqliteTable('evidence', {
    id: text('id').primaryKey(), project: text('project').notNull().references(() => projects.id),
    kind: text('kind').notNull(), claim: text('claim').notNull(), source: text('source').notNull().default(''),
    sourceTitle: text('source_title').notNull().default(''), origin: text('origin').notNull().default('User supplied'), created: text('created').notNull(),
}, t => [index('evidence_project').on(t.project)]);
export const experiments = sqliteTable('experiments', {
    id: text('id').primaryKey(), project: text('project').notNull().references(() => projects.id),
    title: text('title').notNull(), hypothesis: text('hypothesis').notNull(), method: text('method').notNull(),
    metric: text('metric').notNull(), threshold: text('threshold').notNull(), status: text('status').notNull().default('Planned'),
    result: text('result').notNull().default(''), origin: text('origin').notNull().default('Template'), created: text('created').notNull(),
}, t => [index('experiments_project').on(t.project)]);
export const missions = sqliteTable('missions', {
    id: text('id').primaryKey(), project: text('project').notNull().references(() => projects.id), owner: text('owner').notNull(),
    domain: text('domain').notNull(), question: text('question').notNull(), audience: text('audience').notNull(),
    budget: integer('budget').notNull(), status: text('status').notNull().default('Requested'),
    feedback: text('feedback').notNull().default(''), participant: text('participant').notNull().default(''),
    compensation: integer('compensation').notNull().default(0), cost: integer('cost').notNull().default(0), created: text('created').notNull(),
}, t => [index('missions_owner').on(t.owner)]);
export const contributors = sqliteTable('contributors', {
    id: text('id').primaryKey(), owner: text('owner').notNull(), name: text('name').notNull(), email: text('email').notNull(),
    domain: text('domain').notNull(), experience: text('experience').notNull(), profile: text('profile').notNull(),
    rate: integer('rate').notNull(), status: text('status').notNull().default('Pending verification'), created: text('created').notNull(),
});
export const orders = sqliteTable('orders', {
    id: text('id').primaryKey(), owner: text('owner').notNull(), project: text('project').notNull().references(() => projects.id),
    package: text('package').notNull(), amount: integer('amount').notNull(), currency: text('currency').notNull().default('aud'),
    status: text('status').notNull().default('Requested'), paid: integer('paid').notNull().default(0), stripeSession: text('stripe_session'), created: text('created').notNull(),
}, t => [index('orders_owner').on(t.owner)]);
export const stripeEvents = sqliteTable('stripe_events', { id: text('id').primaryKey(), created: text('created').notNull() });
export const audit = sqliteTable('audit', {
    id: text('id').primaryKey(), actor: text('actor').notNull(), action: text('action').notNull(), target: text('target').notNull(), created: text('created').notNull(),
});
export const usage = sqliteTable('usage', { id: text('id').primaryKey(), count: integer('count').notNull().default(0) });
