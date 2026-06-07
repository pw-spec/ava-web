# Phase 1C-c-iii — "Share my baseline" Trigger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the brag-card loop: a "Share my baseline" affordance in the radar drawer that POSTs `/api/share`, then reveals the public `/share/<token>` link with copy + the native share sheet.

**Architecture:** A client fetch wrapper `createShareCard` (never throws) calls `/api/share`. A self-contained `ShareBaseline` client component owns the share flow (idle → creating → link shown / error) and is rendered inside `RadarDrawer` only when the user has a baseline (`overall !== null`).

**Tech Stack:** Next.js 16 (client components), Tailwind v4 warm tokens + shadcn `Button`, Vitest + Testing Library (jsdom). No new deps.

**Spec:** `docs/superpowers/specs/2026-06-04-phase-1c-c-brag-card-design.md` (§Trigger UX).

**Conventions:** Branch `phase-1c-c-iii/share-trigger` (already created off `main`). `phase-1:` commits, one concern each, `Co-Authored-By` trailer. TS strict; no `any` without `// reason:`. Client components start with `'use client'`. Component tests start with `// @vitest-environment jsdom`.

**Builds on (merged):** `POST /api/share` → `{ token, url }` (1C-c-i); the public `/share/[token]` page (1C-c-ii); `RadarDrawer({ open, profile, onClose, onEnd, ending? })` (1C-b-ii) rendered by `ChatScreen`.

**Scope:** the trigger + its client wrapper, wired into the radar drawer. **Deferred:** a name-input UI (ships anonymous; `/api/share` already accepts an optional `displayName`); the real Ava clip + Poster B; the Gap reveal + Decision CTA.

---

## File Structure

**Created:**
- `lib/share/client.ts` — `createShareCard(displayName?)` (client fetch wrapper)
- `components/share/ShareBaseline.tsx` — the share flow (client)
- `test/share/client.test.ts`, `test/share/share-baseline.test.tsx`

**Modified:**
- `components/chat/RadarDrawer.tsx` — render `<ShareBaseline canShare={profile.overall !== null} />`
- `test/chat/radar-drawer.test.tsx` — mock the share client; assert the trigger shows with a baseline

---

## Task 1: `createShareCard` client

**Files:**
- Create: `lib/share/client.ts`, `test/share/client.test.ts`

- [ ] **Step 1: Write the failing test** `test/share/client.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createShareCard } from '@/lib/share/client';

afterEach(() => vi.unstubAllGlobals());

function stubFetch(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body }),
  );
}

describe('createShareCard', () => {
  it('returns the token + url on 200', async () => {
    stubFetch(200, { token: 't', url: 'https://ava.test/share/t' });
    expect(await createShareCard('Pat')).toEqual({ ok: true, token: 't', url: 'https://ava.test/share/t' });
  });

  it('returns ok:false on a non-2xx', async () => {
    stubFetch(400, { error: 'x' });
    expect(await createShareCard()).toEqual({ ok: false });
  });

  it('returns ok:false on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await createShareCard()).toEqual({ ok: false });
  });
});
```

- [ ] **Step 2: Run it — confirm FAIL** (`npx vitest run test/share/client.test.ts`).

- [ ] **Step 3: Write `lib/share/client.ts`**

```ts
/** POST to /api/share to mint a brag card. Never throws — HTTP/network failures → { ok: false }. */
export async function createShareCard(
  displayName?: string,
): Promise<{ ok: true; token: string; url: string } | { ok: false }> {
  try {
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(displayName ? { displayName } : {}),
    });
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as { token: string; url: string };
    return { ok: true, token: data.token, url: data.url };
  } catch {
    return { ok: false };
  }
}
```

- [ ] **Step 4: Run it — confirm PASS** (`npx vitest run test/share/client.test.ts`). `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 5: Commit**

```bash
git add lib/share/client.ts test/share/client.test.ts
git commit -m "phase-1: createShareCard client (POST /api/share, never throws)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `ShareBaseline` component

