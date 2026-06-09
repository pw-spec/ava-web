import 'server-only';
import Stripe from 'stripe';

let cached: Stripe | null = null;

/** The server-side Stripe client (lazy, cached). Server-only — never import from a client component. */
export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe not configured: set STRIPE_SECRET_KEY.');
  cached = new Stripe(key);
  return cached;
}
