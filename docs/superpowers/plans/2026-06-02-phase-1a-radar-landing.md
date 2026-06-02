# Phase 1A — Radar + Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the warm landing page with an interactive six-axis radar teaser driven by a deterministic scoring library, plus an email-capture form backed by a Supabase `waitlist` table.

**Architecture:** Pure `/lib/scoring` computes axis scores/overall/tier from signals (the LLM never produces the number). A hand-rolled SVG `RadarChart` animates via a small lerp; `null` axes render as `??`. The landing teaser feeds 3 sample answers through scoring into the live radar. Email-capture POSTs to `/api/waitlist`, which validates with zod and inserts via a **server-only** Supabase admin client (service-role key never reaches the client).

**Tech Stack:** Next.js 16 (App Router, TS strict), Tailwind v4, Zod, `@supabase/supabase-js`, `server-only`, Vitest (+ `@vitejs/plugin-react`, jsdom, Testing Library).

**Spec:** `docs/superpowers/specs/2026-06-02-phase-1a-radar-landing-design.md`

**Conventions:** Branch `phase-1a/radar-landing` off `main`. `phase-1:` commit prefix, one concern per commit, `Co-Authored-By` trailer. TS strict; no `any` without `// reason:`. Root-level `/app`, `/lib`, `/components`; tests under `/test`.

**Prerequisites for Task 12 only** (everything else is account-free): the Supabase MCP must be authenticated to the **dev** project, and `.env.local` must contain `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Tasks 1–11 do not need these.

---

## File Structure

**Created:**
- `lib/scoring/types.ts` — `Axis`, `Severity`, `Signals`, `AxisScores`, `Tier`, `RadarProfile`, `AXES`, `AXIS_META`
- `lib/scoring/scoring.ts` — `computeAxisScores`, `computeOverall`, `tierForOverall`, `computeProfile`
- `lib/scoring/index.ts` — public exports
- `lib/waitlist/validate.ts` — `parseWaitlistEmail` (zod)
- `lib/waitlist/store.ts` — `saveEmail(client, email)` (client injected; no `server-only` import)
- `lib/supabase/admin.ts` — `getSupabaseAdmin()` (lazy, `server-only`)
- `app/api/waitlist/route.ts` — POST handler
- `components/radar/geometry.ts` — pure polar→cartesian helpers
- `components/radar/animate.ts` — pure `lerp` / `lerpArray`
- `components/radar/useAnimatedScores.ts` — RAF hook
- `components/radar/RadarChart.tsx` — SVG radar
- `components/radar/TierBadge.tsx` — overall + tier label
- `components/teaser/RadarTeaser.tsx` — 3 questions → live radar + CTA
- `components/teaser/EmailCapture.tsx` — validated email form
- `supabase/migrations/0001_waitlist.sql` — waitlist table + RLS
- `test/setup.ts`, plus `test/**` specs

**Modified:**
- `vitest.config.ts` — add `@vitejs/plugin-react`, `setupFiles`, include `.tsx`
- `app/page.tsx` — replace placeholder with the landing
- `app/globals.css` — warm theme tokens + tier color vars
- `.gitignore` — already ignores `.env*.local`

---

## Task 1: Branch, dependencies, and component-test infra

**Files:**
- Modify: `vitest.config.ts`
- Create: `test/setup.ts`, `test/components/infra.test.tsx`

- [ ] **Step 1: Create the branch**

```bash
cd /home/pgw/projects/ava-web
git checkout -b phase-1a/radar-landing
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js@^2.107.0 server-only@^0.0.1
npm install -D @vitejs/plugin-react@^6.0.2 jsdom@^29.1.1 @testing-library/react@^16.3.2 @testing-library/jest-dom@^6.9.1
```
Expected: installs succeed; `package.json` updated.

- [ ] **Step 3: Update `vitest.config.ts`**

```ts
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['test/setup.ts'],
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
});
```

- [ ] **Step 4: Create `test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Write a jsdom component infra test**

`test/components/infra.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

function Hello() {
  return <p>hello radar</p>;
}

describe('component test infra', () => {
  it('renders a component into jsdom', () => {
    render(<Hello />);
    expect(screen.getByText('hello radar')).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run tests, lint, build**

Run: `npm run test`
Expected: PASS — the infra test plus the existing safeguard suite (44 tests).

Run: `npm run lint`
Expected: clean.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts test/setup.ts test/components/infra.test.tsx
git commit -m "phase-1: add component-test infra (jsdom + Testing Library) and Supabase deps

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Scoring library (pure)

**Files:**
- Create: `lib/scoring/types.ts`, `lib/scoring/scoring.ts`, `lib/scoring/index.ts`
- Test: `test/scoring/scoring.test.ts`

- [ ] **Step 1: Write the failing test**

`test/scoring/scoring.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  computeAxisScores,
  computeOverall,
  tierForOverall,
  computeProfile,
} from '@/lib/scoring';

describe('computeAxisScores', () => {
  it('maps the mean severity to 0-100 (all 4 -> 100, all 0 -> 0, all 2 -> 50)', () => {
    expect(computeAxisScores({ energy: [4, 4, 4] }).energy).toBe(100);
    expect(computeAxisScores({ energy: [0, 0] }).energy).toBe(0);
    expect(computeAxisScores({ energy: [2, 2] }).energy).toBe(50);
  });

  it('rounds to an integer', () => {
    expect(computeAxisScores({ sleep: [1, 2] }).sleep).toBe(38); // mean 1.5 -> 37.5 -> 38
  });

  it('returns null for axes with no signals', () => {
    expect(computeAxisScores({ energy: [4] }).sleep).toBeNull();
  });
});

describe('computeOverall', () => {
  it('averages only the scored axes', () => {
    const scores = computeAxisScores({ energy: [4, 4], sleep: [0, 0] }); // 100 and 0
    expect(computeOverall(scores)).toBe(50);
  });

  it('is null when nothing is scored', () => {
    expect(computeOverall(computeAxisScores({}))).toBeNull();
  });
});

describe('tierForOverall', () => {
  it.each<[number, string]>([
    [80, 'Optimized'],
    [79, 'Solid'],
    [65, 'Solid'],
    [64, 'Room to Grow'],
    [50, 'Room to Grow'],
    [49, 'Needs Attention'],
    [35, 'Needs Attention'],
    [34, 'Flagged'],
    [20, 'Flagged'],
    [19, 'Critical'],
    [0, 'Critical'],
  ])('overall %i -> %s', (overall, label) => {
    expect(tierForOverall(overall)?.label).toBe(label);
  });

  it('is null when overall is null', () => {
    expect(tierForOverall(null)).toBeNull();
  });
});

describe('computeProfile', () => {
  it('bundles axes, overall, and tier', () => {
    const p = computeProfile({ energy: [4, 4], sleep: [4, 4], drive: [4, 4] });
    expect(p.overall).toBe(100);
    expect(p.tier?.label).toBe('Optimized');
    expect(p.axes.focus).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/scoring/scoring.test.ts`
Expected: FAIL — cannot resolve `@/lib/scoring`.

- [ ] **Step 3: Write `lib/scoring/types.ts`**

```ts
export const AXES = ['energy', 'strength', 'sleep', 'drive', 'focus', 'body'] as const;
export type Axis = (typeof AXES)[number];

/** 0 = most symptomatic, 4 = optimized. */
export type Severity = 0 | 1 | 2 | 3 | 4;

