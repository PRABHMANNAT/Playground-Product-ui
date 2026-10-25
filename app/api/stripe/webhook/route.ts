import { config, db, fail, HttpError } from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
    try {
        const secret = config().STRIPE_WEBHOOK_SECRET;
        if (!secret)
            throw new HttpError(503, 'Webhook unavailable.');
        const raw = await req.text();
        if (raw.length > 1000000)
            throw new HttpError(413, 'Payload too large.');
        const parts = (req.headers.get('stripe-signature') || '').split(',').map(x => x.split('='));
        const timestamp = parts.find(x => x[0] === 't')?.[1];
        const signatures = parts.filter(x => x[0] === 'v1').map(x => x[1]);
        if (!timestamp || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300)
            throw new HttpError(400, 'Invalid signature.');
        const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
        let valid = false;
        for (const signature of signatures) {
            if (!/^[a-f0-9]{64}$/i.test(signature || ''))
                continue;
            const bytes = Uint8Array.from(signature.match(/../g)!.map(s => parseInt(s, 16)));
            if (await crypto.subtle.verify('HMAC', key, bytes, new TextEncoder().encode(`${timestamp}.${raw}`)))
                valid = true;
        }
        if (!valid)
            throw new HttpError(400, 'Invalid signature.');
        const event = JSON.parse(raw);
        const database = db();
        if (await database.prepare('SELECT id FROM stripe_events WHERE id=?').bind(event.id).first())
            return Response.json({ received: true });
        const s = event.data?.object;
        if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type) && s?.payment_status === 'paid') {
            const order = await database.prepare('SELECT * FROM orders WHERE id=?').bind(s.metadata?.order_id || '').first<any>();
            if (!order || s.currency !== order.currency || s.amount_total !== order.amount || s.id !== order.stripe_session)
                throw new HttpError(400, 'Order mismatch.');
            await database.batch([database.prepare("UPDATE orders SET paid=1,status=CASE WHEN status IN ('Delivered','In progress') THEN status ELSE 'Paid' END WHERE id=?").bind(order.id), database.prepare('INSERT OR IGNORE INTO stripe_events (id,created) VALUES (?,?)').bind(event.id, new Date().toISOString())]);
        }
        else
            await database.prepare('INSERT OR IGNORE INTO stripe_events (id,created) VALUES (?,?)').bind(event.id, new Date().toISOString()).run();
        return Response.json({ received: true });
    }
    catch (e) {
        return fail(e);
    }
}
