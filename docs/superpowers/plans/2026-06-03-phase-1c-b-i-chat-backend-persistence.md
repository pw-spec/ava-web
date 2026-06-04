# Phase 1C-b-i — Chat Persistence & Memory Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the 1C-a chat engine memory + score persistence: load last-3 summaries + facts into the prompt each turn, keep a per-session radar snapshot (continuity via `overlayProfile`), and return the merged profile + a `sessionId` — all backend, no UI.

**Architecture:** A `chat_sessions` table + `session_id` on `health_scores`/`session_summaries` (migration `0005`). `/api/chat` (the 1C-a route) gains: server-side memory load (user's RLS client) into the pipeline context, lazy session creation, a per-turn `upsertSessionScores`, and an `overlayProfile(baseline, turn)` merge so a returning user's prior axes stay visible. A pure `overlayProfile` does the merge; new store helpers do the DB work via the user's RLS-scoped client.

**Tech Stack:** Next.js 16 (TS strict), Supabase (RLS owner policies + a new `health_scores` UPDATE policy enabling the per-turn upsert), Zod, Vitest. No new npm deps.

**Spec:** `docs/superpowers/specs/2026-06-03-phase-1c-b-chat-ui-design.md`

**Conventions:** Branch `phase-1c-b/chat-ui` (already created off `main`). `phase-1:` commits, one concern each, `Co-Authored-By` trailer. TS strict; no `any` without `// reason:`. Migration via the authed Supabase MCP (project `kwmitrnypadzuqueefxi`). Health-store reads/writes go through the **user's RLS-scoped server client** (owner policies); the admin client stays only for the daily-cap RPC + compliance sink.

**Scope of this plan (i):** migration `0005`, `overlayProfile`, store helpers, prompt-memory threading, `/api/chat` changes. **Deferred:** the chat UI (1C-b-ii) and `/api/session/end` + Sonnet summarizer (1C-b-iii).

---

## File Structure

**Created:**
- `supabase/migrations/0005_chat_sessions.sql` — `chat_sessions` + `session_id` columns + the new `health_scores` UPDATE policy
- `lib/chat/overlay.ts` — pure `overlayProfile`
- `test/chat/overlay.test.ts`

**Modified:**
- `lib/health/store.ts` — add `createChatSession`, `upsertSessionScores`, `getBaselineScores`
- `test/health/store.test.ts` — tests for the three new helpers
- `lib/chat/turn.ts` — thread `recentSummaries` into the pipeline
- `lib/safeguards/runtime.ts` — pass `recentSummaries` into `runChatPipeline` context
- `test/chat/turn.test.ts` — assert `recentSummaries` forwarded
- `app/api/chat/route.ts` — `sessionId` in body; memory load; session ensure; overlay + upsert; return `sessionId`
- `test/chat/route.test.ts` — new mocks + assertions

---

## Task 1: Migration `0005_chat_sessions`

**Files:**
- Create: `supabase/migrations/0005_chat_sessions.sql`

- [ ] **Step 1: Write `supabase/migrations/0005_chat_sessions.sql`**

```sql
-- One row per chat check-in. Owner-managed via the user's RLS-scoped client.
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'ended')),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
alter table public.chat_sessions enable row level security;
create policy "chat_sessions_select_own" on public.chat_sessions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "chat_sessions_insert_own" on public.chat_sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "chat_sessions_update_own" on public.chat_sessions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Link the existing health tables to a session.
alter table public.health_scores
  add column if not exists session_id uuid references public.chat_sessions (id) on delete cascade;
-- One score snapshot per session (enables the per-turn upsert on conflict (session_id)).
create unique index if not exists health_scores_session_id_key on public.health_scores (session_id);
-- health_scores previously had only select+insert; the per-turn upsert needs an owner UPDATE policy.
create policy "health_scores_update_own" on public.health_scores
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table public.session_summaries
  add column if not exists session_id uuid references public.chat_sessions (id) on delete cascade;
```

- [ ] **Step 2: Apply via the Supabase MCP**

Use MCP `apply_migration` (name `0005_chat_sessions`, project `kwmitrnypadzuqueefxi`) with the SQL above.
Expected: `{"success": true}`.

- [ ] **Step 3: Verify schema + RLS via MCP `execute_sql`**

```sql
select
  (select relrowsecurity from pg_class where relname='chat_sessions' and relnamespace='public'::regnamespace) as cs_rls,
  (select count(*) from pg_policies where schemaname='public' and tablename='chat_sessions') as cs_policies,
  (select count(*) from pg_policies where schemaname='public' and tablename='health_scores') as hs_policies,
  (select 1 from pg_indexes where indexname='health_scores_session_id_key') as hs_unique,
  (select count(*) from information_schema.columns where table_name='health_scores' and column_name='session_id') as hs_session_col,
  (select count(*) from information_schema.columns where table_name='session_summaries' and column_name='session_id') as ss_session_col;
```
Expected: `cs_rls=true`, `cs_policies=3`, `hs_policies=3` (select+insert+update), `hs_unique=1`, both `*_session_col=1`.

- [ ] **Step 4: Advisors**

MCP `get_advisors` (security): expect no NEW warnings (the only pre-existing items are the intended
`rls_enabled_no_policy` INFO on `compliance_log`/`waitlist` and the leaked-password WARN). `chat_sessions`
has policies, so no new INFO for it.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0005_chat_sessions.sql
git commit -m "phase-1: 0005 chat_sessions + session_id links + health_scores update policy

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `overlayProfile` (pure)

**Files:**
- Create: `lib/chat/overlay.ts`, `test/chat/overlay.test.ts`

- [ ] **Step 1: Write the failing test** `test/chat/overlay.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { overlayProfile } from '@/lib/chat/overlay';
import type { AxisScores, RadarProfile } from '@/lib/scoring';

function prof(axes: Partial<AxisScores>): RadarProfile {
  const full = { energy: null, strength: null, sleep: null, drive: null, focus: null, body: null, ...axes } as AxisScores;
  return { axes: full, overall: null, tier: null };
}

describe('overlayProfile', () => {
  it('returns the session axes when there is no baseline', () => {
    const res = overlayProfile(null, prof({ energy: 80, sleep: 40 }));
    expect(res.axes.energy).toBe(80);
    expect(res.axes.sleep).toBe(40);
    expect(res.axes.drive).toBeNull();
    expect(res.overall).toBe(60); // mean of 80,40
    expect(res.tier?.label).toBe('Room to Grow');
  });

  it('falls back to baseline for axes untouched this session', () => {
    const baseline = { axes: { energy: 50, strength: 50, sleep: 50, drive: 50, focus: 50, body: 50 } as AxisScores };
    const res = overlayProfile(baseline, prof({ energy: 90 }));
    expect(res.axes.energy).toBe(90); // session wins
    expect(res.axes.sleep).toBe(50); // baseline retained
  });

  it('keeps a session score of 0 (does not treat 0 as missing)', () => {
    const baseline = { axes: { energy: 50, strength: 50, sleep: 50, drive: 50, focus: 50, body: 50 } as AxisScores };
    const res = overlayProfile(baseline, prof({ energy: 0 }));
    expect(res.axes.energy).toBe(0);
  });

  it('is all-?? when both are empty', () => {
    const res = overlayProfile(null, prof({}));
    expect(res.overall).toBeNull();
    expect(res.tier).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run test/chat/overlay.test.ts`
Expected: FAIL — cannot resolve `@/lib/chat/overlay`.

- [ ] **Step 3: Write `lib/chat/overlay.ts`**

```ts
import {
  AXES,
  computeOverall,
  tierForOverall,
  type AxisScores,
  type RadarProfile,
} from '@/lib/scoring';

/**
 * Merge this session's computed axes over a prior baseline so a returning user keeps
 * continuity: session score if scored this session, else the baseline score, else null (??).
 * Overall + tier are recomputed from the overlaid axes (never carried over). Pure.
 */
export function overlayProfile(
  baseline: { axes: AxisScores } | null,
  session: RadarProfile,
): RadarProfile {
  const axes = {} as AxisScores;
  for (const axis of AXES) {
    axes[axis] = session.axes[axis] ?? baseline?.axes[axis] ?? null;
  }
  const overall = computeOverall(axes);
  return { axes, overall, tier: tierForOverall(overall) };
}
```

- [ ] **Step 4: Run it — confirm PASS**

Run: `npx vitest run test/chat/overlay.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/chat/overlay.ts test/chat/overlay.test.ts
git commit -m "phase-1: overlayProfile (radar continuity across sessions)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Store helpers — `createChatSession`, `upsertSessionScores`, `getBaselineScores`

**Files:**
- Modify: `lib/health/store.ts`
- Test: `test/health/store.test.ts`

The existing test file already has `captureClient('insert'|'upsert')`, `singleRowClient`, and an
`AXES` fixture. Reuse them; extend the capture helpers where noted.

- [ ] **Step 1: Write the failing tests** — append to `test/health/store.test.ts`:

```ts
import { createChatSession, upsertSessionScores, getBaselineScores } from '@/lib/health/store';

describe('createChatSession', () => {
  it('inserts a row and returns the new id', async () => {
    const chain: Record<string, unknown> = {};
    chain.insert = () => chain;
    chain.select = () => chain;
    chain.single = () => Promise.resolve({ data: { id: 'sess-1' }, error: null });
    const client = { from: () => chain } as never;
    expect(await createChatSession(client, 'u1')).toBe('sess-1');
  });
});

describe('upsertSessionScores', () => {
  it('upserts an encrypted snapshot keyed by session_id', async () => {
    const captured: { row?: Record<string, unknown>; opts?: unknown } = {};
    const client = {
      from: () => ({
        upsert: (row: Record<string, unknown>, opts: unknown) => {
          captured.row = row;
          captured.opts = opts;
          return Promise.resolve({ error: null });
        },
      }),
    } as never;
    await upsertSessionScores(client, 'u1', 'sess-1', { axes: AXES, overall: 47 });
    expect(captured.row!.session_id).toBe('sess-1');
    expect(captured.row!.user_id).toBe('u1');
    expect(captured.row!.overall).toBe(47);
    expect(decryptField(captured.row!.energy as string)).toBe('40');
    expect(captured.opts).toEqual({ onConflict: 'session_id' });
  });

  it('throws on a DB error', async () => {
    const client = {
      from: () => ({ upsert: () => Promise.resolve({ error: { code: '23505' } }) }),
    } as never;
    await expect(
      upsertSessionScores(client, 'u1', 'sess-1', { axes: AXES, overall: 47 }),
    ).rejects.toThrow(/health_scores/);
  });
});

describe('getBaselineScores', () => {
  /** select→eq→neq→order→limit→maybeSingle chain resolving to `row`. */
  function baselineClient(row: Record<string, unknown> | null) {
    const result = Promise.resolve({ data: row, error: null });
    const chain: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'neq', 'order', 'limit']) chain[m] = () => chain;
    chain.maybeSingle = () => result;
    return { from: () => chain } as never;
  }

  it('decrypts the latest non-active snapshot', async () => {
    const stored: Record<string, unknown> = { overall: 47 };
    for (const [k, v] of Object.entries(AXES)) stored[k] = encryptField(String(v));
    const res = await getBaselineScores(baselineClient(stored), 'u1', 'active-sess');
    expect(res).toEqual({ axes: AXES, overall: 47 });
  });

  it('returns null when there is no prior snapshot', async () => {
    expect(await getBaselineScores(baselineClient(null), 'u1', 'active-sess')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npx vitest run test/health/store.test.ts`
Expected: FAIL — the three functions are not exported.

- [ ] **Step 3: Add the helpers to `lib/health/store.ts`**

Add a shared decode helper + the three functions (place after `getLatestHealthScores`):

```ts
function decodeScores(row: Record<string, unknown>): { axes: AxisScores; overall: number | null } {
  const axes = {} as AxisScores;
  for (const axis of AXES) {
    const v = row[axis];
    axes[axis] = v == null ? null : Number(decryptField(v as string));
  }
  return { axes, overall: (row.overall as number | null) ?? null };
}

/** Create a new active chat session, returning its id. */
export async function createChatSession(client: SupabaseClient, userId: string): Promise<string> {
  const { data, error } = await client
    .from('chat_sessions')
    .insert({ user_id: userId })
    .select('id')
    .single();
  ensureOk('chat_sessions', error);
  return (data as { id: string }).id;
}

/** Upsert the per-axis snapshot for one session (one row per session via the unique index). */
export async function upsertSessionScores(
  client: SupabaseClient,
  userId: string,
  sessionId: string,
  scores: { axes: AxisScores; overall: number | null },
): Promise<void> {
  const row: Record<string, string | number | null> = {
    user_id: userId,
    session_id: sessionId,
    overall: scores.overall,
  };
  for (const axis of AXES) {
    const v = scores.axes[axis];
    row[axis] = v === null ? null : encryptField(String(v));
  }
  const { error } = await client.from('health_scores').upsert(row, { onConflict: 'session_id' });
  ensureOk('health_scores', error);
}

/** Latest finalized-or-prior snapshot, excluding the active session's in-progress row. */
export async function getBaselineScores(
  client: SupabaseClient,
  userId: string,
  excludeSessionId: string,
): Promise<{ axes: AxisScores; overall: number | null } | null> {
  const { data, error } = await client
    .from('health_scores')
    .select('*')
    .eq('user_id', userId)
    .neq('session_id', excludeSessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  ensureOk('health_scores', error);
  if (!data) return null;
  return decodeScores(data as Record<string, unknown>);
}
```

> Note: `.neq('session_id', excludeSessionId)` also filters out rows with a NULL `session_id`. That is
> fine here — no `health_scores` rows exist before 1C-b (nothing wrote them in 1B-ii), so there are no
> legacy NULL rows to preserve.

- [ ] **Step 4: Run — confirm PASS**

Run: `npx vitest run test/health/store.test.ts`
Expected: PASS (existing + new).

Run: `npx tsc --noEmit` → clean. `npm run lint` → clean.

- [ ] **Step 5: Commit**

```bash
git add lib/health/store.ts test/health/store.test.ts
git commit -m "phase-1: session-scoped health store helpers (create/upsert/baseline)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Thread `recentSummaries` through the turn

**Files:**
- Modify: `lib/chat/turn.ts`, `lib/safeguards/runtime.ts`
- Test: `test/chat/turn.test.ts`

The pipeline already accepts `context.recentSummaries` (spliced by `buildConstitutionMessages`); we only
need to carry it from the route → `runChatTurn` → `runSafeguardedTurn` → `runChatPipeline`.

- [ ] **Step 1: Add the failing assertion** — append to `test/chat/turn.test.ts` (inside the existing
`describe('runChatTurn', …)`):

```ts
  it('forwards recentSummaries to the safeguarded turn', async () => {
    runSafeguardedTurn.mockResolvedValue({ kind: 'reply', text: 'ok', structured: undefined, flags: [] });
    await runChatTurn({
      history: [],
      userMessage: 'hi',
      signals: {},
      recentSummaries: ['Known facts: age band 30-39.', 'last time: light sleep'],
    });
    expect(runSafeguardedTurn).toHaveBeenCalledWith(
      expect.objectContaining({ recentSummaries: ['Known facts: age band 30-39.', 'last time: light sleep'] }),
    );
  });
```

- [ ] **Step 2: Run to confirm failure**

Run: `npx vitest run test/chat/turn.test.ts`
Expected: FAIL — `recentSummaries` is not in the call (and not on the input type).

- [ ] **Step 3: Add `recentSummaries` to `lib/chat/turn.ts`**

Extend the `runChatTurn` input and the `runSafeguardedTurn` call:

```ts
export async function runChatTurn(input: {
  history: LlmMessage[];
  userMessage: string;
  signals: Signals;
  recentSummaries?: string[];
  log?: ComplianceSink;
}): Promise<ChatTurnResult> {
  const result = await runSafeguardedTurn({
    history: input.history,
    userMessage: input.userMessage,
    recentSummaries: input.recentSummaries,
    log: input.log,
  });
```

(Leave the rest of `runChatTurn` unchanged.)

- [ ] **Step 4: Add `recentSummaries` to `lib/safeguards/runtime.ts`**

```ts
export async function runSafeguardedTurn(input: {
  history: LlmMessage[];
  userMessage: string;
  recentSummaries?: string[];
  log?: ComplianceSink;
}): Promise<PipelineResult> {
  return runChatPipeline({
    userMessage: input.userMessage,
    context: { history: input.history, recentSummaries: input.recentSummaries },
    llm: createHaikuCaller(),
    log: input.log,
  });
}
```

- [ ] **Step 5: Run — confirm PASS + typecheck**

Run: `npx vitest run test/chat/turn.test.ts` → PASS.
Run: `npx tsc --noEmit` → clean (`ConversationContext.recentSummaries` already exists).

- [ ] **Step 6: Commit**

```bash
git add lib/chat/turn.ts lib/safeguards/runtime.ts test/chat/turn.test.ts
git commit -m "phase-1: carry recentSummaries from the turn into the pipeline context

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: `/api/chat` — memory load, session, overlay, persist

**Files:**
- Modify: `app/api/chat/route.ts`
- Test: `test/chat/route.test.ts`

- [ ] **Step 1: Extend the route test** `test/chat/route.test.ts`.

Add the store + overlay to the `vi.hoisted` mocks and the `vi.mock` calls (overlay stays real). At the
top, extend the hoisted block and add a `vi.mock` for the store:

```ts
const { getUser, maybeSingle, rpc, runChatTurn, store } = vi.hoisted(() => ({
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  rpc: vi.fn(),
  runChatTurn: vi.fn(),
  store: {
    getRecentSummaries: vi.fn(),
    getUserFacts: vi.fn(),
    createChatSession: vi.fn(),
    getBaselineScores: vi.fn(),
    upsertSessionScores: vi.fn(),
  },
}));

vi.mock('@/lib/health/store', () => store);
```

In `beforeEach`, add default store resolutions:

```ts
    store.getRecentSummaries.mockReset().mockResolvedValue([]);
    store.getUserFacts.mockReset().mockResolvedValue(null);
    store.createChatSession.mockReset().mockResolvedValue('new-sess');
    store.getBaselineScores.mockReset().mockResolvedValue(null);
    store.upsertSessionScores.mockReset().mockResolvedValue(undefined);
    runChatTurn.mockResolvedValue({
      kind: 'reply',
      reply: 'hey',
      signals: { energy: [4] },
      profile: { axes: { energy: 100, strength: null, sleep: null, drive: null, focus: null, body: null }, overall: 100, tier: { label: 'Optimized', color: 'x' } },
    });
```

Add these cases (keep the existing 401/403/400/cap/happy/crisis tests):

```ts
  it('creates a session, persists the snapshot, and returns sessionId on a reply', async () => {
    const res = await POST(req(goodBody));
    const body = await res.json();
    expect(body.kind).toBe('reply');
    expect(body.sessionId).toBe('new-sess');
    expect(store.createChatSession).toHaveBeenCalledWith(expect.anything(), 'u1');
    expect(store.upsertSessionScores).toHaveBeenCalledWith(expect.anything(), 'u1', 'new-sess', expect.objectContaining({ overall: 100 }));
  });

  it('reuses a provided sessionId (no new session created)', async () => {
    const res = await POST(req({ ...goodBody, sessionId: 'abc' }));
    expect((await res.json()).sessionId).toBe('abc');
    expect(store.createChatSession).not.toHaveBeenCalled();
    expect(store.upsertSessionScores).toHaveBeenCalledWith(expect.anything(), 'u1', 'abc', expect.anything());
  });

  it('loads memory into the turn (summaries + facts as recentSummaries)', async () => {
    store.getRecentSummaries.mockResolvedValue([{ summary: 'light sleep last week', sessionType: 'text', createdAt: 't' }]);
    store.getUserFacts.mockResolvedValue({ ageBand: '30-39', lifestyle: null, wearable: 'oura' });
    await POST(req(goodBody));
    const arg = runChatTurn.mock.calls[0][0];
    expect(arg.recentSummaries).toContain('light sleep last week');
    expect(arg.recentSummaries.some((l: string) => l.includes('30-39'))).toBe(true);
  });

  it('does not persist a score on a non-reply (redirect)', async () => {
    runChatTurn.mockResolvedValue({ kind: 'redirect', text: 'see a provider' });
    const res = await POST(req({ ...goodBody, sessionId: 'abc' }));
    const body = await res.json();
    expect(body.kind).toBe('redirect');
    expect(body.sessionId).toBe('abc');
    expect(store.upsertSessionScores).not.toHaveBeenCalled();
  });

  it('still returns the reply when the score upsert fails', async () => {
    store.upsertSessionScores.mockRejectedValue(new Error('db down'));
    const res = await POST(req(goodBody));
    expect((await res.json()).kind).toBe('reply');
  });
```

- [ ] **Step 2: Run to confirm failure**

Run: `npx vitest run test/chat/route.test.ts`
Expected: FAIL — `sessionId` not returned, store not called.

- [ ] **Step 3: Edit `app/api/chat/route.ts`**

Add imports (top, with the others):

```ts
import {
  getRecentSummaries,
  getUserFacts,
  createChatSession,
  getBaselineScores,
  upsertSessionScores,
} from '@/lib/health/store';
import { overlayProfile } from '@/lib/chat/overlay';
```

Add `sessionId` to `bodySchema`:

```ts
const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(4000) }))
    .min(1),
  signals: signalsSchema,
  sessionId: z.string().uuid().optional(),
});
```

Replace the tail of `POST` (from the `runChatTurn` call to the end) with:

```ts
  // Memory load (user's RLS-scoped client; never round-trips through the client).
  const [summaries, facts] = await Promise.all([
    getRecentSummaries(supabase, user.id),
    getUserFacts(supabase, user.id),
  ]);
  const recentSummaries: string[] = [];
  if (facts) {
    const parts: string[] = [];
    if (facts.ageBand) parts.push(`age band ${facts.ageBand}`);
    if (facts.wearable) parts.push(`wears a ${facts.wearable}`);
    if (parts.length) recentSummaries.push(`Known facts: ${parts.join(', ')}.`);
  }
  // Oldest→newest reads naturally as "recent context".
  for (const s of [...summaries].reverse()) recentSummaries.push(s.summary);

  const result = await runChatTurn({
    history: messages.slice(0, -1),
    userMessage: last.content,
    // reason: zod infers number[]; the schema runtime-validates each to an int 0–4 (a Severity).
    signals: parsed.data.signals as Signals,
    recentSummaries,
    log: makeComplianceSink(admin, user.id),
  });

  if (result.kind !== 'reply') {
    return NextResponse.json({ ...result, sessionId: parsed.data.sessionId ?? null });
  }

  // Persist a per-session snapshot, overlaid on the user's prior baseline (continuity).
  const sessionId = parsed.data.sessionId ?? (await createChatSession(supabase, user.id));
  const baseline = await getBaselineScores(supabase, user.id, sessionId);
  const profile = overlayProfile(baseline, result.profile);
  try {
    await upsertSessionScores(supabase, user.id, sessionId, profile);
  } catch {
    // A score-save glitch must never break the conversation; the reply still returns.
  }
  return NextResponse.json({ ...result, profile, sessionId });
