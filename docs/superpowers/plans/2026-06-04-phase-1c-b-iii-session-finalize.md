# Phase 1C-b-iii — Session Finalize + Sonnet Summarizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the memory loop — wire "End check-in" to a new `/api/session/end` that runs a **Claude Sonnet** session summarizer (output-filtered, non-diagnostic), writes the encrypted `session_summary`, and marks the chat session ended, so the *next* visit's prompt-memory (already loaded by 1C-b-i) actually has something to recall.

**Architecture:** A text-only Sonnet caller (`lib/llm/sonnet.ts`) is consumed ONLY by `lib/safeguards/summarizer.ts` (`summarizeSession`), which builds a non-diagnostic summary prompt, calls Sonnet, runs the existing Layer-3 output filter, and regenerates-once-then-drops on a block (logging `summary_filtered`). `/api/session/end` (authed + gated like `/api/chat`) summarizes → `saveSessionSummary` → `endChatSession`; a forged/foreign/already-ended session is an idempotent no-op; a summarizer failure still ends the session (never lose the check-in). `ChatScreen`'s "End check-in" now POSTs the transcript before resetting.

**Tech Stack:** Next.js 16 (TS strict), `@anthropic-ai/sdk` (Claude **Sonnet** `claude-sonnet-4-6`), Supabase (RLS owner policies; `chat_sessions`/`session_summaries` already have `session_id`/`status`/`ended_at` from `0005`), Zod, Vitest. **No new migration, no new npm deps.**

**Spec:** `docs/superpowers/specs/2026-06-03-phase-1c-b-chat-ui-design.md`

**Conventions:** Branch `phase-1c-b-iii/session-finalize` off `main`. `phase-1:` commits, one concern each, `Co-Authored-By` trailer. TS strict; no `any` without `// reason:`. The `no-restricted-imports` rule allows `@/lib/llm/*` only under `lib/safeguards/**` — so `summarizer.ts` is the sole `/lib/llm/sonnet` consumer; the route imports `summarizeSession`, never the caller.

**Builds on (existing signatures):**
- `scanOutput(text): { blocked: boolean; reason?: string; matches: string[] }` (`@/lib/safeguards/output-filter`).
- `ComplianceSink = (record: { event: ComplianceEvent; outcome: string }) => void`; `makeComplianceSink(client, userId)` (`@/lib/compliance/log`).
- `LlmCaller = (messages: LlmMessage[]) => Promise<{ text: string; structured?: unknown }>`; `LlmMessage = { role: 'system'|'user'|'assistant'; content: string }` (`@/lib/llm/types`).
- `createHaikuCaller` (`lib/llm/haiku.ts`) — the structural model to mirror for Sonnet.
- Store: `saveSessionSummary(client, userId, summary, sessionType)` (to gain `sessionId`), `userOwnsSession(client, userId, sessionId)`, `ensureOk`, `encryptField` (`lib/health/store.ts`).
- `/api/chat/route.ts` — the auth(401)/gate(403)/body(400) preamble to mirror.
- `ChatScreen.tsx` `endCheckIn()` (currently a client-only reset) + `lib/chat/client.ts` (`sendChatTurn`).

**Scope:** the Sonnet summarizer, `/api/session/end`, the store changes, and the "End check-in" wiring. **Deferred:** the Gap reveal / upgrade CTA / brag card (1C-c); trend arrows; token streaming.

---

## File Structure

**Created:**
- `lib/llm/sonnet.ts` — `createSonnetCaller()` (text-only, server-only)
- `lib/safeguards/summarizer.ts` — `summarizeSession` (sole Sonnet consumer)
- `app/api/session/end/route.ts`
- Tests: `test/safeguards/summarizer.test.ts`, `test/chat/session-end-route.test.ts`

**Modified:**
- `lib/safeguards/types.ts` — add `'summary_filtered'` to `ComplianceEvent`
- `lib/health/store.ts` — `saveSessionSummary` gains `sessionId`; add `endChatSession`, `ownsActiveSession`
- `test/health/store.test.ts` — update `saveSessionSummary` test; add `endChatSession`/`ownsActiveSession`
- `lib/chat/client.ts` — add `endSession`
- `test/chat/client.test.ts` — add `endSession` cases
- `components/chat/ChatScreen.tsx` — `endCheckIn` POSTs `/api/session/end` before resetting
- `test/chat/chat-screen.test.tsx` — mock `endSession`; assert it fires on End

