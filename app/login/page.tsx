import { safeReturnTo, emailAvailable } from '@/lib/auth';
import LoginForm from './login-form';
export const dynamic = 'force-dynamic';
export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <LoginForm next={safeReturnTo(typeof params.next === 'string' ? params.next : '/workspace')} emailEnabled={emailAvailable()} token={typeof params.token === 'string' ? params.token : ''}/>;
}
