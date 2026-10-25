// Real HTTP integration checks. Only run against an isolated local server/database.
import assert from 'node:assert/strict';
import { randomUUID, createHmac } from 'node:crypto';
import { loadEnvFile } from 'node:process';
loadEnvFile('.env.local');
const origin = process.env.TEST_ORIGIN || process.env.BETTER_AUTH_URL || 'http://localhost:3000';
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname) || !process.env.TURSO_DATABASE_URL?.startsWith('file:')) throw new Error('Use an isolated local server and file database for integration tests.');
const { getClient, ensureDatabase } = await import('../db/client.mjs');
await ensureDatabase();
const client = getClient(), accounts = [], projects = [];
let checks = 0;
function check(value, message) { assert.ok(value, message); checks++; console.log(`PASS ${message}`); }
async function call(path, body, cookie, extras = {}) {
  const response = await fetch(origin + path, { method: body ? 'POST' : 'GET', headers: { ...(body ? { 'Content-Type': 'application/json', Origin: origin } : {}), ...(cookie ? { Cookie: cookie } : {}), ...extras }, body: body ? JSON.stringify(body) : undefined, redirect: 'manual' });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}
async function signup(email) {
  const password = 'Local-QA-' + randomUUID();
  const r = await call('/api/auth/sign-up/email', { email, name: 'Integration QA', password });
  check(r.response.ok, 'Account created through real authentication');
  accounts.push(r.data.user.id);
  const cookie = r.response.headers.getSetCookie().map(x => x.split(';')[0]).join('; ');
  check(!!cookie, 'Sign-up returns a session cookie');
  return { cookie, email, password, id: r.data.user.id };
}
try {
  check((await call('/api/workspace')).response.status === 401, 'Anonymous workspace access is rejected');
  const spoof = await call('/api/workspace', null, null, { 'oai-authenticated-user-id': 'fake', 'oai-authenticated-user-email': 'operator@example.test' });
  check(spoof.response.status === 401, 'Old gateway identity headers do not authenticate users');
  const suffix = randomUUID().slice(0, 8);
  const first = await signup(`founder-${suffix}@example.test`), second = await signup(`other-${suffix}@example.test`);
  const operatorEmail = (process.env.ADMIN_EMAILS || '').split(',')[0]?.trim();
  if (!operatorEmail?.endsWith('@example.test')) throw new Error('Use an @example.test operator allowlist for this QA suite.');
  const operator = await signup(operatorEmail);
  check(!(await call('/api/workspace', null, operator.cookie)).data.user.admin, 'An unverified allowlisted email does not grant operator access');
  await client.execute({ sql: 'UPDATE user SET emailVerified=1 WHERE id=?', args: [operator.id] });
  const operatorData = (await call('/api/workspace', null, operator.cookie)).data;
  check(operatorData.user.admin && !!operatorData.operations, 'Verified allowlisted operator receives Operations access');
  const storedPassword = (await client.execute({ sql: 'SELECT password FROM account WHERE userId=?', args: [first.id] })).rows[0]?.password;
  check(storedPassword && storedPassword !== first.password && !storedPassword.includes(first.password), 'Passwords are stored as hashes');
  const brief = { action: 'create_project', name: 'Vercel migration QA', description: 'A synthetic test brief for validating persistence, source records and account isolation.', audience: 'Synthetic test accounts', sector: 'SaaS', stage: 'Idea', url: '', consent: false };
  let result = await call('/api/workspace', brief, first.cookie);
  check(result.response.status === 201, 'Signed-in user can create a project');
  const project = result.data.id; projects.push(project);
  check((await call('/api/workspace', null, first.cookie)).data.projects.some(p => p.id === project), 'Project persists in an independent request');
  check(!(await call('/api/workspace', null, second.cookie)).data.projects.some(p => p.id === project), 'Another account cannot read the project');
  check((await call('/api/workspace', { action: 'save_decision', project, decision: 'Pause', rationale: 'Synthetic cross-account attempt.' }, second.cookie)).response.status === 404, 'Another account cannot mutate the project');
  check((await call('/api/workspace', brief, first.cookie, { Origin: 'https://foreign.example' })).response.status === 403, 'Foreign-origin write rejected');
  check((await call('/api/workspace', { action: 'add_evidence', project, kind: 'Fact', claim: 'An unsourced fact should be rejected.', source: '', sourceTitle: '' }, first.cookie)).response.status === 400, 'Unsourced fact rejected');
  result = await call('/api/workspace', { action: 'add_evidence', project, kind: 'Hypothesis', claim: 'This is a synthetic hypothesis, not customer evidence.', source: '', sourceTitle: '' }, first.cookie);
  check(result.response.status === 201, 'Hypothesis saved');
  result = await call('/api/workspace', { action: 'generate_experiments', project }, first.cookie);
  check(result.response.ok, 'Starter experiments saved in a database transaction');
  check((await call('/api/workspace', null, first.cookie)).data.experiments.filter(e => e.project === project).length === 3, 'All three experiments persist');
  result = await call('/api/workspace', { action: 'save_decision', project, decision: 'Pause', rationale: 'QA only. Customer demand has not been tested.' }, first.cookie);
  check(result.response.ok, 'Decision saved');
  check((await call('/api/workspace', { action: 'admin_contributor', id: randomUUID(), status: 'Verified' }, first.cookie)).response.status === 403, 'Ordinary accounts cannot perform operator actions');
  result = await call('/api/workspace', { action: 'request_package', project, package: 'validation' }, first.cookie);
  check(result.response.status === 201, 'Pilot request saved');
  const order = result.data.id;
  const saved = (await call('/api/workspace', null, first.cookie)).data.orders.find(o => o.id === order);
  check(saved.amount === 49900 && saved.currency === 'aud' && !saved.paid, 'Price is server-controlled AUD and request is unpaid');
  check((await call('/api/workspace', { action: 'admin_order', id: order, status: 'Delivered' }, operator.cookie)).response.status === 400, 'Even an operator cannot fulfill an unpaid order');
  check((await call('/api/workspace', { action: 'checkout', id: order }, first.cookie)).response.status === 409, 'Missing payment keys produce an explicit unavailable response');
  check((await call('/api/workspace', { action: 'research', project, consent: true }, first.cookie)).response.status === 409, 'Missing OpenAI key produces an explicit unavailable response');
  const event = { id: `evt_${suffix}`, type: 'checkout.session.completed', data: { object: { id: 'cs_qa', payment_status: 'paid', metadata: { order_id: order }, amount_total: 49900, currency: 'aud' } } };
  const raw = JSON.stringify(event), time = String(Math.floor(Date.now() / 1000));
  const signature = createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET).update(`${time}.${raw}`).digest('hex');
  let hook = await fetch(origin + '/api/stripe/webhook', { method: 'POST', body: raw, headers: { 'stripe-signature': `t=${time},v1=${signature}` } });
  check(hook.status === 400, 'Validly signed but mismatched payment session rejected');
  await client.execute({ sql: 'UPDATE orders SET stripe_session=? WHERE id=?', args: ['cs_qa', order] });
  hook = await fetch(origin + '/api/stripe/webhook', { method: 'POST', body: raw, headers: { 'stripe-signature': `t=${time},v1=${signature}` } });
  check(hook.ok, 'Verified webhook records a payment');
  hook = await fetch(origin + '/api/stripe/webhook', { method: 'POST', body: raw, headers: { 'stripe-signature': `t=${time},v1=${signature}` } });
  check(hook.ok, 'Duplicate verified webhook is idempotent');
  check((await call('/api/workspace', null, first.cookie)).data.orders.find(o => o.id === order).paid === 1, 'Verified paid state persists');
  await client.execute({ sql: 'DELETE FROM stripe_events WHERE id=?', args: [event.id] });
  result = await call('/api/auth/sign-out', {}, first.cookie);
  check(result.response.ok, 'Sign-out succeeds');
  check((await call('/api/workspace', null, first.cookie)).response.status === 401, 'Signed-out session no longer grants access');
  const login = await call('/api/auth/sign-in/email', { email: first.email, password: first.password });
  check(login.response.ok, 'Existing account can sign in with its password');
  const cookie = login.response.headers.getSetCookie().map(x => x.split(';')[0]).join('; ');
  check((await call('/api/workspace', null, cookie)).data.projects.some(p => p.id === project), 'Saved project survives sign-out and sign-in');
  console.log(`${checks} integration checks passed.`);
} finally {
  for (const id of projects) {
    for (const table of ['evidence', 'experiments', 'missions', 'orders']) await client.execute({ sql: `DELETE FROM ${table} WHERE project=?`, args: [id] });
    await client.execute({ sql: 'DELETE FROM projects WHERE id=?', args: [id] });
  }
  for (const id of accounts) {
    for (const table of ['session', 'account']) await client.execute({ sql: `DELETE FROM ${table} WHERE userId=?`, args: [id] });
    await client.execute({ sql: 'DELETE FROM user WHERE id=?', args: [id] });
    await client.execute({ sql: 'DELETE FROM usage WHERE id LIKE ?', args: [`${id}:%`] });
  }
  client.close();
}