---

## Task 1: `ComplianceEvent` gains `summary_filtered`

**Files:**
- Modify: `lib/safeguards/types.ts`

- [ ] **Step 1: Edit `lib/safeguards/types.ts`** — extend the union:

```ts
export type ComplianceEvent =
  | 'emergency_detected'
  | 'filter_block'
  | 'validator_reject'
  | 'llm_error'
  | 'summary_filtered';
```

- [ ] **Step 2: Verify + commit**

Run: `npx tsc --noEmit` → clean (additive union member, non-breaking). `npm run lint` → clean.

```bash
git add lib/safeguards/types.ts
git commit -m "phase-1: add summary_filtered compliance event

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Sonnet caller (`lib/llm/sonnet.ts`)

**Files:**
- Create: `lib/llm/sonnet.ts`

Text-only mirror of the Haiku caller (no tools). No unit test (it hits the real API; it is exercised via the mocked summarizer in Task 3 and verified live in Task 7). Verify with `tsc`.

- [ ] **Step 1: Write `lib/llm/sonnet.ts`**

```ts
import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import type { LlmCaller, LlmMessage, LlmResponse } from './types';

// Claude Sonnet 4.6 — the summaries/reports model (see CLAUDE.md tech stack).
const MODEL = 'claude-sonnet-4-6';

function splitMessages(messages: LlmMessage[]): {
  system: string;
  turns: Anthropic.MessageParam[];
} {
  const system = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n');
  const turns: Anthropic.MessageParam[] = messages
    .filter((m): m is LlmMessage & { role: 'user' | 'assistant' } => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }));
  return { system, turns };
}

/** Plain-text Sonnet caller (no tools). Server-only. Used only by the session summarizer. */
export function createSonnetCaller(): LlmCaller {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  const client = new Anthropic({ apiKey });

  return async (messages: LlmMessage[]): Promise<LlmResponse> => {
    const { system, turns } = splitMessages(messages);
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      system,
      messages: turns,
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    return { text: text.trim() };
  };
}
```

- [ ] **Step 2: Verify + commit**

Run: `npx tsc --noEmit` → clean. `npm run lint` → clean (`lib/llm/sonnet.ts` is allowed to be imported only from `lib/safeguards/**`, which Task 3 satisfies).

```bash
git add lib/llm/sonnet.ts
git commit -m "phase-1: Sonnet caller (text-only) for session summaries

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: `summarizeSession` (`lib/safeguards/summarizer.ts`)

**Files:**
- Create: `lib/safeguards/summarizer.ts`, `test/safeguards/summarizer.test.ts`

The only `/lib/llm/sonnet` consumer. Builds a non-diagnostic summary prompt, runs the output filter on the result, regenerates once on a block, then drops (`null`) + logs.

- [ ] **Step 1: Write the failing test** `test/safeguards/summarizer.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';

const call = vi.fn();
vi.mock('@/lib/llm/sonnet', () => ({ createSonnetCaller: () => call }));

import { summarizeSession } from '@/lib/safeguards/summarizer';
import type { LlmMessage } from '@/lib/safeguards/types';

const convo: LlmMessage[] = [
  { role: 'assistant', content: 'how is your energy?' },
  { role: 'user', content: 'low all week, sleeping badly' },
];

describe('summarizeSession', () => {
  it('returns a clean, non-diagnostic summary', async () => {
    call.mockReset().mockResolvedValue({ text: 'Energy and sleep have been low this week; open to small changes.' });
    const out = await summarizeSession({ messages: convo });
    expect(out).toMatch(/energy/i);
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('regenerates once when the first summary is blocked, then keeps the clean one', async () => {
    call
      .mockReset()
      .mockResolvedValueOnce({ text: 'He clearly has low testosterone.' })
      .mockResolvedValueOnce({ text: 'Energy and drive have felt low; worth tracking.' });
    const log = vi.fn();
    const out = await summarizeSession({ messages: convo, log });
    expect(out).toMatch(/energy/i);
    expect(call).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledWith({ event: 'summary_filtered', outcome: 'regenerated' });
  });

  it('drops the summary (null) and logs when still blocked after regeneration', async () => {
    call.mockReset().mockResolvedValue({ text: 'Diagnosis: hypogonadism; start testosterone.' });
    const log = vi.fn();
    const out = await summarizeSession({ messages: convo, log });
    expect(out).toBeNull();
    expect(call).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledWith({ event: 'summary_filtered', outcome: 'dropped' });
  });
});
```

(The output filter is the real `scanOutput`; "low testosterone" / "hypogonadism" / "testosterone" are deny-listed by the existing filter, so these drive the block paths without mocking it.)

- [ ] **Step 2: Run — confirm FAIL** (`npx vitest run test/safeguards/summarizer.test.ts`).

- [ ] **Step 3: Write `lib/safeguards/summarizer.ts`**

```ts
import 'server-only';
import { createSonnetCaller } from '@/lib/llm/sonnet';
import { scanOutput } from './output-filter';
import type { ComplianceSink, LlmMessage } from './types';

const SUMMARY_SYSTEM =
  'You write a short private memory note (2-3 sentences) summarizing a wellness check-in, so a ' +
  'companion can recall it next time. Describe only self-reported wellness indicators and durable ' +
  'context ("energy has been low", "started a stressful job", "sleeping ~6h"). Never name medical ' +
  'conditions, drugs, doses, or give any clinical assessment or diagnosis. Write in plain third person.';

const STRICTER =
  'Reminder: do NOT name conditions, drugs, or doses, and do not assess or diagnose. Reframe ' +
  'everything as neutral wellness indicators.';

/**
 * Summarize a finished check-in into an encrypted-at-rest memory note. The summary passes through
 * the same Layer-3 output filter as conversation; on a block it regenerates once, then is dropped
 * (returns null) rather than stored. The sole consumer of the Sonnet caller (import boundary).
 */
