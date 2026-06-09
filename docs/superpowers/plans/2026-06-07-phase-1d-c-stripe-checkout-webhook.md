# Phase 1D-c — Stripe Checkout + Webhook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The money rail — a `/api/checkout` that opens a Stripe-hosted Checkout Session for the $29 Wellness Profile, and a signature-verified `/api/stripe/webhook` that idempotently grants 12 credits + creates the purchase entitlement (via the 1D-b store layer) on `checkout.session.completed`.

**Architecture:** A thin server-only Stripe client (`lib/stripe/server.ts`). `POST /api/checkout` (authed + full gate, mirroring `/api/share`) creates a Checkout Session carrying `{userId, sessionId}` metadata. `POST /api/stripe/webhook` verifies the signature over the raw body, and on a completed checkout calls `grantCredits` + `upsertEntitlement` (1D-b) through the service-role admin client. Stripe is **mocked** in all tests — no account/keys needed to build or test.

**Tech Stack:** Next.js 16 App Router (Node runtime), `stripe` SDK (new dep), Supabase service-role client, zod, Vitest. Builds on 1D-b (`lib/credits/store.ts`, the two tables).

**Spec:** `docs/superpowers/specs/2026-06-07-phase-1d-decision-cta-design.md` (§Stripe flow, §Routes, §Security).

**Conventions:** Branch `phase-1d-c/stripe-checkout` off `main`. `phase-1:` commits, one concern each, `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. TS strict; no `any` without `// reason:`. Money/credits are integers. No hardcoded secrets — all Stripe config via env.

---

## File Structure

**Created:**
- `lib/stripe/server.ts` — lazy server-only Stripe client
- `lib/credits/expiry.ts` — pure `creditExpiry(now, months)` for grant `expires_at`
- `app/api/checkout/route.ts` — create the Checkout Session
- `app/api/stripe/webhook/route.ts` — verify + grant on completion
- `test/credits/expiry.test.ts`, `test/api/checkout.test.ts`, `test/api/stripe-webhook.test.ts`

**Modified:**
- `package.json` (+ `stripe` dep)
- `.env.example` (+ `STRIPE_PRICE_WELLNESS_PROFILE`, `WELLNESS_PROFILE_CREDITS`, `WELLNESS_PROFILE_PRICE_CENTS`)

---

## Task 1: Install `stripe` + the server client + env

**Files:**
- Modify: `package.json` (via npm), `.env.example`
- Create: `lib/stripe/server.ts`

> No dedicated test for the client wrapper — it mirrors `lib/supabase/admin.ts` (`getSupabaseAdmin`), which also has none; it's exercised through the route tests (which mock it).

- [ ] **Step 1: Install the dependency**

```bash
npm install stripe
```

- [ ] **Step 2: Write `lib/stripe/server.ts`**

```ts
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
```

> The config arg (and its `apiVersion`) is optional in the current `stripe` SDK, so `new Stripe(key)` typechecks. Only if `npx tsc --noEmit` complains that `apiVersion` is required, pass the SDK's own default: `new Stripe(key, { apiVersion: Stripe.LatestApiVersion })` — do not hardcode a date string.

- [ ] **Step 3: Add the new env keys to `.env.example`** under the existing `# Stripe` block (the other three Stripe keys + `CREDIT_EXPIRY_MONTHS` are already present). Append:

```bash
STRIPE_PRICE_WELLNESS_PROFILE=    # test-mode Price id for the $29 Wellness Profile (price_…)
WELLNESS_PROFILE_CREDITS=12       # credits granted per Wellness Profile purchase
WELLNESS_PROFILE_PRICE_CENTS=2900 # price in cents (for unit_price_cents = round(price/credits))
```

- [ ] **Step 4: Verify** `npx tsc --noEmit` clean; `npm run lint` clean. (`stripe` resolves; the import typechecks.)

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json lib/stripe/server.ts .env.example
git commit -m "phase-1: add stripe dep + server-only Stripe client + env keys

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `lib/credits/expiry.ts` — pure grant-expiry helper

**Files:**
- Create: `lib/credits/expiry.ts`, `test/credits/expiry.test.ts`

- [ ] **Step 1: Write the failing test** `test/credits/expiry.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { creditExpiry } from '@/lib/credits/expiry';

describe('creditExpiry', () => {
  it('returns an ISO timestamp the given number of months ahead', () => {
    expect(creditExpiry(new Date('2026-06-07T00:00:00.000Z'), 12)).toBe('2027-06-07T00:00:00.000Z');
  });
  it('advances mid-month timestamps by the month count, preserving the time', () => {
    expect(creditExpiry(new Date('2026-06-15T08:30:00.000Z'), 6)).toBe('2026-12-15T08:30:00.000Z');
  });
  it('does not mutate the input date', () => {
    const now = new Date('2026-06-07T00:00:00.000Z');
    creditExpiry(now, 12);
    expect(now.toISOString()).toBe('2026-06-07T00:00:00.000Z');
  });
});
```

- [ ] **Step 2: Run it — confirm FAIL** (`npx vitest run test/credits/expiry.test.ts`).