**Files:**
- Create: `components/share/ShareBaseline.tsx`, `test/share/share-baseline.test.tsx`

- [ ] **Step 1: Write the failing test** `test/share/share-baseline.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { createShareCard } = vi.hoisted(() => ({ createShareCard: vi.fn() }));
vi.mock('@/lib/share/client', () => ({ createShareCard }));

import { ShareBaseline } from '@/components/share/ShareBaseline';

describe('ShareBaseline', () => {
  beforeEach(() => createShareCard.mockReset());

  it('renders nothing when there is no baseline to share', () => {
    const { container } = render(<ShareBaseline canShare={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('creates a card and reveals the link on click', async () => {
    createShareCard.mockResolvedValue({ ok: true, token: 't', url: 'https://ava.test/share/t' });
    render(<ShareBaseline canShare />);
    fireEvent.click(screen.getByRole('button', { name: /share my baseline/i }));
    await waitFor(() => expect(createShareCard).toHaveBeenCalledTimes(1));
    expect(await screen.findByLabelText(/share link/i)).toHaveValue('https://ava.test/share/t');
  });

  it('copies the link', async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    createShareCard.mockResolvedValue({ ok: true, token: 't', url: 'https://ava.test/share/t' });
    render(<ShareBaseline canShare />);
    fireEvent.click(screen.getByRole('button', { name: /share my baseline/i }));
    fireEvent.click(await screen.findByRole('button', { name: /copy/i }));
    expect(writeText).toHaveBeenCalledWith('https://ava.test/share/t');
  });

  it('shows an error when the link cannot be created', async () => {
    createShareCard.mockResolvedValue({ ok: false });
    render(<ShareBaseline canShare />);
    fireEvent.click(screen.getByRole('button', { name: /share my baseline/i }));
    expect(await screen.findByText(/couldn.t create a link/i)).toBeInTheDocument();
  });
});
```

(In jsdom `navigator.share` is `undefined`, so the native-share branch is skipped — no mocking needed for it.)

- [ ] **Step 2: Run it — confirm FAIL** (`npx vitest run test/share/share-baseline.test.tsx`).

- [ ] **Step 3: Write `components/share/ShareBaseline.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createShareCard } from '@/lib/share/client';

type State = { kind: 'idle' } | { kind: 'sharing' } | { kind: 'done'; url: string } | { kind: 'error' };

/** "Share my baseline" — mints a brag card and reveals the public link (copy + native share).
 *  Renders nothing until the user has a baseline (`canShare`). */
export function ShareBaseline({ canShare }: { canShare: boolean }) {
  const [state, setState] = useState<State>({ kind: 'idle' });
  if (!canShare) return null;

  async function share() {
    setState({ kind: 'sharing' });
    const res = await createShareCard();
    if (!res.ok) {
      setState({ kind: 'error' });
      return;
    }
    setState({ kind: 'done', url: res.url });
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ url: res.url, title: 'My wellness baseline' });
      } catch {
        // user dismissed the native share sheet — the link is still shown for copy
      }
    }
  }

  if (state.kind === 'done') {
    return (
      <div className="mt-3 rounded-2xl border border-border bg-background p-3">
        <p className="text-xs text-muted-foreground">Your shareable link</p>
        <div className="mt-1 flex items-center gap-2">
          <input
            readOnly
            value={state.url}
            aria-label="Share link"
            className="min-w-0 flex-1 truncate rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground"
          />
          <Button
            type="button"
            onClick={() => void navigator.clipboard?.writeText(state.url)}
            className="shrink-0"
          >
            Copy
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <Button
        type="button"
        variant="outline"
        onClick={share}
        disabled={state.kind === 'sharing'}
        className="w-full"
      >
        {state.kind === 'sharing' ? 'Creating link…' : 'Share my baseline'}
      </Button>
      {state.kind === 'error' && (
        <p className="mt-1 text-center text-xs text-destructive">Couldn&apos;t create a link — try again.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run it — confirm PASS** (`npx vitest run test/share/share-baseline.test.tsx`). `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 5: Commit**

