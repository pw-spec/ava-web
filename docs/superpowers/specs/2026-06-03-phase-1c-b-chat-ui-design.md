# Phase 1C-b — Chat UI + Live Radar + Memory Loop — Design

**Date:** 2026-06-03
**Phase:** 1 (Ava MVP) — Slice 1C-b
**Status:** Approved for planning

## Context

1C-a shipped the chat *engine* (`/api/chat`: Haiku through the safeguard pipeline, tool-use signal
extraction, deterministic scoring, gate + daily cap) with **no UI and no persistence**. 1C-b makes Ava
a product a man actually talks to: a chat-immersive screen, a live radar that fills as he talks, and the
**memory loop** that makes Ava feel like it knows him — the heart of the retention north star.

It builds on: `/api/chat` + `runChatTurn` (1C-a), the deterministic radar (`/lib/scoring` +
`components/radar/RadarChart`), the encrypted health store (`lib/health/store.ts`, 1B-ii), the shadcn/ui
warm-themed primitives (just merged), and the auth/gate (1B-i).

## The experience (layout C — "chat-immersive")

Full-screen conversation. A **score pill** in the header is the always-on progress glance (overall +
tier color); it pulses when a score changes. The full radar lives in a **pull-up drawer** (shadcn
`Sheet`/`Drawer`) reusing `RadarChart` as-is, with `??` on unscored axes. A free text session covers
3–4 of 6 axes; the rest stay `??` (the completion hook). The drawer holds the **"End check-in & save"**
action. Ava replies as whole messages with a warm **"typing…"** indicator (token streaming deferred).

## Scope

**In scope**
- **Chat screen** at `/home` (replaces the placeholder), built from shadcn warm primitives: conversation
  thread, typing indicator, composer, header score pill, radar drawer.
- **Live radar** continuity: pre-fill from the user's latest finalized scores; this session's signals
  overlay the touched axes; `??` for never-scored.
- **`/api/chat` additions:** load memory (last-3 summaries + facts) **server-side** (the user's
  RLS-scoped client) into the pipeline context; lazily create the chat session; upsert the session's
  `health_scores` snapshot each turn (cheap, no LLM); return the overlaid profile + the `sessionId`.
- **`/api/session/end`** (new): Sonnet session summarizer (output-filtered, non-diagnostic) → encrypted
  `session_summary`; mark the session ended. Transcript discarded (never stored raw).
- **Sonnet caller** (`lib/llm/sonnet.ts`) + an output-filtered summarizer runtime, consumed only by
  `/lib/safeguards` (the `no-restricted-imports` boundary holds).
- **Migration `0005_chat_sessions`**: a lightweight `chat_sessions` table + `session_id` on
  `health_scores` (unique, for the per-turn upsert) and `session_summaries`.
- **Store changes:** new `upsertSessionScores` (session-keyed upsert, replaces `saveHealthScores` on the
  live path); `saveSessionSummary` → takes `sessionId`; new `createChatSession` / `endChatSession` /
  `getBaselineScores`.
- Unit tests (mocked LLM/DB), a pure `overlayProfile` helper, and component tests for the thread + drawer.

