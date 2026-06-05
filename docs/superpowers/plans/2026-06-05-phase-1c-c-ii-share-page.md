# Phase 1C-c-ii — Public Share Page + OG Image Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a brag-card link actually viewable + previewable: a **public** `/share/[token]` page rendering composition A (video-hero placeholder + overall + unlabeled silhouette + "got my baseline" + CTA) from the stripped `share_cards` row, plus a `next/og` image so the link previews as a card.

**Architecture:** A server-only `getShareCard(token)` reads the stripped public fields from `share_cards` via the admin client (never `user_id`). `app/share/[token]/page.tsx` (public, no gate) renders `<ShareCard>` or `notFound()`. `app/share/[token]/opengraph-image.tsx` (`next/og` `ImageResponse`) renders a still preview. `ShareCard` is a pure server component reusing the radar geometry for the unlabeled silhouette.

**Tech Stack:** Next.js 16 (App Router, public server components, `next/og`), Tailwind v4 warm tokens, Vitest + Testing Library. No new deps.

**Spec:** `docs/superpowers/specs/2026-06-04-phase-1c-c-brag-card-design.md`

**Conventions:** Branch `phase-1c-c-ii/share-page` (already created off `main`). `phase-1:` commits, one concern each, `Co-Authored-By` trailer. TS strict; no `any` without `// reason:`. The public card shows ONLY `{overall, silhouette, displayName?}` — no axis labels, no per-axis values, no `user_id`.

**Builds on (1C-c-i, merged):** `share_cards { token, user_id, overall, silhouette jsonb (number[]), display_name, created_at }` (RLS-on, 0 policies = service-role-only). Geometry: `polygonPoints(values, cx, cy, radius): string` + `pointForValue(i, value, cx, cy, radius): {x,y}` from `@/components/radar/geometry`.

**Scope:** the public page + OG image + `ShareCard`. **Deferred:** the "Share my baseline" trigger (1C-c-iii); the real Ava clip + Poster B (→ avatar foundation, see memory).

---

## File Structure

**Created:**
- `lib/share/read.ts` — `getShareCard(token)` (server-only, stripped public read)
- `components/share/ShareCard.tsx` — composition A (server component)
- `app/share/[token]/page.tsx` — public page
- `app/share/[token]/opengraph-image.tsx` — `next/og` still
- `test/share/read.test.ts`, `test/share/share-card.test.tsx`

---

## Task 1: `getShareCard` (stripped public read)

**Files:**
- Create: `lib/share/read.ts`, `test/share/read.test.ts`

- [ ] **Step 1: Write the failing test** `test/share/read.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';

const maybeSingle = vi.fn();
vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }) }),
}));

import { getShareCard } from '@/lib/share/read';

describe('getShareCard', () => {
  it('returns only the stripped public fields for a known token', async () => {
    maybeSingle.mockResolvedValue({
      data: { overall: 47, silhouette: [40, 0, 60, 50, 45, 55], display_name: 'Pat' },
      error: null,
    });
    const card = await getShareCard('tok123');
    expect(card).toEqual({ overall: 47, silhouette: [40, 0, 60, 50, 45, 55], displayName: 'Pat' });
    // user_id / created_at must never appear
    expect(Object.keys(card!).sort()).toEqual(['displayName', 'overall', 'silhouette']);
  });

  it('returns null for an unknown token', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await getShareCard('nope')).toBeNull();
  });

  it('returns null on a db error or a malformed row', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'boom' } });
    expect(await getShareCard('x')).toBeNull();
    maybeSingle.mockResolvedValue({ data: { overall: null, silhouette: [], display_name: null }, error: null });
    expect(await getShareCard('x')).toBeNull();
  });
});
```

- [ ] **Step 2: Run it — confirm FAIL** (`npx vitest run test/share/read.test.ts`).

- [ ] **Step 3: Write `lib/share/read.ts`**

```ts
import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/** The public, sensitive-data-stripped card (no user_id, no per-axis labels). */
export interface PublicShareCard {
  overall: number;
  silhouette: number[];
  displayName: string | null;
}

/** Read one brag card by token (service-role; the table has no anon grant). Returns only the
 *  public fields — never user_id/created_at. null on missing/error/malformed. */
export async function getShareCard(token: string): Promise<PublicShareCard | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('share_cards')
    .select('overall, silhouette, display_name')
    .eq('token', token)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as { overall: number | null; silhouette: unknown; display_name: string | null };
  if (row.overall === null || !Array.isArray(row.silhouette) || row.silhouette.length === 0) {
    return null;
  }
  return {
    overall: row.overall,
    silhouette: (row.silhouette as unknown[]).map(Number),
    displayName: row.display_name,
  };
}
```

