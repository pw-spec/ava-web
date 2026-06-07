# Phase 1D-a — The Gap Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the in-chat "Gap reveal" — once the user has mapped 4 of 6 axes, Ava surfaces an inline, frozen radar snapshot with its `??` gaps emphasized and a soft teaser pulling toward completion (no purchase).

**Architecture:** A pure trigger helper (`lib/chat/gap.ts`) decides nothing about React; `ChatScreen` watches the live profile and, on the first crossing to 4 scored axes, appends a `GapItem` to the message stream. `MessageList`'s item type widens to a discriminated union so a `GapItem` renders `<GapCard>` inline. `GapCard` draws a compact labeled radar from the shared geometry helpers. The card's "Keep going →" focuses the composer via a ref threaded from `ChatScreen` → `ChatComposer`.

**Tech Stack:** Next.js 16 / React 19.2, TypeScript strict, Tailwind v4 (warm brand tokens `--brand`/`--brand-2`, exposed as `text-brand`/`fill-brand`), Vitest + Testing Library (jsdom). No new deps, no DB/network/LLM changes.

**Spec:** `docs/superpowers/specs/2026-06-07-phase-1d-a-gap-reveal-design.md`

**Conventions:** Branch `phase-1d-a/gap-reveal` (already created off `main`). `phase-1:` commits, one concern each, `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. TS strict; no `any` without `// reason:`. The card shows only what the radar already shows (axis labels + values/`??`) — no symptoms, no condition language. The purchase Decision CTA is explicitly **out of scope** (separate 1D beat).

---

## File Structure

**Created:**
- `lib/chat/gap.ts` — pure trigger logic (`scoredAxisCount`, `GAP_THRESHOLD`)
- `components/chat/GapCard.tsx` — the inline Gap card (compact radar + teaser + CTA)
- `test/chat/gap.test.ts`, `test/chat/gap-card.test.tsx`

**Modified:**
- `components/chat/MessageList.tsx` — widen item type to `UiItem` union; render `GapCard` for gap items; accept optional `focusComposer`
- `components/chat/ChatComposer.tsx` — accept an optional `textareaRef` and forward it to the `<Textarea>`
- `components/chat/ChatScreen.tsx` — hold the composer ref + `gapShown` state; append the `GapItem` on the threshold crossing; reset on end
- `test/chat/chat-screen.test.tsx` — add Gap reveal cases (append-once, suppression, reset, focus wiring)
- `test/chat/message-list.test.tsx` — add a gap-item render case

---

## Task 1: `lib/chat/gap.ts` — pure trigger logic

**Files:**
- Create: `lib/chat/gap.ts`, `test/chat/gap.test.ts`

- [ ] **Step 1: Write the failing test** `test/chat/gap.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { scoredAxisCount, GAP_THRESHOLD } from '@/lib/chat/gap';
import { AXES, type RadarProfile } from '@/lib/scoring';

/** A profile with the first `n` axes (in AXES order) scored at 50, the rest null. */
function profileWith(n: number): RadarProfile {
  const axes = Object.fromEntries(AXES.map((a, i) => [a, i < n ? 50 : null])) as RadarProfile['axes'];
  return { axes, overall: n ? 50 : null, tier: null };
}

describe('scoredAxisCount', () => {
  it('counts only the non-null axes', () => {
    expect(scoredAxisCount(profileWith(0))).toBe(0);
    expect(scoredAxisCount(profileWith(3))).toBe(3);
    expect(scoredAxisCount(profileWith(4))).toBe(4);
    expect(scoredAxisCount(profileWith(6))).toBe(6);
  });
});

describe('GAP_THRESHOLD', () => {
  it('is 4 — fires with two axes still unscored', () => {
    expect(GAP_THRESHOLD).toBe(4);
    expect(scoredAxisCount(profileWith(3)) >= GAP_THRESHOLD).toBe(false);
    expect(scoredAxisCount(profileWith(4)) >= GAP_THRESHOLD).toBe(true);
  });
});
```

