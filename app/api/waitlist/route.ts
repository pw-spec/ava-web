import { NextResponse } from 'next/server';
import { parseWaitlistEmail } from '@/lib/waitlist/validate';
import { saveEmail } from '@/lib/waitlist/store';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = parseWaitlistEmail(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  try {
    await saveEmail(getSupabaseAdmin(), parsed.email);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
