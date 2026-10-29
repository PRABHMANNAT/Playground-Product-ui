import { z } from 'zod';
import { searchGraveyard } from '@/lib/graveyard';
import { graveyardStatuses } from '@/lib/graveyard-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const input = z.object({
    query: z.string().max(200).default(''),
    status: z.enum(['all', ...graveyardStatuses]).default('verified_failure'),
    country: z.string().max(200).default(''),
    industry: z.string().max(300).default(''),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    pageSize: z.coerce.number().int().min(1).max(48).default(12),
});
export function GET(request: Request) {
    const parsed = input.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return Response.json({ error: 'Invalid archive filters or pagination.' }, { status: 400 });
    return Response.json(searchGraveyard(parsed.data), { headers: { 'Cache-Control': 'public, max-age=300' } });
}
