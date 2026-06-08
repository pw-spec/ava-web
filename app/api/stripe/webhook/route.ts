import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { grantCredits, upsertEntitlement } from '@/lib/credits/store';
import { creditExpiry } from '@/lib/credits/expiry';

// Stripe SDK needs Node crypto for signature verification.
export const runtime = 'nodejs';

/** Stripe → us. Trust comes from the signature over the raw body, not from auth. On a completed
 *  checkout we idempotently grant credits + create the entitlement (both keyed so retries no-op). */
export async function POST(request: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook unavailable.' }, { status: 500 });

  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.userId;
  if (!userId) return NextResponse.json({ received: true }); // nothing to grant

  const credits = Number(process.env.WELLNESS_PROFILE_CREDITS) || 12;
  const priceCents = Number(process.env.WELLNESS_PROFILE_PRICE_CENTS) || 2900;
  const months = Number(process.env.CREDIT_EXPIRY_MONTHS) || 12;

  const admin = getSupabaseAdmin();
  // Grant first, then entitlement — both idempotent (grantCredits no-ops on its stripe_event_id
  // unique, upsertEntitlement on stripe_checkout_id). If either await throws, we let it 500 so
  // Stripe RETRIES the webhook; the retry safely re-applies without double-granting. Do NOT
  // swallow-and-200 here — that would silently drop the entitlement.
  await grantCredits(admin, {
    userId,
    delta: credits,
    reason: 'purchase:wellness_profile',
    unitPriceCents: Math.round(priceCents / credits),
    expiresAt: creditExpiry(new Date(), months),
    stripeEventId: event.id,
  });
  await upsertEntitlement(admin, {
    userId,
    sessionId: session.metadata?.sessionId || null,
    stripeCheckoutId: session.id,
    status: 'paid',
  });

  return NextResponse.json({ received: true });
}
