import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isBlockedState } from '@/lib/auth/geo';

export async function POST(request: Request): Promise<Response> {
  const origin = new URL(request.url).origin;

  const form = await request.formData();
  const accepted = form.get('accept') === 'yes';
  const rawState = form.get('state_code');
  const submittedState = typeof rawState === 'string' && rawState ? rawState.toUpperCase() : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/sign-in', origin), { status: 303 });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('state_code')
    .eq('id', user.id)
    .maybeSingle();
  const existingState = (profile?.state_code as string | null) ?? null;
  const finalState = existingState ?? submittedState;

  // Need both a known state and an affirmative acceptance to proceed.
  if (!finalState || !accepted) {
    return NextResponse.redirect(new URL('/disclosure', origin), { status: 303 });
  }

  // Persist the state we learned so a self-reported CA/NY is a sticky block.
  if (isBlockedState(finalState)) {
    await supabase.from('users').update({ state_code: finalState }).eq('id', user.id);
    return NextResponse.redirect(new URL('/unavailable', origin), { status: 303 });
  }

  await supabase
    .from('users')
    .update({ state_code: finalState, ai_disclosure_accepted_at: new Date().toISOString() })
    .eq('id', user.id);
  return NextResponse.redirect(new URL('/home', origin), { status: 303 });
}