```

> **Security note (for the reviewer):** a forged/other-user `sessionId` is contained by RLS + the
> `try/catch`. The health writes run under the user's RLS-scoped client, so `upsertSessionScores` can
> only insert a row with `user_id = self`; a `session_id` that is another user's hits the
> `unique(session_id)` index → an RLS-blocked UPDATE of a row they don't own → the `try/catch` swallows
> it and the reply still returns (no persistence, no cross-user read/write). `getBaselineScores` uses
> `.neq(session_id, …)` and `.eq(user_id, self)`, so it only ever returns the caller's own data.

- [ ] **Step 4: Run the route test — confirm PASS**

Run: `npx vitest run test/chat/route.test.ts`
Expected: PASS (all prior + new cases).

- [ ] **Step 5: Typecheck + lint**

Run: `npx tsc --noEmit` → clean.
Run: `npm run lint` → clean. (The route imports `@/lib/health/store`, which is `server-only`; that is
fine in a route handler — `lib/compliance/log` is already imported the same way.)

- [ ] **Step 6: Commit**

```bash
git add app/api/chat/route.ts test/chat/route.test.ts
git commit -m "phase-1: /api/chat loads memory + persists per-session radar snapshot

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Full verification

- [ ] **Step 1: Full suite, typecheck, lint, build**