export type Signals = Partial<Record<Axis, Severity[]>>;

export type AxisScores = Record<Axis, number | null>;

export type TierLabel =
  | 'Optimized'
  | 'Solid'
  | 'Room to Grow'
  | 'Needs Attention'
  | 'Flagged'
  | 'Critical';

export interface Tier {
  label: TierLabel;
  /** CSS custom-property reference, defined in globals.css */
  color: string;
}

export interface RadarProfile {
  axes: AxisScores;
  overall: number | null;
  tier: Tier | null;
}

export const AXIS_META: Record<Axis, { label: string; icon: string }> = {
  energy: { label: 'Energy', icon: '⚡' },
  strength: { label: 'Strength', icon: '💪' },
  sleep: { label: 'Sleep', icon: '🌙' },
  drive: { label: 'Drive', icon: '🔥' },
  focus: { label: 'Focus', icon: '🧠' },
  body: { label: 'Body', icon: '📊' },
};
```

- [ ] **Step 4: Write `lib/scoring/scoring.ts`**

```ts
import {
  AXES,
  type AxisScores,
  type RadarProfile,
  type Severity,
  type Signals,
  type Tier,
} from './types';

function axisScore(severities: Severity[] | undefined): number | null {
  if (!severities || severities.length === 0) return null;
  const mean = severities.reduce((a, b) => a + b, 0) / severities.length;
  return Math.round((mean / 4) * 100);
}

export function computeAxisScores(signals: Signals): AxisScores {
  const out = {} as AxisScores;
  for (const axis of AXES) {
    out[axis] = axisScore(signals[axis]);
  }
  return out;
}

