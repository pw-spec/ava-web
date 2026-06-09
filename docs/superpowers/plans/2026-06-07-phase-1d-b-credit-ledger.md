# Phase 1D-b — Credit Ledger Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lay the credit-liability data foundation — the `credit_ledger` + `wellness_profiles` tables and a pure + store data-access layer — that the Stripe webhook (1D-c) and report flow (1D-d) build on. No Stripe, no UI.

**Architecture:** A migration adds two service-role-write / owner-read tables. `lib/credits/balance.ts` holds pure math (`creditBalance`, `outstandingLiability`) over plain row arrays. `lib/credits/store.ts` (server-only) is the typed data-access layer: read the ledger/entitlement, and idempotently grant credits / upsert the entitlement / save the report — each a thin, mockable wrapper over Supabase.

**Tech Stack:** Supabase (PostgreSQL, RLS) via the Supabase MCP; TypeScript strict; Vitest. No new deps, no Stripe.

**Spec:** `docs/superpowers/specs/2026-06-07-phase-1d-decision-cta-design.md` (§Data model, §`lib/credits/`).

**Conventions:** Branch `phase-1d-b/credit-ledger` (already created off `main`; the 1D design spec is committed there). `phase-1:` commits, one concern each, `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. TS strict; no `any` without `// reason:`. Money/credits are integers — never floats. Supabase project ref: `kwmitrnypadzuqueefxi`.

**Why the write helpers live here (not 1D-c):** the spec scopes the whole `lib/credits/` data layer to this foundation slice. `grantCredits`/`upsertEntitlement`/`saveReport` are pure DB wrappers (no Stripe SDK) — building + unit-testing them here keeps the data layer cohesive and lets 1D-c focus purely on Stripe wiring.

---

## File Structure

**Created:**
- `supabase/migrations/0007_credits_profiles.sql` — the two tables + RLS
- `lib/credits/balance.ts` — pure balance/liability math
- `lib/credits/store.ts` — server-only data-access layer
- `test/credits/balance.test.ts`, `test/credits/store.test.ts`

---

## Task 1: Migration `0007_credits_profiles`

**Files:**
- Create: `supabase/migrations/0007_credits_profiles.sql`

- [ ] **Step 1: Write the migration** `supabase/migrations/0007_credits_profiles.sql`:

```sql
-- Prepaid credits as a tracked LIABILITY. Grants are written only by the service role (the Stripe
-- webhook); a user may read their own ledger but never mint credits. Balance = sum(delta).
create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  delta integer not null,                                   -- + grant, − consume/expire/refund (whole credits)
  reason text not null,                                     -- e.g. purchase:wellness_profile
  unit_price_cents integer not null default 0,              -- cash paid per credit this grant (refund/liability math)
  expires_at timestamptz,                                   -- grants only; null for consume/expire/refund
  stripe_event_id text unique,                              -- idempotency: a webhook retry hits 23505 → no-op
  created_at timestamptz not null default now()
);
alter table public.credit_ledger enable row level security;
create policy "credit_ledger_select_own" on public.credit_ledger
  for select to authenticated using ((select auth.uid()) = user_id);
-- no insert/update/delete policy: only the service role writes grants.
create index if not exists credit_ledger_user_idx on public.credit_ledger (user_id);

-- Paid PRIVATE-profile artifact + purchase entitlement. Owner-readable; service-role writes only.
-- The report is the private profile (encrypted, in-account only) — never the shareable brag card.
create table if not exists public.wellness_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid,                                          -- which check-in the report reads
  stripe_checkout_id text unique,                           -- ties the unlock to the payment; idempotent upsert
  status text not null,                                     -- paid → ready
  report text,                                              -- encrypted (v1:) written read; null until ready
  created_at timestamptz not null default now()
);
alter table public.wellness_profiles enable row level security;
create policy "wellness_profiles_select_own" on public.wellness_profiles
  for select to authenticated using ((select auth.uid()) = user_id);
-- no insert/update/delete policy: service-role writes only.
create index if not exists wellness_profiles_user_idx on public.wellness_profiles (user_id, created_at desc);
```

- [ ] **Step 2: Apply the migration** via the Supabase MCP tool `mcp__plugin_supabase_supabase__apply_migration` (project_id `kwmitrnypadzuqueefxi`, name `0007_credits_profiles`, the SQL above).