- [ ] **Step 2: Run it — confirm FAIL** (`npx vitest run test/chat/gap.test.ts`). Expected: module `@/lib/chat/gap` not found.

- [ ] **Step 3: Write `lib/chat/gap.ts`**

```ts
import { AXES, type RadarProfile } from '@/lib/scoring';

/** How many of the six axes currently have a (non-null) score. */
export function scoredAxisCount(profile: RadarProfile): number {
  return AXES.filter((axis) => profile.axes[axis] !== null).length;
}

/** The Gap reveal fires once the user has mapped at least this many axes (so 2 remain `??`). */
export const GAP_THRESHOLD = 4;
```

- [ ] **Step 4: Run it — confirm PASS** (`npx vitest run test/chat/gap.test.ts`). Then `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 5: Commit**

```bash
git add lib/chat/gap.ts test/chat/gap.test.ts
git commit -m "phase-1: Gap reveal trigger logic (scoredAxisCount + threshold)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `components/chat/GapCard.tsx` — the inline card

**Files:**
- Create: `components/chat/GapCard.tsx`, `test/chat/gap-card.test.tsx`

- [ ] **Step 1: Write the failing test** `test/chat/gap-card.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GapCard } from '@/components/chat/GapCard';
import type { RadarProfile } from '@/lib/scoring';

// 4 scored, 2 blank (drive, focus) — the canonical Gap moment.
const profile: RadarProfile = {
  axes: { energy: 58, strength: 60, sleep: 41, drive: null, focus: null, body: 49 },
  overall: 52,
  tier: { label: 'Room to Grow', color: 'x' },
};

describe('GapCard', () => {
  it('shows the framing line, the teaser, and the keep-going CTA', () => {
    render(<GapCard profile={profile} onKeepGoing={() => {}} />);
    expect(screen.getByText(/where you're landing/i)).toBeInTheDocument();
    expect(screen.getByText(/fills in all six/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /keep going/i })).toBeInTheDocument();
  });

  it('reflects the number of blank axes', () => {
    render(<GapCard profile={profile} onKeepGoing={() => {}} />);
    expect(screen.getByText(/2 still blank/i)).toBeInTheDocument();
  });

  it('renders ?? for each unscored axis', () => {
    const { container } = render(<GapCard profile={profile} onKeepGoing={() => {}} />);
    const tokens = Array.from(container.querySelectorAll('tspan')).map((t) => t.textContent);
    expect(tokens.filter((t) => t === '??')).toHaveLength(2);
  });

  it('does not leak any axis symptom/condition language (labels + values only)', () => {
    render(<GapCard profile={profile} onKeepGoing={() => {}} />);
    expect(screen.queryByText(/testosterone|diagnos|symptom|condition/i)).not.toBeInTheDocument();
  });

  it('calls onKeepGoing when the CTA is clicked', () => {
    const onKeepGoing = vi.fn();
    render(<GapCard profile={profile} onKeepGoing={onKeepGoing} />);
    fireEvent.click(screen.getByRole('button', { name: /keep going/i }));
    expect(onKeepGoing).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run it — confirm FAIL** (`npx vitest run test/chat/gap-card.test.tsx`).

- [ ] **Step 3: Write `components/chat/GapCard.tsx`**

```tsx
'use client';
import { AXES, AXIS_META, type RadarProfile } from '@/lib/scoring';
import { pointForValue, polygonPoints, scoresToValues } from '@/components/radar/geometry';
import { scoredAxisCount } from '@/lib/chat/gap';
import { Button } from '@/components/ui/button';

const SIZE = 180;
const C = SIZE / 2;
const R = 56;
const LABEL_R = R + 18;

/**
 * The Gap reveal — an inline, frozen snapshot of the radar shown once the user has mapped
 * 4 of 6 axes. Unscored axes render `??` with terracotta emphasis so the blanks pull the eye.
 * Soft teaser only; the purchase Decision CTA is a separate (later) beat.
 */