- [ ] **Step 4: Run it — confirm PASS** (`npx vitest run test/share/read.test.ts`). `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 5: Commit**

```bash
git add lib/share/read.ts test/share/read.test.ts
git commit -m "phase-1: getShareCard (stripped public read by token)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `ShareCard` component (composition A)

**Files:**
- Create: `components/share/ShareCard.tsx`, `test/share/share-card.test.tsx`

- [ ] **Step 1: Write the failing test** `test/share/share-card.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShareCard } from '@/components/share/ShareCard';

const silhouette = [40, 0, 60, 50, 45, 55];

describe('ShareCard', () => {
  it('shows the overall number, the baseline copy, and the CTA', () => {
    render(<ShareCard overall={47} silhouette={silhouette} displayName={null} />);
    expect(screen.getByText('47')).toBeInTheDocument();
    expect(screen.getByText(/got my baseline with ava/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /map your six/i })).toBeInTheDocument();
  });

  it('renders the silhouette as an unlabeled shape (no axis names or per-axis values)', () => {
    render(<ShareCard overall={47} silhouette={silhouette} displayName={null} />);
    expect(screen.getByRole('img', { name: /wellness silhouette/i })).toBeInTheDocument();
    // never leaks axis identity
    for (const label of ['Energy', 'Strength', 'Sleep', 'Drive', 'Focus', 'Body']) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });

  it('personalizes the copy when a display name is given', () => {
    render(<ShareCard overall={47} silhouette={silhouette} displayName="Pat" />);
    expect(screen.getByText(/pat got a wellness baseline/i)).toBeInTheDocument();
  });

  it('shows the video placeholder when there is no clip yet', () => {
    render(<ShareCard overall={47} silhouette={silhouette} displayName={null} />);
    expect(screen.getByLabelText(/ava clip/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it — confirm FAIL** (`npx vitest run test/share/share-card.test.tsx`).

- [ ] **Step 3: Write `components/share/ShareCard.tsx`**

```tsx
import { pointForValue, polygonPoints } from '@/components/radar/geometry';

const SIZE = 200;
const C = SIZE / 2;
const R = 78;
const FULL = [100, 100, 100, 100, 100, 100];

/** Composition A — the public day-one brag card. Pure/server component. The silhouette is
 *  UNLABELED (shape only); `clipUrl` is the future templated Ava clip (placeholder until then). */
export function ShareCard({
  overall,
  silhouette,
  displayName,
  clipUrl,
}: {
  overall: number;
  silhouette: number[];
  displayName?: string | null;
  clipUrl?: string;
}) {
  const copy = displayName ? `${displayName} got a wellness baseline with Ava.` : 'Got my baseline with Ava.';

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(43,38,34,0.10)]">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-bold tracking-tight text-foreground">Ava</span>
          <span className="text-xs text-muted-foreground">wellness baseline</span>
        </div>

        {/* Video hero: placeholder now; the templated Ava clip drops in here later. */}
        {clipUrl ? (
          <video
            className="mb-4 aspect-video w-full rounded-2xl object-cover"
            src={clipUrl}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <div
            aria-label="Ava clip (coming soon)"
            className="mb-4 flex aspect-video w-full items-center justify-center rounded-2xl"
            style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-2))' }}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-background/85 text-brand">
              ▶
            </span>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div>
            <div className="text-5xl font-extrabold leading-none tracking-tight text-foreground tabular-nums">
              {overall}
            </div>
            <div className="text-xs text-muted-foreground">out of 100</div>
          </div>
          <svg
            width={96}
            height={96}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            role="img"
            aria-label="Wellness silhouette"
            className="shrink-0"
          >
            {/* grid ring (no axis labels) */}
            <polygon points={polygonPoints(FULL, C, C, R)} fill="none" stroke="var(--border)" strokeWidth={1.5} />
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const e = pointForValue(i, 100, C, C, R);
              return <line key={i} x1={C} y1={C} x2={e.x} y2={e.y} stroke="var(--border)" strokeOpacity={0.6} />;
            })}
            <polygon
              points={polygonPoints(silhouette, C, C, R)}
              fill="var(--brand-2)"
              fillOpacity={0.35}
              stroke="var(--brand)"
              strokeWidth={2}
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p className="mt-4 text-sm font-semibold text-foreground">{copy}</p>
        <a
          href="/"
          className="mt-4 block rounded-full bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground"
        >
          Map your six with Ava →
        </a>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Run it — confirm PASS** (`npx vitest run test/share/share-card.test.tsx`). `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 5: Commit**

```bash
git add components/share/ShareCard.tsx test/share/share-card.test.tsx
git commit -m "phase-1: ShareCard (composition A — video placeholder + unlabeled silhouette)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Public page + OG image