export async function summarizeSession(input: {
  messages: LlmMessage[];
  log?: ComplianceSink;
}): Promise<string | null> {
  const call = createSonnetCaller();
  const transcript = input.messages.map((m) => `${m.role}: ${m.content}`).join('\n');
  const base: LlmMessage[] = [
    { role: 'system', content: SUMMARY_SYSTEM },
    { role: 'user', content: `Conversation:\n${transcript}\n\nWrite the memory note.` },
  ];

  let res = await call(base);
  if (scanOutput(res.text).blocked) {
    res = await call([...base, { role: 'system', content: STRICTER }]);
    if (scanOutput(res.text).blocked) {
      input.log?.({ event: 'summary_filtered', outcome: 'dropped' });
      return null;
    }
    input.log?.({ event: 'summary_filtered', outcome: 'regenerated' });
  }
  const text = res.text.trim();
  return text.length > 0 ? text : null;
}
```

- [ ] **Step 4: Run — confirm PASS** (`npx vitest run test/safeguards/summarizer.test.ts`). `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 5: Commit**

```bash
git add lib/safeguards/summarizer.ts test/safeguards/summarizer.test.ts
git commit -m "phase-1: session summarizer (Sonnet + output filter, drop-on-block)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Store — `saveSessionSummary(sessionId)`, `endChatSession`, `ownsActiveSession`

**Files:**
- Modify: `lib/health/store.ts`
- Test: `test/health/store.test.ts`

- [ ] **Step 1: Update the failing tests** in `test/health/store.test.ts`.

The existing `saveSessionSummary` test calls it WITHOUT a sessionId — update that call, and add tests for the two new helpers. Find the existing block:

```ts
  it('encrypts the summary, leaves session_type plaintext', async () => {
    const { client, captured } = captureClient('insert');
    await saveSessionSummary(client, 'u1', 'slept poorly, low drive', 'text');
    expect(captured.row!.session_type).toBe('text');
    expect(decryptField(captured.row!.summary as string)).toBe('slept poorly, low drive');
  });
