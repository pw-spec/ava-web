# Phase 1C-b-ii — Chat UI (Layout C) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the chat-immersive screen (layout C) at `/home` from the warm-themed shadcn primitives — a conversation thread with a typing indicator, a header score pill that pulses, and a pull-up radar drawer — consuming the 1C-b-i `/api/chat` (memory + per-session persistence already live).

**Architecture:** `/home` becomes a server component that pre-loads the user's latest radar snapshot and renders a client `ChatScreen`. `ChatScreen` owns the session state (`messages`, `signals`, `sessionId`, `profile`, `crisis`, `capped`, `pending`) and drives one turn per send via a typed `sendChatTurn` client against `/api/chat`. The full radar (`RadarChart`, reused) lives in a controlled bottom drawer toggled by the score pill. Replies arrive as whole messages (typing indicator; streaming deferred).

**Tech Stack:** Next.js 16 App Router (RSC + client components, TS strict), Tailwind v4 + shadcn (warm-themed), Vitest + Testing Library (jsdom). One shadcn primitive added (`textarea`); no other new deps.

**Spec:** `docs/superpowers/specs/2026-06-03-phase-1c-b-chat-ui-design.md`

**Conventions:** Branch `phase-1c-b-ii/chat-ui` (already created off `main`). `phase-1:` commits, one concern each, `Co-Authored-By` trailer. TS strict; no `any` without `// reason:`. Client components start with `'use client'`. Component tests start with `// @vitest-environment jsdom` and use RTL (`render`/`screen`/`fireEvent`); `afterEach(cleanup)` is already global in `test/setup.ts`.

**Builds on (existing):**
- `RadarChart({ profile }: { profile: RadarProfile })` and `TierBadge({ overall, tier })` from `components/radar` — reused as-is.
- `/api/chat` returns one of: `{kind:'reply', reply, signals, profile, sessionId}` · `{kind:'crisis', card, sessionId}` · `{kind:'redirect', text, sessionId}` · `{kind:'error', text, sessionId?}` · `{kind:'cap', text}`; HTTP 401/403/400/500 carry `{error}`.
- `CrisisCard = { kind:'crisis'; headline:string; resources:{label:string;contact:string}[] }` (`@/lib/safeguards/types`).
- `RadarProfile`, `Signals`, `AXES`, `tierForOverall` (`@/lib/scoring`); `LlmMessage` (`@/lib/safeguards/types`).
- Warm tokens: `bg-background`/`bg-card`/`text-foreground`/`text-muted-foreground`/`bg-primary`/`text-primary-foreground`/`border-border`/`bg-brand`; tier colors via `style={{ backgroundColor: tier.color }}`.

**Scope:** the chat screen + `/home` wiring only. The **"End check-in"** button is present in the drawer but in this slice only **resets the conversation client-side** (scores are already persisted per turn); wiring it to the Sonnet summarizer is **1C-b-iii**. Deferred: `/api/session/end`, the Gap reveal / CTA / brag card (1C-c), token streaming.

---

## File Structure

**Created:**
- `components/ui/textarea.tsx` — shadcn primitive (via CLI)
- `lib/chat/client.ts` — `ChatApiResponse` type + `sendChatTurn` fetch wrapper
- `components/chat/MessageBubble.tsx`, `components/chat/TypingIndicator.tsx`
- `components/chat/ScorePill.tsx`
- `components/chat/RadarDrawer.tsx`
- `components/chat/ChatComposer.tsx`
- `components/chat/MessageList.tsx`
- `components/chat/ChatScreen.tsx`
- Tests under `test/chat/` (one per component)

**Modified:**
- `app/(app)/home/page.tsx` — server component: load latest scores, render `ChatScreen`

---

## Task 1: shadcn `textarea` + the chat API client

**Files:**
- Create: `components/ui/textarea.tsx` (CLI), `lib/chat/client.ts`, `test/chat/client.test.ts`

- [ ] **Step 1: Add the shadcn textarea primitive**

```bash
npx shadcn@latest add textarea
```
Expected: creates `components/ui/textarea.tsx`. (It is a thin styled `<textarea>` — no new runtime deps.)

