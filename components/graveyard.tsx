'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, Plus, Search } from 'lucide-react';
import { Label, Pill } from './playground';
import { PixelArt } from './pixel-art';
import { statusLabels } from '@/lib/graveyard-types';
import type { GraveyardMeta, GraveyardResults, GraveyardStatus, StartupRecord } from '@/lib/graveyard-types';

function safeHref(value: string | null) {
    if (!value) return undefined;
    try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : undefined; }
    catch { return undefined; }
}
const statusTone = (status: GraveyardStatus) => status === 'verified_failure' ? 'green' : status === 'candidate' ? 'amber' : 'blue';
const extraFields = ['product_description', 'founders', 'city', 'business_model', 'features', 'target_audience', 'monetization', 'pricing', 'investors', 'revenue', 'competitors', 'market_conditions', 'gtm_strategy', 'secondary_failure_reasons', 'product_market_fit', 'customer_acquisition_issues', 'financial_failures', 'technical_failures', 'operational_failures', 'team_failures', 'warning_signs', 'root_causes', 'lessons_learned', 'prevention_strategies'];

function StartupCard({ record, meta, onSave }: { record: StartupRecord; meta: GraveyardMeta; onSave: (record: StartupRecord) => void }) {
    const verified = record.status === 'verified_failure';
    const sources = record.evidence_urls.filter(url => safeHref(url));
    const website = safeHref(record.website);
    return <article className="case-card startup-card">
        <div className="startup-card-header"><span className="startup-monogram" aria-hidden="true">{record.name.slice(0, 2).toUpperCase()}</span><Pill tone={statusTone(record.status)}>{statusLabels[record.status]}</Pill></div>
        <div className="case-body">
            <h2>{record.name}</h2>
            <div className="startup-location">{record.country || 'Country unknown'} · {record.industry || 'Industry unknown'}</div>
            <p>{record.product_description || 'A product description has not been documented in this dataset.'}</p>
            <div className="startup-dates"><span>Founded: {record.founded_year ?? 'Unknown'}</span><span>{verified ? 'Closed' : 'Reported closure'}: {record.shutdown_date || record.shutdown_year || 'Unknown'}</span></div>
            {verified && record.verification && <div className="question-box"><Label>REVIEWED HISTORICAL SUMMARY</Label><p>{record.verification.summary}</p></div>}
            {record.primary_failure_reason && <div className="startup-reason"><Label>SOURCE-ATTRIBUTED EXPLANATION</Label><p>{record.primary_failure_reason}</p></div>}
            {!verified && <p className="startup-caveat">{record.status === 'candidate' ? 'This company is a research candidate. Its closure has not been verified.' : 'This record is included for comparison and is not classified as a verified failure.'}</p>}
            {!!record.failure_categories.length && <div className="case-tags">{record.failure_categories.map(category => <span key={category}>{category.replaceAll('_', ' ')}</span>)}</div>}
            <details className="startup-details"><summary>Sources & record details</summary>
                <dl><dt>Dataset confidence</dt><dd>{record.confidence} (source label)</dd>
                    {record.verification && <><dt>Review</dt><dd>{record.verification.reviewer} · {record.verification.reviewed_at}</dd><dt>Scope</dt><dd>{record.verification.scope}</dd></>}
                    {extraFields.filter(field => typeof record[field] === 'string' && record[field]).map(field => <div key={field}><dt>{field.replaceAll('_', ' ')}</dt><dd>{String(record[field])}</dd></div>)}
                </dl>
                {record.verification && safeHref(record.verification.url) && <a className="source-link" href={record.verification.url} target="_blank" rel="noreferrer">Review evidence <ExternalLink size={12}/></a>}
                {sources.map((url, i) => <a className="source-link" key={url} href={url} target="_blank" rel="noreferrer">Source {i + 1} · {new URL(url).hostname}<ExternalLink size={12}/></a>)}
                {website && <a className="source-link" href={website} target="_blank" rel="noreferrer">Source-reported website <ExternalLink size={12}/></a>}
                <p className="startup-attribution">Data: {record.source_ids.map(id => meta.sources.find(s => s.id === id)?.name || id).join('; ')}.</p>
                {!!Object.keys(record.conflicts).length && <div className="notice">Conflicting source fields: {Object.keys(record.conflicts).join(', ')}. Disputed canonical values remain unknown.<dl>{Object.entries(record.conflicts).map(([field, values]) => <div key={field}><dt>{field.replaceAll('_', ' ')}</dt><dd>{values.map(value => typeof value === 'string' ? value : JSON.stringify(value)).join(' / ')}</dd></div>)}</dl></div>}
                <p className="startup-attribution">Missing fields are unknown. Dataset reviews are source-content reviews by an agent, not independent human audits.</p>
            </details>
            <button className="button outline full" onClick={() => onSave(record)}>Save to a project <Plus size={15}/></button>
        </div>
    </article>;
}

