# Phase 1D-d — Wellness Profile Report + `/profile` Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the paid product — generate the written **Wellness Profile report** from a check-in transcript (Sonnet → output filter → encrypt → discard transcript) gated by the purchase entitlement, and render it on a private, RLS-owner-only `/profile` page (ready / preparing / locked states).

**Architecture:** A `generateProfileReport` safeguard mirrors the existing `summarizeSession` (same Sonnet caller + Layer-3 output filter + regenerate-once-then-drop, lives under `/lib/safeguards` to satisfy the `/lib/llm` import boundary). `POST /api/profile/generate` (authed + gated) verifies a **paid** entitlement (1D-b), generates, encrypts (`encryptField`), `saveReport`s, and discards the transcript. A pure `ProfileView` component renders the three states; `app/(app)/profile/page.tsx` loads the entitlement + radar and delegates to it.

**Tech Stack:** Next.js 16 App Router (server components), Claude Sonnet via the existing caller, app-layer AES field encryption, Supabase RLS, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-06-07-phase-1d-decision-cta-design.md` (§Report generation + /profile page, §Security & compliance).

**Conventions:** Branch `phase-1d-d/profile-report` off `main`. `phase-1:` commits, one concern each, `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. TS strict; no `any` without `// reason:`. The report is the **private profile** (CLAUDE.md rule #5) — encrypted, in-account only, never the brag card.

**Slice boundary:** This slice builds the server-side report machinery + the page that renders it. The **client flow** that fires generation after a checkout return (the transcript hand-off + polling island) is **1D-e** ("return handling") — so `/profile`'s "preparing" state is static here; 1D-e adds the island that drives it. The generate endpoint is fully unit-tested in isolation (mocked body).

---

## File Structure

**Created:**
- `lib/safeguards/profile-report.ts` — `generateProfileReport` (Sonnet + filter)
- `app/api/profile/generate/route.ts` — entitlement-gated generation
- `components/profile/ProfileView.tsx` — pure renderer of the 3 states
- `app/(app)/profile/page.tsx` — server component (load + delegate)
- `test/safeguards/profile-report.test.ts`, `test/api/profile-generate.test.ts`, `test/profile/profile-view.test.tsx`

**Modified:**
- `lib/safeguards/types.ts` — add `profile_filtered` to `ComplianceEvent`

---

## Task 1: `generateProfileReport` safeguard + `profile_filtered` event

**Files:**
- Modify: `lib/safeguards/types.ts`
- Create: `lib/safeguards/profile-report.ts`, `test/safeguards/profile-report.test.ts`

- [ ] **Step 1: Add the compliance event** — in `lib/safeguards/types.ts`, add `profile_filtered` to the `ComplianceEvent` union (it currently ends with `| 'summary_filtered';`):

```ts
export type ComplianceEvent =
  // …existing members…
  | 'summary_filtered'
  | 'profile_filtered';
```

(Read the file first; keep the existing members exactly, just append `| 'profile_filtered'` before the semicolon.)

- [ ] **Step 2: Write the failing test** `test/safeguards/profile-report.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';

const call = vi.fn();
vi.mock('@/lib/llm/sonnet', () => ({ createSonnetCaller: () => call }));

import { generateProfileReport } from '@/lib/safeguards/profile-report';
import type { LlmMessage } from '@/lib/safeguards/types';

const convo: LlmMessage[] = [
  { role: 'assistant', content: 'how is your energy?' },
  { role: 'user', content: 'low all week, sleeping badly' },
];

describe('generateProfileReport', () => {
  it('returns a clean, non-diagnostic report', async () => {
    call.mockReset().mockResolvedValue({
      text: 'Your energy and sleep have been running low together this week. Worth paying attention to.',
    });
    const out = await generateProfileReport({ messages: convo });
    expect(out).toMatch(/energy/i);
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('regenerates once when the first report is blocked, then keeps the clean one', async () => {
    call
      .mockReset()
      .mockResolvedValueOnce({ text: 'You clearly have low testosterone.' })
      .mockResolvedValueOnce({ text: 'Your drive and energy have felt low; worth tracking over time.' });
    const log = vi.fn();
    const out = await generateProfileReport({ messages: convo, log });
    expect(out).toMatch(/drive/i);
    expect(call).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledWith({ event: 'profile_filtered', outcome: 'regenerated' });
  });

  it('drops the report (null) and logs when still blocked after regeneration', async () => {
    call.mockReset().mockResolvedValue({ text: 'Diagnosis: hypogonadism; start testosterone therapy.' });
    const log = vi.fn();
    const out = await generateProfileReport({ messages: convo, log });
    expect(out).toBeNull();
    expect(call).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledWith({ event: 'profile_filtered', outcome: 'dropped' });
  });
});
```

- [ ] **Step 3: Run it — confirm FAIL** (`npx vitest run test/safeguards/profile-report.test.ts`).

- [ ] **Step 4: Write `lib/safeguards/profile-report.ts`**

```ts
import 'server-only';
import { createSonnetCaller } from '@/lib/llm/sonnet';
import { scanOutput } from './output-filter';
import type { ComplianceSink, LlmMessage } from './types';

const REPORT_SYSTEM =
  'You write a private wellness profile for a man who just finished a self-reported check-in with ' +
  'an AI companion. In 2-4 short paragraphs, reflect back the patterns across his six wellness axes ' +
  '(energy, strength, sleep, drive, focus, body): what stands out, what tends to move together, and ' +
  'a few gentle, non-prescriptive things worth attention or worth raising with a clinician. Warm, ' +
  'plain, second person ("you"). Describe only self-reported wellness indicators. NEVER name medical ' +
  'conditions, drugs, or doses, and never give a diagnosis or clinical assessment.';

const STRICTER =
  'Reminder: do NOT name conditions, drugs, or doses, and do not assess or diagnose. Reframe ' +
  'everything as neutral wellness indicators and general lifestyle reflection.';

/**
 * Generate the paid private wellness-profile report from a finished check-in transcript. Passes
 * through the same Layer-3 output filter as conversation; on a block it regenerates once, then is
 * dropped (returns null) rather than stored. Lives under /lib/safeguards (the /lib/llm boundary);
 * a second Sonnet consumer alongside the summarizer.
 */
export async function generateProfileReport(input: {
  messages: LlmMessage[];
  log?: ComplianceSink;
}): Promise<string | null> {
  const call = createSonnetCaller();
  const transcript = input.messages.map((m) => `${m.role}: ${m.content}`).join('\n');
  const base: LlmMessage[] = [
    { role: 'system', content: REPORT_SYSTEM },
    { role: 'user', content: `Conversation:\n${transcript}\n\nWrite his wellness profile.` },
  ];

  let res = await call(base);
  if (scanOutput(res.text).blocked) {
    res = await call([...base, { role: 'system', content: STRICTER }]);
    if (scanOutput(res.text).blocked) {
      input.log?.({ event: 'profile_filtered', outcome: 'dropped' });
      return null;
    }
    input.log?.({ event: 'profile_filtered', outcome: 'regenerated' });
  }
  const text = res.text.trim();
  return text.length > 0 ? text : null;
}
```

- [ ] **Step 5: Run it — confirm PASS** (`npx vitest run test/safeguards/profile-report.test.ts`). `npx tsc --noEmit` clean; `npm run lint` clean. (The test relies on the REAL `scanOutput` catching "low testosterone"/"Diagnosis"/"hypogonadism", exactly as the summarizer test does.)

- [ ] **Step 6: Commit**

```bash
git add lib/safeguards/types.ts lib/safeguards/profile-report.ts test/safeguards/profile-report.test.ts
git commit -m "phase-1: generateProfileReport safeguard (Sonnet + output filter) + profile_filtered event

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `POST /api/profile/generate` — entitlement-gated generation

**Files:**
- Create: `app/api/profile/generate/route.ts`, `test/api/profile-generate.test.ts`

- [ ] **Step 1: Write the failing test** `test/api/profile-generate.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getUser, maybeSingle, getWellnessProfile, saveReport, generateProfileReport, encryptField } =
  vi.hoisted(() => ({
    getUser: vi.fn(),
    maybeSingle: vi.fn(),
    getWellnessProfile: vi.fn(),
    saveReport: vi.fn(),
    generateProfileReport: vi.fn(),
    encryptField: vi.fn(),
  }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({ getSupabaseAdmin: () => ({}) }));
vi.mock('@/lib/credits/store', () => ({ getWellnessProfile, saveReport }));
vi.mock('@/lib/safeguards/profile-report', () => ({ generateProfileReport }));
vi.mock('@/lib/crypto/field', () => ({ encryptField }));
vi.mock('@/lib/compliance/log', () => ({ makeComplianceSink: () => vi.fn() }));

import { POST } from '@/app/api/profile/generate/route';

const SID = '00000000-0000-0000-0000-000000000001';
function req(body: unknown = { sessionId: SID, messages: [{ role: 'user', content: 'low energy' }] }): Request {
  return new Request('https://ava.test/api/profile/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/profile/generate', () => {
  beforeEach(() => {
    getUser.mockReset().mockResolvedValue({ data: { user: { id: 'u1' } } });
    maybeSingle.mockReset().mockResolvedValue({ data: { state_code: 'TX', ai_disclosure_accepted_at: 't' } });
    getWellnessProfile.mockReset();
    saveReport.mockReset().mockResolvedValue(undefined);
    generateProfileReport.mockReset();
    encryptField.mockReset().mockReturnValue('v1:enc');
  });

  it('401 when unauthenticated', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await POST(req())).status).toBe(401);
  });

  it('403 when the gate is not satisfied', async () => {
    maybeSingle.mockResolvedValue({ data: { state_code: 'CA', ai_disclosure_accepted_at: 't' } });
    expect((await POST(req())).status).toBe(403);
  });

  it('400 on an invalid body', async () => {
    expect((await POST(req({ sessionId: 'nope' }))).status).toBe(400);
  });

  it('pending when there is no entitlement yet (webhook not landed)', async () => {
    getWellnessProfile.mockResolvedValue(null);
    const res = await POST(req());
    expect(await res.json()).toEqual({ status: 'pending' });
    expect(generateProfileReport).not.toHaveBeenCalled();
  });

  it('ready (idempotent) without regenerating when already ready', async () => {
    getWellnessProfile.mockResolvedValue({ id: 'p1', session_id: SID, status: 'ready', report: 'v1:x' });
    const res = await POST(req());
    expect(await res.json()).toEqual({ status: 'ready' });
    expect(generateProfileReport).not.toHaveBeenCalled();
  });

  it('generates, encrypts, saves, and returns ready when paid', async () => {
    getWellnessProfile.mockResolvedValue({ id: 'p1', session_id: SID, status: 'paid', report: null });
    generateProfileReport.mockResolvedValue('Your energy has been low; worth tracking.');
    const res = await POST(req());
    expect(await res.json()).toEqual({ status: 'ready' });
    expect(encryptField).toHaveBeenCalledWith('Your energy has been low; worth tracking.');
    expect(saveReport).toHaveBeenCalledWith(expect.anything(), 'p1', 'v1:enc');
  });

  it('stays pending (retryable) when generation is filtered/dropped', async () => {
    getWellnessProfile.mockResolvedValue({ id: 'p1', session_id: SID, status: 'paid', report: null });
    generateProfileReport.mockResolvedValue(null);
    const res = await POST(req());
    expect(await res.json()).toEqual({ status: 'pending' });
    expect(saveReport).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it — confirm FAIL** (`npx vitest run test/api/profile-generate.test.ts`).

- [ ] **Step 3: Write `app/api/profile/generate/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { gateDecision } from '@/lib/auth/gate';
import { makeComplianceSink } from '@/lib/compliance/log';
import { getWellnessProfile, saveReport } from '@/lib/credits/store';
import { generateProfileReport } from '@/lib/safeguards/profile-report';
import { encryptField } from '@/lib/crypto/field';
import type { LlmMessage } from '@/lib/safeguards/types';

const bodySchema = z.object({
  sessionId: z.string().uuid(),
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(4000) }))
    .min(1),
});

/** Generate the paid Wellness Profile report from the posted transcript. Gated on a paid entitlement
 *  (created by the Stripe webhook). Idempotent (ready → no-op). Transcript is used then discarded. */
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  // Entitlement gate: only a paid entitlement (created by the webhook) for THIS user+session can
  // generate. No entitlement yet → the webhook hasn't landed → pending (the client retries).
  const entitlement = await getWellnessProfile(supabase, user.id, parsed.data.sessionId);
  if (!entitlement) return NextResponse.json({ status: 'pending' });
  if (entitlement.status === 'ready') return NextResponse.json({ status: 'ready' });

  // status 'paid', no report yet → generate (Sonnet → output filter), encrypt, store, discard transcript.
  const admin = getSupabaseAdmin();
  let report: string | null = null;
  try {
    report = await generateProfileReport({
      messages: parsed.data.messages as LlmMessage[],
      log: makeComplianceSink(admin, user.id),
    });
  } catch {
    report = null;
  }
  if (!report) return NextResponse.json({ status: 'pending' }); // filter-drop/failure → retryable

  await saveReport(admin, entitlement.id, encryptField(report));
  return NextResponse.json({ status: 'ready' });
}
```

- [ ] **Step 4: Run it — confirm PASS** (`npx vitest run test/api/profile-generate.test.ts`). `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 5: Commit**

```bash
git add app/api/profile/generate/route.ts test/api/profile-generate.test.ts
git commit -m "phase-1: POST /api/profile/generate — entitlement-gated report (encrypt + discard transcript)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: `ProfileView` + `/profile` page

**Files:**
- Create: `components/profile/ProfileView.tsx`, `app/(app)/profile/page.tsx`, `test/profile/profile-view.test.tsx`

- [ ] **Step 1: Write the failing test** `test/profile/profile-view.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileView } from '@/components/profile/ProfileView';
import type { RadarProfile } from '@/lib/scoring';

const profile: RadarProfile = {
  axes: { energy: 58, strength: 60, sleep: 41, drive: 47, focus: 44, body: 49 },
  overall: 50,
  tier: { label: 'Room to Grow', color: 'x' },
};

describe('ProfileView', () => {
  it('locked: shows the upsell and a way back to a check-in', () => {
    render(<ProfileView state="locked" />);
    expect(screen.getByText(/wellness profile/i)).toBeInTheDocument();
    expect(screen.getByText(/\$29/)).toBeInTheDocument();
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('preparing: shows a preparing message', () => {
    render(<ProfileView state="preparing" />);
    expect(screen.getByText(/preparing your profile/i)).toBeInTheDocument();
  });

  it('ready: renders the written report and the radar', () => {
    render(<ProfileView state="ready" report={'Your energy has been low this week.'} profile={profile} />);
    expect(screen.getByText(/your energy has been low/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /wellness radar/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it — confirm FAIL** (`npx vitest run test/profile/profile-view.test.tsx`).

- [ ] **Step 3: Write `components/profile/ProfileView.tsx`**

```tsx
import type { RadarProfile } from '@/lib/scoring';
import { RadarChart } from '@/components/radar/RadarChart';

type Props =
  | { state: 'locked' }
  | { state: 'preparing' }
  | { state: 'ready'; report: string; profile: RadarProfile };

/** The private Wellness Profile page body. Pure renderer of the three states; the page component
 *  loads the data and picks the state. The report is the private artifact — never the brag card. */
export function ProfileView(props: Props) {
  if (props.state === 'locked') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Your full Wellness Profile</h1>
        <p className="text-sm text-muted-foreground">
          All six axes, with a written read on what they mean together — yours for <strong>$29</strong>.
        </p>
        <a href="/home" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          Continue your check-in →
        </a>
      </main>
    );
  }

  if (props.state === 'preparing') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-semibold text-foreground">Preparing your profile…</h1>
        <p className="text-sm text-muted-foreground">Ava is writing your full read. This only takes a moment.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Your Profile</h1>
      </header>
      <div className="flex justify-center rounded-3xl border border-border bg-card p-4">
        <RadarChart profile={props.profile} />
      </div>
      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Your read</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-card-foreground">{props.report}</p>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Run it — confirm PASS** (`npx vitest run test/profile/profile-view.test.tsx`). `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 5: Write `app/(app)/profile/page.tsx`** (server component — no test; thin data-load + delegate, mirroring `app/(app)/home/page.tsx`):

```tsx
import { createClient } from '@/lib/supabase/server';
import { getWellnessProfile } from '@/lib/credits/store';
import { getLatestHealthScores } from '@/lib/health/store';
import { decryptField } from '@/lib/crypto/field';
import { AXES, tierForOverall, type AxisScores, type RadarProfile } from '@/lib/scoring';
import { ProfileView } from '@/components/profile/ProfileView';

function emptyAxes(): AxisScores {
  const axes = {} as AxisScores;
  for (const a of AXES) axes[a] = null;
  return axes;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <ProfileView state="locked" />; // proxy gates this route; guard anyway

  const entitlement = await getWellnessProfile(supabase, user.id);
  if (!entitlement) return <ProfileView state="locked" />;
  if (entitlement.status !== 'ready' || !entitlement.report) return <ProfileView state="preparing" />;

  const latest = await getLatestHealthScores(supabase, user.id);
  const profile: RadarProfile = latest
    ? { axes: latest.axes, overall: latest.overall, tier: tierForOverall(latest.overall) }
    : { axes: emptyAxes(), overall: null, tier: null };

  return <ProfileView state="ready" report={decryptField(entitlement.report)} profile={profile} />;
}
```

- [ ] **Step 6: Verify** `npx vitest run` (whole suite green; isolate any WSL2 5000ms component flake). `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 7: Commit**

```bash
git add components/profile/ProfileView.tsx app/\(app\)/profile/page.tsx test/profile/profile-view.test.tsx
git commit -m "phase-1: /profile page — private report + radar (ready/preparing/locked)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Done criteria

- `generateProfileReport`: clean report passes; blocked-then-clean regenerates + logs `profile_filtered:regenerated`; blocked-twice → null + logs `profile_filtered:dropped`.
- `POST /api/profile/generate`: 401 / 403 (incl. geo) / 400 bad body / `{status:'pending'}` when no entitlement / `{status:'ready'}` idempotent when already ready / generates+encrypts+`saveReport`+`{status:'ready'}` when paid / `{status:'pending'}` when generation drops. Transcript never stored (only the encrypted report).
- `/profile`: locked (no entitlement) shows the $29 upsell + link; preparing (paid, no report) shows the preparing message; ready decrypts + renders the radar + written read. RLS owner-only; never reachable by the share path.
- `npx vitest run`, `npx tsc --noEmit`, `npm run lint` all clean.

## Deferred to 1D-e (the client flow)
- The post-checkout **return handling**: stashing the transcript before redirecting to Stripe and posting it to `/api/profile/generate` on return to `/profile?checkout=success`, with polling until `ready`. (So `/profile`'s "preparing" state is static in this slice; 1D-e drives it.)
- The inline `DecisionCard`, `lib/chat/decision.ts` trigger, `MessageList` union extension, `createCheckout`, and `alreadyPurchased` suppression.

## Post-plan (not part of this branch)
- Security review before the PR (standing rule) — focus: entitlement gating (no report without a paid row), report stays private (encrypted, no share path), transcript discarded, output filter enforced.
