'use client';
import { useState } from 'react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailCapture() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('failed');
      setStatus('success');
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  }

  if (status === 'success') {
    return <p className="font-medium text-[var(--accent)]">You&apos;re on the list. We&apos;ll be in touch.</p>;
  }

  return (
    <form onSubmit={submit} noValidate className="flex w-full max-w-md flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          aria-label="Email"
          className="flex-1 rounded-full border border-[var(--fg)]/15 bg-white/70 px-4 py-3 text-[var(--fg)] outline-none focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-white disabled:opacity-60"
        >
          Notify me
        </button>
      </div>
      {status === 'error' && <p className="text-sm text-[var(--tier-flagged)]">{message}</p>}
    </form>
  );
}
