import 'server-only';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { drizzle } from 'drizzle-orm/libsql';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import * as schema from '@/db/auth-schema';
import { ensureDatabase, getClient } from '@/db/client.mjs';
export function appOrigin() {
  const url = process.env.BETTER_AUTH_URL || process.env.SITE_URL ||
    (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  return new URL(url).origin;
}
export function emailAvailable() { return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM); }
async function sendEmail(to: string, subject: string, url: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text: `${subject}\n\nOpen this link:\n${url}\n\nIf you did not request this, ignore this email.` }),
  });
  if (!response.ok) throw new Error('Email could not be sent. Please try again.');
}
function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('Set BETTER_AUTH_SECRET to a random value of at least 32 characters.');
  return betterAuth({
    appName: 'Playground', secret,
    baseURL: process.env.VERCEL ? {
      allowedHosts: Array.from(new Set([appOrigin(), process.env.SITE_URL, process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`, process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`, process.env.VERCEL_BRANCH_URL && `https://${process.env.VERCEL_BRANCH_URL}`].filter(Boolean).map(value => new URL(value!).host))),
      protocol: 'https', fallback: appOrigin(),
    } : appOrigin(),
    database: drizzleAdapter(drizzle(getClient(), { schema }), { provider: 'sqlite', schema, transaction: true }),
    emailAndPassword: {
      enabled: true, minPasswordLength: 12, maxPasswordLength: 128, requireEmailVerification: emailAvailable(),
      ...(emailAvailable() ? { sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => sendEmail(user.email, 'Reset your Playground password', url) } : {}),
    },
    emailVerification: emailAvailable() ? {
      sendOnSignUp: true, sendOnSignIn: true, autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => sendEmail(user.email, 'Verify your Playground email', url),
    } : undefined,
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    rateLimit: {
      enabled: true, window: 60, max: 60,
      customRules: { '/sign-in/email': { window: 60, max: 8 }, '/sign-up/email': { window: 60, max: 5 } },
      customStorage: { async consume(key, rule) {
        const time = Date.now(), cutoff = time - rule.window * 1000;
        const result = await getClient().execute({ sql: `INSERT INTO auth_rate_limit (key,count,lastRequest) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN lastRequest<=? THEN 1 ELSE count+1 END,lastRequest=CASE WHEN lastRequest<=? THEN ? ELSE lastRequest END RETURNING count,lastRequest`, args: [key, time, cutoff, cutoff, time] });
        const row = result.rows[0], allowed = Number(row.count) <= rule.max;
        return { allowed, retryAfter: allowed ? null : Math.max(1, Math.ceil((Number(row.lastRequest) + rule.window * 1000 - time) / 1000)) };
      } },
    },
    advanced: { ipAddress: { ipAddressHeaders: ['x-real-ip'] } },
  });
}
let instance: ReturnType<typeof createAuth> | undefined;
export async function getAuth() { await ensureDatabase(); return instance ??= createAuth(); }
export async function currentUser() {
  const result = await (await getAuth()).api.getSession({ headers: await headers() });
  return result ? { userId: result.user.id, email: result.user.email, fullName: result.user.name, emailVerified: result.user.emailVerified } : null;
}
export function safeReturnTo(value: string) {
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/workspace';
  const url = new URL(value, 'https://local.invalid');
  return url.origin === 'https://local.invalid' && !url.pathname.startsWith('/api/') && !url.pathname.startsWith('/login') ? url.pathname + url.search : '/workspace';
}
export async function requireUser(returnTo: string) {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(safeReturnTo(returnTo))}`);
  return user;
}
