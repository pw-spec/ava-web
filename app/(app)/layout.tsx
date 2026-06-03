import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { gateDecision } from '@/lib/auth/gate';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let disclosureAccepted = false;
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('ai_disclosure_accepted_at')
      .eq('id', user.id)
      .maybeSingle();
    disclosureAccepted = Boolean(profile?.ai_disclosure_accepted_at);
  }

  // geoState is null here (server components don't see the geo header); proxy.ts covers geo.
  const decision = gateDecision({ hasSession: Boolean(user), disclosureAccepted, geoState: null });
  if (decision !== 'allow') redirect(decision);

  return <>{children}</>;
}