export function GapCard({ profile, onKeepGoing }: { profile: RadarProfile; onKeepGoing: () => void }) {
  const values = scoresToValues(profile.axes);
  const blanks = AXES.length - scoredAxisCount(profile);

  return (
    <div className="flex w-full justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-border bg-card p-4 text-card-foreground">
        <p className="text-sm font-medium">Here&apos;s where you&apos;re landing so far.</p>

        <div className="my-3 flex justify-center">
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            role="img"
            aria-label="Wellness radar so far"
          >
            {[0.5, 1].map((ring) => (
              <circle key={ring} cx={C} cy={C} r={R * ring} fill="none" stroke="var(--fg)" strokeOpacity={0.08} />
            ))}

            {AXES.map((axis, i) => {
              const edge = pointForValue(i, 100, C, C, R);
              const isGap = profile.axes[axis] === null;
              return (
                <line
                  key={axis}
                  x1={C}
                  y1={C}
                  x2={edge.x}
                  y2={edge.y}
                  stroke={isGap ? 'var(--brand)' : 'var(--fg)'}
                  strokeOpacity={isGap ? 0.5 : 0.08}
                  strokeDasharray={isGap ? '3 3' : undefined}
                />
              );
            })}

            <polygon
              points={polygonPoints(values, C, C, R)}
              fill="var(--brand-2)"
              fillOpacity={0.3}
              stroke="var(--brand)"
              strokeWidth={2}
              strokeLinejoin="round"
            />

            {AXES.map((axis, i) => {
              const lp = pointForValue(i, (LABEL_R / R) * 100, C, C, R);
              const score = profile.axes[axis];
              const isGap = score === null;
              return (
                <text
                  key={axis}
                  x={lp.x}
                  y={lp.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={isGap ? 'fill-brand text-[9px] font-semibold' : 'fill-[var(--fg)] text-[9px]'}
                >
                  <tspan>{AXIS_META[axis].label}</tspan>
                  <tspan dx="3" className="font-semibold">
                    {isGap ? '??' : String(score)}
                  </tspan>
                </text>
              );
            })}
          </svg>
        </div>

        <p className="text-sm font-semibold text-brand">{blanks} still blank.</p>
        <p className="mt-1 text-sm">
          Your full profile fills in all six — with a written read on what they mean together.
        </p>

        <Button onClick={onKeepGoing} variant="outline" className="mt-3 w-full">
          Keep going →
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run it — confirm PASS** (`npx vitest run test/chat/gap-card.test.tsx`). `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 5: Commit**

```bash
git add components/chat/GapCard.tsx test/chat/gap-card.test.tsx
git commit -m "phase-1: GapCard — inline radar snapshot + soft profile teaser

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: `MessageList` — widen items to a union, render `GapCard`

**Files:**
- Modify: `components/chat/MessageList.tsx`
- Modify: `test/chat/message-list.test.tsx`

> The existing `messages` prop is kept (text-only arrays still typecheck as `UiItem[]`), so the current MessageList/ChatScreen call sites compile unchanged. We add the union, the `GapItem` branch, an `isTextItem` guard (consumed by `ChatScreen` in Task 4), and an optional `focusComposer`.

- [ ] **Step 1: Add a failing test case** to `test/chat/message-list.test.tsx` (add the import at the top, then append the `gapProfile` const + the new `it(...)` inside the `describe('MessageList', …)` block):

```tsx
import type { RadarProfile } from '@/lib/scoring';

const gapProfile: RadarProfile = {
  axes: { energy: 58, strength: 60, sleep: 41, drive: null, focus: null, body: 49 },
  overall: 52,
  tier: { label: 'Room to Grow', color: 'x' },
};

it('renders a GapCard for a gap item in the stream', () => {
  const items = [
    { id: 1, role: 'assistant' as const, content: 'how is your energy?' },
    { id: 2, kind: 'gap' as const, profile: gapProfile },
  ];
  render(<MessageList messages={items} pending={false} crisis={null} capped={false} />);
  expect(screen.getByText(/where you're landing/i)).toBeInTheDocument();
  expect(screen.getByText(/2 still blank/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it — confirm FAIL** (`npx vitest run test/chat/message-list.test.tsx`). Expected: gap item renders nothing / type error.

- [ ] **Step 3: Edit `components/chat/MessageList.tsx`**

Replace the type alias + imports at the top:

```tsx
'use client';
import { useEffect, useRef } from 'react';
import type { CrisisCard } from '@/lib/safeguards/types';
import type { RadarProfile } from '@/lib/scoring';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { GapCard } from './GapCard';

/** A normal chat turn. */
export type TextItem = { id: number; role: 'user' | 'assistant'; content: string };
/** The inline Gap reveal — a frozen radar snapshot injected into the stream. */
export type GapItem = { id: number; kind: 'gap'; profile: RadarProfile };
export type UiItem = TextItem | GapItem;

/** Kept for existing call sites that build text turns. */
export type UiMessage = TextItem;

export function isTextItem(item: UiItem): item is TextItem {
  return 'role' in item;
}
```

Update the component signature + render loop:

```tsx
export function MessageList({
  messages,
  pending,
  crisis,
  capped,
  focusComposer,
}: {
  messages: UiItem[];
  pending: boolean;
  crisis: CrisisCard | null;
  capped: boolean;
  focusComposer?: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages.length, pending, crisis, capped]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
      <div className="mt-auto flex flex-col gap-3">
        {messages.map((m) =>
          isTextItem(m) ? (
            <MessageBubble key={m.id} role={m.role}>
              {m.content}
            </MessageBubble>
          ) : (
            <GapCard key={m.id} profile={m.profile} onKeepGoing={() => focusComposer?.()} />
          ),
        )}
        {pending && <TypingIndicator />}
        {/* crisis + capped blocks unchanged */}
```

Leave the `crisis`, `capped`, and `endRef` blocks exactly as they are.

- [ ] **Step 4: Run it — confirm PASS** (`npx vitest run test/chat/message-list.test.tsx`). `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 5: Commit**

```bash
git add components/chat/MessageList.tsx test/chat/message-list.test.tsx
git commit -m "phase-1: MessageList renders inline GapCard via a UiItem union

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Wire the trigger + composer focus in `ChatScreen` (+ `ChatComposer`)

**Files:**
- Modify: `components/chat/ChatComposer.tsx`
- Modify: `components/chat/ChatScreen.tsx`
- Modify: `test/chat/chat-screen.test.tsx`

### 4a — `ChatComposer` accepts a forwarded textarea ref

- [ ] **Step 1: Edit `components/chat/ChatComposer.tsx`** — add the prop and pass it through. React 19 lets the shadcn `Textarea` (which spreads `...props`) forward a `ref` to its host `<textarea>`.

```tsx
'use client';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function ChatComposer({
  onSend,
  disabled,
  textareaRef,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
  textareaRef?: React.Ref<HTMLTextAreaElement>;
}) {
  const [value, setValue] = useState('');

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
  }

  return (
    <div className="flex items-end gap-2 border-t border-border bg-background p-3">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        disabled={disabled}
        rows={1}
        placeholder="Tell Ava how you're doing…"
        aria-label="Message Ava"
        className="max-h-32 min-h-10 flex-1 resize-none"
      />
      <Button type="button" onClick={submit} disabled={disabled} aria-label="Send" className="shrink-0">
        ↑
      </Button>
    </div>
  );
}
```

### 4b — `ChatScreen` holds the ref + `gapShown`, appends the GapItem

- [ ] **Step 2: Add the Gap reveal test cases** to `test/chat/chat-screen.test.tsx`. First add a helper near the top (after `emptyProfile`):

```ts
import { AXES } from '@/lib/scoring';

/** A reply profile with the first `n` axes scored (50), the rest null. */
function profileWith(n: number): RadarProfile {
  const axes = Object.fromEntries(AXES.map((a, i) => [a, i < n ? 50 : null])) as RadarProfile['axes'];
  return { axes, overall: n ? 50 : null, tier: { label: 'Room to Grow', color: 'x' } };
}
```

Then add these cases inside `describe('ChatScreen', …)`:

```ts
it('reveals the Gap card once, when the 4th axis is scored', async () => {
  sendChatTurn
    .mockResolvedValueOnce({ kind: 'reply', reply: 'r1', signals: {}, profile: profileWith(3), sessionId: 's1' })
    .mockResolvedValueOnce({ kind: 'reply', reply: 'r2', signals: {}, profile: profileWith(4), sessionId: 's1' })
    .mockResolvedValueOnce({ kind: 'reply', reply: 'r3', signals: {}, profile: profileWith(5), sessionId: 's1' });
  render(<ChatScreen initialProfile={emptyProfile} />);

  type('a');
  await waitFor(() => expect(screen.getByText('r1')).toBeInTheDocument());
  expect(screen.queryByText(/still blank/i)).not.toBeInTheDocument(); // 3 scored → no gap yet

  type('b');
  await waitFor(() => expect(screen.getByText('r2')).toBeInTheDocument());
  expect(screen.getByText(/still blank/i)).toBeInTheDocument(); // 4 scored → gap appears

  type('c');
  await waitFor(() => expect(screen.getByText('r3')).toBeInTheDocument());
  expect(screen.getAllByText(/still blank/i)).toHaveLength(1); // only once
});

it('suppresses the Gap when the session starts already mapped (returning user)', async () => {
  sendChatTurn.mockResolvedValue({ kind: 'reply', reply: 'r', signals: {}, profile: profileWith(5), sessionId: 's1' });
  render(<ChatScreen initialProfile={profileWith(4)} />);
  type('hi');
  await waitFor(() => expect(screen.getByText('r')).toBeInTheDocument());
  expect(screen.queryByText(/still blank/i)).not.toBeInTheDocument();
});

it('focuses the composer when "Keep going" is clicked', async () => {
  sendChatTurn.mockResolvedValue({ kind: 'reply', reply: 'r', signals: {}, profile: profileWith(4), sessionId: 's1' });
  render(<ChatScreen initialProfile={emptyProfile} />);
  type('hi');
  await waitFor(() => expect(screen.getByText(/still blank/i)).toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: /keep going/i }));
  expect(screen.getByRole('textbox')).toHaveFocus();
});

it('clears the Gap card after the check-in is ended', async () => {
  sendChatTurn.mockResolvedValue({ kind: 'reply', reply: 'r', signals: {}, profile: profileWith(4), sessionId: 's1' });
  render(<ChatScreen initialProfile={emptyProfile} />);
  type('hi');
  await waitFor(() => expect(screen.getByText(/still blank/i)).toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: /wellness score/i })); // open the drawer
  fireEvent.click(screen.getByRole('button', { name: /end check-?in/i }));
  expect(screen.queryByText(/still blank/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 3: Run them — confirm FAIL** (`npx vitest run test/chat/chat-screen.test.tsx`). Expected: no Gap card rendered.

- [ ] **Step 4: Edit `components/chat/ChatScreen.tsx`**

Update imports + types (top of file):

```tsx
'use client';
import { useRef, useState } from 'react';
import type { RadarProfile, Signals } from '@/lib/scoring';
import type { CrisisCard, LlmMessage } from '@/lib/safeguards/types';
import { sendChatTurn, endSession } from '@/lib/chat/client';
import { MessageList, isTextItem, type UiItem, type UiMessage } from './MessageList';
import { ChatComposer } from './ChatComposer';
import { ScorePill } from './ScorePill';
import { RadarDrawer } from './RadarDrawer';
import { scoredAxisCount, GAP_THRESHOLD } from '@/lib/chat/gap';
```

Inside the component, change the messages state to the union, add the composer ref + `gapShown`:

```tsx
export function ChatScreen({ initialProfile }: { initialProfile: RadarProfile }) {
  const opener = openerFor(initialProfile);
  const [messages, setMessages] = useState<UiItem[]>([
    { id: 0, role: 'assistant', content: opener },
  ]);
  const [signals, setSignals] = useState<Signals>({});
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [profile, setProfile] = useState<RadarProfile>(initialProfile);
  const [pending, setPending] = useState(false);
  const [crisis, setCrisis] = useState<CrisisCard | null>(null);
  const [capped, setCapped] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  // The Gap is a first-mapping beat: suppress it if the session already opens at/above
  // threshold (a returning user whose baseline already has 4+ axes).
  const [gapShown, setGapShown] = useState(scoredAxisCount(initialProfile) >= GAP_THRESHOLD);
  const idRef = useRef(0);
  const sendingRef = useRef(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const locked = pending || crisis !== null || capped;
  const nextId = () => ++idRef.current;
  const focusComposer = () => composerRef.current?.focus();
```

In `send()`, replace the wire-build line and the `reply` branch:

```tsx
      const wire: LlmMessage[] = history.filter(isTextItem).map((m) => ({ role: m.role, content: m.content }));
      const res = await sendChatTurn({ messages: wire, signals, sessionId });
      setPending(false);

      if (res.kind === 'reply') {
        const assistant: UiItem = { id: nextId(), role: 'assistant', content: res.reply };
        const next: UiItem[] = [...history, assistant];
        if (!gapShown && scoredAxisCount(res.profile) >= GAP_THRESHOLD) {
          setGapShown(true);
          next.push({ id: nextId(), kind: 'gap', profile: res.profile });
        }
        setMessages(next);
        setSignals(res.signals);
        setProfile(res.profile);
        setSessionId(res.sessionId);
        pulse();
      } else if (res.kind === 'redirect' || res.kind === 'error') {
```

> `history` is `[...messages, userMsg]` (now `UiItem[]`); `userMsg` stays `{ id, role: 'user', content: text }` typed as `UiMessage`/`UiItem`. Leave the `redirect`/`error`/`crisis`/`cap` branches unchanged.

In `endCheckIn()`, build the wire via the guard and reset `gapShown`:

```tsx
  function endCheckIn() {
    const sid = sessionId;
    const wire: LlmMessage[] = messages.filter(isTextItem).map((m) => ({ role: m.role, content: m.content }));
    setDrawerOpen(false);
    setMessages([{ id: 0, role: 'assistant', content: opener }]);
    setSignals({});
    setSessionId(undefined);
    setProfile(initialProfile);
    setCapped(false);
    setCrisis(null);
    setGapShown(scoredAxisCount(initialProfile) >= GAP_THRESHOLD);
    if (sid) void endSession({ messages: wire, sessionId: sid });
  }
```

Pass the ref + focus callback to the children in the JSX:

```tsx
        <MessageList messages={messages} pending={pending} crisis={crisis} capped={capped} focusComposer={focusComposer} />
        <ChatComposer onSend={send} disabled={locked} textareaRef={composerRef} />
```

- [ ] **Step 5: Run the chat tests — confirm PASS** (`npx vitest run test/chat/chat-screen.test.tsx`). All prior cases still pass; the 4 new cases pass.

- [ ] **Step 6: Full check** — `npx vitest run` (whole suite green; if a 5000ms jsdom-contention flake appears under WSL2, re-run the affected file in isolation). `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 7: Commit**

```bash
git add components/chat/ChatComposer.tsx components/chat/ChatScreen.tsx test/chat/chat-screen.test.tsx
git commit -m "phase-1: fire the Gap reveal at 4/6 axes + focus composer on Keep going

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Done criteria

- New user: after the reply that scores a 4th axis, an inline frozen radar card appears with the 2 `??` axes emphasized, a "{n} still blank" line, the soft teaser, and a "Keep going →" that focuses the composer. It fires exactly once per check-in.
- Returning user already at ≥4 axes: no Gap card.
- Ending the check-in clears the card and re-arms the trigger for the next session.
- No purchase/Stripe/intent code introduced. No DB/network/LLM changes.
- `npx vitest run`, `npx tsc --noEmit`, `npm run lint` all clean.

## Post-plan (not part of this branch)

- Security review before the PR (standing rule).
- Next iteration: the **Decision CTA** ($9/$29 purchase beat) — design carefully; see `memory/decision-cta-followup.md`.
