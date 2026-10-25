import { requireUser } from '@/lib/auth';
import Workspace from './workspace';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) { const params = await searchParams; const query = new URLSearchParams(); for (const key of ['view', 'project', 'new', 'package']) {
    const v = params[key];
    if (typeof v === 'string' && v.length < 150)
        query.set(key, v);
} await requireUser('/workspace' + (query.size ? '?' + query.toString() : '')); return <Workspace />; }
