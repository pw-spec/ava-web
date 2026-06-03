'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { parseSignUp } from '@/lib/auth/validate';
import { isBlockedState } from '@/lib/auth/geo';
import { StateSelect } from './StateSelect';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    if (isBlockedState(stateCode)) {
      setError('Ava is not available in your state yet.');
      return;
    }
    const parsed = parseSignUp({ email, password, stateCode });
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { state_code: stateCode },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return <p className="font-medium text-[var(--accent)]">Check your email to confirm your account.</p>;
  }

  return (
    <form onSubmit={submit} noValidate className="flex w-full max-w-sm flex-col gap-3">
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
      <StateSelect value={stateCode} onChange={setStateCode} />
      <button type="submit" className="rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-white">
        Create account
      </button>
      {error && <p className="text-sm text-[var(--tier-flagged)]">{error}</p>}
    </form>
  );
}
