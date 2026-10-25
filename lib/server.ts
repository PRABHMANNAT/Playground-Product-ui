import { database } from '@/lib/database';
const env = process.env;
import { currentUser } from '@/lib/auth';
export class HttpError extends Error {
    constructor(public status: number, message: string) { super(message); }
}
export function db() { return database; }
export function config() { return env; }
export async function identity() { const user = await currentUser(); if (!user)
    throw new HttpError(401, 'Sign in to continue.'); return { ...user, admin: user.emailVerified && (env.ADMIN_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean).includes(user.email.toLowerCase()) }; }
export function guardOrigin(req: Request) { const origin = req.headers.get('origin'); if (!origin || origin !== new URL(req.url).origin)
    throw new HttpError(403, 'Request origin could not be verified.'); }
export async function body(req: Request) { if (Number(req.headers.get('content-length') || 0) > 24000)
    throw new HttpError(413, 'Request is too large.'); const text = await req.text(); if (text.length > 24000)
    throw new HttpError(413, 'Request is too large.'); try {
    return JSON.parse(text);
}
catch {
    throw new HttpError(400, 'Invalid JSON.');
} }
export async function projectFor(id: string, user: {
    userId: string;
    admin: boolean;
}) { const p = await db().prepare('SELECT * FROM projects WHERE id=?').bind(id).first<Record<string, any>>(); if (!p || (!user.admin && p.owner !== user.userId))
    throw new HttpError(404, 'Project not found.'); return p; }
export async function log(actor: string, action: string, target: string) { await db().prepare('INSERT INTO audit (id,actor,action,target,created) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(), actor, action, target, new Date().toISOString()).run(); }
export async function rateLimit(user: string, action: string, limit: number) { const id = `${user}:${action}:${new Date().toISOString().slice(0, 10)}`; const r = await db().prepare('INSERT INTO usage (id,count) VALUES (?,1) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(id).first<{
    count: number;
}>(); if ((r?.count || 0) > limit)
    throw new HttpError(429, 'Daily limit reached. Try again tomorrow or contact your operator.'); }
export function fail(e: unknown) { if (e instanceof HttpError)
    return Response.json({ error: e.message }, { status: e.status }); if (e && typeof e === 'object' && 'issues' in e)
    return Response.json({ error: (e as any).issues.map((x: any) => x.message).join(' ') }, { status: 400 }); console.error('API operation failed', e instanceof Error ? e.message : 'Unknown error'); return Response.json({ error: 'Something went wrong. Please retry; your saved work is safe.' }, { status: 500 }); }
