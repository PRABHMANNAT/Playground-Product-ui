// Owner-only local maintenance command. Never expose this command as a public API.
import { ensureDatabase, getClient } from '../db/client.mjs';
const email = process.argv[2]?.trim().toLowerCase();
const allowed = (process.env.ADMIN_EMAILS || '').split(',').map(x => x.trim().toLowerCase());
if (!email || !allowed.includes(email)) throw new Error('Pass an email listed in ADMIN_EMAILS, after verifying that the registered account belongs to the operator.');
await ensureDatabase();
const row = (await getClient().execute({ sql: 'SELECT id FROM user WHERE lower(email)=?', args: [email] })).rows[0];
if (!row) throw new Error('Create the operator account through the app before running this command.');
await getClient().execute({ sql: 'UPDATE user SET emailVerified=1,updatedAt=? WHERE id=?', args: [Date.now(), row.id] });
console.log('Operator account verified. Sign in again to open Operations.');