export function computeOverall(scores: AxisScores): number | null {
  const vals = AXES.map((a) => scores[a]).filter((v): v is number => v !== null);
  if (vals.length === 0) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

const TIERS: { min: number; label: Tier['label']; color: string }[] = [
  { min: 80, label: 'Optimized', color: 'var(--tier-optimized)' },
  { min: 65, label: 'Solid', color: 'var(--tier-solid)' },
  { min: 50, label: 'Room to Grow', color: 'var(--tier-room)' },
  { min: 35, label: 'Needs Attention', color: 'var(--tier-attention)' },
  { min: 20, label: 'Flagged', color: 'var(--tier-flagged)' },
  { min: 0, label: 'Critical', color: 'var(--tier-critical)' },
];

export function tierForOverall(overall: number | null): Tier | null {
  if (overall === null) return null;
  const t = TIERS.find((x) => overall >= x.min);
  // overall is always >= 0, so the last tier (min 0) always matches.
  return t ? { label: t.label, color: t.color } : null;
}

export function computeProfile(signals: Signals): RadarProfile {
  const axes = computeAxisScores(signals);
  const overall = computeOverall(axes);
  return { axes, overall, tier: tierForOverall(overall) };
}
```

- [ ] **Step 5: Write `lib/scoring/index.ts`**

```ts
export {
  computeAxisScores,
  computeOverall,
  tierForOverall,
  computeProfile,
} from './scoring';
export { AXES, AXIS_META } from './types';
export type {
  Axis,
  Severity,
  Signals,
  AxisScores,
  Tier,
  TierLabel,
  RadarProfile,
} from './types';
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run test/scoring/scoring.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/scoring test/scoring/scoring.test.ts
git commit -m "phase-1: deterministic scoring library (signals -> radar profile)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Email validation (pure)

**Files:**
- Create: `lib/waitlist/validate.ts`
- Test: `test/waitlist/validate.test.ts`

- [ ] **Step 1: Write the failing test**

`test/waitlist/validate.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parseWaitlistEmail } from '@/lib/waitlist/validate';

describe('parseWaitlistEmail', () => {
  it('accepts a valid email and lowercases it', () => {
    const r = parseWaitlistEmail({ email: 'Test@Example.COM' });
    expect(r).toEqual({ ok: true, email: 'test@example.com' });
  });

  it.each<[string, unknown]>([
    ['missing', {}],
    ['empty', { email: '' }],
    ['not an email', { email: 'nope' }],
    ['non-string', { email: 42 }],
    ['null body', null],
  ])('rejects %s', (_label, input) => {
    expect(parseWaitlistEmail(input).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/waitlist/validate.test.ts`
Expected: FAIL — cannot resolve `@/lib/waitlist/validate`.

- [ ] **Step 3: Write `lib/waitlist/validate.ts`**

```ts
import { z } from 'zod';

const schema = z.object({ email: z.string().email() });

export type WaitlistParse =
  | { ok: true; email: string }
  | { ok: false; error: string };

export function parseWaitlistEmail(input: unknown): WaitlistParse {
  const r = schema.safeParse(input);
  if (r.success) return { ok: true, email: r.data.email.toLowerCase() };
  return { ok: false, error: 'Please enter a valid email address.' };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run test/waitlist/validate.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/waitlist/validate.ts test/waitlist/validate.test.ts
git commit -m "phase-1: waitlist email validation

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Waitlist store (client injected)

**Files:**
- Create: `lib/waitlist/store.ts`
- Test: `test/waitlist/store.test.ts`

`saveEmail` takes the Supabase client as an argument so it is testable with a fake — it never
imports the `server-only` admin module.

- [ ] **Step 1: Write the failing test**

`test/waitlist/store.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { saveEmail } from '@/lib/waitlist/store';

function fakeClient(insertResult: { error: { code?: string } | null }) {
  const insert = vi.fn().mockResolvedValue(insertResult);
  const from = vi.fn().mockReturnValue({ insert });
  // reason: minimal structural stand-in for SupabaseClient in tests
  return { client: { from } as never, insert, from };
}

describe('saveEmail', () => {
  it('inserts the email into the waitlist table', async () => {
    const { client, from, insert } = fakeClient({ error: null });
    const res = await saveEmail(client, 'a@b.com');
    expect(from).toHaveBeenCalledWith('waitlist');
    expect(insert).toHaveBeenCalledWith({ email: 'a@b.com' });
    expect(res).toEqual({ duplicate: false });
  });

  it('treats a unique-violation (23505) as a duplicate, not an error', async () => {
    const { client } = fakeClient({ error: { code: '23505' } });
    await expect(saveEmail(client, 'a@b.com')).resolves.toEqual({ duplicate: true });
  });

  it('throws on any other database error', async () => {
    const { client } = fakeClient({ error: { code: '500' } });
    await expect(saveEmail(client, 'a@b.com')).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/waitlist/store.test.ts`
Expected: FAIL — cannot resolve `@/lib/waitlist/store`.

- [ ] **Step 3: Write `lib/waitlist/store.ts`**

```ts
import type { SupabaseClient } from '@supabase/supabase-js';

const UNIQUE_VIOLATION = '23505';

export async function saveEmail(
  client: SupabaseClient,
  email: string,
): Promise<{ duplicate: boolean }> {
  const { error } = await client.from('waitlist').insert({ email });
  if (!error) return { duplicate: false };
  if (error.code === UNIQUE_VIOLATION) return { duplicate: true };
  throw new Error(`waitlist insert failed: ${error.code ?? 'unknown'}`);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run test/waitlist/store.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/waitlist/store.ts test/waitlist/store.test.ts
git commit -m "phase-1: waitlist store (injected supabase client)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Supabase admin client (server-only)

**Files:**
- Create: `lib/supabase/admin.ts`

No unit test: this module imports `server-only` (which throws outside a server context) and only wires
env → client. It is exercised by the route in Task 6 (where it is mocked).

- [ ] **Step 1: Write `lib/supabase/admin.ts`**

```ts
import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

/** Service-role client. Server-only — never import from client components. */
export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Supabase admin not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/admin.ts
git commit -m "phase-1: server-only supabase admin client

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: `/api/waitlist` route

**Files:**
- Create: `app/api/waitlist/route.ts`
- Test: `test/waitlist/route.test.ts`

The route test mocks `@/lib/supabase/admin` (so the real `server-only` module never loads) and
controls the fake client's insert result.

- [ ] **Step 1: Write the failing test**

`test/waitlist/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const insert = vi.fn();
vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => ({ from: () => ({ insert }) }),
}));

import { POST } from '@/app/api/waitlist/route';

function req(body: unknown): Request {
  return new Request('http://localhost/api/waitlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/waitlist', () => {
  beforeEach(() => insert.mockReset());

  it('rejects an invalid email with 400', async () => {
    const res = await POST(req({ email: 'nope' }));
    expect(res.status).toBe(400);
  });

  it('stores a valid email and returns 200', async () => {
    insert.mockResolvedValue({ error: null });
    const res = await POST(req({ email: 'a@b.com' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(insert).toHaveBeenCalledWith({ email: 'a@b.com' });
  });

  it('treats a duplicate as success (200)', async () => {
    insert.mockResolvedValue({ error: { code: '23505' } });
    const res = await POST(req({ email: 'a@b.com' }));
    expect(res.status).toBe(200);
  });

  it('returns 500 on an unexpected database error', async () => {
    insert.mockResolvedValue({ error: { code: '500' } });
    const res = await POST(req({ email: 'a@b.com' }));
    expect(res.status).toBe(500);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/waitlist/route.test.ts`
Expected: FAIL — cannot resolve `@/app/api/waitlist/route`.

- [ ] **Step 3: Write `app/api/waitlist/route.ts`**

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run test/waitlist/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/waitlist/route.ts test/waitlist/route.test.ts
git commit -m "phase-1: /api/waitlist route (zod + supabase insert)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Radar geometry + animation (pure)

**Files:**
- Create: `components/radar/geometry.ts`, `components/radar/animate.ts`
- Test: `test/components/radar-math.test.ts`

- [ ] **Step 1: Write the failing test**

`test/components/radar-math.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { pointForValue, scoresToValues } from '@/components/radar/geometry';
import { lerp, lerpArray } from '@/components/radar/animate';

describe('pointForValue', () => {
  it('puts axis 0 at the top at full value', () => {
    const p = pointForValue(0, 100, 100, 100, 80); // cx,cy=100, radius=80
    expect(p.x).toBeCloseTo(100, 1);
    expect(p.y).toBeCloseTo(20, 1); // straight up
  });

  it('puts value 0 at the center', () => {
    const p = pointForValue(2, 0, 100, 100, 80);
    expect(p.x).toBeCloseTo(100, 1);
    expect(p.y).toBeCloseTo(100, 1);
  });
});

describe('scoresToValues', () => {
  it('treats null axes as 0 for the polygon shape', () => {
    expect(scoresToValues({ energy: 50, strength: null, sleep: 100, drive: null, focus: null, body: null }))
      .toEqual([50, 0, 100, 0, 0, 0]);
  });
});

describe('lerp', () => {
  it('interpolates', () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
    expect(lerpArray([0, 0], [100, 50], 0.5)).toEqual([50, 25]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/components/radar-math.test.ts`
Expected: FAIL — cannot resolve the modules.

- [ ] **Step 3: Write `components/radar/geometry.ts`**

```ts
import { AXES, type AxisScores } from '@/lib/scoring';

export interface Point {
  x: number;
  y: number;
}

/** Angle for an axis index, starting at the top and going clockwise. */
export function axisAngle(index: number): number {
  return (-90 + index * (360 / AXES.length)) * (Math.PI / 180);
}

export function pointForValue(
  index: number,
  value: number,
  cx: number,
  cy: number,
  radius: number,
): Point {
  const r = (value / 100) * radius;
  const a = axisAngle(index);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

/** Axis scores in AXES order, with null mapped to 0 for the filled shape. */
export function scoresToValues(scores: AxisScores): number[] {
  return AXES.map((axis) => scores[axis] ?? 0);
}

export function polygonPoints(
  values: number[],
  cx: number,
  cy: number,
  radius: number,
): string {
  return values
    .map((v, i) => {
      const p = pointForValue(i, v, cx, cy, radius);
      return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    })
    .join(' ');
}
```

- [ ] **Step 4: Write `components/radar/animate.ts`**

```ts
export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function lerpArray(from: number[], to: number[], t: number): number[] {
  return to.map((v, i) => lerp(from[i] ?? 0, v, t));
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run test/components/radar-math.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/radar/geometry.ts components/radar/animate.ts test/components/radar-math.test.ts
git commit -m "phase-1: radar geometry + lerp helpers

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: RadarChart + TierBadge + animation hook

**Files:**
- Create: `components/radar/useAnimatedScores.ts`, `components/radar/TierBadge.tsx`, `components/radar/RadarChart.tsx`
- Test: `test/components/radar-chart.test.tsx`

- [ ] **Step 1: Write the failing test**

`test/components/radar-chart.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RadarChart } from '@/components/radar/RadarChart';
import { computeProfile } from '@/lib/scoring';

describe('RadarChart', () => {
  it('renders all six axis labels', () => {
    render(<RadarChart profile={computeProfile({ energy: [4] })} />);
    for (const label of ['Energy', 'Strength', 'Sleep', 'Drive', 'Focus', 'Body']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('shows ?? for unscored axes', () => {
    render(<RadarChart profile={computeProfile({ energy: [4] })} />);
    // five axes unscored -> at least one ?? marker
    expect(screen.getAllByText('??').length).toBeGreaterThanOrEqual(5);
  });

  it('shows the overall score and non-diagnostic tier label', () => {
    render(<RadarChart profile={computeProfile({ energy: [4, 4], sleep: [4, 4] })} />);
    expect(screen.getByTestId('overall')).toHaveTextContent('100');
    expect(screen.getByText('Optimized')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/components/radar-chart.test.tsx`
Expected: FAIL — cannot resolve `@/components/radar/RadarChart`.

- [ ] **Step 3: Write `components/radar/useAnimatedScores.ts`**

```ts
'use client';
import { useEffect, useRef, useState } from 'react';
import { lerpArray } from './animate';

const DURATION_MS = 500;

/** Smoothly animates the rendered values toward `target` whenever it changes. */
export function useAnimatedScores(target: number[]): number[] {
  const [values, setValues] = useState<number[]>(target);
  const fromRef = useRef<number[]>(target);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    fromRef.current = values;
    startRef.current = null;

    function tick(now: number): void {
      if (startRef.current === null) startRef.current = now;
      const t = Math.min((now - startRef.current) / DURATION_MS, 1);
      setValues(lerpArray(fromRef.current, target, t));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // reason: keyed on the serialized target; the animation start is captured via refs
  }, [JSON.stringify(target)]);

  return values;
}
```

- [ ] **Step 4: Write `components/radar/TierBadge.tsx`**

```tsx
import type { Tier } from '@/lib/scoring';

export function TierBadge({ overall, tier }: { overall: number | null; tier: Tier | null }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span data-testid="overall" className="text-5xl font-semibold tabular-nums text-[var(--fg)]">
        {overall ?? '—'}
      </span>
      {tier && (
        <span
          className="rounded-full px-3 py-1 text-sm font-medium text-white"
          style={{ backgroundColor: tier.color }}
        >
          {tier.label}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Write `components/radar/RadarChart.tsx`**

```tsx
'use client';
import { AXES, AXIS_META, type RadarProfile } from '@/lib/scoring';
import { pointForValue, polygonPoints, scoresToValues } from './geometry';
import { useAnimatedScores } from './useAnimatedScores';
import { TierBadge } from './TierBadge';

const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = 110;
const LABEL_RADIUS = RADIUS + 26;

export function RadarChart({ profile }: { profile: RadarProfile }) {
  const target = scoresToValues(profile.axes);
  const values = useAnimatedScores(target);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Wellness radar">
        <defs>
          <radialGradient id="ava-radar-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent-2)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.30" />
          </radialGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((ring) => (
          <circle
            key={ring}
            cx={CENTER}
            cy={CENTER}
            r={RADIUS * ring}
            fill="none"
            stroke="var(--fg)"
            strokeOpacity={0.08}
          />
        ))}

        {AXES.map((_, i) => {
          const edge = pointForValue(i, 100, CENTER, CENTER, RADIUS);
          return (
            <line
              key={i}
              x1={CENTER}
              y1={CENTER}
              x2={edge.x}
              y2={edge.y}
              stroke="var(--fg)"
              strokeOpacity={0.08}
            />
          );
        })}

        <polygon
          points={polygonPoints(values, CENTER, CENTER, RADIUS)}
          fill="url(#ava-radar-fill)"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {AXES.map((axis, i) => {
          const labelPoint = pointForValue(i, (LABEL_RADIUS / RADIUS) * 100, CENTER, CENTER, RADIUS);
          const score = profile.axes[axis];
          return (
            <text
              key={axis}
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-[var(--fg)] text-[11px]"
            >
              <tspan>{AXIS_META[axis].label}</tspan>
              <tspan dx="4" className="font-semibold">
                {score === null ? '??' : String(score)}
              </tspan>
            </text>
          );
        })}
      </svg>

      <TierBadge overall={profile.overall} tier={profile.tier} />
    </div>
  );
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run test/components/radar-chart.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/radar/useAnimatedScores.ts components/radar/TierBadge.tsx components/radar/RadarChart.tsx test/components/radar-chart.test.tsx
git commit -m "phase-1: animated SVG radar chart + tier badge

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: EmailCapture form

**Files:**
- Create: `components/teaser/EmailCapture.tsx`
- Test: `test/components/email-capture.test.tsx`

- [ ] **Step 1: Write the failing test**

`test/components/email-capture.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmailCapture } from '@/components/teaser/EmailCapture';

describe('EmailCapture', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('shows an error and does not submit an invalid email', () => {
    render(<EmailCapture />);
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'nope' } });
    fireEvent.click(screen.getByRole('button', { name: /notify me/i }));
    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('submits a valid email and shows success', async () => {
    render(<EmailCapture />);
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: /notify me/i }));
    await waitFor(() => expect(screen.getByText(/you're on the list/i)).toBeInTheDocument());
    expect(fetch).toHaveBeenCalledWith('/api/waitlist', expect.objectContaining({ method: 'POST' }));
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/components/email-capture.test.tsx`
Expected: FAIL — cannot resolve `@/components/teaser/EmailCapture`.

- [ ] **Step 3: Write `components/teaser/EmailCapture.tsx`**

```tsx
'use client';
import { useState } from 'react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailCapture() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('failed');
      setStatus('success');
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  }

  if (status === 'success') {
    return <p className="font-medium text-[var(--accent)]">You&apos;re on the list. We&apos;ll be in touch.</p>;
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          aria-label="Email"
          className="flex-1 rounded-full border border-[var(--fg)]/15 bg-white/70 px-4 py-3 text-[var(--fg)] outline-none focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-white disabled:opacity-60"
        >
          Notify me
        </button>
      </div>
      {status === 'error' && <p className="text-sm text-[var(--tier-flagged)]">{message}</p>}
    </form>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run test/components/email-capture.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/teaser/EmailCapture.tsx test/components/email-capture.test.tsx
git commit -m "phase-1: email capture form

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: RadarTeaser (interactive)

**Files:**
- Create: `components/teaser/RadarTeaser.tsx`
- Test: `test/components/radar-teaser.test.tsx`

- [ ] **Step 1: Write the failing test**

`test/components/radar-teaser.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { RadarTeaser } from '@/components/teaser/RadarTeaser';

describe('RadarTeaser', () => {
  it('starts with all axes unscored', () => {
    render(<RadarTeaser />);
    expect(screen.getAllByText('??').length).toBe(6);
  });

  it('fills an axis when a question is answered', () => {
    render(<RadarTeaser />);
    const energy = screen.getByTestId('q-energy');
    fireEvent.click(within(energy).getByRole('button', { name: /great/i }));
    // Energy is no longer ?? -> fewer than 6 unscored
    expect(screen.getAllByText('??').length).toBe(5);
  });

  it('reveals the email-capture form via the CTA', () => {
    render(<RadarTeaser />);
    fireEvent.click(screen.getByRole('button', { name: /get your full profile/i }));
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/components/radar-teaser.test.tsx`
Expected: FAIL — cannot resolve `@/components/teaser/RadarTeaser`.

- [ ] **Step 3: Write `components/teaser/RadarTeaser.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { computeProfile, type Axis, type Severity, type Signals } from '@/lib/scoring';
import { RadarChart } from '@/components/radar/RadarChart';
import { EmailCapture } from './EmailCapture';

interface Question {
  axis: Axis;
  prompt: string;
  options: { label: string; severity: Severity }[];
}

const QUESTIONS: Question[] = [
  {
    axis: 'energy',
    prompt: 'How are your energy levels lately?',
    options: [
      { label: 'Running on empty', severity: 1 },
      { label: 'Up and down', severity: 2 },
      { label: 'Great', severity: 4 },
    ],
  },
  {
    axis: 'sleep',
    prompt: 'How well are you sleeping?',
    options: [
      { label: 'Barely', severity: 1 },
      { label: 'Okay', severity: 2 },
      { label: 'Like a rock', severity: 4 },
    ],
  },
  {
    axis: 'drive',
    prompt: 'How is your drive and motivation?',
    options: [
      { label: 'Low', severity: 1 },
      { label: 'Some days', severity: 2 },
      { label: 'Fired up', severity: 4 },
    ],
  },
];

export function RadarTeaser() {
  const [signals, setSignals] = useState<Signals>({});
  const [showCapture, setShowCapture] = useState(false);
  const profile = computeProfile(signals);

  function answer(axis: Axis, severity: Severity): void {
    setSignals((prev) => ({ ...prev, [axis]: [severity] }));
  }

  return (
    <div className="grid w-full max-w-4xl gap-10 md:grid-cols-2 md:items-center">
      <div className="flex flex-col gap-5">
        {QUESTIONS.map((q) => (
          <div key={q.axis} data-testid={`q-${q.axis}`} className="flex flex-col gap-2">
            <p className="font-medium text-[var(--fg)]">{q.prompt}</p>
            <div className="flex flex-wrap gap-2">
              {q.options.map((o) => {
                const selected = signals[q.axis]?.[0] === o.severity;
                return (
                  <button
                    key={o.label}
                    type="button"
                    onClick={() => answer(q.axis, o.severity)}
                    aria-pressed={selected}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      selected
                        ? 'border-transparent bg-[var(--accent)] text-white'
                        : 'border-[var(--fg)]/15 bg-white/40 text-[var(--fg)] hover:border-[var(--accent)]'
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {showCapture ? (
          <EmailCapture />
        ) : (
          <button
            type="button"
            onClick={() => setShowCapture(true)}
            className="mt-2 self-start rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
          >
            Get your full profile
          </button>
        )}
      </div>

      <div className="flex justify-center">
        <RadarChart profile={profile} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run test/components/radar-teaser.test.tsx`
Expected: PASS (EmailCapture already exists from Task 9).

- [ ] **Step 5: Commit**

```bash
git add components/teaser/RadarTeaser.tsx test/components/radar-teaser.test.tsx
git commit -m "phase-1: interactive radar teaser

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 11: Landing page + warm theme + disclosure footer

**Files:**
- Modify: `app/page.tsx`, `app/globals.css`
- Test: `test/components/landing.test.tsx`

- [ ] **Step 1: Write the failing test**

`test/components/landing.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('landing page', () => {
  it('shows the product name and the not-medical-advice disclaimer', () => {
    render(<Home />);
    expect(screen.getAllByText(/ava/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/not medical advice/i)).toBeInTheDocument();
  });

  it('renders the interactive teaser CTA', () => {
    render(<Home />);
    expect(screen.getByRole('button', { name: /get your full profile/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/components/landing.test.tsx`
Expected: FAIL — current `app/page.tsx` has no teaser/disclaimer.

- [ ] **Step 3: Add warm theme tokens to `app/globals.css`**

```css
@import "tailwindcss";

:root {
  --bg: #f6f0e8;
  --fg: #2b2622;
  --accent: #c8643c;
  --accent-2: #d9a441;

  --tier-optimized: #3f9c5a;
  --tier-solid: #6fae4f;
  --tier-room: #d8a24a;
  --tier-attention: #d2792f;
  --tier-flagged: #c2502f;
  --tier-critical: #7d2b1d;
}

body {
  background-color: var(--bg);
  color: var(--fg);
}
```

- [ ] **Step 4: Replace `app/page.tsx`**

```tsx
import { RadarTeaser } from '@/components/teaser/RadarTeaser';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center gap-12 px-6 py-16">
      <header className="flex flex-col items-center gap-4 text-center">
        <span className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">
          Ava
        </span>
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
          See where your wellness really stands.
        </h1>
        <p className="max-w-xl text-lg text-[var(--fg)]/70">
          Answer a few quick questions and watch your six-axis profile take shape. No appointments,
          no judgment — just a clear picture and a companion in your corner.
        </p>
      </header>

      <RadarTeaser />

      <footer className="mt-auto flex flex-col items-center gap-1 pt-12 text-center text-xs text-[var(--fg)]/50">
        <p>Ava is an AI companion · not medical advice.</p>
        <p>Wellness indicators, not a medical assessment.</p>
      </footer>
    </main>
  );
}
```

- [ ] **Step 5: Run the landing test to verify it passes**

Run: `npx vitest run test/components/landing.test.tsx`
Expected: PASS.

- [ ] **Step 6: Run the full suite, lint, and build**

Run: `npm run test`
Expected: PASS — all scoring, waitlist, component, landing, and safeguard suites.

Run: `npm run lint`
Expected: clean.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 7: Manually view the landing in the dev server**

Run: `npm run dev` (background) then open `http://localhost:3000`.
Expected: warm landing, three questions, a live radar that animates as you answer (3 axes fill, 3
show `??`), an overall score + tier badge, and the "Get your full profile" CTA revealing the email
form. (The form needs Task 12 for a live insert; without `.env.local` it will return a 500 on
submit, which is expected until then.)

- [ ] **Step 8: Commit**

```bash
git add app/page.tsx app/globals.css test/components/landing.test.tsx
git commit -m "phase-1: warm landing page with interactive radar teaser

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 12: Supabase `waitlist` migration (GATED on MCP auth + `.env.local`)

**Files:**
- Create: `supabase/migrations/0001_waitlist.sql`

**Prerequisites:** Supabase MCP authenticated to the **dev** project; `.env.local` populated. The SQL
file can be written and committed without these; applying/verifying requires them. Use the
`supabase` skill when applying.

- [ ] **Step 1: Write the migration**

`supabase/migrations/0001_waitlist.sql`:

```sql
-- Waitlist for the Ava landing email capture.
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  created_at timestamptz not null default now()
);

-- RLS on, with NO anon/public policies: inserts happen server-side via the
-- service role only (which bypasses RLS). The anon key can neither read nor write.
alter table public.waitlist enable row level security;
```

- [ ] **Step 2: Apply the migration via the Supabase MCP**

Use the `supabase` skill / MCP `apply_migration` (name: `0001_waitlist`) against the **dev** project,
passing the SQL above.
Expected: migration applies without error.

- [ ] **Step 3: Verify RLS is enabled and there are no permissive policies**

Via the Supabase MCP, run:
```sql
select relrowsecurity from pg_class where relname = 'waitlist';
select polname from pg_policies where tablename = 'waitlist';
```
Expected: `relrowsecurity = true`; the policy query returns **no rows** (no anon access).

- [ ] **Step 4: Live end-to-end check**

With `.env.local` populated, run `npm run dev`, open the landing, answer a question, click "Get your
full profile", enter a real email, submit.
Expected: success state ("You're on the list"). Then via the Supabase MCP:
```sql
select email from public.waitlist order by created_at desc limit 1;
```
Expected: the submitted email is present. Submitting the same email again still shows success (the
duplicate is handled).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0001_waitlist.sql
git commit -m "phase-1: waitlist table migration (RLS on, server-side insert only)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Done criteria (Slice 1A)

- [ ] `npm run test`, `npm run lint`, `npm run build` all green.
- [ ] Scoring library: tier boundaries + `??`/`null` handling covered by tests.
- [ ] Landing renders the warm hero + interactive teaser; radar animates and shows `??` for unscored axes.
- [ ] Email-capture persists to the Supabase `waitlist` table (RLS verified on); duplicate handled.
- [ ] Service-role key only reachable server-side (`server-only` on the admin client).
- [ ] No medical-claim language in copy; "not medical advice" disclaimer present.

## Deferred (do not build here)

Full auth + accepted-checkbox disclosure gate + geo-block (1B); the full health schema + encryption +
`compliance_log` (1B); real chat + LLM-populated signals (1C); credits/Stripe/profile/brag
card/avatar/referrals (1D–1G).
