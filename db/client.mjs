import { createClient } from '@libsql/client';
import { bootstrapStatements } from './bootstrap.mjs';
let client;
let initialization;
export function getClient() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) throw new Error('Set TURSO_DATABASE_URL to connect the database.');
    if (process.env.VERCEL && !url.startsWith('libsql://') && !url.startsWith('https://')) throw new Error('Vercel requires a remote Turso database; local files are not durable.');
    client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined, intMode: 'number' });
  }
  return client;
}
// Idempotent initial schema setup happens on first access, never during the build.
export async function ensureDatabase() {
  if (!initialization) initialization = getClient().batch(bootstrapStatements, 'write').catch(error => { initialization = undefined; throw error; });
  await initialization;
}
class Statement {
  constructor(sql, args = []) { this.sql = sql; this.args = args; }
  bind(...args) { return new Statement(this.sql, args); }
  async execute() { await ensureDatabase(); return getClient().execute({ sql: this.sql, args: this.args }); }
  async all() { const result = await this.execute(); return { results: result.rows.map(row => ({ ...row })) }; }
  async first() { const result = await this.execute(); return result.rows[0] ? { ...result.rows[0] } : null; }
  async run() { const result = await this.execute(); return { success: true, changes: result.rowsAffected }; }
}
export const database = {
  prepare(sql) { return new Statement(sql); },
  async batch(statements) { await ensureDatabase(); return getClient().batch(statements.map(s => ({ sql: s.sql, args: s.args })), 'write'); },
};
