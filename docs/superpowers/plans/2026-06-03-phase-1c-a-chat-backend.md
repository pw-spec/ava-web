# Phase 1C-a — Chat Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Plug a real Claude Haiku model into the safeguard pipeline (extracting signals via tool-use, scoring deterministically) behind an authed, gated, daily-capped `/api/chat` endpoint.

**Architecture:** A real Haiku caller (`/lib/llm/haiku.ts`, tool-use `record_signals`) is wired into `runChatPipeline` only by `/lib/safeguards/runtime.ts`. The pipeline's Layer-4 now validates **signals** (not scores) and carries conversation history. `/lib/chat` merges per-turn signals and computes the radar with `/lib/scoring`. `/api/chat` re-runs the full gate, enforces a daily free cap (`chat_usage` + a hardened RPC), and routes every model call through the pipeline + the real compliance sink.

**Tech Stack:** Next.js 16 (TS strict), `@anthropic-ai/sdk` 0.100.x (Claude **Haiku** `claude-haiku-4-5-20251001`), Supabase (RLS + a SECURITY DEFINER RPC), Zod, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-03-phase-1c-a-chat-backend-design.md`

**Conventions:** Branch `phase-1c-a/chat-backend` off `main`. `phase-1:` commits, one concern each, `Co-Authored-By` trailer. TS strict; no `any` without `// reason:`. Migration via the authed Supabase MCP (project `kwmitrnypadzuqueefxi`). When writing the Anthropic call (Task 4), consult the **`claude-api` skill** for current tool-use + prompt-caching specifics.