```
Replace its `saveSessionSummary` call line with the new signature + a `session_id` assertion:
```ts
    await saveSessionSummary(client, 'u1', 'sess-1', 'slept poorly, low drive', 'text');
    expect(captured.row!.session_type).toBe('text');
    expect(captured.row!.session_id).toBe('sess-1');
    expect(decryptField(captured.row!.summary as string)).toBe('slept poorly, low drive');
```

Add a new describe block (import the new functions at the top — extend the existing import from `@/lib/health/store`):
```ts
describe('endChatSession / ownsActiveSession', () => {
  it('endChatSession marks the session ended (scoped to owner)', async () => {
    const captured: { patch?: Record<string, unknown> } = {};
    const client = {
      from: () => ({
        update: (patch: Record<string, unknown>) => {
          captured.patch = patch;
          return { eq: () => ({ eq: () => Promise.resolve({ error: null }) }) };
        },
      }),
    } as never;
    await endChatSession(client, 'u1', 'sess-1');
    expect(captured.patch!.status).toBe('ended');
    expect(captured.patch!.ended_at).toBeTruthy();
  });

  function activeClient(row: Record<string, unknown> | null) {
    const result = Promise.resolve({ data: row, error: null });
    const chain: Record<string, unknown> = {};
    for (const m of ['select', 'eq']) chain[m] = () => chain;
    chain.maybeSingle = () => result;
    return { from: () => chain } as never;
  }

  it('ownsActiveSession is true only for an owned active session', async () => {
    expect(await ownsActiveSession(activeClient({ id: 's' }), 'u1', 's')).toBe(true);
    expect(await ownsActiveSession(activeClient(null), 'u1', 's')).toBe(false);
  });
});
```
Add `endChatSession, ownsActiveSession` to the existing `import { … } from '@/lib/health/store'`.

- [ ] **Step 2: Run — confirm FAIL** (`npx vitest run test/health/store.test.ts`).

- [ ] **Step 3: Edit `lib/health/store.ts`.**

Change `saveSessionSummary` to take `sessionId`:
```ts
export async function saveSessionSummary(
  client: SupabaseClient,
  userId: string,
  sessionId: string,
  summary: string,
  sessionType: 'text' | 'avatar',
): Promise<void> {
  const { error } = await client.from('session_summaries').insert({
    user_id: userId,
    session_id: sessionId,
    summary: encryptField(summary),
    session_type: sessionType,
  });
  ensureOk('session_summaries', error);
}
```

Add the two helpers (near `userOwnsSession`):
```ts
/** Mark a session ended (owner-scoped). Idempotent: re-ending just re-stamps ended_at. */
export async function endChatSession(
  client: SupabaseClient,
  userId: string,
  sessionId: string,
): Promise<void> {
  const { error } = await client
    .from('chat_sessions')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId);
  ensureOk('chat_sessions', error);
}

