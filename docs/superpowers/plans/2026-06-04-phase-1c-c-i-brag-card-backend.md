# Phase 1C-c-i — Brag Card Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The data + API for the day-one brag card: a non-sensitive `share_cards` snapshot table, the single server-side assembler `buildShareCard` (emits only `{overall, silhouette}`, silhouette shuffled to anonymize axis order), and an authed `/api/share` that creates a card and returns a public `/share/<token>` URL. No UI (that's 1C-c-ii/iii).

**Architecture:** `buildShareCard(client, userId)` reads the user's latest scores via their RLS client (decrypts), keeps only the overall + the 6 axis values shuffled into an anonymized order (shape, never which-axis-is-which). `/api/share` (auth + full gate) calls it, generates an unguessable token, and inserts the `share_cards` row via the service-role admin client (the table is RLS-on with zero policies). Sensitive/labeled data never enters this path.

**Tech Stack:** Next.js 16 (TS strict), Supabase (RLS-on + 0 policies = service-role-only, like `waitlist`), `node:crypto` (token + shuffle), Zod, Vitest. No new npm deps, no new env.

**Spec:** `docs/superpowers/specs/2026-06-04-phase-1c-c-brag-card-design.md`

**Conventions:** Branch `phase-1c-c/brag-card` (already created off `main`). `phase-1:` commits, one concern each, `Co-Authored-By` trailer. TS strict; no `any` without `// reason:`. Migration via the authed Supabase MCP (project `kwmitrnypadzuqueefxi`). The compliance keystone: `buildShareCard` is the ONLY place the card is assembled and it emits only `{overall, silhouette}`.

**Scope of this plan (i):** migration `0006`, `lib/share/card.ts`, `app/api/share/route.ts`. **Deferred:** the public page + OG image + `ShareCard` (1C-c-ii); the radar-drawer trigger (1C-c-iii).

---

## File Structure

**Created:**
- `supabase/migrations/0006_share_cards.sql`
- `lib/share/card.ts` — `buildShareCard` + `generateShareToken` (server-only)
- `app/api/share/route.ts`
- `test/share/card.test.ts`, `test/share/route.test.ts`

---

## Task 1: Migration `0006_share_cards`

**Files:**
- Create: `supabase/migrations/0006_share_cards.sql`

- [ ] **Step 1: Write `supabase/migrations/0006_share_cards.sql`**

```sql
-- Public, NON-SENSITIVE brag-card snapshot. Service-role only (RLS on, 0 policies — same as waitlist):
-- /api/share writes via the admin client; the public /share/[token] page reads one row by token via admin.
create table if not exists public.share_cards (
  token text primary key,                                   -- unguessable, url-safe
  user_id uuid not null references auth.users (id) on delete cascade,
  overall integer,                                          -- snapshot; non-diagnostic public metric
  silhouette jsonb not null,                                -- 6 normalized values, ANONYMIZED order (shape only)
  display_name text,                                        -- optional first name; null = anonymous
  created_at timestamptz not null default now()
);
alter table public.share_cards enable row level security;
-- intentionally no policies: RLS-on + 0 policies = service-role-only access.
```

- [ ] **Step 2: Apply via the Supabase MCP**

Use MCP `apply_migration` (name `0006_share_cards`, project `kwmitrnypadzuqueefxi`) with the SQL above.
Expected: `{"success": true}`.

- [ ] **Step 3: Verify via MCP `execute_sql`**

```sql
select
  (select relrowsecurity from pg_class where relname='share_cards' and relnamespace='public'::regnamespace) as rls,
  (select count(*) from pg_policies where schemaname='public' and tablename='share_cards') as policies,
  (select count(*) from information_schema.columns where table_name='share_cards') as cols;
```
Expected: `rls = true`, `policies = 0`, `cols = 5`.

- [ ] **Step 4: Advisors**

MCP `get_advisors` (security): expect the intended `rls_enabled_no_policy` INFO for `share_cards` (same as
`waitlist`/`compliance_log`) and no new WARN.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0006_share_cards.sql
git commit -m "phase-1: 0006 share_cards snapshot table (service-role-only)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `buildShareCard` + `generateShareToken`

**Files:**
- Create: `lib/share/card.ts`, `test/share/card.test.ts`

