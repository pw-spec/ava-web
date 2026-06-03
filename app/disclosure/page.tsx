import { DisclosureForm } from '@/components/auth/DisclosureForm';
import { createClient } from '@/lib/supabase/server';

export default async function DisclosurePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let needsState = false;
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('state_code')
      .eq('id', user.id)
      .maybeSingle();
    needsState = !profile?.state_code;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold">Before you start</h1>
      <DisclosureForm needsState={needsState} />
    </main>
  );
}
