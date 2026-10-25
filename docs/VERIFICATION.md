# Vercel release verification — 25 October 2026

This is a standard Next.js migration of the Playground pilot. The UI, business workflows, provider adapters and original pixel illustrations are included. Sites-only authentication and Cloudflare runtime bindings have been replaced.

## Completed checks

- TypeScript check passes.
- Next.js 16.4.3 production build passes without requiring provider credentials at build time.
- Seven mocked OpenAI/Stripe provider tests pass.
- Thirty-five real HTTP integration checks pass against the production Node.js server and an isolated local libSQL database.
- Browser: account creation, automatic workspace redirect, authenticated data loading and sign-out verified. No browser errors or warnings captured. The new account started with zero customer records.
- Screenshots of the homepage and sign-in screen are in `docs/images`.

## Integration coverage

Anonymous requests and forged former Sites identity headers cannot authenticate. Sign-up creates server sessions and hashed passwords. Sign-out invalidates sessions; signing back in retains project data. Separate accounts cannot read or change one another's projects. Foreign-origin writes, unsourced facts and unauthorized operator actions are rejected.

An allowlisted email remains an ordinary account until verified. A verified allowlisted email receives Operations access. Parameterized SQL, transactional experiment generation, independent persistence reads and server-controlled AUD prices were exercised. Operators cannot fulfill unpaid orders. Missing OpenAI/payment keys produce explicit unavailable responses.

Stripe checks use synthetic, locally signed events. Mismatched sessions are rejected; matching events persist paid status; duplicate deliveries are idempotent. These checks do not spend money or call Stripe/OpenAI.

## Deployment behavior

The initial SQL schema is created idempotently on first database access, not during the build. On Vercel the database URL must be remote; file databases are rejected. Authentication uses the exact Vercel deployment/production hosts or the configured custom domain, not a broad wildcard for other people's sites. The build and dependency lockfile are suitable for GitHub-to-Vercel deployment.

## Remaining limits

- No live Vercel deployment or remote Turso database was provisioned as part of this GitHub preparation. The README explains the required owner setup and includes a Deploy button.
- Remote database account permissions, live OpenAI calls, real Stripe checkout and Resend email delivery require the owner's credentials and remain untested.
- Automatic email verification/password recovery need Resend settings. Without them, regular email/password accounts work; operator verification is performed by the documented trusted maintenance command.
- Browser verification used a 1280 CSS pixel viewport. Mobile rules are present, but a real mobile viewport was not captured.
- The Sandbox supports plans and recorded observations. Automated browser execution, continuous monitoring, expert recruitment/matching and payouts are not automated.
- Existing Sites accounts and records are not automatically imported into this database.
- Complete business-specific service/privacy terms before public paid onboarding.

Provider handling is tested with mocks; authentication, API and data checks use real local services. No default account, API key, database file or test customer data is committed.
