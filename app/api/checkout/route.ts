import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { gateDecision } from '@/lib/auth/gate';
import { getStripe } from '@/lib/stripe/server';

const bodySchema = z.object({ sessionId: z.string().uuid().optional() });

/** Opens a Stripe-hosted Checkout Session for the $29 Wellness Profile. Authed + full gate (a
 *  purchase derives from the user's session). The webhook does the credit grant, not this route. */
export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users')
    .select('state_code, ai_disclosure_accepted_at')
    .eq('id', user.id)
    .maybeSingle();
  const stateCode = (profile?.state_code as string | null) ?? null;
  const decision = gateDecision({
    hasSession: true,
    disclosureAccepted: Boolean(profile?.ai_disclosure_accepted_at),
    hasState: Boolean(stateCode),
    geoState: stateCode,
  });
  if (decision !== 'allow') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let raw: unknown = {};
  try {
    raw = await request.json();
  } catch {
    raw = {};
  }
  const parsed = bodySchema.safeParse(raw ?? {});
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const price = process.env.STRIPE_PRICE_WELLNESS_PROFILE;
  if (!price) return NextResponse.json({ error: 'Checkout unavailable.' }, { status: 500 });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price, quantity: 1 }],
    client_reference_id: user.id,
    metadata: { userId: user.id, sessionId: parsed.data.sessionId ?? '' },
    success_url: `${base}/profile?checkout=success`,
    cancel_url: `${base}/home?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