/** True only if the session exists, belongs to the user, AND is still active. */
export async function ownsActiveSession(
  client: SupabaseClient,
  userId: string,
  sessionId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from('chat_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  ensureOk('chat_sessions', error);
  return data != null;
}
```

- [ ] **Step 4: Run — confirm PASS** (`npx vitest run test/health/store.test.ts`). `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 5: Commit**

```bash
git add lib/health/store.ts test/health/store.test.ts
git commit -m "phase-1: session-summary gains sessionId; endChatSession + ownsActiveSession

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: `/api/session/end` route

**Files:**
- Create: `app/api/session/end/route.ts`, `test/chat/session-end-route.test.ts`

- [ ] **Step 1: Write the failing test** `test/chat/session-end-route.test.ts`:

```ts
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

beforeAll(() => {
  process.env.COMPLIANCE_LOG_SALT = 'test-salt';
});

const { getUser, maybeSingle, store, summarizeSession } = vi.hoisted(() => ({
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  store: {
    ownsActiveSession: vi.fn(),
    saveSessionSummary: vi.fn(),
    endChatSession: vi.fn(),
  },
  summarizeSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({ getSupabaseAdmin: () => ({}) }));
vi.mock('@/lib/health/store', () => store);
vi.mock('@/lib/safeguards/summarizer', () => ({ summarizeSession }));

import { POST } from '@/app/api/session/end/route';

function req(body: unknown): Request {
  return new Request('http://localhost/api/session/end', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const SID = '11111111-1111-4111-8111-111111111111';
const goodBody = { messages: [{ role: 'assistant', content: 'hi' }, { role: 'user', content: 'low energy' }], sessionId: SID };

describe('POST /api/session/end', () => {
  beforeEach(() => {
    getUser.mockReset().mockResolvedValue({ data: { user: { id: 'u1' } } });
    maybeSingle.mockReset().mockResolvedValue({ data: { state_code: 'TX', ai_disclosure_accepted_at: 't' } });
    store.ownsActiveSession.mockReset().mockResolvedValue(true);
    store.saveSessionSummary.mockReset().mockResolvedValue(undefined);
    store.endChatSession.mockReset().mockResolvedValue(undefined);
    summarizeSession.mockReset().mockResolvedValue('energy has been low');
  });

  it('401 when unauthenticated', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await POST(req(goodBody))).status).toBe(401);
  });

  it('403 when the gate is not satisfied', async () => {
    maybeSingle.mockResolvedValue({ data: { state_code: 'TX', ai_disclosure_accepted_at: null } });
    expect((await POST(req(goodBody))).status).toBe(403);
  });

  it('400 on a bad body', async () => {
    expect((await POST(req({ sessionId: 'not-a-uuid' }))).status).toBe(400);
  });

  it('summarizes, saves, ends, and reports summarized:true', async () => {
    const res = await POST(req(goodBody));
    const body = await res.json();
    expect(body).toEqual({ ok: true, summarized: true });
    expect(store.saveSessionSummary).toHaveBeenCalledWith(expect.anything(), 'u1', SID, 'energy has been low', 'text');
    expect(store.endChatSession).toHaveBeenCalledWith(expect.anything(), 'u1', SID);
  });

  it('no-ops for a forged/foreign/already-ended session', async () => {
    store.ownsActiveSession.mockResolvedValue(false);
    const res = await POST(req(goodBody));
    expect(await res.json()).toEqual({ ok: true, summarized: false });
    expect(summarizeSession).not.toHaveBeenCalled();
    expect(store.endChatSession).not.toHaveBeenCalled();
  });

  it('still ends the session when the summarizer fails (summarized:false)', async () => {
    summarizeSession.mockRejectedValue(new Error('no key'));
    const res = await POST(req(goodBody));
    expect(await res.json()).toEqual({ ok: true, summarized: false });
    expect(store.saveSessionSummary).not.toHaveBeenCalled();
    expect(store.endChatSession).toHaveBeenCalledWith(expect.anything(), 'u1', SID);
  });

  it('ends without a summary when the summarizer drops it (null)', async () => {
    summarizeSession.mockResolvedValue(null);
    const res = await POST(req(goodBody));
    expect(await res.json()).toEqual({ ok: true, summarized: false });
    expect(store.saveSessionSummary).not.toHaveBeenCalled();
    expect(store.endChatSession).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run — confirm FAIL** (`npx vitest run test/chat/session-end-route.test.ts`).

- [ ] **Step 3: Write `app/api/session/end/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { gateDecision } from '@/lib/auth/gate';
import { makeComplianceSink } from '@/lib/compliance/log';
import { ownsActiveSession, saveSessionSummary, endChatSession } from '@/lib/health/store';
import { summarizeSession } from '@/lib/safeguards/summarizer';
import type { LlmMessage } from '@/lib/safeguards/types';

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(4000) }))
    .min(1),
  sessionId: z.string().uuid(),
});

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Full gate (same as /api/chat — this finalizes a health-signal session).
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

  // Idempotent + safe against forged/foreign ids: only finalize an owned, still-active session.
  if (!(await ownsActiveSession(supabase, user.id, parsed.data.sessionId))) {
    return NextResponse.json({ ok: true, summarized: false });
  }

  // Summarize (Sonnet → output filter). A failure or a filter-drop must not block the end.
  const admin = getSupabaseAdmin();
  let summary: string | null = null;
  try {
    summary = await summarizeSession({
      messages: parsed.data.messages as LlmMessage[],
      log: makeComplianceSink(admin, user.id),
    });
  } catch {
    summary = null;
  }
  if (summary) {
    try {
      await saveSessionSummary(supabase, user.id, parsed.data.sessionId, summary, 'text');
    } catch {
      // a summary-write glitch must not prevent ending the session
      summary = null;
    }
  }

  await endChatSession(supabase, user.id, parsed.data.sessionId);
  return NextResponse.json({ ok: true, summarized: summary !== null });
}
```

- [ ] **Step 4: Run — confirm PASS** (`npx vitest run test/chat/session-end-route.test.ts`). `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 5: Commit**

```bash
git add app/api/session/end/route.ts test/chat/session-end-route.test.ts
git commit -m "phase-1: /api/session/end (summarize + persist + mark ended, idempotent)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Wire "End check-in" — `endSession` client + `ChatScreen`

**Files:**
- Modify: `lib/chat/client.ts`, `components/chat/ChatScreen.tsx`
- Test: `test/chat/client.test.ts`, `test/chat/chat-screen.test.tsx`

- [ ] **Step 1: Add the failing client test** — append to `test/chat/client.test.ts`:

```ts
import { endSession } from '@/lib/chat/client';

describe('endSession', () => {
  it('returns the parsed result on 200', async () => {
    stubFetch(200, { ok: true, summarized: true });
    const res = await endSession({ messages: [{ role: 'user', content: 'x' }], sessionId: 's' });
    expect(res).toEqual({ ok: true, summarized: true });
  });

  it('returns ok:false on a non-2xx or network error', async () => {
    stubFetch(500, {});
    expect((await endSession({ messages: [{ role: 'user', content: 'x' }], sessionId: 's' })).ok).toBe(false);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect((await endSession({ messages: [{ role: 'user', content: 'x' }], sessionId: 's' })).ok).toBe(false);
  });
});
```

(`stubFetch` and the `afterEach(vi.unstubAllGlobals())` already exist in this file from Task 1 of 1C-b-ii.)

- [ ] **Step 2: Run — confirm FAIL** (`npx vitest run test/chat/client.test.ts`).

- [ ] **Step 3: Add `endSession` to `lib/chat/client.ts`** (after `sendChatTurn`):

```ts
/** POST a finished check-in to /api/session/end for summarization + close-out. Never throws. */
export async function endSession(body: {
  messages: LlmMessage[];
  sessionId: string;
}): Promise<{ ok: boolean; summarized?: boolean }> {
  try {
    const res = await fetch('/api/session/end', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false };
    return (await res.json()) as { ok: boolean; summarized?: boolean };
  } catch {
    return { ok: false };
  }
}
```

- [ ] **Step 4: Run — confirm the client test PASSES** (`npx vitest run test/chat/client.test.ts`).

- [ ] **Step 5: Update the ChatScreen test** `test/chat/chat-screen.test.tsx` — add `endSession` to the mock and assert it fires on End.

Change the hoisted mock + `vi.mock` for the client to include `endSession`:
```ts
const { sendChatTurn, endSession } = vi.hoisted(() => ({ sendChatTurn: vi.fn(), endSession: vi.fn() }));
vi.mock('@/lib/chat/client', () => ({ sendChatTurn, endSession }));
```
In `beforeEach`, reset it: `endSession.mockReset().mockResolvedValue({ ok: true, summarized: true });` (add alongside `sendChatTurn.mockReset()`).

Append a test:
```ts
  it('finalizes the session via /api/session/end on End check-in', async () => {
    sendChatTurn.mockResolvedValue({ kind: 'reply', reply: 'ok', signals: {}, profile: emptyProfile, sessionId: 's1' });
    render(<ChatScreen initialProfile={emptyProfile} />);
    type('low energy');
    await waitFor(() => expect(screen.getByText('ok')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /wellness score/i })); // open the drawer
    fireEvent.click(screen.getByRole('button', { name: /end check-?in/i }));
    await waitFor(() => expect(endSession).toHaveBeenCalledTimes(1));
    const arg = endSession.mock.calls[0][0];
    expect(arg.sessionId).toBe('s1');
    expect(arg.messages.some((m: { content: string }) => m.content === 'low energy')).toBe(true);
  });
```

- [ ] **Step 6: Run — confirm FAIL** (`npx vitest run test/chat/chat-screen.test.tsx` — the new test fails; `endSession` not called yet).

- [ ] **Step 7: Wire `endCheckIn` in `components/chat/ChatScreen.tsx`.**

Add the import:
```ts
import { sendChatTurn, endSession } from '@/lib/chat/client';
```
Replace `endCheckIn` with an async version that finalizes BEFORE clearing local state (capture the transcript + id first):
```ts
  /** Finalize the check-in: fire-and-forget the summary/close-out, then reset the conversation.
   *  Scores already persisted per turn; the summary is written server-side. */
  function endCheckIn() {
    const sid = sessionId;
    const wire: LlmMessage[] = messages.map((m) => ({ role: m.role, content: m.content }));
    setDrawerOpen(false);
    setMessages([{ id: 0, role: 'assistant', content: opener }]);
    setSignals({});
    setSessionId(undefined);
    setProfile(initialProfile);
    setCapped(false);
    setCrisis(null);
    if (sid) void endSession({ messages: wire, sessionId: sid });
  }
```

- [ ] **Step 8: Run — confirm PASS** (`npx vitest run test/chat/chat-screen.test.tsx` — all, incl. the existing crisis-reset test which still works since `endSession` is mocked). `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 9: Commit**

```bash
git add lib/chat/client.ts components/chat/ChatScreen.tsx test/chat/client.test.ts test/chat/chat-screen.test.tsx
git commit -m "phase-1: End check-in finalizes the session (summary + close-out)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Full verification (+ live Sonnet check)

- [ ] **Step 1: Full suite, typecheck, lint, build**

Run: `npx vitest run` → all PASS.
Run: `npx tsc --noEmit` → clean.
Run: `npm run lint` → clean (confirm `no-restricted-imports`: only `lib/safeguards/summarizer.ts` imports `@/lib/llm/sonnet`).
Run: `npm run build` → succeeds; routes include `ƒ /api/session/end`.

- [ ] **Step 2 (manual, needs the dev server + `ANTHROPIC_API_KEY`): live loop**

On your machine, signed in as an onboarded user: have a short check-in on `/home`, then open the radar and tap **End check-in & save**. Via the Supabase MCP, confirm: a `session_summaries` row for that session (the `summary` column is encrypted `v1:…`), and `chat_sessions.status = 'ended'` with `ended_at` set. Then start a NEW check-in — Ava's opener should reference the prior overall, and a follow-up should show she has context from last time (the memory loop closed). Also verify a transcript that pushes a diagnosis gets a `summary_filtered` compliance event and no stored summary.

---

## Done criteria (Slice 1C-b-iii)

- [ ] `createSonnetCaller` (text-only, `claude-sonnet-4-6`) is consumed ONLY by `lib/safeguards/summarizer.ts`; the boundary lint passes.
- [ ] `summarizeSession` returns a non-diagnostic note, regenerates once on a filter block, drops to `null` + logs `summary_filtered` on a persistent block.
- [ ] `/api/session/end`: 401/403/400 like `/api/chat`; idempotent no-op for forged/foreign/already-ended sessions; summarizer failure or drop still ends the session; on success writes the encrypted summary + marks ended; returns `{ ok, summarized }`.
- [ ] `saveSessionSummary` carries `session_id`; `endChatSession`/`ownsActiveSession` owner-scoped via the user's RLS client.
- [ ] "End check-in" POSTs the transcript to `/api/session/end` then resets; the conversation/radar continuity is intact.
- [ ] `npm run test` / `lint` / `build` green. (No migration — `0005` already has `session_id`/`status`/`ended_at`.)

## Deferred

The Gap reveal + Decision CTA + brag card (1C-c); trend arrows; token streaming.
