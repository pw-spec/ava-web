# Phase 1C-a — Chat Backend — Design

**Date:** 2026-06-03
**Phase:** 1 (Ava MVP) — Slice 1C-a
**Status:** Approved for planning

## Context

Everything so far has been scaffolding for *this*: a real conversation with Ava. 1C-a plugs a real
Claude **Haiku** model into the Phase-0 safeguard pipeline, extracts **signals** from each turn (the
deterministic scorer — never the LLM — computes the radar), and exposes an authed, gated `/api/chat`
endpoint. This is the backend engine only — **no UI, no persistence** (those are 1C-b).

It builds on: `runChatPipeline` (safeguard orchestrator with an injected `llm` + `log`), the
`LlmCaller` interface, `/lib/scoring` (signals→radar), `makeComplianceSink` (1B-ii), and the
auth/gate (1B-i).

## Scope

**In scope**
- `/lib/llm/haiku.ts` — real Anthropic Haiku caller using **tool-use** (`record_signals`) so one call
  yields the reply **and** the extracted signals. Server-only.
- **Two Phase-0 pipeline refinements** (see below): Layer-4 validates *signals*; the pipeline carries
  conversation history.
- `/lib/chat/signals.ts` — `SignalsTurnSchema` (validate the model's per-turn extraction) +
  `mergeSignals`.
- `/lib/safeguards/runtime.ts` — wires the real Haiku caller into `runChatPipeline` (the only
  `/lib/llm` consumer).
- `/lib/chat/turn.ts` — orchestrate one turn: run the safeguarded pipeline → merge signals →
  `computeProfile`.
- `/app/api/chat/route.ts` — authed/gated POST; stateless single turn; enforces the free daily cap.
- Migration `0004_chat_usage` + the daily-cap enforcement.
- Unit tests (mocked llm) + a live verification (real Haiku key).

**Out of scope (later)**
- Chat UI + live radar, memory load (last-3 summaries + facts), session persistence (summary +
  `health_scores`) → **1C-b**.
- The Gap reveal + decision CTA + day-one brag card → **1C-c**.
- Avatar / ElevenLabs / HeyGen → Phase 1F.

## The two pipeline refinements (the architectural reconciliation)

1. **Layer-4 validates *signals*, not scores.** The Phase-0 validator checks `structured` against
   `ScoredSchema` (six 0–100 scores), but COMPLIANCE requires the LLM to emit **signals** and a pure
   function to compute scores ("the LLM never invents the number"). Add `SignalsTurnSchema` +
   `validateSignals`, and point the pipeline's Layer-4 at it. `ScoredSchema`/`validateScored` stays as
   a sanity-check on the *computed* profile (`computeProfile` output is in-range by construction, so
   this is defensive). The existing `pipeline.test.ts` cases that feed structured scores are updated
   to feed signals; the emergency-bypass / output-filter / regenerate behaviors are unchanged.
2. **The pipeline carries conversation history.** Add `history?: LlmMessage[]` to
   `ConversationContext`; `buildConstitutionMessages` splices it between the constitution and the
   latest user message, so multi-turn chat has real context. No other Layer behavior changes.

## Module: `/lib/llm/haiku.ts`

```
import 'server-only'
createHaikuCaller(): LlmCaller    // (messages) => Promise<{ text, structured? }>
```
- `@anthropic-ai/sdk`, model **`claude-haiku-4-5`**, key `ANTHROPIC_API_KEY`.
- One `messages.create` per turn with a **`record_signals` tool** whose input schema is
  `{ axis: <one of the 6>, severities: number[] (0–4) }`. The model produces the warm reply as text
  **and** calls `record_signals` for the axis the user just discussed. The caller returns
  `{ text: <reply>, structured: <tool input | undefined if no tool call> }`.
- Prompt caching on the (static) constitution/system block. Built with the **`claude-api` skill** at
  implementation time for correct tool-use + caching wiring.
- If the model returns no tool call, `structured` is `undefined` → no signal update that turn (valid).

## Module: `/lib/chat/signals.ts`

```
SignalsTurnSchema = z.object({ axis: z.enum(AXES), severities: z.array(int 0..4).min(1) }).strict()
validateSignals(input: unknown): { valid: boolean; errors: string[] }
mergeSignals(accumulated: Signals, turn: { axis: Axis; severities: Severity[] }): Signals
```
`mergeSignals` appends the turn's severities to the axis's array in the accumulated `Signals`
(`Partial<Record<Axis, Severity[]>>` from `/lib/scoring`), returning a new object (pure).

## Module: `/lib/safeguards/runtime.ts`

```
import { createHaikuCaller } from '@/lib/llm/haiku'
runSafeguardedTurn({ history, userMessage, log }): Promise<PipelineResult>
  -> runChatPipeline({ userMessage, context: { history }, llm: createHaikuCaller(), log })
```
This is the only module that imports `/lib/llm` (the `no-restricted-imports` guard is satisfied; the
route never touches the LLM directly).

## Module: `/lib/chat/turn.ts`

```
runChatTurn({ history, userMessage, signals, log }):
  Promise<
    | { kind: 'crisis'; card }
    | { kind: 'reply'; reply: string; signals: Signals; profile: RadarProfile }
    | { kind: 'redirect'; text }
    | { kind: 'error'; text }
  >
```
- Calls `runSafeguardedTurn`. On `reply` with valid `structured` signals → `mergeSignals` →
  `computeProfile(merged)`; returns the reply, the updated `signals`, and the `profile`. On a reply
  with no signals, returns the unchanged `signals` + recomputed `profile`. Crisis/redirect/error pass
  through.

## `/api/chat` route

- **Gated (full gate, server-side)**: this is the health-signal-collecting endpoint, so it re-runs
  the *same* `gateDecision` used by the page gate, against the user's profile — `getUser()` (→ `401`
  if absent), then read `state_code` + `ai_disclosure_accepted_at` and compute
  `gateDecision({ hasSession, disclosureAccepted, hasState, geoState: stored state })`; if the result
  is not `'allow'` → `403` (an API route returns a status, not a page redirect). This prevents a
  client bypassing the UI from chatting without accepting the disclosure or from a blocked state.
