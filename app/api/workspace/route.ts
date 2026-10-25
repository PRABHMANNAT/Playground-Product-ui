import { researchBrief, checkoutSession, ProviderError } from '@/lib/providers';
import { z } from 'zod';
import { db, config, identity, projectFor, guardOrigin, body, fail, HttpError, rateLimit, log } from '@/lib/server';
import { projectInput, evidenceInput, experimentInput, missionInput, templates, safeUrl } from '@/lib/validation';
import { packages } from '@/lib/catalog';
export const dynamic = 'force-dynamic';
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
export async function GET() {
    try {
        const user = await identity();
        const database = db();
        const projects = (await database.prepare('SELECT * FROM projects WHERE (?=1 OR owner=?) ORDER BY updated DESC').bind(user.admin ? 1 : 0, user.userId).all()).results;
        const evidence = (await database.prepare('SELECT e.* FROM evidence e JOIN projects p ON p.id=e.project WHERE (?=1 OR p.owner=?) ORDER BY e.created DESC').bind(user.admin ? 1 : 0, user.userId).all()).results;
        const experiments = (await database.prepare('SELECT e.* FROM experiments e JOIN projects p ON p.id=e.project WHERE (?=1 OR p.owner=?) ORDER BY e.created DESC').bind(user.admin ? 1 : 0, user.userId).all()).results;
        const missions = (await database.prepare('SELECT m.*,p.name AS project_name FROM missions m JOIN projects p ON p.id=m.project WHERE (?=1 OR m.owner=?) ORDER BY m.created DESC').bind(user.admin ? 1 : 0, user.userId).all()).results;
        const orders = (await database.prepare('SELECT o.*,p.name AS project_name FROM orders o JOIN projects p ON p.id=o.project WHERE (?=1 OR o.owner=?) ORDER BY o.created DESC').bind(user.admin ? 1 : 0, user.userId).all()).results;
        const applications = (await database.prepare('SELECT * FROM contributors WHERE owner=? ORDER BY created DESC').bind(user.userId).all()).results;
        const env = config();
        let operations: any = null;
        if (user.admin) {
            operations = { projects: (await database.prepare('SELECT * FROM projects ORDER BY created DESC LIMIT 200').all()).results, missions: (await database.prepare('SELECT m.*,p.name AS project_name FROM missions m JOIN projects p ON p.id=m.project ORDER BY m.created DESC LIMIT 200').all()).results, contributors: (await database.prepare('SELECT * FROM contributors ORDER BY created DESC LIMIT 200').all()).results, orders: (await database.prepare('SELECT o.*,p.name AS project_name FROM orders o JOIN projects p ON p.id=o.project ORDER BY o.created DESC LIMIT 200').all()).results };
        }
        return Response.json({ guest: false, user: { name: user.fullName || user.email.split('@')[0], email: user.email, admin: user.admin }, projects, evidence, experiments, missions, orders, applications, operations, capabilities: { ai: !!env.OPENAI_API_KEY, payments: !!env.STRIPE_SECRET_KEY && !!env.STRIPE_WEBHOOK_SECRET && env.SALES_ENABLED === 'true', adminConfigured: !!env.ADMIN_EMAILS }, currency: 'AUD' }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    catch (e) {
        if (e instanceof HttpError && e.status === 401)
            return Response.json({ guest: true, user: { name: 'Guest', email: '', admin: false }, projects: [], evidence: [], experiments: [], missions: [], orders: [], applications: [], operations: null, capabilities: { ai: false, payments: false, adminConfigured: false }, currency: 'AUD' }, { headers: { 'Cache-Control': 'private, no-store' } });
        if (e instanceof ProviderError)
            return Response.json({ error: e.message }, { status: 502 });
        return fail(e);
    }
}
export async function POST(req: Request) {
    try {
        const raw = await body(req);
        guardOrigin(req);
        const user = await identity();
        const action = z.string().parse(raw.action);
        const database = db();
        await rateLimit(user.userId, 'writes', 300);
        if (action === 'create_project') {
            const p = projectInput.parse(raw);
            const id = uid();
            const time = now();
            await database.prepare('INSERT INTO projects (id,owner,name,description,audience,sector,url,stage,status,consent,decision,rationale,created,updated) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id, user.userId, p.name, p.description, p.audience, p.sector, p.url, p.stage, 'Investigating', p.consent ? 1 : 0, 'Undecided', '', time, time).run();
            return Response.json({ id }, { status: 201 });
        }
        if (action === 'update_project') {
            const id = z.string().uuid().parse(raw.id);
            await projectFor(id, user);
            const p = projectInput.parse(raw);
            await database.prepare('UPDATE projects SET name=?,description=?,audience=?,sector=?,url=?,stage=?,consent=?,updated=? WHERE id=?').bind(p.name, p.description, p.audience, p.sector, p.url, p.stage, p.consent ? 1 : 0, now(), id).run();
            return Response.json({ ok: true });
        }
        if (action === 'update_evidence') {
            const id = z.string().uuid().parse(raw.id);
            const e = evidenceInput.parse(raw);
            await projectFor(e.project, user);
            const row = await database.prepare('SELECT project FROM evidence WHERE id=?').bind(id).first<{
                project: string;
            }>();
            if (!row || row.project !== e.project)
                throw new HttpError(404, 'Evidence not found.');
            await database.prepare("UPDATE evidence SET kind=?,claim=?,source=?,source_title=?,origin='User reviewed' WHERE id=?").bind(e.kind, e.claim, e.source, e.sourceTitle, id).run();
            return Response.json({ ok: true });
        }
        if (action === 'update_experiment_plan') {
            const id = z.string().uuid().parse(raw.id);
            const e = experimentInput.parse(raw);
            await projectFor(e.project, user);
            const row = await database.prepare('SELECT project FROM experiments WHERE id=?').bind(id).first<{
                project: string;
            }>();
            if (!row || row.project !== e.project)
                throw new HttpError(404, 'Experiment not found.');
            await database.prepare('UPDATE experiments SET title=?,hypothesis=?,method=?,metric=?,threshold=? WHERE id=?').bind(e.title, e.hypothesis, e.method, e.metric, e.threshold, id).run();
            return Response.json({ ok: true });
        }
        if (action === 'add_evidence') {
            const e = evidenceInput.parse(raw);
            await projectFor(e.project, user);
            const id = uid();
            await database.prepare('INSERT INTO evidence (id,project,kind,claim,source,source_title,origin,created) VALUES (?,?,?,?,?,?,?,?)').bind(id, e.project, e.kind, e.claim, e.source, e.sourceTitle, 'User supplied', now()).run();
            return Response.json({ id }, { status: 201 });
        }
        if (action === 'generate_experiments') {
            const id = z.string().uuid().parse(raw.project);
            const p = await projectFor(id, user);
            const existing = await database.prepare("SELECT id FROM experiments WHERE project=? AND origin='Template' LIMIT 1").bind(id).first();
            if (existing)
                throw new HttpError(409, 'This project already has a starter experiment plan. Add a custom experiment to extend it.');
            await database.batch(templates(p as any).map(e => database.prepare('INSERT INTO experiments (id,project,title,hypothesis,method,metric,threshold,status,result,origin,created) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(uid(), id, e.title, e.hypothesis, e.method, e.metric, e.threshold, 'Planned', '', 'Template', now())));
            return Response.json({ ok: true });
        }
        if (action === 'add_experiment') {
            const e = experimentInput.parse(raw);
            await projectFor(e.project, user);
            const id = uid();
            await database.prepare('INSERT INTO experiments (id,project,title,hypothesis,method,metric,threshold,status,result,origin,created) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(id, e.project, e.title, e.hypothesis, e.method, e.metric, e.threshold, 'Planned', '', 'Custom', now()).run();
            return Response.json({ id }, { status: 201 });
        }
        if (action === 'update_experiment') {
            const v = z.object({ id: z.string().uuid(), status: z.enum(['Planned', 'Running', 'Supported', 'Not supported', 'Inconclusive']), result: z.string().max(5000) }).parse(raw);
            if (['Supported', 'Not supported', 'Inconclusive'].includes(v.status) && v.result.trim().length < 10)
                throw new HttpError(400, 'Record observations before setting an outcome.');
            const row = await database.prepare('SELECT project FROM experiments WHERE id=?').bind(v.id).first<{
                project: string;
            }>();
            if (!row)
                throw new HttpError(404, 'Experiment not found.');
            await projectFor(row.project, user);
            await database.prepare('UPDATE experiments SET status=?,result=? WHERE id=?').bind(v.status, v.result, v.id).run();
            return Response.json({ ok: true });
        }
        if (action === 'save_decision') {
            const v = z.object({ project: z.string().uuid(), decision: z.enum(['Undecided', 'Pursue', 'Change', 'Pause']), rationale: z.string().max(5000) }).parse(raw);
            await projectFor(v.project, user);
            if (v.decision !== 'Undecided' && v.rationale.trim().length < 20)
                throw new HttpError(400, 'Explain your decision and the evidence behind it in at least 20 characters.');
            await database.prepare('UPDATE projects SET decision=?,rationale=?,updated=? WHERE id=?').bind(v.decision, v.rationale, now(), v.project).run();
            return Response.json({ ok: true });
        }
        if (action === 'request_mission') {
            const v = missionInput.parse(raw);
            await projectFor(v.project, user);
            const id = uid();
            await database.prepare('INSERT INTO missions (id,project,owner,domain,question,audience,budget,status,feedback,participant,compensation,cost,created) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id, v.project, user.userId, v.domain, v.question, v.audience, v.budget, 'Requested', '', '', 0, 0, now()).run();
            return Response.json({ id }, { status: 201 });
        }
        if (action === 'apply_contributor') {
            const v = z.object({ name: z.string().trim().min(2).max(120), domain: z.string().min(2).max(100), experience: z.string().trim().min(40).max(4000), profile: safeUrl.refine(v => !!v, 'A professional profile URL is required'), rate: z.number().int().min(25).max(10000), consent: z.literal(true) }).parse(raw);
            const id = uid();
            await database.prepare('INSERT INTO contributors (id,owner,name,email,domain,experience,profile,rate,status,created) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id, user.userId, v.name, user.email, v.domain, v.experience, v.profile, v.rate, 'Pending verification', now()).run();
            return Response.json({ id }, { status: 201 });
        }
        if (action === 'request_package') {
            const v = z.object({ project: z.string().uuid(), package: z.string() }).parse(raw);
            await projectFor(v.project, user);
            const pack = packages.find(p => p.id === v.package);
            if (!pack)
                throw new HttpError(400, 'Unknown package.');
            const existing = await database.prepare("SELECT id FROM orders WHERE project=? AND package=? AND status IN ('Requested','Checkout open')").bind(v.project, v.package).first();
            if (existing)
                return Response.json(existing);
            const id = uid();
            await database.prepare('INSERT INTO orders (id,owner,project,package,amount,currency,status,created) VALUES (?,?,?,?,?,?,?,?)').bind(id, user.userId, v.project, pack.id, pack.price * 100, 'aud', 'Requested', now()).run();
            return Response.json({ id }, { status: 201 });
        }
        if (action === 'checkout') {
            const id = z.string().uuid().parse(raw.id);
            const env = config();
            if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET || env.SALES_ENABLED !== 'true')
                throw new HttpError(409, 'Online payments are not live yet. Your package request is saved for scoping.');
            const order = await database.prepare('SELECT * FROM orders WHERE id=? AND owner=?').bind(id, user.userId).first<any>();
            if (!order)
                throw new HttpError(404, 'Order not found.');
            if (order.paid)
                throw new HttpError(409, 'This order has already been paid.');
            if (!['Scoping', 'Checkout open'].includes(order.status))
                throw new HttpError(409, 'An operator must confirm the scope before checkout.');
            const session = await checkoutSession({ id: order.id, amount: order.amount, currency: order.currency, name: packages.find(p => p.id === order.package)?.name || order.package }, user.email, new URL(req.url).origin, env.STRIPE_SECRET_KEY);
            if (!session.url?.startsWith('https://checkout.stripe.com/'))
                throw new HttpError(502, 'Unexpected checkout response.');
            await database.prepare("UPDATE orders SET status='Checkout open',stripe_session=? WHERE id=?").bind(session.id, id).run();
            return Response.json({ url: session.url });
        }
        if (action === 'research') {
            const v = z.object({ project: z.string().uuid(), consent: z.literal(true) }).parse(raw);
            const p = await projectFor(v.project, user);
            const env = config();
            if (!env.OPENAI_API_KEY)
                throw new HttpError(409, 'AI research is not connected. You can add sources manually or request an intelligence brief.');
            await rateLimit(user.userId, 'research', 5);
            await rateLimit('site', 'research', 50);
            const parsed = await researchBrief({ name: p.name, description: p.description, audience: p.audience, sector: p.sector }, env.OPENAI_API_KEY, env.OPENAI_MODEL || 'gpt-4.1-mini');
            await database.batch(parsed.map(e => database.prepare('INSERT INTO evidence (id,project,kind,claim,source,source_title,origin,created) VALUES (?,?,?,?,?,?,?,?)').bind(uid(), v.project, 'Hypothesis', e.claim, e.source, e.sourceTitle, 'AI research · needs verification', now())));
            await log(user.userId, 'research_completed', v.project);
            return Response.json({ count: parsed.length });
        }
        if (action === 'update_consent') {
            const v = z.object({ consent: z.boolean() }).parse(raw);
            await database.prepare('UPDATE projects SET consent=? WHERE owner=?').bind(v.consent ? 1 : 0, user.userId).run();
            return Response.json({ ok: true });
        }
        if (action === 'admin_mission') {
            if (!user.admin)
                throw new HttpError(403, 'Operator access required.');
            const v = z.object({ id: z.string().uuid(), status: z.enum(['Requested', 'Scoping', 'Recruiting', 'Scheduled', 'Completed', 'Cancelled']), participant: z.string().max(200), feedback: z.string().max(6000), compensation: z.number().int().min(0).max(100000), cost: z.number().int().min(0).max(100000) }).parse(raw);
            if (v.status === 'Completed' && (!v.participant.trim() || v.feedback.trim().length < 20))
                throw new HttpError(400, 'Completed missions need a participant reference and substantive feedback.');
            await database.prepare('UPDATE missions SET status=?,participant=?,feedback=?,compensation=?,cost=? WHERE id=?').bind(v.status, v.participant, v.feedback, v.compensation, v.cost, v.id).run();
            await log(user.userId, 'mission_updated', v.id);
            return Response.json({ ok: true });
        }
        if (action === 'admin_contributor') {
            if (!user.admin)
                throw new HttpError(403, 'Operator access required.');
            const v = z.object({ id: z.string().uuid(), status: z.enum(['Pending verification', 'Verified', 'Declined']) }).parse(raw);
            await database.prepare('UPDATE contributors SET status=? WHERE id=?').bind(v.status, v.id).run();
            await log(user.userId, 'contributor_' + v.status, v.id);
            return Response.json({ ok: true });
        }
        if (action === 'admin_order') {
            if (!user.admin)
                throw new HttpError(403, 'Operator access required.');
            const v = z.object({ id: z.string().uuid(), status: z.enum(['Scoping', 'In progress', 'Delivered', 'Cancelled']) }).parse(raw);
            const order = await database.prepare('SELECT status,paid FROM orders WHERE id=?').bind(v.id).first<{
                status: string;
                paid: number;
            }>();
            if (!order)
                throw new HttpError(404, 'Order not found.');
            if (['In progress', 'Delivered'].includes(v.status) && !order.paid)
                throw new HttpError(400, 'A verified payment is required before starting fulfillment.');
            await database.prepare('UPDATE orders SET status=? WHERE id=?').bind(v.status, v.id).run();
            await log(user.userId, 'order_' + v.status, v.id);
            return Response.json({ ok: true });
        }
        throw new HttpError(400, 'Unknown action.');
    }
    catch (e) {
        if (e instanceof ProviderError)
            return Response.json({ error: e.message }, { status: 502 });
        return fail(e);
    }
}