- [ ] **Step 3: Verify** via `mcp__plugin_supabase_supabase__list_tables` (confirm `credit_ledger` + `wellness_profiles` exist with RLS enabled) and `mcp__plugin_supabase_supabase__get_advisors` (type `security`). Expected: clean — **no new `rls_enabled_no_policy`** (both tables have an owner SELECT policy), and no new errors. The pre-existing leaked-password WARN is unrelated.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0007_credits_profiles.sql
git commit -m "phase-1: migration 0007 — credit_ledger + wellness_profiles (RLS owner-read/service-write)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `lib/credits/balance.ts` — pure balance + liability math

**Files:**
- Create: `lib/credits/balance.ts`, `test/credits/balance.test.ts`

- [ ] **Step 1: Write the failing test** `test/credits/balance.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { creditBalance, outstandingLiability, type LedgerRow } from '@/lib/credits/balance';

const row = (delta: number, unit: number, expires: string | null): LedgerRow => ({
  delta,
  unit_price_cents: unit,
  expires_at: expires,
});

describe('creditBalance', () => {
  it('is 0 for an empty ledger', () => {
    expect(creditBalance([])).toBe(0);
  });
  it('sums deltas (grants minus consumption/expiry/refund)', () => {
    expect(creditBalance([row(12, 242, null), row(-2, 0, null)])).toBe(10);
  });
});

describe('outstandingLiability', () => {
  const now = new Date('2026-06-07T00:00:00Z');
  it('sums unexpired positive grants × their unit price', () => {
    expect(outstandingLiability([row(12, 242, '2027-06-07T00:00:00Z')], now)).toBe(2904);
  });
  it('excludes expired grants and non-grant (≤0) rows', () => {
    expect(
      outstandingLiability(
        [
          row(12, 242, '2026-01-01T00:00:00Z'), // expired grant → not owed
          row(-2, 0, null), // consumption → not a positive grant
          row(8, 150, '2027-06-07T00:00:00Z'), // live grant → 1200
        ],
        now,
      ),
    ).toBe(1200);
  });
  it('treats a null expires_at as never-expiring', () => {
    expect(outstandingLiability([row(4, 100, null)], now)).toBe(400);
  });
});
```

- [ ] **Step 2: Run it — confirm FAIL** (`npx vitest run test/credits/balance.test.ts`).

- [ ] **Step 3: Write `lib/credits/balance.ts`**

```ts
/** The credit_ledger fields balance/liability math needs (a plain row, no DB coupling). */
export interface LedgerRow {
  delta: number;
  unit_price_cents: number;
  expires_at: string | null;
}

/** Current balance = sum of all deltas (grants − consumption/expiry/refund). Whole credits. */
export function creditBalance(rows: LedgerRow[]): number {
  return rows.reduce((sum, r) => sum + r.delta, 0);
}

/**
 * Cash we would owe if every live credit were refunded: Σ over unexpired positive grants of
 * (delta × unit_price_cents). Consumption/expiry/refund rows (delta ≤ 0) don't add; expired
 * grants are no longer owed. This is the conservative basis for the future /admin/liability view.
 *
 * Note: credits aren't spent yet (avatar metering is 1F), so no FIFO remaining-credit allocation
 * across grants is needed here; add it when consumption rows exist.
 */
export function outstandingLiability(rows: LedgerRow[], now: Date): number {
  return rows.reduce((sum, r) => {
    if (r.delta <= 0) return sum;
    if (r.expires_at !== null && new Date(r.expires_at) <= now) return sum;
    return sum + r.delta * r.unit_price_cents;
  }, 0);
}
```

- [ ] **Step 4: Run it — confirm PASS** (`npx vitest run test/credits/balance.test.ts`). `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 5: Commit**

```bash
git add lib/credits/balance.ts test/credits/balance.test.ts
git commit -m "phase-1: credit balance + outstanding-liability math (pure, integer-only)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: `lib/credits/store.ts` — server-only data-access layer

**Files:**
- Create: `lib/credits/store.ts`, `test/credits/store.test.ts`