- [ ] **Step 2: Write the failing test** `test/chat/client.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { sendChatTurn } from '@/lib/chat/client';

afterEach(() => vi.unstubAllGlobals());

function stubFetch(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body }),
  );
}

describe('sendChatTurn', () => {
  it('returns the parsed reply on 200', async () => {
    stubFetch(200, { kind: 'reply', reply: 'hi', signals: {}, profile: {}, sessionId: 's1' });
    const res = await sendChatTurn({ messages: [{ role: 'user', content: 'hey' }], signals: {} });
    expect(res.kind).toBe('reply');
    if (res.kind === 'reply') expect(res.sessionId).toBe('s1');
  });

  it('maps a non-2xx response to a safe error', async () => {
    stubFetch(403, { error: 'Forbidden' });
    const res = await sendChatTurn({ messages: [{ role: 'user', content: 'x' }], signals: {} });
    expect(res.kind).toBe('error');
  });

  it('maps a network throw to a safe error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const res = await sendChatTurn({ messages: [{ role: 'user', content: 'x' }], signals: {} });
    expect(res.kind).toBe('error');
  });
});
```

- [ ] **Step 3: Run it — confirm FAIL**

Run: `npx vitest run test/chat/client.test.ts`
Expected: FAIL — cannot resolve `@/lib/chat/client`.

- [ ] **Step 4: Write `lib/chat/client.ts`**

```ts
import type { RadarProfile, Signals } from '@/lib/scoring';
import type { CrisisCard, LlmMessage } from '@/lib/safeguards/types';

export type ChatApiResponse =
  | { kind: 'reply'; reply: string; signals: Signals; profile: RadarProfile; sessionId: string }
  | { kind: 'crisis'; card: CrisisCard; sessionId: string | null }
  | { kind: 'redirect'; text: string; sessionId: string | null }
  | { kind: 'error'; text: string; sessionId?: string | null }
  | { kind: 'cap'; text: string };

const SAFE_ERROR = "Something went wrong on my end. Let's try that again in a moment.";
const OFFLINE = "I couldn't reach the server — check your connection and try again.";

/** POST one turn to /api/chat. Never throws: HTTP/network failures become a safe error kind. */
export async function sendChatTurn(body: {
  messages: LlmMessage[];
  signals: Signals;
  sessionId?: string;
}): Promise<ChatApiResponse> {
  let res: Response;
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return { kind: 'error', text: OFFLINE };
  }
  if (!res.ok) return { kind: 'error', text: SAFE_ERROR };
  return (await res.json()) as ChatApiResponse;
}
```

- [ ] **Step 5: Run it — confirm PASS**

Run: `npx vitest run test/chat/client.test.ts` → PASS.
Run: `npx tsc --noEmit` → clean. `npm run lint` → clean.

- [ ] **Step 6: Commit**

```bash
git add components/ui/textarea.tsx lib/chat/client.ts test/chat/client.test.ts package.json package-lock.json
git commit -m "phase-1: chat API client (sendChatTurn) + shadcn textarea

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `MessageBubble` + `TypingIndicator`

**Files:**
- Create: `components/chat/MessageBubble.tsx`, `components/chat/TypingIndicator.tsx`, `test/chat/message-bubble.test.tsx`

- [ ] **Step 1: Write the failing test** `test/chat/message-bubble.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';

