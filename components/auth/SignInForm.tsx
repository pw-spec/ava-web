'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GoogleButton } from './GoogleButton';

export function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      return;
    }
    window.location.assign('/home');
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-[var(--fg)]/15 bg-white/70 px-4 py-3" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-[var(--fg)]/15 bg-white/70 px-4 py-3" />
        </label>
        <button type="submit" className="rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-white">
          Sign in
        </button>
        {error && <p className="text-sm text-[var(--tier-flagged)]">{error}</p>}
      </form>
      <GoogleButton />
    </div>
  );
}
