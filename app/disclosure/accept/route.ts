import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request): Promise<Response> {
  const origin = new URL(request.url).origin;

  // Server-side defense in depth: the consent box must actually be checked.
  const form = await request.formData();
  const accepted = form.get('accept') === 'yes';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/sign-in', origin), { status: 303 });
  }
  if (!accepted) {
    return NextResponse.redirect(new URL('/disclosure', origin), { status: 303 });
  }
  await supabase
    .from('users')
    .update({ ai_disclosure_accepted_at: new Date().toISOString() })
    .eq('id', user.id);
  return NextResponse.redirect(new URL('/home', origin), { status: 303 });
}
