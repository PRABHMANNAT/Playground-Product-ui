# Startup Graveyard integration

The archive uses a checked-in server-side snapshot of [Startup Graveyard Database](https://github.com/PRABHMANNAT/Startup-Graveyard-Database) at revision `4b811050bea31b1323ffae13cfca49d45e60526a`.

This release contains **4,778 companies**, not 8,000 failures: 8 verified failures, 1,530 unverified candidates, 3,044 active companies and 196 acquisitions. Eight thousand is the upstream collection target. Reviews are agent source-content reviews, not independent human audits.

The snapshot contains all canonical startup fields, IDs, source links, source attribution, review metadata and conflicts. Unknowns remain null. It does not include article bodies, upstream Python code, or a running PostgreSQL service. It needs no additional credentials or hosted service to browse, including on Vercel. The existing customer database remains separate.

## Browsing and saving

Open `/workspace?view=graveyard`. The default view shows verified failures. Status, industry and country filters and keyword search run on the server; responses contain at most 48 records (12 in the interface). Search matches all supplied terms across names, descriptions, geography, industries, reviewed explanations, lessons, categories and review summaries. It is lexical matching, not a prediction or semantic similarity score.

`GET /api/graveyard?status=all&query=ingredients&page=1&pageSize=12` returns records, filtered count, page information, status totals, filter options and attribution. Valid statuses are `verified_failure`, `candidate`, `active`, `acquired`, `pivot`, and `all`. Invalid parameters return 400. No customer records are exposed by this public endpoint.

The authenticated `save_graveyard_evidence` workspace action accepts only a startup UUID and an owned project UUID. The server loads the canonical record. Verified closure summaries are saved as Facts with the original evidence link and review scope. All other records are saved as Hypotheses with their source-reported status and an explicit unverified-failure note. The evidence origin includes the snapshot revision. Authentication, project ownership and existing write limits apply.

## Refreshing the snapshot

1. Obtain the upstream repository and check out a reviewed commit. Review changes to licenses, status gates and counts before importing.
2. Run `npm run graveyard:import -- /absolute/path/to/Startup-Graveyard-Database` from the app directory.
3. The importer checks SHA-256 against upstream `exports/checksums.json`, entity uniqueness, known statuses, required verification evidence and the published quality report counts. It preserves canonical records and writes the pinned revision and attribution.
4. Run `npm run test:graveyard`, `npm run typecheck`, and `npm run build`. Update pinned-release expectations in tests after reviewing a new release.

There is no automatic refresh from a mutable remote branch. Next.js file tracing includes the snapshot in both the search and save route deployments. Large data never enters the browser JavaScript bundle.

## Attribution

Data: CC BY 4.0. See [the preserved source notice](../data/graveyard/ATTRIBUTION.md) for IdeaProof Research Team (2026); Melegati, Edison & Wang (2020), DOI 10.5281/zenodo.4017712; Gawli (2026), Startup Lifecycle Project v1.0.0; and Playground source-content reviews. The UI links to these sources, the pinned repository and the license. Integration changes are JSONL-to-JSON conversion and normalized retrieval text; canonical fields are preserved.