- [ ] **Step 3: Write `lib/credits/expiry.ts`**

```ts
/** ISO timestamp `months` calendar months after `now` — the `expires_at` for a credit grant.
 *  Copies the input (does not mutate). Per CREDIT_EXPIRY_MONTHS (default 12). */
export function creditExpiry(now: Date, months: number): string {
  const d = new Date(now.getTime());
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}
```

- [ ] **Step 4: Run it — confirm PASS** (`npx vitest run test/credits/expiry.test.ts`). `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 5: Commit**

```bash
git add lib/credits/expiry.ts test/credits/expiry.test.ts
git commit -m "phase-1: creditExpiry helper (grant expires_at, N months ahead)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: `POST /api/checkout` — create the Checkout Session

**Files:**
- Create: `app/api/checkout/route.ts`, `test/api/checkout.test.ts`

- [ ] **Step 1: Write the failing test** `test/api/checkout.test.ts`:

```ts
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

beforeAll(() => {
  process.env.NEXT_PUBLIC_APP_URL = 'https://ava.test';
  process.env.STRIPE_PRICE_WELLNESS_PROFILE = 'price_123';
});

const { getUser, maybeSingle, create } = vi.hoisted(() => ({
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  create: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));
vi.mock('@/lib/stripe/server', () => ({
  getStripe: () => ({ checkout: { sessions: { create } } }),
}));

import { POST } from '@/app/api/checkout/route';

function req(body?: unknown): Request {
  return new Request('https://ava.test/api/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('POST /api/checkout', () => {
  beforeEach(() => {
    getUser.mockReset().mockResolvedValue({ data: { user: { id: 'u1' } } });
    maybeSingle.mockReset().mockResolvedValue({ data: { state_code: 'TX', ai_disclosure_accepted_at: 't' } });
    create.mockReset().mockResolvedValue({ url: 'https://checkout.stripe.test/cs_1', id: 'cs_1' });
  });

  it('401 when unauthenticated', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await POST(req({}))).status).toBe(401);
  });

  it('403 when the gate is not satisfied (e.g. disclosure not accepted)', async () => {
    maybeSingle.mockResolvedValue({ data: { state_code: 'TX', ai_disclosure_accepted_at: null } });
    expect((await POST(req({}))).status).toBe(403);
  });

  it('403 for a geo-blocked state', async () => {
    maybeSingle.mockResolvedValue({ data: { state_code: 'CA', ai_disclosure_accepted_at: 't' } });
    expect((await POST(req({}))).status).toBe(403);
  });

  it('creates a Checkout Session with the price + user/session metadata and returns the url', async () => {
    const res = await POST(req({ sessionId: '00000000-0000-0000-0000-000000000001' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: 'https://checkout.stripe.test/cs_1' });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        line_items: [{ price: 'price_123', quantity: 1 }],
        client_reference_id: 'u1',
        metadata: { userId: 'u1', sessionId: '00000000-0000-0000-0000-000000000001' },
        success_url: 'https://ava.test/profile?checkout=success',
        cancel_url: 'https://ava.test/home?checkout=cancelled',
      }),
    );
  });

  it('works without a sessionId (empty string metadata) and rejects a non-uuid sessionId', async () => {
    expect((await POST(req({}))).status).toBe(200);
    expect(create.mock.calls.at(-1)?.[0].metadata).toEqual({ userId: 'u1', sessionId: '' });
    expect((await POST(req({ sessionId: 'not-a-uuid' }))).status).toBe(400);
  });
});
```

- [ ] **Step 2: Run it — confirm FAIL** (`npx vitest run test/api/checkout.test.ts`).

- [ ] **Step 3: Write `app/api/checkout/route.ts`**

```ts
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
```

- [ ] **Step 4: Run it — confirm PASS** (`npx vitest run test/api/checkout.test.ts`). `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 5: Commit**

```bash
git add app/api/checkout/route.ts test/api/checkout.test.ts
git commit -m "phase-1: POST /api/checkout — gated Stripe Checkout Session for the $29 profile

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: `POST /api/stripe/webhook` — verify + grant

**Files:**
- Create: `app/api/stripe/webhook/route.ts`, `test/api/stripe-webhook.test.ts`

- [ ] **Step 1: Write the failing test** `test/api/stripe-webhook.test.ts`:

