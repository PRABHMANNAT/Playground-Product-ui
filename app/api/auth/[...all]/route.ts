import { getAuth } from '@/lib/auth';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function handle(request: Request) {
  try { return await (await getAuth()).handler(request); }
  catch (error) {
    console.error('Authentication unavailable', error instanceof Error ? error.message : 'Unknown error');
    return Response.json({ message: 'Sign-in is unavailable. The site owner needs to check the database and authentication settings.' }, { status: 503 });
  }
}
export { handle as GET, handle as POST };
