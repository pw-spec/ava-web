import { NextResponse } from 'next/server';
import { parseWaitlistEmail } from '@/lib/waitlist/validate';
import { saveEmail } from '@/lib/waitlist/store';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { waitlistLimiter } from '@/lib/ratelimit/waitlist';

function clientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return 'unknown';
}

/** Hidden form field that real users never fill; bots do. */
function honeypotFilled(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return false;
  const website = (body as Record<string, unknown>).website;
  return typeof website === 'string' && website.trim() !== '';
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  // Honeypot: pretend success, store nothing. Traps naive bots with zero user friction.
  if (honeypotFilled(body)) {
    return NextResponse.json({ ok: true });
  }

  // Best-effort per-IP rate limit. Durable layer = Vercel Firewall at deploy.
  if (!waitlistLimiter.check(clientIp(request)).allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests. Please try again shortly.' },
      { status: 429 },
    );
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