- [ ] **Step 1: Write the failing test** `test/credits/store.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import {
  getLedger,
  grantCredits,
  getWellnessProfile,
  upsertEntitlement,
  saveReport,
} from '@/lib/credits/store';

/** A chainable Supabase mock: every builder method returns the builder; the builder is awaitable
 *  (resolves `result`) for terminal `.eq()`-style awaits, and `.maybeSingle()` resolves `result`. */
function mockClient(result: { data?: unknown; error?: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order', 'limit', 'insert', 'upsert', 'update']) {
    builder[m] = vi.fn(() => builder);
  }
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));
  (builder as { then?: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  // reason: the test mock stands in for SupabaseClient's fluent builder; `never` avoids re-typing it.
  return { client: { from: vi.fn(() => builder) } as never, builder };
}

describe('getLedger', () => {
  it('returns the ledger rows for a user', async () => {
    const { client } = mockClient({ data: [{ delta: 12, unit_price_cents: 242, expires_at: null }], error: null });
    expect(await getLedger(client, 'u1')).toEqual([{ delta: 12, unit_price_cents: 242, expires_at: null }]);
  });
  it('throws on a db error', async () => {
    const { client } = mockClient({ data: null, error: { code: 'XX' } });
    await expect(getLedger(client, 'u1')).rejects.toThrow(/credit_ledger/);
  });
});

describe('grantCredits', () => {
  const input = {
    userId: 'u1',
    delta: 12,
    reason: 'purchase:wellness_profile',
    unitPriceCents: 242,
    expiresAt: null,
    stripeEventId: 'evt_1',
  };
  it('inserts the grant and reports granted', async () => {
    const { client, builder } = mockClient({ error: null });
    expect(await grantCredits(client, input)).toEqual({ granted: true });
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ stripe_event_id: 'evt_1', delta: 12, unit_price_cents: 242 }),
    );
  });
  it('treats a duplicate stripe_event_id (23505) as an idempotent no-op', async () => {
    const { client } = mockClient({ error: { code: '23505' } });
    expect(await grantCredits(client, input)).toEqual({ granted: false });
  });
  it('throws on a non-conflict error', async () => {
    const { client } = mockClient({ error: { code: 'XX' } });
    await expect(grantCredits(client, input)).rejects.toThrow(/credit_ledger/);
  });
});

describe('getWellnessProfile', () => {
  it('returns the latest entitlement', async () => {
    const { client } = mockClient({ data: { id: 'p1', session_id: 's1', status: 'paid', report: null }, error: null });
    expect(await getWellnessProfile(client, 'u1', 's1')).toEqual({
      id: 'p1',
      session_id: 's1',
      status: 'paid',
      report: null,
    });
  });
  it('returns null when there is no entitlement', async () => {
    const { client } = mockClient({ data: null, error: null });
    expect(await getWellnessProfile(client, 'u1')).toBeNull();
  });
});

describe('upsertEntitlement', () => {
  it('upserts on stripe_checkout_id', async () => {
    const { client, builder } = mockClient({ error: null });
    await upsertEntitlement(client, { userId: 'u1', sessionId: 's1', stripeCheckoutId: 'cs_1', status: 'paid' });
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ stripe_checkout_id: 'cs_1', status: 'paid' }),
      { onConflict: 'stripe_checkout_id' },
    );
  });
});

describe('saveReport', () => {
  it('writes the encrypted report and flips status to ready', async () => {
    const { client, builder } = mockClient({ error: null });
    await saveReport(client, 'p1', 'v1:abc');
    expect(builder.update).toHaveBeenCalledWith({ report: 'v1:abc', status: 'ready' });
  });
});
```

- [ ] **Step 2: Run it — confirm FAIL** (`npx vitest run test/credits/store.test.ts`).

- [ ] **Step 3: Write `lib/credits/store.ts`**

