'use client';
import { useState } from 'react';

export function DisclosureForm() {
  const [accepted, setAccepted] = useState(false);
  return (
    <form action="/disclosure/accept" method="post" className="flex max-w-md flex-col gap-4">
      <p className="text-[var(--fg)]/80">
        Ava is an AI companion — not a human and not medical advice. It shares wellness indicators, not
        a medical assessment. In a crisis, call or text 988, or 911.
      </p>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
        I understand Ava is an AI wellness companion and not medical advice.
      </label>
      <button
        type="submit"
        disabled={!accepted}
        className="rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-white disabled:opacity-60"
      >
        Agree and continue
      </button>
    </form>
  );
}
