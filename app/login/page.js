'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Field } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const body = Object.fromEntries(new FormData(e.currentTarget));
    const r = await api(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify(body) });
    setBusy(false);
    if (r.ok) {
      router.push('/');
      router.refresh();
    } else {
      setErr(r.data?.error || 'Something went wrong');
    }
  }

  return (
    <div className="auth card">
      <h1>🌱 EcoFoodSync</h1>
      <p className="muted">
        {mode === 'login' ? 'Sign in to coordinate food rescue.' : 'Create an account.'}
      </p>
      {err && <div className="notice err">{err}</div>}
      <form className="form" onSubmit={submit}>
        <Field label="Username">
          <input name="username" required minLength={3} maxLength={50} autoComplete="username" />
        </Field>
        {mode === 'register' && (
          <Field label="Email">
            <input name="email" type="email" required maxLength={255} />
          </Field>
        )}
        <Field label="Password">
          <input
            name="password"
            type="password"
            required
            minLength={mode === 'register' ? 8 : 1}
            maxLength={72}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </Field>
        {mode === 'register' && (
          <Field label="I am a">
            <select name="role" defaultValue="DONOR">
              <option value="DONOR">Food donor</option>
              <option value="CHARITY">Charity / NGO</option>
              <option value="VOLUNTEER">Volunteer driver</option>
            </select>
          </Field>
        )}
        <button disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Register'}</button>
      </form>
      <p className="muted" style={{ marginTop: 14 }}>
        {mode === 'login' ? 'No account? ' : 'Already registered? '}
        <button className="link" onClick={() => { setErr(''); setMode(mode === 'login' ? 'register' : 'login'); }}>
          {mode === 'login' ? 'Register' : 'Sign in'}
        </button>
      </p>
    </div>
  );
}