```ts
import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { LedgerRow } from './balance';

/** Credit/profile data is not best-effort: surface DB errors so callers don't silently lose data. */
function ensureOk(table: string, error: { code?: string; message?: string } | null): void {
  if (error) throw new Error(`${table} query failed: ${error.code ?? error.message}`);
}

/** All ledger rows for a user, read via the caller's client (user RLS client or admin). The
 *  selected columns match `LedgerRow` exactly, so the result feeds `creditBalance`/`outstandingLiability`. */
export async function getLedger(client: SupabaseClient, userId: string): Promise<LedgerRow[]> {
  const { data, error } = await client
    .from('credit_ledger')
    .select('delta, unit_price_cents, expires_at')
    .eq('user_id', userId);
  ensureOk('credit_ledger', error);
  return (data ?? []) as LedgerRow[];
}

export interface GrantInput {
  userId: string;
  delta: number;
  reason: string;
  unitPriceCents: number;
  expiresAt: string | null;
  stripeEventId: string;
}

/**
 * Insert a credit grant via the service-role client. Idempotent on `stripe_event_id`: a duplicate
 * (Postgres 23505) is treated as already-processed (`granted: false`), so webhook retries never
 * double-grant. Other errors throw.
 */
export async function grantCredits(
  admin: SupabaseClient,
  input: GrantInput,
): Promise<{ granted: boolean }> {
  const { error } = await admin.from('credit_ledger').insert({
    user_id: input.userId,
    delta: input.delta,
    reason: input.reason,
    unit_price_cents: input.unitPriceCents,
    expires_at: input.expiresAt,
    stripe_event_id: input.stripeEventId,
  });
  if (error) {
    if (error.code === '23505') return { granted: false };
    ensureOk('credit_ledger', error);
  }
  return { granted: true };
}

export interface WellnessProfileRecord {
  id: string;
  session_id: string | null;
  status: string;
  report: string | null;
}

/** The user's most-recent wellness-profile entitlement (optionally scoped to one session). */
export async function getWellnessProfile(
  client: SupabaseClient,
  userId: string,
  sessionId?: string,
): Promise<WellnessProfileRecord | null> {
  let query = client
    .from('wellness_profiles')
    .select('id, session_id, status, report')
    .eq('user_id', userId);
  if (sessionId) query = query.eq('session_id', sessionId);
  const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
  ensureOk('wellness_profiles', error);
  return (data as WellnessProfileRecord | null) ?? null;
}

export interface EntitlementInput {
  userId: string;
  sessionId: string | null;
  stripeCheckoutId: string;
  status: string;
}

/** Create/refresh the purchase entitlement via the service-role client. Idempotent on stripe_checkout_id. */
export async function upsertEntitlement(admin: SupabaseClient, input: EntitlementInput): Promise<void> {
  const { error } = await admin.from('wellness_profiles').upsert(
    {
      user_id: input.userId,
      session_id: input.sessionId,
      stripe_checkout_id: input.stripeCheckoutId,
      status: input.status,
    },
    { onConflict: 'stripe_checkout_id' },
  );
  ensureOk('wellness_profiles', error);
}

/** Store the (already-encrypted) report and flip status to ready. Service-role write. */
export async function saveReport(admin: SupabaseClient, id: string, encryptedReport: string): Promise<void> {
  const { error } = await admin
    .from('wellness_profiles')
    .update({ report: encryptedReport, status: 'ready' })
    .eq('id', id);
  ensureOk('wellness_profiles', error);
}
```

- [ ] **Step 4: Run it — confirm PASS** (`npx vitest run test/credits/store.test.ts`). Then `npx vitest run` (whole suite green; isolate any WSL2 5000ms flake). `npx tsc --noEmit` clean; `npm run lint` clean.

> Note: `lib/credits/store.ts` imports `'server-only'`; the vitest config already aliases `server-only` → a stub, so the test imports it fine (same as `lib/health/store.ts`).

- [ ] **Step 5: Commit**

```bash
git add lib/credits/store.ts test/credits/store.test.ts
git commit -m "phase-1: credit/profile store (getLedger/grantCredits/entitlement/saveReport, idempotent)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Done criteria

- `credit_ledger` + `wellness_profiles` exist with RLS owner-SELECT only (no user writes); advisors clean.
- `creditBalance`/`outstandingLiability` compute correctly (integer-only; expiry excluded).
- Store layer reads the ledger/entitlement and idempotently grants credits / upserts the entitlement / saves the report; `grantCredits` no-ops on a duplicate `stripe_event_id`.
- `npx vitest run`, `npx tsc --noEmit`, `npm run lint` all clean. No Stripe, no UI, no `.env` changes.

## Post-plan (not part of this branch)
- Security review before the PR (standing rule).
- Next slice: **1D-c** — Stripe checkout + signature-verified webhook that calls `grantCredits` + `upsertEntitlement`.
