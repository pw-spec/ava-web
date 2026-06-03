'use client';
import { createClient } from '@/lib/supabase/client';

export function GoogleButton() {
  function go(): void {
    const supabase = createClient();
    void supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }
  return (
    <button
      type="button"
      onClick={go}
      className="rounded-full border border-[var(--fg)]/15 bg-white px-6 py-3 font-semibold text-[var(--fg)]"
    >
      Continue with Google
    </button>
  );
}