export function Graveyard({ onSave }: { onSave: (record: StartupRecord) => void }) {
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<GraveyardStatus | 'all'>('verified_failure');
    const [country, setCountry] = useState('');
    const [industry, setIndustry] = useState('');
    const [page, setPage] = useState(1);
    const [result, setResult] = useState<GraveyardResults | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true); setError('');
        const timer = setTimeout(async () => {
            try {
                const params = new URLSearchParams({ query, status, country, industry, page: String(page) });
                const response = await fetch(`/api/graveyard?${params}`, { signal: controller.signal });
                if (!response.ok) throw new Error('The company archive could not be loaded. Please try again.');
                const data: GraveyardResults = await response.json();
                if (!controller.signal.aborted) { setResult(data); setLoading(false); }
            } catch (e) {
                if (!controller.signal.aborted) { setError((e as Error).message); setLoading(false); }
            }
        }, 200);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [query, status, country, industry, page, retry]);
    function reset() { setQuery(''); setCountry(''); setIndustry(''); setStatus('verified_failure'); setPage(1); }
    const meta = result?.meta;
    return <>
        <div className="library-banner"><div className="library-intro"><Label>STARTUP GRAVEYARD DATABASE{meta ? ` / ${meta.total.toLocaleString()} COMPANIES` : ''}</Label><h2>Company histories,<br/>with sources.</h2><p>{meta ? `${meta.counts.verified_failure.toLocaleString()} verified failures across ${meta.total.toLocaleString()} company records. Explore the wider collection with status filters.` : 'Explore company records, historical reviews and their sources.'}</p></div><PixelArt scene="archive"/></div>
        <div className="archive-statuses" aria-label="Filter by company status">{(['verified_failure', 'candidate', 'active', 'acquired', 'all'] as const).map(value => <button key={value} className={status === value ? 'selected' : ''} aria-pressed={status === value} onClick={() => { setStatus(value); setPage(1); }}>{value === 'all' ? 'All companies' : statusLabels[value]}{meta && <span>{(value === 'all' ? meta.total : meta.counts[value]).toLocaleString()}</span>}</button>)}</div>
        <div className="toolbar archive-toolbar">
            <div className="search-input"><Search size={17}/><input aria-label="Search historical cases" placeholder="Search companies, products, or lessons…" value={query} maxLength={200} onChange={e => { setQuery(e.target.value); setPage(1); }}/></div>
            <label><span>Country</span><select aria-label="Filter country" value={country} onChange={e => { setCountry(e.target.value); setPage(1); }}><option value="">All countries</option>{meta?.countries.map(value => <option key={value}>{value}</option>)}</select></label>
            <label><span>Industry</span><select aria-label="Filter industry" value={industry} onChange={e => { setIndustry(e.target.value); setPage(1); }}><option value="">All industries</option>{meta?.industries.map(value => <option key={value}>{value}</option>)}</select></label>
            <button className="text-link" onClick={reset}>Reset filters</button>
        </div>
        <div role="status" aria-live="polite" className="archive-results-count">{loading ? 'Searching the archive…' : error ? 'Archive unavailable' : `${result?.total.toLocaleString() || 0} matching ${result?.total === 1 ? 'company' : 'companies'}`}</div>
        {error && <div className="notice" role="alert">{error} <button className="text-link" onClick={() => setRetry(v => v + 1)}>Try again</button></div>}
        {!loading && !error && result && <>
            {result.records.length ? <div className="case-grid archive-grid">{result.records.map(record => <StartupCard key={record.id} record={record} meta={result.meta} onSave={onSave}/>)}</div> : <div className="empty"><Search size={24}/><h3>No matching companies</h3><p>Try broader keywords, another status, or fewer filters.</p><button className="button outline" onClick={reset}>Reset filters</button></div>}
            {result.pages > 1 && <nav className="archive-pagination" aria-label="Archive pages"><button className="button outline" disabled={result.page <= 1} onClick={() => setPage(result.page - 1)}><ArrowLeft size={15}/>Previous</button><span>Page {result.page} of {result.pages}</span><button className="button outline" disabled={result.page >= result.pages} onClick={() => setPage(result.page + 1)}>Next<ArrowRight size={15}/></button></nav>}
        </>}
        {meta && <footer className="archive-provenance"><p>Source: <a href={`${meta.repository}/tree/${meta.revision}`} target="_blank" rel="noreferrer">Startup Graveyard Database · {meta.revision.slice(0, 7)}</a>. Data licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Imported as a versioned snapshot; statuses, missing fields and conflicts preserved.</p><p>{meta.sources.map(source => <a key={source.id} href={safeHref(source.url)} target="_blank" rel="noreferrer">{source.name}</a>)}</p></footer>}
    </>;
}
