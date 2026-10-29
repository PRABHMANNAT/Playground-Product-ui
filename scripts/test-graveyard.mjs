import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getStartup, searchGraveyard, startupEvidence } from '../lib/graveyard.ts';
import { evidenceInput } from '../lib/validation.ts';

const snapshot = JSON.parse(readFileSync('data/graveyard/snapshot.json', 'utf8'));

test('snapshot preserves the available population and defaults to reviewed failures only', () => {
    const result = searchGraveyard();
    assert.equal(result.meta.total, 4778);
    assert.deepEqual(result.meta.counts, { verified_failure: 8, candidate: 1530, active: 3044, acquired: 196, pivot: 0 });
    assert.equal(result.total, 8);
    assert.ok(result.records.every(r => r.status === 'verified_failure' && r.verification?.url));
    assert.equal(result.meta.revision, '4b811050bea31b1323ffae13cfca49d45e60526a');
});

test('all companies are accessible once through bounded pagination', () => {
    const first = searchGraveyard({ status: 'all', pageSize: 48 });
    const ids = [];
    for (let page = 1; page <= first.pages; page++) {
        const result = searchGraveyard({ status: 'all', pageSize: 48, page });
        assert.ok(result.records.length <= 48);
        ids.push(...result.records.map(r => r.id));
    }
    assert.equal(ids.length, 4778);
    assert.equal(new Set(ids).size, 4778);
    assert.equal(searchGraveyard({ status: 'all', page: 99999 }).page, searchGraveyard({ status: 'all' }).pages);
});

test('keyword search finds products and composes country, industry and status filters', () => {
    const dinnr = searchGraveyard({ query: '  DINNR  ', country: 'United Kingdom' });
    assert.equal(dinnr.total, 1);
    assert.equal(dinnr.records[0].name, 'Dinnr');
    assert.ok(searchGraveyard({ query: 'cooking ingredients' }).records.some(r => r.name === 'Dinnr'));
    const result = searchGraveyard({ status: 'active', country: 'India', industry: 'B2B -> Productivity' });
    assert.ok(result.total > 0);
    assert.ok(result.records.every(r => r.status === 'active' && r.country === 'India' && r.industry === 'B2B -> Productivity'));
    assert.equal(searchGraveyard({ query: 'Dinnr', country: 'India' }).total, 0);
    assert.equal(searchGraveyard({ query: 'no-company-matches-this-8675309' }).total, 0);
});

test('candidates and acquisitions never appear in verified failure search', () => {
    for (const status of ['candidate', 'active', 'acquired']) {
        const result = searchGraveyard({ status });
        assert.ok(result.total > 0);
        assert.ok(result.records.every(r => r.status === status));
    }
    assert.equal(searchGraveyard({ status: 'pivot' }).total, 0);
});

test('unknown values, conflicting claims and review provenance survive import', () => {
    const dresses = searchGraveyard({ query: '99dresses' }).records[0];
    assert.equal(dresses.industry, null);
    assert.ok(dresses.conflicts.industry.length > 1);
    assert.ok(dresses.verification.reviewer.includes('Codex'));
    assert.equal(dresses.funding_usd, null);
    assert.equal(getStartup(dresses.id).id, dresses.id);
    assert.equal(getStartup('missing'), undefined);
});

test('saved evidence keeps verification boundaries, citations and pinned provenance', () => {
    for (const record of snapshot.records) {
        const evidence = startupEvidence(record);
        evidenceInput.parse({ project: '11111111-1111-4111-8111-111111111111', ...evidence });
        assert.equal(evidence.kind, record.status === 'verified_failure' ? 'Fact' : 'Hypothesis');
        assert.match(evidence.origin, /4b81105/);
        if (record.status === 'verified_failure') {
            assert.equal(evidence.source, record.verification.url);
            assert.ok(evidence.claim.includes(record.verification.scope));
        } else assert.match(evidence.claim, /not been verified/);
    }
});
