import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { gateDecision } from '@/lib/auth/gate';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let disclosureAccepted = false;
  let stateCode: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('ai_disclosure_accepted_at, state_code')
      .eq('id', user.id)
      .maybeSingle();
    disclosureAccepted = Boolean(profile?.ai_disclosure_accepted_at);
    stateCode = (profile?.state_code as string | null) ?? null;
  }

  // IP geo isn't visible to server components; proxy.ts covers IP. Here we still block a
  // stored CA/NY state and require state + disclosure before /home.
  const decision = gateDecision({
    hasSession: Boolean(user),
    disclosureAccepted,
    hasState: Boolean(stateCode),
    geoState: stateCode,
  });
  if (decision !== 'allow') redirect(decision);

  return <>{children}</>;
}
