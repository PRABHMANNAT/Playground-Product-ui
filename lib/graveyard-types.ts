export const graveyardStatuses = ['verified_failure', 'candidate', 'active', 'acquired', 'pivot'] as const;
export type GraveyardStatus = typeof graveyardStatuses[number];
export const statusLabels: Record<GraveyardStatus, string> = {
    verified_failure: 'Verified failure', candidate: 'Candidate · unverified',
    active: 'Active', acquired: 'Acquired', pivot: 'Pivot',
};
export type StartupRecord = {
    id: string;
    name: string;
    status: GraveyardStatus;
    confidence: string;
    country: string | null;
    industry: string | null;
    product_description: string | null;
    founded_year: number | null;
    shutdown_year: number | null;
    shutdown_date: string | null;
    website: string | null;
    primary_failure_reason: string | null;
    lessons_learned: string | null;
    source_ids: string[];
    evidence_urls: string[];
    failure_categories: string[];
    conflicts: Record<string, unknown[]>;
    verification: { summary: string; url: string; reviewer: string; reviewed_at: string; scope: string } | null;
    [field: string]: unknown;
};
export type GraveyardSource = { id: string; name: string; url: string; license: string; note: string };
export type GraveyardMeta = {
    total: number;
    counts: Record<GraveyardStatus, number>;
    countries: string[];
    industries: string[];
    sources: GraveyardSource[];
    repository: string;
    revision: string;
    license: string;
};
export type GraveyardResults = {
    records: StartupRecord[];
    total: number;
    page: number;
    pageSize: number;
    pages: number;
    meta: GraveyardMeta;
};
