import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

// Import a reviewed, pinned checkout, never a mutable remote feed at runtime.
const root = resolve(process.argv[2] || '../graveyard-source');
const raw = readFileSync(resolve(root, 'exports/startups.jsonl'));
const checksums = JSON.parse(readFileSync(resolve(root, 'exports/checksums.json'), 'utf8'));
const checksum = createHash('sha256').update(raw).digest('hex');
const expected = checksums['exports/startups.jsonl'];
if (checksum !== expected) throw new Error('Startup export checksum mismatch.');
const records = raw.toString('utf8').trim().split(/\r?\n/).map(line => JSON.parse(line));
const quality = JSON.parse(readFileSync(resolve(root, 'exports/quality.json'), 'utf8'));
const statuses = new Set(['verified_failure', 'candidate', 'active', 'acquired', 'pivot']);
if (records.length !== quality.unique_entities || new Set(records.map(r => r.id)).size !== records.length)
    throw new Error('Entity count or unique IDs failed validation.');
for (const record of records) {
    if (!record.id || !record.name || !statuses.has(record.status)) throw new Error('Invalid startup record.');
    if (record.status === 'verified_failure' && (!record.verification?.summary || !record.verification?.url))
        throw new Error('Verified failure lacks review evidence.');
}
for (const [status, count] of Object.entries(quality.status_counts)) {
    if (records.filter(r => r.status === status).length !== count) throw new Error(`Count mismatch: ${status}`);
}
const revision = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const sources = JSON.parse(readFileSync(resolve(root, 'data/sources.json'), 'utf8'))
    .filter(s => ['import', 'original'].includes(s.decision));
const snapshot = {
    repository: 'https://github.com/PRABHMANNAT/Startup-Graveyard-Database',
    revision, sourceChecksum: checksum, license: 'CC-BY-4.0', target: quality.target,
    sources, records,
};
mkdirSync('data/graveyard', { recursive: true });
writeFileSync('data/graveyard/snapshot.json', JSON.stringify(snapshot) + '\n');
const attribution = readFileSync(resolve(root, 'docs/SOURCES.md'), 'utf8')
    .replaceAll('](../', `](${snapshot.repository}/blob/${revision}/`);
writeFileSync('data/graveyard/ATTRIBUTION.md', attribution + '\nPlayground integration: JSONL converted to JSON; all canonical fields, unknown values, conflicts, status and review metadata preserved. Search text is normalized for retrieval only. No article bodies are included.\n');
console.log(`Imported ${records.length} companies at ${revision}; ${quality.status_counts.verified_failure} verified failures.`);
