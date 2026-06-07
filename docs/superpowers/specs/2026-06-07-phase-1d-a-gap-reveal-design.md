# Phase 1D-a — The Gap Reveal (design)

**Status:** approved design, ready for implementation plan
**Date:** 2026-06-07
**Spec source:** `docs/PRODUCT-SPEC.md` §Conversation flow ("The Gap") + §Engagement mechanics
**Builds on:** 1C-b (live chat + radar) and 1C-c (brag card) — all merged to `main`.

---

## What we're building

The **Gap reveal**: the in-chat moment from the PRODUCT-SPEC conversation flow where, after the user has mapped most of their six axes, Ava surfaces the radar **inline in the conversation** with its `??` gaps emphasized and softly teases the full profile — pulling the user toward completing the map (and, later, upgrading).

This is a **free engagement mechanic**. It contains **no purchase**. The actual Decision CTA ($9 Starter / $29 Wellness Profile) is a *separate, later beat* (Phase 1D's Decision step) and is deliberately **out of scope** here — see "Out of scope" below.

### North-star fit

The Gap deepens the user's relationship with Ava the right way: it pulls toward *completion* (the `??` gaps create an honest "almost there" tension) and plants the value of the full profile, without manufactured urgency or a fake checkout. The tease is a fact ("two pieces are still blank"), not a dark pattern. This is value-earned engagement, which is the only kind that compounds (CLAUDE.md §Product north star).

---

## Behavior

### Trigger (deterministic, edge-guarded)

- The radar fills in as axes are scored. Scoring is already deterministic (`lib/scoring`) from LLM-emitted signals; the client (`ChatScreen`) holds the live `RadarProfile`.
- The Gap fires **once per session**, the first time the number of scored axes reaches **4 of 6** (so 2 remain `??`). `GAP_THRESHOLD = 4`.
- **Not model-driven.** The chat LLM (Haiku) does not decide when the card appears. Rationale: a retention beat must fire reliably and be testable; this codebase enforces mechanics in deterministic code and keeps the LLM out of UI control (CLAUDE.md). The conversation *around* the card is still fully Ava (Haiku writes the surrounding dialogue), so the moment reads natural without surrendering the trigger.
- **Returning-user suppression:** a returning user's baseline (overlay of baseline + session scores) may already have ≥4 axes. The beat is a *first-mapping* mechanic, so it is suppressed when the session starts already at/above threshold: `gapShown` initializes to `scoredAxisCount(initialProfile) >= GAP_THRESHOLD`. A returning user sitting at 2–3 who completes a 4th axis this session still gets the beat.
- `endCheckIn` resets `gapShown` to that same initial value (so a fresh check-in in the same mount behaves like a new session).

### Presentation (inline radar card — "approach A")

- The Gap renders as a **rich message bubble inline in the chat thread**, left-aligned like Ava's voice. The conversation flows around it; it scrolls with the thread and remains in history as a marker.
- The card **snapshots the profile at reveal time** — it is a frozen "here's where you landed" beat. The live `ScorePill` and `RadarDrawer` continue to update independently as more axes are scored; the inline card does not change after it appears.
- Chosen over an auto-opening drawer (modal interrupt, covers the chat) and a full-screen takeover (hard interrupt, fights the calm "one axis at a time" tone).

### Tease + CTA (soft teaser, no checkout — "option B")

The card contains:
- **Framing line:** "Here's where you're landing so far."
- **Compact radar (~170px)**, all six axes **labeled**; scored axes show their number, unscored show `??` with the gap spokes/labels **emphasized in terracotta** so the blanks pull the eye.
- **Gap line:** "{n} still blank" where `n = 6 − scoredAxisCount(snapshot)`.
- **Teaser:** "Your full profile fills in all six — with a written read on what they mean together."
- **"Keep going →"** button — focuses the chat composer. No navigation, no checkout. Pure free continuation.

---

## Architecture

Four units, each independently testable.

### 1. `lib/chat/gap.ts` (pure trigger logic)

```ts
import { AXES, type RadarProfile } from '@/lib/scoring';

/** How many of the six axes currently have a (non-null) score. */
export function scoredAxisCount(profile: RadarProfile): number {
  return AXES.filter((a) => profile.axes[a] !== null).length;
}

/** The Gap fires once the user has mapped at least this many axes (2 still `??`). */
export const GAP_THRESHOLD = 4;
```

No React, no side effects — trivially unit-testable.

### 2. `components/chat/MessageList.tsx` (widened item stream)

Replace the flat `UiMessage[]` with a discriminated union so a card can live inline:

```ts
export type TextItem = { id: number; role: 'user' | 'assistant'; content: string };
export type GapItem = { id: number; kind: 'gap'; profile: RadarProfile };
export type UiItem = TextItem | GapItem;
```

- `MessageList` accepts `items: UiItem[]` and a `focusComposer: () => void` callback.
- A `TextItem` (no `kind`) renders `MessageBubble` exactly as today; a `GapItem` renders `<GapCard profile={item.profile} onKeepGoing={focusComposer} />`.
- `MessageBubble`, `TypingIndicator`, crisis/cap rendering are unchanged.
- The existing `UiMessage` type alias is kept as `TextItem` (re-exported as `UiMessage`) so `ChatScreen`'s text-message construction is untouched.

### 3. `components/chat/GapCard.tsx` (the inline card)

- `'use client'`. Props: `{ profile: RadarProfile; onKeepGoing: () => void }`.
- Builds a compact (~170px) labeled radar from the shared `@/components/radar/geometry` helpers (`scoresToValues`, `polygonPoints`, `pointForValue`) — the same primitives `ShareCard` uses — rather than the fixed-280px `RadarChart`. Unscored axes render `??`; their spoke + label get terracotta emphasis.
- Renders the framing line, gap line (`6 − scoredAxisCount(profile)`), teaser, and the "Keep going →" button wired to `onKeepGoing`.
- Pure/presentational apart from the button callback.

### 4. `components/chat/ChatComposer.tsx` + `components/chat/ChatScreen.tsx` (wiring)

- `ChatComposer` forwards a `ref` to its `<textarea>` (via `forwardRef`), so the composer can be focused imperatively.
- `ChatScreen`:
  - Holds `composerRef` and defines `focusComposer = () => composerRef.current?.focus()`.
  - State becomes `items: UiItem[]` (seeded with the opener `TextItem`).
  - `gapShown` state initializes to `scoredAxisCount(initialProfile) >= GAP_THRESHOLD`.
  - In `send()`, after a `reply` updates `profile`: if `scoredAxisCount(nextProfile) >= GAP_THRESHOLD && !gapShown`, set `gapShown` and append a `GapItem` (snapshotting `nextProfile`) after the assistant message.
  - `endCheckIn` resets `items` to the opener and `gapShown` to `scoredAxisCount(initialProfile) >= GAP_THRESHOLD`.

### Data flow

```
send() → sendChatTurn() → reply{profile} → setProfile
  └─ scoredAxisCount(profile) crosses 4 && !gapShown
       └─ append GapItem{profile snapshot} → MessageList renders GapCard
            └─ "Keep going →" → focusComposer() → textarea.focus()
```

No new network calls, no DB, no LLM changes.

---

## Testing

- `test/chat/gap.test.ts` — `scoredAxisCount` for 0/3/4/6 scored; `GAP_THRESHOLD === 4`.
- `test/chat/gap-card.test.tsx` (jsdom) — renders framing/teaser/"Keep going"; shows `??` for null axes; gap line reflects count; clicking "Keep going" calls `onKeepGoing`; asserts no leak beyond labels+values the radar already shows.
- `test/chat/chat-screen.test.tsx` (jsdom, mock `@/lib/chat/client`) — gap card appears when a reply pushes scored count to 4; fires only once across further replies; suppressed when `initialProfile` already has ≥4 scored; reset after `endCheckIn`.

---

## Out of scope (explicit)

- **The Decision CTA** — the actual $9 Starter / $29 Wellness Profile purchase moment that follows the Gap in the conversation flow. This is the next 1D beat and needs **careful, dedicated design** (placement, copy, intent capture vs. live checkout, Stripe test-mode wiring). Deferred on purpose; flagged for the next iteration. **No Stripe, no intent table, no purchase button in this slice.**
- The real templated Ava clip / Poster B brag-card variant (→ avatar foundation / Phase 1F).
- Trend arrows / progress deltas (require history → Phase 2).

---

## Conventions

- Branch `phase-1d-a/gap-reveal` off `main`. `phase-1:` commits, one concern each, `Co-Authored-By` trailer.
- TS strict; no `any` without `// reason:`.
- All sub-agents use Opus 4.8 (`model: 'opus'`). Security review before the PR.