- [ ] **Step 1: Write the failing test** `test/share/card.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';

const getLatestHealthScores = vi.fn();
vi.mock('@/lib/health/store', () => ({ getLatestHealthScores }));

import { buildShareCard, generateShareToken } from '@/lib/share/card';
import type { AxisScores } from '@/lib/scoring';

const axes: AxisScores = { energy: 40, strength: 50, sleep: 60, drive: 0, focus: 45, body: 55 };

describe('buildShareCard', () => {
  it('emits only overall + an anonymized silhouette (same multiset, no labels)', async () => {
    getLatestHealthScores.mockResolvedValue({ axes, overall: 47 });
    const card = await buildShareCard({} as never, 'u1');
    expect(Object.keys(card).sort()).toEqual(['overall', 'silhouette']); // nothing else leaks
    expect(card.overall).toBe(47);
    expect(card.silhouette).toHaveLength(6);
    // shape is preserved (same six values), order is anonymized
    expect([...card.silhouette].sort((a, b) => a - b)).toEqual([0, 40, 45, 50, 55, 60]);
  });

  it('maps unscored axes to 0 in the shape', async () => {
    getLatestHealthScores.mockResolvedValue({ axes: { ...axes, body: null }, overall: 40 });
    const card = await buildShareCard({} as never, 'u1');
    expect(card.silhouette.filter((v) => v === 0)).toHaveLength(2); // drive(0) + body(null→0)
  });

  it('returns null overall + empty silhouette when there is no baseline', async () => {
    getLatestHealthScores.mockResolvedValue(null);
    expect(await buildShareCard({} as never, 'u1')).toEqual({ overall: null, silhouette: [] });
    getLatestHealthScores.mockResolvedValue({ axes, overall: null });
    expect(await buildShareCard({} as never, 'u1')).toEqual({ overall: null, silhouette: [] });
  });
});

describe('generateShareToken', () => {
  it('produces a url-safe, non-empty, unique token', () => {
    const a = generateShareToken();
    const b = generateShareToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a.length).toBeGreaterThanOrEqual(16);
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2: Run it — confirm FAIL**

Run: `npx vitest run test/share/card.test.ts`
Expected: FAIL — cannot resolve `@/lib/share/card`.

- [ ] **Step 3: Write `lib/share/card.ts`**

```ts
import 'server-only';
import { randomBytes, randomInt } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AXES } from '@/lib/scoring';
import { getLatestHealthScores } from '@/lib/health/store';