**Note on module placement:** the spec put `SignalsTurnSchema` in `/lib/chat`; to avoid a `safeguards → chat` dependency (the pipeline's Layer-4 must validate it), the **schema + `validateSignals` live in `lib/safeguards/response-validator.ts`** (next to `ScoredSchema`), and `/lib/chat/signals.ts` holds only `mergeSignals`. Same behavior, cleaner dependency direction.

---

## File Structure

**Created:**
- `lib/llm/haiku.ts` — real Haiku caller (tool-use), `server-only`
- `lib/safeguards/runtime.ts` — wires the Haiku caller into `runChatPipeline`
- `lib/chat/signals.ts` — `mergeSignals`
- `lib/chat/turn.ts` — `runChatTurn` (pipeline → merge → computeProfile)
- `app/api/chat/route.ts` — gated, capped, stateless turn
- `supabase/migrations/0004_chat_usage.sql`
- tests under `test/`

**Modified:**
- `lib/safeguards/response-validator.ts` — add `SignalsTurnSchema` + `validateSignals`
- `lib/safeguards/types.ts` — add `history?: LlmMessage[]` to `ConversationContext`; add `SignalsTurn` type
- `lib/safeguards/constitution.ts` — splice `history` into the messages
- `lib/safeguards/pipeline.ts` — Layer-4 validates signals
- `test/safeguards/pipeline.test.ts`, `test/safeguards/constitution.test.ts`, `test/safeguards/response-validator.test.ts` — updated
- `.env.example` — `ANTHROPIC_API_KEY`, `FREE_DAILY_MESSAGE_CAP`

---

## Task 1: Pipeline refinements — signals validation + conversation history

**Files:**
- Modify: `lib/safeguards/types.ts`, `lib/safeguards/response-validator.ts`, `lib/safeguards/constitution.ts`, `lib/safeguards/pipeline.ts`
- Test: `test/safeguards/response-validator.test.ts`, `test/safeguards/constitution.test.ts`, `test/safeguards/pipeline.test.ts`

- [ ] **Step 1: Add the `SignalsTurn` type + `history` to `lib/safeguards/types.ts`**

Add to the file (it already re-exports `LlmMessage` and defines `ConversationContext`):

```ts
import type { Axis } from '@/lib/scoring';

export interface SignalsTurn {
  axis: Axis;
  severities: number[];
}
```

And extend `ConversationContext`:

```ts
export interface ConversationContext {
  recentSummaries?: string[];
  history?: LlmMessage[];
}
```

- [ ] **Step 2: Write the failing validator test** — add to `test/safeguards/response-validator.test.ts`:

```ts
import { validateSignals } from '@/lib/safeguards/response-validator';

describe('validateSignals', () => {
  it('accepts a valid per-turn extraction', () => {
    expect(validateSignals({ axis: 'energy', severities: [2, 3] }).valid).toBe(true);
  });

  it.each<[string, unknown]>([
    ['unknown axis', { axis: 'mood', severities: [2] }],
    ['severity out of range', { axis: 'energy', severities: [9] }],
    ['empty severities', { axis: 'energy', severities: [] }],
    ['extra field', { axis: 'energy', severities: [2], note: 'x' }],
    ['not an object', 'nope'],
  ])('rejects %s', (_label, input) => {
    expect(validateSignals(input).valid).toBe(false);
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npx vitest run test/safeguards/response-validator.test.ts`
Expected: FAIL — `validateSignals` not exported.

- [ ] **Step 4: Add `SignalsTurnSchema` + `validateSignals` to `lib/safeguards/response-validator.ts`**

First add the import at the **top** of the file (next to `import { z } from 'zod';` — ESLint `import/first` requires imports before other statements):

```ts
import { AXES } from '@/lib/scoring';
```

Then append the schema + validator to the file (keep the existing `ScoredSchema`/`validateScored`):

```ts
const severity = z.number().int().min(0).max(4);

export const SignalsTurnSchema = z
  .object({
    axis: z.enum(AXES),
    severities: z.array(severity).min(1),
  })
  .strict();

export function validateSignals(input: unknown): ValidationResult {
  const result = SignalsTurnSchema.safeParse(input);
  if (result.success) return { valid: true, errors: [] };
  return {
    valid: false,
    errors: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
  };
}
```

(If `z.enum(AXES)` complains about the readonly tuple, use `z.enum(AXES as unknown as [string, ...string[]])`.)

- [ ] **Step 5: Run the validator test — confirm PASS**

Run: `npx vitest run test/safeguards/response-validator.test.ts`
Expected: PASS (the new `validateSignals` block plus the existing `validateScored` block).

- [ ] **Step 6: Splice `history` into `lib/safeguards/constitution.ts`**

In `buildConstitutionMessages`, after the `recentSummaries` block and before the final user push, add:

```ts
  if (context?.history?.length) {
    messages.push(...context.history);
  }
```

- [ ] **Step 7: Update the constitution test** — add to `test/safeguards/constitution.test.ts`:

```ts
import type { LlmMessage } from '@/lib/safeguards/types';

it('splices conversation history before the latest user message', () => {
  const history: LlmMessage[] = [
    { role: 'user', content: 'hi' },
    { role: 'assistant', content: 'hey, how is your energy?' },
  ];
  const msgs = buildConstitutionMessages('pretty low', { history });
  expect(msgs.at(-1)).toEqual({ role: 'user', content: 'pretty low' });
  expect(msgs.some((m) => m.role === 'assistant' && m.content.includes('how is your energy'))).toBe(true);
});
```

- [ ] **Step 8: Point the pipeline's Layer-4 at `validateSignals`**

In `lib/safeguards/pipeline.ts`: change the import `import { validateScored } from './response-validator';` to `import { validateSignals } from './response-validator';`, and replace the **two** `validateScored(raw.structured)` calls with `validateSignals(raw.structured)`. Update the Layer-4 comment to say "validates the model's extracted signals".

- [ ] **Step 9: Update the pipeline test's structured cases** — in `test/safeguards/pipeline.test.ts`, change the `rejects out-of-range structured scores, regenerating once` test to use signals:

```ts
  it('rejects invalid structured signals, regenerating once', async () => {
    const bad = { text: 'ok', structured: { axis: 'energy', severities: [9] } };
    const good = { text: 'ok', structured: { axis: 'energy', severities: [3] } };
    const llm = vi.fn().mockResolvedValueOnce(bad).mockResolvedValueOnce(good);
    const res = await runChatPipeline({ userMessage: 'score me', llm });
    expect(res.kind).toBe('reply');
    expect(llm).toHaveBeenCalledTimes(2);
  });
```

- [ ] **Step 10: Run all safeguard tests — confirm green**

Run: `npx vitest run test/safeguards/`
Expected: PASS (emergency bypass, output filter block→redirect, regenerate-once, validator, constitution-with-history all green).

Run: `npx tsc --noEmit` → no errors. `npm run lint` → clean.

- [ ] **Step 11: Commit**

```bash
git add lib/safeguards test/safeguards
git commit -m "phase-1: pipeline validates extracted signals + carries conversation history

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `mergeSignals` (pure)

**Files:**
- Create: `lib/chat/signals.ts`, `test/chat/signals.test.ts`

- [ ] **Step 1: Write the failing test** `test/chat/signals.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { mergeSignals } from '@/lib/chat/signals';

describe('mergeSignals', () => {
  it('appends a turn to an empty accumulator', () => {
    expect(mergeSignals({}, { axis: 'energy', severities: [2, 3] })).toEqual({ energy: [2, 3] });
  });

  it('appends to an existing axis without mutating the input', () => {
    const acc = { energy: [2] };
    const next = mergeSignals(acc, { axis: 'energy', severities: [4] });
    expect(next).toEqual({ energy: [2, 4] });
    expect(acc).toEqual({ energy: [2] }); // unchanged (pure)
  });

  it('keeps other axes intact', () => {
    expect(mergeSignals({ sleep: [1] }, { axis: 'energy', severities: [3] })).toEqual({
      sleep: [1],
      energy: [3],
    });
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run test/chat/signals.test.ts`
Expected: FAIL — cannot resolve `@/lib/chat/signals`.

- [ ] **Step 3: Write `lib/chat/signals.ts`**

```ts
import type { Severity, Signals } from '@/lib/scoring';
import type { SignalsTurn } from '@/lib/safeguards/types';

/** Append a turn's severities to the accumulated signals (pure). */
export function mergeSignals(accumulated: Signals, turn: SignalsTurn): Signals {
  const existing = accumulated[turn.axis] ?? [];
  return { ...accumulated, [turn.axis]: [...existing, ...(turn.severities as Severity[])] };
}
```

- [ ] **Step 4: Run it — confirm PASS**

Run: `npx vitest run test/chat/signals.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/chat/signals.ts test/chat/signals.test.ts
git commit -m "phase-1: mergeSignals (accumulate per-turn extractions)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: `runChatTurn`

**Files:**
- Create: `lib/chat/turn.ts`, `test/chat/turn.test.ts`

`runChatTurn` calls `runSafeguardedTurn` (Task 4) and, on a `reply`, merges any extracted signals and computes the radar. The test mocks `@/lib/safeguards/runtime` so it needs no model.

- [ ] **Step 1: Write the failing test** `test/chat/turn.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';

const runSafeguardedTurn = vi.fn();
vi.mock('@/lib/safeguards/runtime', () => ({ runSafeguardedTurn }));

import { runChatTurn } from '@/lib/chat/turn';

describe('runChatTurn', () => {
  it('passes a crisis result through', async () => {
    runSafeguardedTurn.mockResolvedValue({ kind: 'crisis', card: { kind: 'crisis' } });
    const res = await runChatTurn({ history: [], userMessage: 'hi', signals: {} });
    expect(res.kind).toBe('crisis');
  });

  it('merges extracted signals and computes the profile', async () => {
    runSafeguardedTurn.mockResolvedValue({
      kind: 'reply',
      text: 'Many men notice that. How is your sleep?',
      structured: { axis: 'energy', severities: [4, 4] },
      flags: [],
    });
    const res = await runChatTurn({ history: [], userMessage: 'great energy', signals: {} });
    expect(res.kind).toBe('reply');
    if (res.kind !== 'reply') return;
    expect(res.signals.energy).toEqual([4, 4]);
    expect(res.profile.axes.energy).toBe(100); // mean 4 -> 100
    expect(res.reply).toContain('sleep');
  });

  it('leaves signals unchanged when the model extracted none', async () => {
    runSafeguardedTurn.mockResolvedValue({ kind: 'reply', text: 'ok', structured: undefined, flags: [] });
    const res = await runChatTurn({ history: [], userMessage: 'hmm', signals: { sleep: [2] } });
    if (res.kind !== 'reply') throw new Error('expected reply');
    expect(res.signals).toEqual({ sleep: [2] });
  });

  it('passes redirect/error through', async () => {
    runSafeguardedTurn.mockResolvedValue({ kind: 'error', text: 'oops' });
    const res = await runChatTurn({ history: [], userMessage: 'x', signals: {} });
    expect(res.kind).toBe('error');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run test/chat/turn.test.ts`
Expected: FAIL — cannot resolve `@/lib/chat/turn`.

- [ ] **Step 3: Write `lib/chat/turn.ts`**

```ts
import { computeProfile, type RadarProfile, type Signals } from '@/lib/scoring';
import { runSafeguardedTurn } from '@/lib/safeguards/runtime';
import type { ComplianceSink, CrisisCard, LlmMessage, SignalsTurn } from '@/lib/safeguards/types';
import { mergeSignals } from './signals';

export type ChatTurnResult =
  | { kind: 'crisis'; card: CrisisCard }
  | { kind: 'reply'; reply: string; signals: Signals; profile: RadarProfile }
  | { kind: 'redirect'; text: string }
  | { kind: 'error'; text: string };

export async function runChatTurn(input: {
  history: LlmMessage[];
  userMessage: string;
  signals: Signals;
  log?: ComplianceSink;
}): Promise<ChatTurnResult> {
  const result = await runSafeguardedTurn({
    history: input.history,
    userMessage: input.userMessage,
    log: input.log,
  });

  if (result.kind === 'crisis') return { kind: 'crisis', card: result.card };
  if (result.kind === 'redirect') return { kind: 'redirect', text: result.text };
  if (result.kind === 'error') return { kind: 'error', text: result.text };

  // result.kind === 'reply'
  const signals =
    result.structured !== undefined
      ? mergeSignals(input.signals, result.structured as SignalsTurn)
      : input.signals;
  return { kind: 'reply', reply: result.text, signals, profile: computeProfile(signals) };
}
```

- [ ] **Step 4: Run it — confirm PASS**

Run: `npx vitest run test/chat/turn.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/chat/turn.ts test/chat/turn.test.ts
git commit -m "phase-1: runChatTurn (pipeline -> merge signals -> computeProfile)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Haiku caller + runtime wiring

**Files:**
- Create: `lib/llm/haiku.ts`, `lib/safeguards/runtime.ts`
- Modify: `package.json` (add `@anthropic-ai/sdk`)

No unit test (the caller hits the real API; it is live-verified in Task 7, and `runChatTurn`'s tests mock the runtime). Verify with `tsc`.

**Consult the `claude-api` skill** before writing `haiku.ts` to confirm the current tool-use block shape and prompt-caching wiring for `@anthropic-ai/sdk` 0.100.x. The code below is the intended structure.

- [ ] **Step 1: Install the SDK**

```bash
npm install @anthropic-ai/sdk@^0.100.1
```

- [ ] **Step 2: Write `lib/llm/haiku.ts`**

```ts
import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { AXES } from '@/lib/scoring';
import type { LlmCaller, LlmMessage, LlmResponse } from './types';

const MODEL = 'claude-haiku-4-5-20251001';

const RECORD_SIGNALS_TOOL = {
  name: 'record_signals',
  description:
    'Record the wellness signals the user just shared for ONE axis they discussed. ' +
    'severities are integers 0 (most symptomatic) to 4 (optimized). Call this whenever the user ' +
    'reveals how they are doing on an axis; omit it if they shared nothing scorable this turn.',
  input_schema: {
    type: 'object' as const,
    properties: {
      axis: { type: 'string' as const, enum: [...AXES] },
      severities: {
        type: 'array' as const,
        items: { type: 'integer' as const, minimum: 0, maximum: 4 },
        minItems: 1,
      },
    },
    required: ['axis', 'severities'],
  },
};

function splitMessages(messages: LlmMessage[]): {
  system: string;
  turns: { role: 'user' | 'assistant'; content: string }[];
} {
  const system = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n');
  const turns = messages
    .filter((m): m is LlmMessage & { role: 'user' | 'assistant' } => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }));
  return { system, turns };
}

export function createHaikuCaller(): LlmCaller {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  const client = new Anthropic({ apiKey });

  return async (messages: LlmMessage[]): Promise<LlmResponse> => {
    const { system, turns } = splitMessages(messages);
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      tools: [RECORD_SIGNALS_TOOL],
      messages: turns,
    });

    let text = '';
    let structured: unknown;
    for (const block of res.content) {
      if (block.type === 'text') text += block.text;
      else if (block.type === 'tool_use' && block.name === 'record_signals') structured = block.input;
    }
    return { text: text.trim(), structured };
  };
}
```

- [ ] **Step 3: Write `lib/safeguards/runtime.ts`** (the only `/lib/llm` consumer)

```ts
import 'server-only';
import { createHaikuCaller } from '@/lib/llm/haiku';
import { runChatPipeline } from './pipeline';
import type { ComplianceSink, LlmMessage, PipelineResult } from './types';

/** Production entrypoint: wires the real Haiku caller into the safeguard pipeline. */
export async function runSafeguardedTurn(input: {
  history: LlmMessage[];
  userMessage: string;
  log?: ComplianceSink;
}): Promise<PipelineResult> {
  return runChatPipeline({
    userMessage: input.userMessage,
    context: { history: input.history },
    llm: createHaikuCaller(),
    log: input.log,
  });
}
```

- [ ] **Step 4: Verify typecheck + lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run lint`
Expected: clean — in particular, the `no-restricted-imports` rule allows `@/lib/llm/haiku` here because `runtime.ts` is under `lib/safeguards/`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json lib/llm/haiku.ts lib/safeguards/runtime.ts
git commit -m "phase-1: Haiku caller (tool-use record_signals) + safeguarded runtime

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: `0004_chat_usage` migration + env slots

**Files:**
- Create: `supabase/migrations/0004_chat_usage.sql`
- Modify: `.env.example`

- [ ] **Step 1: Add env slots to `.env.example`** (under `# App config`):

```
ANTHROPIC_API_KEY=                 # Claude Haiku (chat) + Sonnet (reports)
FREE_DAILY_MESSAGE_CAP=10          # free-tier text messages per day
```

- [ ] **Step 2: Write `supabase/migrations/0004_chat_usage.sql`**

```sql
-- Per-user, per-day free chat counter. Read-own; written only via the bump function.
create table if not exists public.chat_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default (now() at time zone 'utc')::date,
  count integer not null default 0,
  primary key (user_id, day)
);
alter table public.chat_usage enable row level security;
create policy "chat_usage_select_own" on public.chat_usage
  for select to authenticated using ((select auth.uid()) = user_id);

-- Atomic increment, returns the new count for today. Service-role only.
create or replace function public.bump_chat_usage(p_user uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_count integer;
begin
  insert into public.chat_usage (user_id, day, count)
  values (p_user, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update set count = public.chat_usage.count + 1
  returning count into new_count;
  return new_count;
end;
$$;

revoke execute on function public.bump_chat_usage(uuid) from public, anon, authenticated;
```

- [ ] **Step 3: Apply via the Supabase MCP**

Use MCP `apply_migration` (name `0004_chat_usage`, project `kwmitrnypadzuqueefxi`) with the SQL above.
Expected: `{"success": true}`.

- [ ] **Step 4: Verify + advisors**

Via MCP `execute_sql`:
```sql
select relrowsecurity from pg_class where relname = 'chat_usage' and relnamespace = 'public'::regnamespace;
select proname from pg_proc where proname = 'bump_chat_usage';
```
Expected: `relrowsecurity = true`; `bump_chat_usage` present.

MCP `get_advisors` (security): expect no new WARN for `bump_chat_usage` (execute revoked, pinned
search_path); `chat_usage` has a SELECT policy so no `rls_enabled_no_policy` INFO for it.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0004_chat_usage.sql .env.example
git commit -m "phase-1: chat_usage daily counter + hardened bump RPC

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: `/api/chat` route

**Files:**
- Create: `app/api/chat/route.ts`, `test/chat/route.test.ts`

- [ ] **Step 1: Write the failing test** `test/chat/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const getUser = vi.fn();
const maybeSingle = vi.fn();
const rpc = vi.fn();
const runChatTurn = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({ getSupabaseAdmin: () => ({ rpc }) }));
vi.mock('@/lib/chat/turn', () => ({ runChatTurn }));

import { POST } from '@/app/api/chat/route';

function req(body: unknown): Request {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const goodBody = { messages: [{ role: 'user', content: 'hi' }], signals: {} };

describe('POST /api/chat', () => {
  beforeEach(() => {
    getUser.mockReset();
    maybeSingle.mockReset();
    rpc.mockReset();
    runChatTurn.mockReset();
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    maybeSingle.mockResolvedValue({ data: { state_code: 'TX', ai_disclosure_accepted_at: 't' } });
    rpc.mockResolvedValue({ data: 1, error: null });
    runChatTurn.mockResolvedValue({ kind: 'reply', reply: 'hey', signals: {}, profile: {} });
  });

  it('401 when unauthenticated', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await POST(req(goodBody))).status).toBe(401);
  });

  it('403 when the gate is not satisfied (no disclosure)', async () => {
    maybeSingle.mockResolvedValue({ data: { state_code: 'TX', ai_disclosure_accepted_at: null } });
    expect((await POST(req(goodBody))).status).toBe(403);
  });

  it('400 on a bad body', async () => {
    expect((await POST(req({ messages: 'nope' }))).status).toBe(400);
  });

  it('returns a cap response without calling the model when over the daily cap', async () => {
    rpc.mockResolvedValue({ data: 11, error: null }); // cap default 10
    const res = await POST(req(goodBody));
    expect(res.status).toBe(200);
    expect((await res.json()).kind).toBe('cap');
    expect(runChatTurn).not.toHaveBeenCalled();
  });

  it('runs the turn on the happy path', async () => {
    const res = await POST(req(goodBody));
    expect(res.status).toBe(200);
    expect((await res.json()).kind).toBe('reply');
    expect(runChatTurn).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run test/chat/route.test.ts`
Expected: FAIL — cannot resolve `@/app/api/chat/route`.

- [ ] **Step 3: Write `app/api/chat/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { gateDecision } from '@/lib/auth/gate';
import { makeComplianceSink } from '@/lib/compliance/log';
import { runChatTurn } from '@/lib/chat/turn';
import type { Signals } from '@/lib/scoring';
import type { LlmMessage } from '@/lib/safeguards/types';

const CAP = Number(process.env.FREE_DAILY_MESSAGE_CAP ?? '10');

const severities = z.array(z.number().int().min(0).max(4));

// Strict per-axis shape: rejects unknown axis keys (defense-in-depth). Zod infers
// `number[]` for the arrays; the route casts to `Signals` below (runtime-validated 0–4).
const signalsSchema = z
  .object({
    energy: severities.optional(),
    strength: severities.optional(),
    sleep: severities.optional(),
    drive: severities.optional(),
    focus: severities.optional(),
    body: severities.optional(),
  })
  .strict()
  .default({});

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(4000) }))
    .min(1),
  signals: signalsSchema,
});

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Full gate (this endpoint collects health signals).
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

  const messages = parsed.data.messages as LlmMessage[];
  const last = messages[messages.length - 1];
  if (last.role !== 'user') return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  // Free daily cap (soft funnel control; fail open on counter error).
  const admin = getSupabaseAdmin();
  const { data: count, error: bumpErr } = await admin.rpc('bump_chat_usage', { p_user: user.id });
  if (!bumpErr && typeof count === 'number' && count > CAP) {
    return NextResponse.json({
      kind: 'cap',
      text: "That's your free check-in for today — come back tomorrow to keep going.",
    });
  }

  const result = await runChatTurn({
    history: messages.slice(0, -1),
    userMessage: last.content,
    // reason: zod infers number[]; the schema runtime-validates each to an int 0–4 (a Severity).
    signals: parsed.data.signals as Signals,
    log: makeComplianceSink(admin, user.id),
  });
  return NextResponse.json(result);
}
```

- [ ] **Step 4: Run the route test — confirm PASS**

Run: `npx vitest run test/chat/route.test.ts`
Expected: PASS (401, 403, 400, cap, happy path).

- [ ] **Step 5: Commit**

```bash
git add app/api/chat/route.ts test/chat/route.test.ts
git commit -m "phase-1: /api/chat route (full gate + daily cap + safeguarded turn)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Full verification (+ live Haiku check)

- [ ] **Step 1: Full suite, lint, build**

Run: `npm run test` → PASS (all suites, incl. updated safeguard tests).
Run: `npm run lint` → clean.
Run: `npm run build` → succeeds; routes include `ƒ /api/chat`.

- [ ] **Step 2 (gated on the key): live Haiku turn**

Add `ANTHROPIC_API_KEY` (+ optionally `FREE_DAILY_MESSAGE_CAP`) to `.env.local`, plus the encryption
secrets if not already present. Start `npm run dev` (your machine — sandbox can't hold it). As a
signed-in, disclosure-accepted, non-blocked user, POST to `/api/chat`:
```bash
curl -s -X POST http://localhost:3000/api/chat -H 'content-type: application/json' \
  --cookie '<your auth cookies>' \
  -d '{"messages":[{"role":"user","content":"my energy has been low all week"}],"signals":{}}'
```
Expected: `{ kind: 'reply', reply: <warm, non-diagnostic next question>, signals: { energy: [...] }, profile: {...} }`.
Then verify safety:
- a message like "I want to end it all" → `{ kind: 'crisis', card }` and (via the Supabase MCP) a
  `emergency_detected` row in `compliance_log`; the model is not called.
- a message trying to force a diagnosis → reply is filtered/redirected, never a condition/drug name.

This is the only step needing the key; everything else is unit-proven.

---

## Done criteria (Slice 1C-a)

- [ ] Layer-4 validates signals; pipeline carries history; all safeguard tests green.
- [ ] `createHaikuCaller` (tool-use) wired only via `lib/safeguards/runtime.ts`; `runChatTurn` computes the radar from merged signals.
- [ ] `/api/chat`: 401/403 gate, daily cap via `bump_chat_usage`, zod-validated body, compliance sink wired.
- [ ] `0004_chat_usage` live; advisors clean.
- [ ] `npm run test`/`lint`/`build` green; live Haiku turn + emergency bypass verified.

## Deferred

Chat UI + live radar + memory load + session persistence (1C-b); the Gap/CTA + brag card (1C-c); avatar (1F).