Run: `npx vitest run` → all suites PASS.
Run: `npx tsc --noEmit` → clean.
Run: `npm run lint` → clean.
Run: `npm run build` → succeeds; `ƒ /api/chat` present.

- [ ] **Step 2 (gated on key): live smoke**

With `ANTHROPIC_API_KEY` + the encryption/salt secrets in `.env.local`, `npm run dev`, then as a
signed-in/disclosure-accepted user POST two turns to `/api/chat` (carry the returned `sessionId` into the
second). Expected: first reply returns a `sessionId`; via the Supabase MCP, one `health_scores` row for
that session with the expected `overall`; the second turn updates the same row (still one row).

---

## Done criteria (Slice 1C-b-i)

- [ ] `0005_chat_sessions` live; `chat_sessions` RLS owner (3 policies); `health_scores` gains `session_id`
      (unique) + an owner UPDATE policy; `session_summaries` gains `session_id`; advisors clean.
- [ ] `overlayProfile` pure + unit-tested (session/baseline/mixed/empty; 0 preserved).
- [ ] Store: `createChatSession`, `upsertSessionScores` (session-keyed upsert), `getBaselineScores` (excludes
      active session) — all via the user's RLS client, unit-tested.
- [ ] `/api/chat` loads memory into the prompt, lazily creates a session, persists the overlaid snapshot
      each turn, returns `sessionId`; score-save failure never breaks the reply; 1C-a gate/cap/safeguard
      behavior intact.
- [ ] `npm run test` / `lint` / `build` green.

## Deferred

Chat UI + `/home` wiring (1C-b-ii); `/api/session/end` + Sonnet summarizer + summary memory (1C-b-iii).