```ts
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

beforeAll(() => {
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  process.env.WELLNESS_PROFILE_CREDITS = '12';
  process.env.WELLNESS_PROFILE_PRICE_CENTS = '2900';
  process.env.CREDIT_EXPIRY_MONTHS = '12';
});

const { constructEvent, grantCredits, upsertEntitlement } = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  grantCredits: vi.fn(),
  upsertEntitlement: vi.fn(),
}));

vi.mock('@/lib/stripe/server', () => ({ getStripe: () => ({ webhooks: { constructEvent } }) }));
vi.mock('@/lib/supabase/admin', () => ({ getSupabaseAdmin: () => ({}) }));
vi.mock('@/lib/credits/store', () => ({ grantCredits, upsertEntitlement }));

import { POST } from '@/app/api/stripe/webhook/route';

function req(sig: string | null = 't=1,v1=abc'): Request {
  return new Request('https://ava.test/api/stripe/webhook', {
    method: 'POST',
    headers: sig === null ? {} : { 'stripe-signature': sig },
    body: '{"raw":"body"}',
  });
}

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    constructEvent.mockReset();
    grantCredits.mockReset().mockResolvedValue({ granted: true });
    upsertEntitlement.mockReset().mockResolvedValue(undefined);
  });

  it('400 when the signature header is missing', async () => {
    expect((await POST(req(null))).status).toBe(400);
    expect(grantCredits).not.toHaveBeenCalled();
  });

  it('400 when signature verification fails (forged)', async () => {
    constructEvent.mockImplementation(() => {
      throw new Error('bad sig');
    });
    expect((await POST(req())).status).toBe(400);
    expect(grantCredits).not.toHaveBeenCalled();
  });

  it('ignores non-checkout events with 200 and no grant', async () => {
    constructEvent.mockReturnValue({ id: 'evt_1', type: 'payment_intent.created', data: { object: {} } });
    expect((await POST(req())).status).toBe(200);
    expect(grantCredits).not.toHaveBeenCalled();
  });

  it('grants credits + entitlement on checkout.session.completed', async () => {
    constructEvent.mockReturnValue({
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_1', metadata: { userId: 'u1', sessionId: 's1' } } },
    });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(grantCredits).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: 'u1',
        delta: 12,
        reason: 'purchase:wellness_profile',
        unitPriceCents: 242, // round(2900 / 12)
        stripeEventId: 'evt_1',
      }),
    );
    // expires_at is an ISO string ~12 months out
    expect(grantCredits.mock.calls[0][1].expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(upsertEntitlement).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ userId: 'u1', sessionId: 's1', stripeCheckoutId: 'cs_1', status: 'paid' }),
    );
  });

  it('maps an empty-string sessionId to null entitlement session', async () => {
    constructEvent.mockReturnValue({
      id: 'evt_2',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_2', metadata: { userId: 'u1', sessionId: '' } } },
    });
    await POST(req());
    expect(upsertEntitlement.mock.calls.at(-1)?.[1]).toEqual(
      expect.objectContaining({ sessionId: null, stripeCheckoutId: 'cs_2' }),
    );
  });

  it('200 without granting when metadata.userId is absent', async () => {
    constructEvent.mockReturnValue({
      id: 'evt_3',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_3', metadata: {} } },
    });
    expect((await POST(req())).status).toBe(200);
    expect(grantCredits).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it — confirm FAIL** (`npx vitest run test/api/stripe-webhook.test.ts`).

- [ ] **Step 3: Write `app/api/stripe/webhook/route.ts`**

```ts
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

  const credits = Number(process.env.WELLNESS_PROFILE_CREDITS ?? 12);
  const priceCents = Number(process.env.WELLNESS_PROFILE_PRICE_CENTS ?? 2900);
  const months = Number(process.env.CREDIT_EXPIRY_MONTHS ?? 12);

  const admin = getSupabaseAdmin();
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
```

- [ ] **Step 4: Run it — confirm PASS** (`npx vitest run test/api/stripe-webhook.test.ts`). Then `npx vitest run` (whole suite green; isolate any WSL2 5000ms flake). `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 5: Commit**

```bash
git add app/api/stripe/webhook/route.ts test/api/stripe-webhook.test.ts
git commit -m "phase-1: POST /api/stripe/webhook — sig-verified, idempotent grant + entitlement

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Done criteria

- `POST /api/checkout`: 401 unauth / 403 gate-fail (incl. geo) / 400 bad sessionId / 200 returns a Stripe Checkout url with `{userId, sessionId}` metadata + `client_reference_id`.
- `POST /api/stripe/webhook`: 400 on missing/forged signature (no grant); 200 ignore for non-checkout events; on `checkout.session.completed` calls `grantCredits` (12 credits, `unit_price_cents` 242, `stripe_event_id`) + `upsertEntitlement` (`status:'paid'`, `stripe_checkout_id`); empty `sessionId` → null; missing `userId` → 200 no grant.
- Idempotency carried by 1D-b: webhook retries hit the `stripe_event_id`/`stripe_checkout_id` uniques → no double-grant.
- Stripe mocked throughout; no keys needed. `npx vitest run`, `npx tsc --noEmit`, `npm run lint` all clean.

## Live-test prerequisites (for the user, when wanted — NOT needed for this slice)
- `.env.local`: `STRIPE_SECRET_KEY=sk_test_…`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_…`, `STRIPE_WEBHOOK_SECRET=whsec_…` (from `stripe listen --forward-to localhost:3000/api/stripe/webhook`), `STRIPE_PRICE_WELLNESS_PROFILE=price_…` (create the $29 test product/price — the Stripe MCP can do this).

## Post-plan (not part of this branch)
- Security review before the PR (standing rule) — focus: signature verification, idempotency, no secret leakage, webhook can't be forged to mint credits.
- Next slice: **1D-d** — `POST /api/profile/generate` (Sonnet report → output-filter → encrypt → discard transcript) + the `/profile` page.