- **Free daily cap** (FREE_DAILY_MESSAGE_CAP, default 10): before running the turn, atomically bump
  today's counter via the `bump_chat_usage` RPC (service-role admin client). If the returned count
  exceeds the cap → return `{ kind: 'cap', text }` (a friendly "that's your free check-in for today"
  message — the funnel "gap") without calling the model.
- **Stateless**: request `{ messages: LlmMessage[], signals: Signals }` (the client holds running
  state this slice). The latest user message + prior `history` feed `runChatTurn`. Response is the
  `runChatTurn` result as JSON. Compliance events flow through the injected `makeComplianceSink(admin,
  user.id)`.
- Input validation (zod): messages array shape, latest is a user message, signals shape. Bad input →
  `400`.

## Migration `0004_chat_usage`

```sql
create table public.chat_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default (now() at time zone 'utc')::date,
  count integer not null default 0,
  primary key (user_id, day)
);
alter table public.chat_usage enable row level security;
create policy "chat_usage_select_own" ... for select to authenticated using ((select auth.uid()) = user_id);
-- no insert/update policy: writes only via the SECURITY DEFINER bump function below.

create function public.bump_chat_usage(p_user uuid) returns integer
  language plpgsql security definer set search_path = '' as $$
declare new_count integer;
begin
  insert into public.chat_usage (user_id, day, count)
  values (p_user, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update set count = public.chat_usage.count + 1
  returning count into new_count;
  return new_count;
end; $$;
revoke execute on function public.bump_chat_usage(uuid) from public, anon, authenticated;
```
Applied via the Supabase MCP; advisors re-checked (the SECURITY DEFINER function has a pinned empty
`search_path` and `EXECUTE` revoked from public — same hardening as `handle_new_user`).

## Error handling

- Missing `ANTHROPIC_API_KEY` → the caller throws a clear server error; the route returns a `500` safe
  message (never leaks internals). Anthropic API error/timeout → the pipeline's `llm` throw path
  returns a safe error (existing behavior).
- The output filter / validator regenerate-once-then-redirect behavior is unchanged (Phase 0).
- Emergency input → crisis card, model never called (Phase 0), compliance event logged.
- A failed `bump_chat_usage` should fail closed-ish: if the counter errors, log and **allow** the turn
  (don't block a paying-attention user on a counter glitch) — the cap is a soft funnel control, not a
  safety gate.

## Testing

- **`signals.ts` (unit):** `SignalsTurnSchema` accepts a valid `{axis, severities}`, rejects unknown
  axis / out-of-range severity / empty severities / extra fields; `mergeSignals` appends and is pure.
- **`turn.ts` (unit, mocked `runSafeguardedTurn` or mocked llm):** a reply with signals →
  merged + `computeProfile`; a reply with no signals → unchanged signals; crisis/redirect/error pass
  through.
- **Pipeline (update existing):** Layer-4 now validates signals — update `pipeline.test.ts` structured
  cases to signals; confirm emergency-bypass, output-filter block→redirect, and regenerate-once still
  pass. Add `validateSignals` cases; keep `validateScored` (ScoredSchema) tests.
- **Route (unit, mocked turn + mocked admin/RPC):** `401` when no user; `403` when the gate isn't
  `allow` (e.g. disclosure not accepted); `cap` when the bump exceeds the cap (model not called);
  `400` on bad body; happy path returns the turn result.
- **Live (Anthropic key):** a real Haiku turn returns a warm, non-diagnostic reply + a valid
  `record_signals` extraction; an emergency message returns the crisis card without a model call; a
  prompt-injection asking for a diagnosis is filtered/redirected.

## New dependency / env

`@anthropic-ai/sdk`. Env: `ANTHROPIC_API_KEY` (server-only; add slot to `.env.example`, you generate
into `.env.local`), `FREE_DAILY_MESSAGE_CAP` (default 10).

## Acceptance criteria

- [ ] Layer-4 validates signals (`SignalsTurnSchema`); the pipeline carries conversation history; all
      safeguard tests green after the change.
- [ ] `createHaikuCaller` returns reply + tool-extracted signals; only `/lib/safeguards/runtime.ts`
      imports `/lib/llm`.
- [ ] `runChatTurn` computes the radar from merged signals (deterministic; LLM never sets the number).
- [ ] `/api/chat` enforces the full gate server-side (401 unauthed; 403 if disclosure/geo gate fails),
      enforces the daily cap via `bump_chat_usage`, validates input, and routes every model call
      through the safeguard pipeline + compliance sink.
- [ ] `0004_chat_usage` live; RLS owner-read; bump function hardened; advisors clean.
- [ ] `npm run test`, `npm run lint`, `npm run build` green; live Haiku turn verified.

## Deferred (explicit)

Chat UI + live radar + memory load + session persistence (1C-b); the Gap/CTA + brag card (1C-c);
avatar (1F). No `health_scores`/`session_summaries` are written this slice — the engine returns the
profile to the caller; persistence is 1C-b.