describe('MessageBubble', () => {
  it('renders Ava (assistant) text aligned left', () => {
    const { container } = render(<MessageBubble role="assistant">How is your sleep?</MessageBubble>);
    expect(screen.getByText('How is your sleep?')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('justify-start');
  });

  it('renders the user message aligned right with the brand surface', () => {
    const { container } = render(<MessageBubble role="user">pretty rough</MessageBubble>);
    expect(container.firstChild).toHaveClass('justify-end');
  });
});

describe('TypingIndicator', () => {
  it('exposes an accessible label', () => {
    render(<TypingIndicator />);
    expect(screen.getByLabelText(/ava is typing/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — confirm FAIL**

Run: `npx vitest run test/chat/message-bubble.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write `components/chat/MessageBubble.tsx`**

```tsx
import type { ReactNode } from 'react';

/** One chat turn. Ava = card surface (left); the user = terracotta brand (right). */
export function MessageBubble({ role, children }: { role: 'user' | 'assistant'; children: ReactNode }) {
  const isUser = role === 'user';
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm border border-border bg-card text-card-foreground',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write `components/chat/TypingIndicator.tsx`**

```tsx
/** Three pulsing dots shown while Ava composes a reply. */
export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div
        className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3"
        aria-label="Ava is typing"
        role="status"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run — confirm PASS**

Run: `npx vitest run test/chat/message-bubble.test.tsx` → PASS. `npx tsc --noEmit` → clean. `npm run lint` → clean.

- [ ] **Step 6: Commit**

```bash
git add components/chat/MessageBubble.tsx components/chat/TypingIndicator.tsx test/chat/message-bubble.test.tsx
git commit -m "phase-1: chat message bubble + typing indicator

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: `ScorePill`

**Files:**
- Create: `components/chat/ScorePill.tsx`, `test/chat/score-pill.test.tsx`

The pill is the always-on progress glance (overall + tier color); it toggles the radar drawer and shows a pulse ring when `pulsing`.

- [ ] **Step 1: Write the failing test** `test/chat/score-pill.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScorePill } from '@/components/chat/ScorePill';
import type { RadarProfile } from '@/lib/scoring';

const profile: RadarProfile = {
  axes: { energy: 50, strength: null, sleep: null, drive: null, focus: null, body: null },
  overall: 47,
  tier: { label: 'Room to Grow', color: 'var(--tier-room)' },
};

describe('ScorePill', () => {
  it('shows the overall score and calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<ScorePill profile={profile} pulsing={false} onToggle={onToggle} />);
    const btn = screen.getByRole('button', { name: /wellness score 47/i });
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows a dash when there is no score yet', () => {
    const empty: RadarProfile = { axes: profile.axes, overall: null, tier: null };
    render(<ScorePill profile={empty} pulsing={false} onToggle={() => {}} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — confirm FAIL** (`npx vitest run test/chat/score-pill.test.tsx`).

- [ ] **Step 3: Write `components/chat/ScorePill.tsx`**

```tsx
'use client';
import type { RadarProfile } from '@/lib/scoring';

export function ScorePill({
  profile,
  pulsing,
  onToggle,
}: {
  profile: RadarProfile;
  pulsing: boolean;
  onToggle: () => void;
}) {
  const { overall, tier } = profile;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Wellness score ${overall ?? 'not yet measured'}. Tap to see your radar.`}
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold text-primary-foreground transition',
        pulsing ? 'ring-2 ring-brand-2 ring-offset-1 ring-offset-background' : '',
      ].join(' ')}
      style={{ backgroundColor: tier?.color ?? 'var(--brand)' }}
    >
      <span className="tabular-nums">{overall ?? '—'}</span>
      <span aria-hidden className="opacity-80">▾</span>
    </button>
  );
}
```

- [ ] **Step 4: Run — confirm PASS.** `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 5: Commit**

```bash
git add components/chat/ScorePill.tsx test/chat/score-pill.test.tsx
git commit -m "phase-1: header score pill (overall + tier, pulses on change)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: `RadarDrawer`

**Files:**
- Create: `components/chat/RadarDrawer.tsx`, `test/chat/radar-drawer.test.tsx`

A controlled bottom panel (slides up when `open`) reusing `RadarChart`. We use a plain controlled panel rather than a drag-based library: the interaction is tap-to-toggle (via the pill / a close button / the End button), which is simpler and robust to test. The **End check-in** button calls `onEnd` (this slice: resets the conversation; 1C-b-iii wires the Sonnet summary).

- [ ] **Step 1: Write the failing test** `test/chat/radar-drawer.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RadarDrawer } from '@/components/chat/RadarDrawer';
import type { RadarProfile } from '@/lib/scoring';

const profile: RadarProfile = {
  axes: { energy: 50, strength: null, sleep: null, drive: null, focus: null, body: null },
  overall: 47,
  tier: { label: 'Room to Grow', color: 'var(--tier-room)' },
};

describe('RadarDrawer', () => {
  it('renders the radar and the end button when open', () => {
    render(<RadarDrawer open profile={profile} onClose={() => {}} onEnd={() => {}} />);
    expect(screen.getByRole('img', { name: /wellness radar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /end check-?in/i })).toBeInTheDocument();
  });

  it('fires onEnd and onClose from their controls', () => {
    const onEnd = vi.fn();
    const onClose = vi.fn();
    render(<RadarDrawer open profile={profile} onClose={onClose} onEnd={onEnd} />);
    fireEvent.click(screen.getByRole('button', { name: /end check-?in/i }));
    expect(onEnd).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('is hidden from assistive tech when closed', () => {
    render(<RadarDrawer open={false} profile={profile} onClose={() => {}} onEnd={() => {}} />);
    expect(screen.queryByRole('img', { name: /wellness radar/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — confirm FAIL** (`npx vitest run test/chat/radar-drawer.test.tsx`).

- [ ] **Step 3: Write `components/chat/RadarDrawer.tsx`**

```tsx
'use client';
import type { RadarProfile } from '@/lib/scoring';
import { RadarChart } from '@/components/radar/RadarChart';
import { Button } from '@/components/ui/button';

/**
 * Controlled bottom drawer holding the full radar. When closed it renders nothing
 * (so it stays out of the a11y tree and the test can assert absence).
 */
export function RadarDrawer({
  open,
  profile,
  onClose,
  onEnd,
  ending = false,
}: {
  open: boolean;
  profile: RadarProfile;
  onClose: () => void;
  onEnd: () => void;
  ending?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true">
      <button aria-label="Close radar" onClick={onClose} className="absolute inset-0 bg-foreground/20" />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl border border-border bg-card p-5 shadow-xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" aria-hidden />
        <RadarChart profile={profile} />
        <Button onClick={onEnd} disabled={ending} className="mt-4 w-full">
          {ending ? 'Saving…' : 'End check-in & save'}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run — confirm PASS.** `npx tsc --noEmit` clean; `npm run lint` clean.

> Note: `RadarChart`'s `<svg>` has `role="img" aria-label="Wellness radar"`, so the test's `getByRole('img', { name: /wellness radar/i })` matches. The overlay `<button aria-label="Close radar">` matches `/close/i`.

- [ ] **Step 5: Commit**

```bash
git add components/chat/RadarDrawer.tsx test/chat/radar-drawer.test.tsx
git commit -m "phase-1: pull-up radar drawer (reuses RadarChart) + end-checkin button

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: `ChatComposer`

**Files:**
- Create: `components/chat/ChatComposer.tsx`, `test/chat/chat-composer.test.tsx`

- [ ] **Step 1: Write the failing test** `test/chat/chat-composer.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatComposer } from '@/components/chat/ChatComposer';

describe('ChatComposer', () => {
  it('sends trimmed text and clears the field', () => {
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} disabled={false} />);
    const box = screen.getByRole('textbox');
    fireEvent.change(box, { target: { value: '  low energy  ' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(onSend).toHaveBeenCalledWith('low energy');
    expect((box as HTMLTextAreaElement).value).toBe('');
  });

  it('does not send empty/whitespace', () => {
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} disabled={false} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('is disabled while a turn is pending', () => {
    render(<ChatComposer onSend={() => {}} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run — confirm FAIL** (`npx vitest run test/chat/chat-composer.test.tsx`).

- [ ] **Step 3: Write `components/chat/ChatComposer.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function ChatComposer({ onSend, disabled }: { onSend: (text: string) => void; disabled: boolean }) {
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

- [ ] **Step 4: Run — confirm PASS.** `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 5: Commit**

```bash
git add components/chat/ChatComposer.tsx test/chat/chat-composer.test.tsx
git commit -m "phase-1: chat composer (shadcn textarea + send; Enter to send)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: `MessageList` (thread + crisis card + cap note)

**Files:**
- Create: `components/chat/MessageList.tsx`, `test/chat/message-list.test.tsx`

Renders the conversation, the typing indicator, an inline **crisis card** (988/911), and a **cap** note. Auto-scrolls to the newest message.

- [ ] **Step 1: Write the failing test** `test/chat/message-list.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageList } from '@/components/chat/MessageList';
import { CRISIS_CARD } from '@/lib/safeguards/crisis-card';

const msgs = [
  { id: 1, role: 'user' as const, content: 'hey' },
  { id: 2, role: 'assistant' as const, content: 'how is your energy?' },
];

describe('MessageList', () => {
  it('renders the conversation turns', () => {
    render(<MessageList messages={msgs} pending={false} crisis={null} capped={false} />);
    expect(screen.getByText('hey')).toBeInTheDocument();
    expect(screen.getByText('how is your energy?')).toBeInTheDocument();
  });

  it('shows the typing indicator while pending', () => {
    render(<MessageList messages={msgs} pending crisis={null} capped={false} />);
    expect(screen.getByLabelText(/ava is typing/i)).toBeInTheDocument();
  });

  it('renders the crisis card with the 988 lifeline', () => {
    render(<MessageList messages={msgs} pending={false} crisis={CRISIS_CARD} capped={false} />);
    // `/988/` alone matches both the resource label and its contact → use the unique contact line.
    expect(screen.getByText(/call or text 988/i)).toBeInTheDocument();
    expect(screen.getByText(/in crisis/i)).toBeInTheDocument();
  });

  it('renders the daily-cap note', () => {
    render(<MessageList messages={msgs} pending={false} crisis={null} capped />);
    expect(screen.getByText(/free check-?in for today/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — confirm FAIL** (`npx vitest run test/chat/message-list.test.tsx`).

- [ ] **Step 3: Write `components/chat/MessageList.tsx`**

```tsx
'use client';
import { useEffect, useRef } from 'react';
import type { CrisisCard } from '@/lib/safeguards/types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

export type UiMessage = { id: number; role: 'user' | 'assistant'; content: string };

export function MessageList({
  messages,
  pending,
  crisis,
  capped,
}: {
  messages: UiMessage[];
  pending: boolean;
  crisis: CrisisCard | null;
  capped: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, pending, crisis, capped]);

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-6">
      {messages.map((m) => (
        <MessageBubble key={m.id} role={m.role}>
          {m.content}
        </MessageBubble>
      ))}
      {pending && <TypingIndicator />}
      {crisis && (
        <div className="rounded-2xl border border-destructive/40 bg-card p-4 text-sm" role="alert">
          <p className="font-semibold text-foreground">{crisis.headline}</p>
          <ul className="mt-2 space-y-1">
            {crisis.resources.map((r) => (
              <li key={r.label} className="text-muted-foreground">
                <span className="font-medium text-foreground">{r.label}:</span> {r.contact}
              </li>
            ))}
          </ul>
        </div>
      )}
      {capped && (
        <p className="rounded-2xl bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
          That&apos;s your free check-in for today — come back tomorrow to keep going.
        </p>
      )}
      <div ref={endRef} />
    </div>
  );
}
```

> Note: `endRef.current?.scrollIntoView` — jsdom does not implement `scrollIntoView`, but the optional call is harmless in tests (it's defined as `undefined`? No: it's a method that jsdom stubs as a no-op on elements). If a test errors on it, guard with `endRef.current?.scrollIntoView?.(...)`. Use the guarded form to be safe.

Use the guarded form in the implementation:
```tsx
    endRef.current?.scrollIntoView?.({ behavior: 'smooth' });
```

- [ ] **Step 4: Run — confirm PASS.** `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 5: Commit**

```bash
git add components/chat/MessageList.tsx test/chat/message-list.test.tsx
git commit -m "phase-1: message list (thread + typing + crisis card + cap note)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: `ChatScreen` (orchestrator)

**Files:**
- Create: `components/chat/ChatScreen.tsx`, `test/chat/chat-screen.test.tsx`

Owns session state and drives one turn per send. The test mocks `@/lib/chat/client`.

- [ ] **Step 1: Write the failing test** `test/chat/chat-screen.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { sendChatTurn } = vi.hoisted(() => ({ sendChatTurn: vi.fn() }));
vi.mock('@/lib/chat/client', () => ({ sendChatTurn }));

import { ChatScreen } from '@/components/chat/ChatScreen';
import type { RadarProfile } from '@/lib/scoring';

const emptyProfile: RadarProfile = {
  axes: { energy: null, strength: null, sleep: null, drive: null, focus: null, body: null },
  overall: null,
  tier: null,
};

function type(text: string) {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: /send/i }));
}

describe('ChatScreen', () => {
  beforeEach(() => sendChatTurn.mockReset());

  it('shows the user message then Ava reply and updates the score pill', async () => {
    sendChatTurn.mockResolvedValue({
      kind: 'reply',
      reply: 'Many men notice that. How is your sleep?',
      signals: { energy: [4] },
      profile: { ...emptyProfile, axes: { ...emptyProfile.axes, energy: 100 }, overall: 100, tier: { label: 'Optimized', color: 'x' } },
      sessionId: 's1',
    });
    render(<ChatScreen initialProfile={emptyProfile} />);
    type('my energy is great');
    expect(screen.getByText('my energy is great')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/how is your sleep/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /wellness score 100/i })).toBeInTheDocument();
  });

  it('sends the prior turns + sessionId on the second message', async () => {
    sendChatTurn.mockResolvedValue({ kind: 'reply', reply: 'ok', signals: {}, profile: emptyProfile, sessionId: 's1' });
    render(<ChatScreen initialProfile={emptyProfile} />);
    type('first');
    await waitFor(() => expect(screen.getByText('ok')).toBeInTheDocument());
    type('second');
    await waitFor(() => expect(sendChatTurn).toHaveBeenCalledTimes(2));
    const secondArg = sendChatTurn.mock.calls[1][0];
    expect(secondArg.sessionId).toBe('s1');
    expect(secondArg.messages.map((m: { content: string }) => m.content)).toEqual(['first', 'ok', 'second']);
  });

  it('renders the crisis card and locks the composer', async () => {
    sendChatTurn.mockResolvedValue({ kind: 'crisis', card: { kind: 'crisis', headline: 'help is available', resources: [{ label: '988', contact: 'Call 988' }] }, sessionId: null });
    render(<ChatScreen initialProfile={emptyProfile} />);
    type('I want to end it all');
    await waitFor(() => expect(screen.getByText(/help is available/i)).toBeInTheDocument());
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('disables the composer when capped', async () => {
    sendChatTurn.mockResolvedValue({ kind: 'cap', text: 'come back tomorrow' });
    render(<ChatScreen initialProfile={emptyProfile} />);
    type('hello');
    await waitFor(() => expect(screen.getByRole('textbox')).toBeDisabled());
  });
});
```

- [ ] **Step 2: Run — confirm FAIL** (`npx vitest run test/chat/chat-screen.test.tsx`).

- [ ] **Step 3: Write `components/chat/ChatScreen.tsx`**

```tsx
'use client';
import { useRef, useState } from 'react';
import type { RadarProfile, Signals } from '@/lib/scoring';
import type { CrisisCard, LlmMessage } from '@/lib/safeguards/types';
import { sendChatTurn } from '@/lib/chat/client';
import { MessageList, type UiMessage } from './MessageList';
import { ChatComposer } from './ChatComposer';
import { ScorePill } from './ScorePill';
import { RadarDrawer } from './RadarDrawer';

export function ChatScreen({ initialProfile }: { initialProfile: RadarProfile }) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [signals, setSignals] = useState<Signals>({});
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [profile, setProfile] = useState<RadarProfile>(initialProfile);
  const [pending, setPending] = useState(false);
  const [crisis, setCrisis] = useState<CrisisCard | null>(null);
  const [capped, setCapped] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const idRef = useRef(0);

  const locked = pending || crisis !== null || capped;
  const nextId = () => ++idRef.current;

  function pulse() {
    setPulsing(true);
    setTimeout(() => setPulsing(false), 1200);
  }

  async function send(text: string) {
    if (locked) return;
    const userMsg: UiMessage = { id: nextId(), role: 'user', content: text };
    const history: UiMessage[] = [...messages, userMsg];
    setMessages(history);
    setPending(true);

    const wire: LlmMessage[] = history.map((m) => ({ role: m.role, content: m.content }));
    const res = await sendChatTurn({ messages: wire, signals, sessionId });
    setPending(false);

    if (res.kind === 'reply') {
      setMessages([...history, { id: nextId(), role: 'assistant', content: res.reply }]);
      setSignals(res.signals);
      setProfile(res.profile);
      setSessionId(res.sessionId);
      pulse();
    } else if (res.kind === 'redirect' || res.kind === 'error') {
      setMessages([...history, { id: nextId(), role: 'assistant', content: res.text }]);
      if (res.sessionId) setSessionId(res.sessionId);
    } else if (res.kind === 'crisis') {
      setCrisis(res.card);
    } else if (res.kind === 'cap') {
      setCapped(true);
    }
  }

  /** This slice: end = reset the conversation (scores already persisted per turn). 1C-b-iii adds the summary. */
  function endCheckIn() {
    setDrawerOpen(false);
    setMessages([]);
    setSignals({});
    setSessionId(undefined);
    setProfile(initialProfile);
    setCapped(false);
  }

  return (
    <main className="mx-auto flex h-screen max-w-md flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="font-semibold tracking-tight text-foreground">Ava</span>
        <ScorePill profile={profile} pulsing={pulsing} onToggle={() => setDrawerOpen((o) => !o)} />
      </header>
      <MessageList messages={messages} pending={pending} crisis={crisis} capped={capped} />
      <ChatComposer onSend={send} disabled={locked} />
      <RadarDrawer
        open={drawerOpen}
        profile={profile}
        onClose={() => setDrawerOpen(false)}
        onEnd={endCheckIn}
      />
    </main>
  );
}
```

> Note on the timer: `setTimeout` for the pulse is fine in jsdom; the tests don't assert pulse timing, only the score text. `crisis`/`cap` correctly leave `locked` true so the composer disables.

- [ ] **Step 4: Run — confirm PASS** (`npx vitest run test/chat/chat-screen.test.tsx`). `npx tsc --noEmit` clean; `npm run lint` clean.

- [ ] **Step 5: Commit**

```bash
git add components/chat/ChatScreen.tsx test/chat/chat-screen.test.tsx
git commit -m "phase-1: ChatScreen orchestrator (turn loop, crisis/cap states, radar drawer)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Wire `/home` + full verification

**Files:**
- Modify: `app/(app)/home/page.tsx`

- [ ] **Step 1: Replace `app/(app)/home/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server';
import { getLatestHealthScores } from '@/lib/health/store';
import { AXES, tierForOverall, type AxisScores, type RadarProfile } from '@/lib/scoring';
import { ChatScreen } from '@/components/chat/ChatScreen';

function emptyAxes(): AxisScores {
  const axes = {} as AxisScores;
  for (const a of AXES) axes[a] = null;
  return axes;
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The proxy already gates this route; guard anyway. Pre-fill the radar from the latest snapshot.
  const latest = user ? await getLatestHealthScores(supabase, user.id) : null;
  const initialProfile: RadarProfile = latest
    ? { axes: latest.axes, overall: latest.overall, tier: tierForOverall(latest.overall) }
    : { axes: emptyAxes(), overall: null, tier: null };

  return <ChatScreen initialProfile={initialProfile} />;
}
```

> The sign-out affordance moves out of this placeholder; signout stays reachable at `/auth/signout` (a future header menu can surface it — out of scope here). This is acceptable: the route is a focused chat surface now.

- [ ] **Step 2: Typecheck + lint + full suite**

Run: `npx tsc --noEmit` → clean.
Run: `npm run lint` → clean.
Run: `npx vitest run` → all suites PASS (new chat component suites + the existing 185).

- [ ] **Step 3: Build**

Run: `npm run build` → succeeds; `/home` is present (`ƒ` dynamic, since it reads the session).

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/home/page.tsx"
git commit -m "phase-1: wire /home to the chat screen (pre-fill radar from latest scores)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 5 (manual, needs the dev server + ANTHROPIC_API_KEY): smoke**

On your machine: `npm run dev`, sign in as an onboarded (non-CA/NY) user, open `/home`. Send "my energy has been low" → Ava replies (typing indicator → message), the score pill updates + pulses, tapping it opens the radar with `??` on unscored axes. Send a self-harm message → the crisis card (988/911) renders and the composer locks. (Memory "remembers last time" and the real Sonnet summary land in 1C-b-iii.)

---

## Done criteria (Slice 1C-b-ii)

- [ ] `/home` is a working chat: send → typing indicator → Ava reply; the header score pill shows overall + tier and pulses on change; tapping it opens the radar drawer (`RadarChart` with `??` axes); the composer disables while pending.
- [ ] Multi-turn: the second send includes the prior turns + the `sessionId` from the first reply.
- [ ] Crisis result renders the 988/911 card and locks the composer; cap result shows the note and disables.
- [ ] The radar pre-fills from the user's latest snapshot on load.
- [ ] `sendChatTurn` never throws (HTTP/network → safe error kind).
- [ ] `npm run test` / `lint` / `build` green.

## Deferred

`/api/session/end` + the Sonnet summarizer wired to "End check-in" (1C-b-iii); the Gap reveal + Decision CTA + brag card + trend arrows (1C-c); token streaming.
