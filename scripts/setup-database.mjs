import { ensureDatabase } from '../db/client.mjs';
await ensureDatabase();
console.log('Database ready. Existing records were preserved.');