**Files:**
- Create: `app/share/[token]/page.tsx`, `app/share/[token]/opengraph-image.tsx`

These are public server components + a `next/og` render — not practical to unit-test (async server components + satori); they are **build-verified** here and live-checked in Task 4.

- [ ] **Step 1: Write `app/share/[token]/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getShareCard } from '@/lib/share/read';
import { ShareCard } from '@/components/share/ShareCard';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const card = await getShareCard(token);
  if (!card) return { title: 'Ava' };
  const who = card.displayName ? `${card.displayName}'s` : 'My';
  return {
    title: `${who} wellness baseline · Ava`,
    description: `${who} wellness baseline is ${card.overall}/100 — map your six with Ava.`,
  };
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const card = await getShareCard(token);
  if (!card) notFound();
  return <ShareCard overall={card.overall} silhouette={card.silhouette} displayName={card.displayName} />;
}
```

- [ ] **Step 2: Write `app/share/[token]/opengraph-image.tsx`**

```tsx
import { ImageResponse } from 'next/og';
import { getShareCard } from '@/lib/share/read';

export const alt = 'Ava wellness baseline';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Robust, satori-friendly still (flexbox + inline styles only). Leads with the overall number +
// branding so the link previews as a card. (The silhouette + clip live on the page itself.)
export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const card = await getShareCard(token);
  const overall = card?.overall ?? null;
  const who = card?.displayName ? `${card.displayName}'s` : 'My';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f6f0e8, #ead9bd)',
          color: '#2b2622',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: 2 }}>Ava</div>
        <div style={{ fontSize: 240, fontWeight: 800, lineHeight: 1, color: '#c8643c' }}>
          {overall ?? '—'}
        </div>
        <div style={{ fontSize: 40, fontWeight: 700 }}>{who} wellness baseline</div>
      </div>
    ),
    { ...size },
  );
}
```

- [ ] **Step 3: Typecheck, lint, build**

Run: `npx tsc --noEmit` → clean.
Run: `npm run lint` → clean.
Run: `npm run build` → succeeds; the route list includes `ƒ /share/[token]` (dynamic, reads the DB).

- [ ] **Step 4: Commit**

```bash
git add "app/share/[token]/page.tsx" "app/share/[token]/opengraph-image.tsx"
git commit -m "phase-1: public /share/[token] page + next/og preview image

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Full verification

- [ ] **Step 1: Full suite, typecheck, lint, build**

Run: `npx vitest run` → all PASS (incl. the new `read` + `share-card` suites).
Run: `npx tsc --noEmit` → clean. `npm run lint` → clean.
Run: `npm run build` → succeeds; `ƒ /share/[token]` present.

- [ ] **Step 2 (manual): live render**

With a real `share_cards` row (create one via `POST /api/share` from 1C-c-i), `npm run dev` and open
`http://localhost:3000/share/<token>` — the card renders (video placeholder + overall + unlabeled
silhouette + copy + CTA), and `http://localhost:3000/share/<token>/opengraph-image` returns a PNG with the
score + branding. An unknown token → 404. Confirm **no axis labels / no per-axis values** anywhere on the page.

---

## Done criteria (Slice 1C-c-ii)

- [ ] `getShareCard` returns ONLY `{overall, silhouette, displayName}` (never `user_id`); null on missing/error/malformed.
- [ ] `ShareCard` renders composition A — overall + unlabeled silhouette (no axis names/values) + baseline copy + CTA + the video **placeholder** (clip slot ready).
- [ ] `/share/[token]` is public (no gate): renders the card; unknown token → 404; the OG image previews as a card.
- [ ] `npm run test` / `lint` / `build` green.

## Deferred

The "Share my baseline" trigger in the radar drawer (1C-c-iii); the real templated Ava clip + Poster (B)
composition (avatar foundation/1F — see the `brag-card-poster-variant` memory); the silhouette in the OG
image (optional polish once satori SVG is confirmed).
