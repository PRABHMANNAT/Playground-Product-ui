'use client';
import { useState, type FormEvent } from 'react';
import { ArrowUpRight, ArrowLeft, LoaderCircle } from 'lucide-react';
import { Brand, Label, Landscape } from '@/components/playground';
import { authClient } from '@/lib/auth-client';

export default function LoginForm({ next, emailEnabled, token }: { next: string; emailEnabled: boolean; token: string }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>(token ? 'reset' : 'login');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  function change(value: typeof mode) { setMode(value); setError(''); setMessage(''); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    const fields = new FormData(event.currentTarget);
    const email = String(fields.get('email') || '').trim().toLowerCase();
    const password = String(fields.get('password') || '');
    try {
      if (mode === 'forgot') {
        const result = await authClient.requestPasswordReset({ email, redirectTo: '/login' });
        if (result.error) throw new Error(result.error.message || 'Unable to request a reset.');
        setMessage('If this email has an account, a password reset link will arrive shortly.');
      } else if (mode === 'reset') {
        const result = await authClient.resetPassword({ token, newPassword: password });
        if (result.error) throw new Error(result.error.message || 'This reset link has expired. Request another one.');
        setMode('login'); setMessage('Password updated. Sign in with your new password.');
      } else if (mode === 'signup') {
        const result = await authClient.signUp.email({ name: String(fields.get('name') || '').trim(), email, password, callbackURL: next });
        if (result.error) throw new Error(result.error.message || 'Unable to create an account.');
        if (result.data?.token) location.assign(next);
        else setMessage('Check your inbox to verify your email, then return here to sign in.');
      } else {
        const result = await authClient.signIn.email({ email, password, callbackURL: next });
        if (result.error) throw new Error(result.error.message || 'Unable to sign in.');
        location.assign(next);
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="auth-layout"><section className="auth-panel"><Brand/><div className="auth-form-wrap"><Label>YOUR RESEARCH WORKSPACE</Label><h1>{({ login: 'Welcome back.', signup: 'Create your account.', forgot: 'Reset your password.', reset: 'Choose a new password.' })[mode]}</h1><p>{mode === 'signup' ? 'Keep your projects, evidence and experiments together.' : mode === 'login' ? 'Sign in to continue your research.' : 'Use your account email to recover access.'}</p>
    <form onSubmit={submit} className="auth-form">
      {mode === 'signup' && <label>Name<input autoComplete="name" name="name" required minLength={2} maxLength={100} placeholder="Your name"/></label>}
      {mode !== 'reset' && <label>Email<input autoComplete="email" name="email" type="email" required maxLength={254} placeholder="you@company.com"/></label>}
      {mode !== 'forgot' && <label>{mode === 'reset' ? 'New password' : 'Password'}<input autoComplete={mode === 'login' ? 'current-password' : 'new-password'} name="password" type="password" required minLength={mode === 'login' ? 1 : 12} maxLength={128} placeholder={mode === 'login' ? 'Your password' : 'At least 12 characters'}/></label>}
      {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="auth-message" role="status">{message}</p>}
      <button className="button dark full" disabled={busy}>{busy ? <LoaderCircle size={17} className="spin"/> : null}{busy ? 'Please wait…' : ({ login: 'Sign in', signup: 'Create account', forgot: 'Send reset link', reset: 'Update password' })[mode]}<ArrowUpRight size={16}/></button>
    </form>
    {mode === 'login' && <div className="auth-options"><span>New here? <button onClick={() => change('signup')}>Create an account</button></span>{emailEnabled && <button onClick={() => change('forgot')}>Forgot password?</button>}</div>}
    {mode !== 'login' && <button className="text-link auth-back" onClick={() => change('login')}><ArrowLeft size={14}/>Back to sign in</button>}
    <div className="auth-policy"><a href="/privacy">Privacy</a><span>·</span><a href="/terms">Pilot terms</a></div>
  </div><span className="mono auth-caption">PLAYGROUND / BUSINESS RESEARCH</span></section><section className="auth-art"><Landscape/><div><Label>RESEARCH BEFORE YOU BUILD</Label><h2>A place for the<br/>questions worth testing.</h2></div></section></main>;
}