/** Crypto-random Fisher–Yates shuffle — anonymizes axis order so a spoke can't be mapped to an axis. */
function shuffle(values: number[]): number[] {
  const a = [...values];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Unguessable, url-safe share token (~22 chars from 16 random bytes). */
export function generateShareToken(): string {
  return randomBytes(16).toString('base64url');
}

/**
 * THE single assembler of the stripped brag card. Reads the user's latest scores (their RLS client,
 * decrypted) and emits ONLY the overall + an anonymized 6-value silhouette (the *shape*, never which
 * axis or a labeled value). Never imports the private-profile/report path → the two artifacts never merge.
 */
export async function buildShareCard(
  client: SupabaseClient,
  userId: string,
): Promise<{ overall: number | null; silhouette: number[] }> {
  const latest = await getLatestHealthScores(client, userId);
  if (!latest || latest.overall === null) return { overall: null, silhouette: [] };
  // AXES order with null→0, then shuffled to destroy the axis→position mapping.
  const values = AXES.map((axis) => latest.axes[axis] ?? 0);
  return { overall: latest.overall, silhouette: shuffle(values) };
}
```

- [ ] **Step 4: Run it — confirm PASS**

Run: `npx vitest run test/share/card.test.ts`
Expected: PASS.

Run: `npx tsc --noEmit` → clean. `npm run lint` → clean.

- [ ] **Step 5: Commit**

```bash
git add lib/share/card.ts test/share/card.test.ts
git commit -m "phase-1: buildShareCard (overall + anonymized silhouette) + share token

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: `/api/share` route

**Files:**
- Create: `app/api/share/route.ts`, `test/share/route.test.ts`

- [ ] **Step 1: Write the failing test** `test/share/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

beforeAll(() => {
  process.env.NEXT_PUBLIC_APP_URL = 'https://ava.test';
});

const { getUser, maybeSingle, insert, card } = vi.hoisted(() => ({
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  insert: vi.fn(),
  card: {
    buildShareCard: vi.fn(),
    generateShareToken: vi.fn(),
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({ getSupabaseAdmin: () => ({ from: () => ({ insert }) }) }));
vi.mock('@/lib/share/card', () => card);

import { POST } from '@/app/api/share/route';

function req(body?: unknown): Request {
  return new Request('https://ava.test/api/share', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('POST /api/share', () => {
  beforeEach(() => {
    getUser.mockReset().mockResolvedValue({ data: { user: { id: 'u1' } } });
    maybeSingle.mockReset().mockResolvedValue({ data: { state_code: 'TX', ai_disclosure_accepted_at: 't' } });
    insert.mockReset().mockResolvedValue({ error: null });
    card.buildShareCard.mockReset().mockResolvedValue({ overall: 47, silhouette: [40, 0, 60, 50, 45, 55] });
    card.generateShareToken.mockReset().mockReturnValue('tok123');
  });

  it('401 when unauthenticated', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await POST(req({}))).status).toBe(401);
  });

  it('403 when the gate is not satisfied', async () => {
    maybeSingle.mockResolvedValue({ data: { state_code: 'TX', ai_disclosure_accepted_at: null } });
    expect((await POST(req({}))).status).toBe(403);
  });

  it('400 when there is no baseline yet', async () => {
    card.buildShareCard.mockResolvedValue({ overall: null, silhouette: [] });
    expect((await POST(req({}))).status).toBe(400);
  });

  it('creates a card and returns the public url', async () => {
    const res = await POST(req({ displayName: 'Pat' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ token: 'tok123', url: 'https://ava.test/share/tok123' });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'tok123', user_id: 'u1', overall: 47, display_name: 'Pat' }),
    );
  });

  it('works with no body (anonymous share)', async () => {
    const res = await POST(req()); // no body
    expect(res.status).toBe(200);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ display_name: null }));
  });

  it('400 on an over-long displayName', async () => {
    expect((await POST(req({ displayName: 'x'.repeat(80) }))).status).toBe(400);
  });
});
```

- [ ] **Step 2: Run it — confirm FAIL**

Run: `npx vitest run test/share/route.test.ts`
Expected: FAIL — cannot resolve `@/app/api/share/route`.

- [ ] **Step 3: Write `app/api/share/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { gateDecision } from '@/lib/auth/gate';
import { buildShareCard, generateShareToken } from '@/lib/share/card';

const bodySchema = z.object({ displayName: z.string().trim().min(1).max(40).optional() });

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Full gate (sharing derives from health data).
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

  // Body is optional (anonymous share). An unparseable/missing body is treated as {}.
  let raw: unknown = {};
  try {
    raw = await request.json();
  } catch {
    raw = {};
  }
  const parsed = bodySchema.safeParse(raw ?? {});
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const cardData = await buildShareCard(supabase, user.id);
  if (cardData.overall === null) {
    return NextResponse.json({ error: 'Finish a check-in first.' }, { status: 400 });
  }

  // Insert via the service-role admin client (share_cards has no owner policy). 16-byte token →
  // collisions are astronomically unlikely; regenerate once on the off chance of a unique violation.
  const admin = getSupabaseAdmin();
  const row = {
    user_id: user.id,
    overall: cardData.overall,
    silhouette: cardData.silhouette,
    display_name: parsed.data.displayName ?? null,
  };
  let token = generateShareToken();
  let { error } = await admin.from('share_cards').insert({ token, ...row });
  if (error && (error as { code?: string }).code === '23505') {
    token = generateShareToken();
    ({ error } = await admin.from('share_cards').insert({ token, ...row }));
  }
  if (error) return NextResponse.json({ error: 'Could not create share link.' }, { status: 500 });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
  return NextResponse.json({ token, url: `${base}/share/${token}` });
}
```

- [ ] **Step 4: Run it — confirm PASS**

Run: `npx vitest run test/share/route.test.ts`
Expected: PASS (401/403/400-no-baseline/happy/anonymous/400-long-name).

- [ ] **Step 5: Typecheck + lint**

Run: `npx tsc --noEmit` → clean.
Run: `npm run lint` → clean.

- [ ] **Step 6: Commit**

```bash
git add app/api/share/route.ts test/share/route.test.ts
git commit -m "phase-1: /api/share (authed) creates a brag card, returns the public url

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Full verification

- [ ] **Step 1: Full suite, typecheck, lint, build**

Run: `npx vitest run` → all PASS.
Run: `npx tsc --noEmit` → clean.
Run: `npm run lint` → clean.
Run: `npm run build` → succeeds; routes include `ƒ /api/share`.

- [ ] **Step 2 (gated on the dev server): live smoke**

`npm run dev`, signed in as an onboarded user who has completed a check-in (has a baseline). POST `/api/share`:
```bash
curl -s -X POST http://localhost:3000/api/share -H 'content-type: application/json' \
  --cookie '<your auth cookies>' -d '{"displayName":"Pat"}' | jq
```
Expected: `{ token, url: "<APP_URL>/share/<token>" }`. Via the Supabase MCP, confirm one `share_cards` row
with `overall` set, `silhouette` a 6-element array, `display_name='Pat'`, and **no per-axis labels / no encrypted
field**. (The `/share/<token>` page itself is 1C-c-ii.) A user with no baseline → `400`.

---

## Done criteria (Slice 1C-c-i)

- [ ] `0006_share_cards` live; RLS on + 0 policies (service-role-only); advisors clean.
- [ ] `buildShareCard` is the single assembler; emits only `{overall, silhouette}`; silhouette is a shape-only,
      anonymized-order permutation of the axis values; `generateShareToken` is unguessable + url-safe.
- [ ] `/api/share` (auth 401 / gate 403 / no-baseline 400) creates a card via the admin client and returns
      `{token, url}`; anonymous (no-body) share works; over-long name → 400.
- [ ] `npm run test` / `lint` / `build` green.

## Deferred

The public `/share/[token]` page + `next/og` image + `ShareCard` component (1C-c-ii); the radar-drawer
"Share my baseline" trigger (1C-c-iii).
