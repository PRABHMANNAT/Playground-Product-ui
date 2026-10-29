import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GraveyardMeta, GraveyardResults, GraveyardSource, GraveyardStatus, StartupRecord } from './graveyard-types';

// Server-side snapshot; never imported by client components.
const snapshot = JSON.parse(readFileSync(join(process.cwd(), 'data/graveyard/snapshot.json'), 'utf8')) as {
    repository: string; revision: string; license: string; sources: GraveyardSource[]; records: StartupRecord[];
};
const normalize = (text: string) => text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const byId = new Map(snapshot.records.map(record => [record.id, record]));
const index = snapshot.records.map(record => ({ record, text: normalize([
    record.name, record.country, record.industry, record.product_description,
    record.primary_failure_reason, record.lessons_learned, ...record.failure_categories,
    record.verification?.summary,
].filter(Boolean).join(' ')) }));
const counts: GraveyardMeta['counts'] = { verified_failure: 0, candidate: 0, active: 0, acquired: 0, pivot: 0 };
snapshot.records.forEach(record => counts[record.status]++);
const facets = (field: 'country' | 'industry') => [...new Set(snapshot.records.map(r => r[field] || 'Unknown'))].sort((a, b) => a.localeCompare(b));
const meta: GraveyardMeta = {
    total: snapshot.records.length, counts, countries: facets('country'), industries: facets('industry'),
    sources: snapshot.sources, repository: snapshot.repository, revision: snapshot.revision, license: snapshot.license,
};
export function getStartup(id: string) { return byId.get(id); }
export function searchGraveyard(options: { query?: string; status?: GraveyardStatus | 'all'; country?: string; industry?: string; page?: number; pageSize?: number } = {}): GraveyardResults {
    const terms = normalize(options.query || '').trim().split(/\s+/).filter(Boolean);
    const status = options.status || 'verified_failure';
    const matches = index.filter(({ record, text }) =>
        (status === 'all' || record.status === status) &&
        (!options.country || (record.country || 'Unknown') === options.country) &&
        (!options.industry || (record.industry || 'Unknown') === options.industry) &&
        terms.every(term => text.includes(term))
    );
    const pageSize = Math.min(48, Math.max(1, Math.trunc(options.pageSize || 12)));
    const pages = Math.max(1, Math.ceil(matches.length / pageSize));
    const page = Math.min(pages, Math.max(1, Math.trunc(options.page || 1)));
    return { records: matches.slice((page - 1) * pageSize, page * pageSize).map(item => item.record), total: matches.length, page, pages, pageSize, meta };
}
export function startupEvidence(record: StartupRecord) {
    const verified = record.status === 'verified_failure' && !!record.verification;
    return {
        kind: verified ? 'Fact' as const : 'Hypothesis' as const,
        claim: verified
            ? `${record.name}: ${record.verification!.summary} Review scope: ${record.verification!.scope}`
            : `${record.name} — source-reported status: ${record.status}. ${record.product_description || 'Product description not documented.'} This record has not been verified as a startup failure.`,
        source: verified ? record.verification!.url : record.evidence_urls[0] || `${snapshot.repository}/blob/${snapshot.revision}/exports/startups.jsonl`,
        sourceTitle: `Startup Graveyard · ${record.name}`.slice(0, 200),
        origin: `Startup Graveyard ${snapshot.revision.slice(0, 7)} · ${record.status}`,
    };
}