```bash
git add components/share/ShareBaseline.tsx test/share/share-baseline.test.tsx
git commit -m "phase-1: ShareBaseline (mint + reveal link, copy + native share)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Wire `ShareBaseline` into `RadarDrawer`

**Files:**
- Modify: `components/chat/RadarDrawer.tsx`
- Test: `test/chat/radar-drawer.test.tsx`

- [ ] **Step 1: Update the radar-drawer test** `test/chat/radar-drawer.test.tsx`.

At the top (after the imports), mock the share client so the trigger doesn't reach a real `fetch`:
```ts
vi.mock('@/lib/share/client', () => ({ createShareCard: vi.fn() }));
```
(Add `vi` to the `vitest` import if it isn't already imported.)

Append two tests inside the existing `describe('RadarDrawer', …)`:
```ts
  it('offers "Share my baseline" when there is a baseline', () => {
    render(<RadarDrawer open profile={profile} onClose={() => {}} onEnd={() => {}} />);
    expect(screen.getByRole('button', { name: /share my baseline/i })).toBeInTheDocument();
  });

  it('hides the share trigger when there is no baseline', () => {
    const blank: RadarProfile = { ...profile, overall: null, tier: null };
    render(<RadarDrawer open profile={blank} onClose={() => {}} onEnd={() => {}} />);
    expect(screen.queryByRole('button', { name: /share my baseline/i })).not.toBeInTheDocument();
  });
```
(`profile` and the `RadarProfile` type import already exist in this test file from 1C-b-ii.)

- [ ] **Step 2: Run it — confirm the new tests FAIL** (`npx vitest run test/chat/radar-drawer.test.tsx`).

- [ ] **Step 3: Edit `components/chat/RadarDrawer.tsx`** — import + render `ShareBaseline` between the radar and the End button:

Add the import:
```ts
import { ShareBaseline } from '@/components/share/ShareBaseline';
```
And insert the component after `<RadarChart … />`, before the End `<Button>`:
```tsx
        <RadarChart profile={profile} />
        <ShareBaseline canShare={profile.overall !== null} />
        <Button onClick={onEnd} disabled={ending} className="mt-4 w-full">
          {ending ? 'Saving…' : 'End check-in & save'}
        </Button>
```

- [ ] **Step 4: Run it — confirm PASS** (`npx vitest run test/chat/radar-drawer.test.tsx` — the 3 existing + 2 new). `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 5: Commit**

```bash
git add components/chat/RadarDrawer.tsx test/chat/radar-drawer.test.tsx
git commit -m "phase-1: surface 'Share my baseline' in the radar drawer

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Full verification

- [ ] **Step 1: Full suite, typecheck, lint, build**

Run: `npx vitest run` → all PASS (incl. the new `client` + `share-baseline` suites and the updated `radar-drawer`).
Run: `npx tsc --noEmit` → clean. `npm run lint` → clean.
Run: `npm run build` → succeeds.

- [ ] **Step 2 (manual): live loop**

`npm run dev`, signed in as an onboarded user with a baseline. On `/home`, tap the score pill to open the
radar → tap **"Share my baseline"** → a `/share/<token>` link appears (and the native share sheet on mobile);
**Copy** copies it; opening the link shows the public card (1C-c-ii). Before any check-in (no baseline), the
trigger is absent.

---

## Done criteria (Slice 1C-c-iii)

- [ ] `createShareCard` POSTs `/api/share` and returns `{ok, token?, url?}`; never throws.
- [ ] `ShareBaseline` renders nothing without a baseline; on click mints a card and reveals the link with a
      Copy button (+ native share when available); shows a quiet error on failure.
- [ ] The radar drawer surfaces "Share my baseline" only when `overall !== null`.
- [ ] `npm run test` / `lint` / `build` green.

## Deferred

A name-input UI (ships anonymous; the API accepts `displayName`); the real templated Ava clip + Poster (B);
the Gap reveal + Decision CTA (→ 1D Stripe). With this slice, the **day-one brag card is wired end-to-end**.