**Out of scope (later)**
- The **"Gap" reveal** moment, the upgrade/**Decision CTA**, the **brag card** → 1C-c.
- **Trend arrows** (delta vs last check-in) — need history/subscription → 1C-c+.
- Token streaming; avatar/voice (Phase 1F); the private profile results page + Sonnet *report* (1E).

## Architecture & data flow

```
/home (server component)
  └─ load baseline = getBaselineScores(user)         → pre-fill the radar (continuity)
  └─ render <ChatScreen baseline=… />                  (client; holds messages[], signals, sessionId)

per turn:  client ──POST /api/chat {messages, signals, sessionId?}──▶
  auth + full gate (1C-a) → daily cap (1C-a) →
  load recentSummaries(3)+facts SERVER-SIDE → runChatTurn(context.recentSummaries) →
  ensure session (create if sessionId absent) →
  overlay = overlayProfile(baseline, turn.profile) → upsert health_scores(session_id)=overlay →
  ◀── {kind, reply, signals, profile: overlay, sessionId}

on "End check-in":  client ──POST /api/session/end {messages, signals, sessionId}──▶
  auth + gate → summarizeSession(messages)  [Sonnet → output filter] →
  saveSessionSummary(sessionId, summary) → endChatSession(sessionId) →
  ◀── {ok:true}   (transcript discarded)
```

The transcript lives only in the client; it reaches the server per turn and at finalize, but is **never
stored raw** — only the computed scores and the filtered Sonnet summary persist. Sensitive **memory
(summaries + facts) is loaded server-side per turn** and injected into the prompt; it never round-trips
through the client. The radar scores shown to the client are the user's own data.

## Components (UI — all from shadcn warm primitives)

- `ChatScreen` (client) — owns `{messages, signals, sessionId, baseline, drawerOpen, pending}`; orchestrates
  the two endpoints; renders the thread + composer + header + drawer.
- `MessageList` / `MessageBubble` — Ava (card surface) vs user (terracotta `primary`); `TypingIndicator`.
- `ScorePill` (header) — overall + tier color; pulses on change; toggles the drawer.
- `RadarDrawer` — shadcn `Sheet`/`Drawer` wrapping the existing `RadarChart` (+ `TierBadge`) and the
  "End check-in & save" button.
- `ChatComposer` — shadcn `Textarea` + send; disabled while `pending`, on `kind:'cap'`, or after end.
- Result states: `kind:'reply'` appends Ava's message + animates the radar; `crisis` → crisis card
  (988/911), conversation locked; `redirect`/`error` → Ava message, no score change; `cap` → friendly
  "that's your free check-in for today" and composer disabled.

## Live-radar continuity — `overlayProfile` (pure)

```
overlayProfile(baseline: RadarProfile | null, session: RadarProfile): RadarProfile
```
For each axis: `session.axes[a]` if scored this session, else `baseline?.axes[a]`, else `null` (`??`).
Overall + tier recomputed from the overlaid axes (reusing `computeOverall`/`tierForOverall`). Pure and
unit-tested. Used server-side in `/api/chat` (the returned + persisted profile) and matches what the
client renders. `baseline` = the user's most recent **finalized** session scores (excludes the active
session's own in-progress row).

## Server endpoints

**`/api/chat`** (extend 1C-a) — unchanged auth/gate/cap/safeguard flow, plus:
- Body gains optional `sessionId: string` (uuid). After auth+gate+cap and **before** `runChatTurn`,
  load `getRecentSummaries(3)` + `getUserFacts` via the user's **RLS-scoped** server client (owner-read)
  and pass their text as `context.recentSummaries` into the turn. (Emergency scan stays on the newest
  message — see Compliance.)
- After a `reply`: ensure a session (`createChatSession` if `sessionId` absent → new id), compute
  `overlay = overlayProfile(baseline, result.profile)`, `upsertSessionScores(sessionId, overlay)`,
  and return `{…result, profile: overlay, sessionId}`. Non-reply kinds pass through unchanged (no score
  write), still returning `sessionId` when known. These health writes use the user's RLS-scoped client
  (owner policies, incl. the new `health_scores` update policy); the **admin** client stays only for the
  daily-cap RPC + the compliance sink.

**`/api/session/end`** (new) — auth + full gate (same as `/api/chat`); zod body `{messages, signals,
sessionId}`. Runs `summarizeSession(messages)` → `saveSessionSummary(sessionId, summary, 'text')` →
`endChatSession(sessionId)`; returns `{ok:true}`. On summarizer failure: still `endChatSession` and
return `{ok:true, summarized:false}` (the score snapshot was already saved each turn — never lose the
check-in). Idempotent: ending an already-ended session is a no-op `{ok:true}`.

## Sonnet summarizer (output-filtered, non-diagnostic)

- `lib/llm/sonnet.ts` → `createSonnetCaller()` (server-only, `@anthropic-ai/sdk`, model
  **`claude-sonnet-4-6`**, key `ANTHROPIC_API_KEY`). Plain text in/out (no tools).
- `lib/safeguards/summarizer.ts` → `summarizeSession(messages): Promise<string | null>`. Builds a
  summarization prompt that asks for a short, **non-diagnostic** recap framed as wellness indicators and
  durable facts ("based on what he shared… sleep has been light; mentioned new job stress"), never
  conditions/drugs/doses. Calls Sonnet, then runs the existing **output filter** (`scanOutput`) on the
  result; on block, regenerate once with the stricter reminder, then on a second block return `null`
  (no summary stored). This is the only Sonnet consumer and lives under `/lib/safeguards`, so the
  `/lib/llm` import boundary holds. A compliance event (`summary_filtered`) is logged on a block.

## Data model — migration `0005_chat_sessions`

```sql
create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','ended')),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
alter table public.chat_sessions enable row level security;
-- Owner-managed via the user's RLS-scoped client (mirrors user_facts: select/insert/update own).
create policy "chat_sessions_select_own" … for select to authenticated using ((select auth.uid()) = user_id);
create policy "chat_sessions_insert_own" … for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "chat_sessions_update_own" … for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter table public.health_scores    add column session_id uuid references public.chat_sessions(id) on delete cascade;
create unique index health_scores_session_id_key on public.health_scores(session_id);  -- one snapshot per session
-- NEW: health_scores had only select+insert; the per-turn upsert needs an owner UPDATE policy.
create policy "health_scores_update_own" on public.health_scores for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter table public.session_summaries add column session_id uuid references public.chat_sessions(id) on delete cascade;
```

`session_id` is nullable (existing rows predate sessions). Advisors re-checked after apply. Store
changes (all via the user's RLS-scoped client): `upsertSessionScores(client, userId, sessionId, scores)`
upserts on `session_id` (insert+update owner policies); `saveSessionSummary(client, userId, sessionId,
summary, type)` adds the column; `createChatSession(client, userId)` / `endChatSession(client, sessionId)`;
`getBaselineScores(client, userId)` = the latest `health_scores` row belonging to an **ended** session
(or a legacy `session_id is null` row) — i.e. excludes the active session's in-progress snapshot.

## Memory load (the "remembers you" payoff)

- **Prompt memory:** `/api/chat` loads last-3 `session_summaries` + `user_facts` server-side each turn,
  passed as `context.recentSummaries` (already spliced by `buildConstitutionMessages`). So Ava opens a
  return visit referencing last time ("last week your sleep was dragging…").
- **Radar continuity:** the page pre-fills the radar from `getBaselineScores`; `overlayProfile` keeps
  prior axes visible while this session updates the ones discussed; `??` for never-scored.

## Compliance

- **Transcript minimized:** held client-side, summarized then **discarded**; the encrypted summary is the
  only durable record (COMPLIANCE rule 4).
- **Summarizer is non-diagnostic and output-filtered** (same allow/deny enforcement as conversation);
  blocked summaries are dropped, not stored.
- **Emergency protocol everywhere:** the per-turn pipeline scans the newest user message (correct for the
  append-only flow; re-scanning history would loop the crisis card). The residual *crafted-history*
  trust gap (a client injecting an unsent crisis/jailbreak message) stays **backstopped by the always-on
  output filter** on every generated reply; fully closing it needs server-side session reconstruction,
  which we declined for data-minimization — **documented accepted risk**, revisit if persistence model
  changes. Daily cap + crisis carve-out (1C-a) unchanged.
- New tables/columns RLS owner-scoped (select/insert/update own — same shape as `user_facts`); the
  compliance sink (`compliance_log`) stays service-role-only; `session_id` FKs cascade on user delete
  (wind-down / crypto-shred).

## Error handling

- Turn network failure / abort → composer re-enables, the user can resend; no partial state persisted.
- `/api/chat` score-upsert failure → log, still return the reply (the radar shows the in-memory overlay;
  a counter/score glitch must not break the conversation).
- Summarizer (Sonnet) failure or filter-drop at finalize → `endChatSession` anyway, tell the user it
  saved (the score snapshot persisted per turn). Never lose the check-in.
- Missing `ANTHROPIC_API_KEY` → the caller throws; finalize returns `{ok:true, summarized:false}`; the UI
  still confirms the check-in saved.

## Testing

- **`overlayProfile` (unit):** session-only, baseline-only, mixed, all-`??`; overall/tier recomputed.
- **Sonnet summarizer (unit, mocked caller):** clean recap passes; a diagnosis-laden draft is
  filtered → regenerate → drop (`null`) + `summary_filtered` logged.
- **`/api/chat` (unit, mocked deps):** session created when `sessionId` absent; memory loaded into
  context; overlay returned + upserted; non-reply kinds skip the score write; 1C-a gate/cap/401/403/400
  still hold.
- **`/api/session/end` (unit):** happy path saves summary + ends session; summarizer failure still ends +
  `summarized:false`; already-ended is a no-op; 401/403 enforced.
- **Components:** thread renders Ava/user bubbles + typing; score pill pulses + toggles drawer; drawer
  shows `RadarChart` with `??`; composer disables on pending/cap; crisis result locks the conversation.
- **Migration:** applied via MCP; RLS + unique(session_id) verified; advisors clean.
- Full `npm run test` / `lint` / `build` green; live smoke (key) optional.

## Implementation note (size)

This slice is larger than 1C-a (UI + two endpoints + a new Sonnet path + migration + store changes). The
implementation plan may split into two phases for reviewable increments: **(i)** chat screen + live radar
+ per-turn score persistence + prompt-memory load + the `0005` migration; **(ii)** `/api/session/end` +
the Sonnet summarizer + summary memory. Both land behind the same gate before 1C-b is "done."

## Acceptance criteria

- [ ] `/home` is a working chat: send a message → Ava replies (typing indicator) → the radar animates;
      the header score pill reflects overall + tier and pulses on change; the drawer shows the full radar
      with `??` on unscored axes.
- [ ] A returning user sees prior axes pre-filled (continuity) and Ava references last time (memory).
- [ ] `/api/chat` loads memory server-side, upserts the session score snapshot each turn, returns the
      overlaid profile + `sessionId`; 1C-a gate/cap/safeguard behavior intact.
- [ ] "End check-in" writes an encrypted, **output-filtered** Sonnet summary and marks the session ended;
      the transcript is never persisted; summarizer failure still saves the check-in.
- [ ] `overlayProfile` is pure + unit-tested; the Sonnet caller is the only new `/lib/llm` consumer
      (boundary holds).
- [ ] `0005_chat_sessions` live; RLS owner-read; `unique(session_id)`; advisors clean.
- [ ] `npm run test` / `lint` / `build` green.

## Deferred (explicit)

The "Gap" reveal + Decision CTA + brag card (1C-c); trend arrows (need history → 1C-c+); token streaming;
the private profile results page + Sonnet report (1E); avatar/voice (1F).
