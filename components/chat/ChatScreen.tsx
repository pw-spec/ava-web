'use client';
import { useRef, useState } from 'react';
import type { RadarProfile, Signals } from '@/lib/scoring';
import type { CrisisCard, LlmMessage } from '@/lib/safeguards/types';
import { sendChatTurn, endSession } from '@/lib/chat/client';
import { MessageList, type UiMessage } from './MessageList';
import { ChatComposer } from './ChatComposer';
import { ScorePill } from './ScorePill';
import { RadarDrawer } from './RadarDrawer';

const NEW_USER_OPENER =
  "Hey — I'm Ava. I'm not a doctor, just someone in your corner here to check in on how " +
  "you're actually doing. No rush, nothing's off-limits. Let's start easy: how's your energy " +
  'been this past week?';

/** Ava always speaks first so the screen is never an empty void (and to set the warm, non-clinical
 *  tone + AI framing up front). A returning user gets a continuity nod to their last overall. */
function openerFor(profile: RadarProfile): string {
  if (profile.overall !== null) {
    return (
      `Good to see you back. Last time your overall landed around ${profile.overall} — ` +
      "let's see where things are now. How's your energy been since we last talked?"
    );
  }
  return NEW_USER_OPENER;
}

export function ChatScreen({ initialProfile }: { initialProfile: RadarProfile }) {
  const opener = openerFor(initialProfile);
  const [messages, setMessages] = useState<UiMessage[]>([
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
  const idRef = useRef(0);
  // Synchronous latch: the `locked` derived state only disables the composer after a
  // re-render, so a same-tick double-trigger (Enter + click) could fire two concurrent
  // credit-metered turns. The ref closes that window deterministically.
  const sendingRef = useRef(false);

  const locked = pending || crisis !== null || capped;
  const nextId = () => ++idRef.current;

  function pulse() {
    setPulsing(true);
    setTimeout(() => setPulsing(false), 1200);
  }

  async function send(text: string) {
    if (locked || sendingRef.current) return;
    sendingRef.current = true;
    try {
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
    } finally {
      sendingRef.current = false;
    }
  }

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

  return (
    <div className="relative min-h-screen w-full bg-background">
      {/* Warm atmosphere behind the centered column — gives wide screens depth instead of a dead field. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% -10%, rgba(200,100,60,0.10), transparent 55%), ' +
            'radial-gradient(85% 55% at 50% 108%, rgba(217,164,65,0.10), transparent 50%)',
        }}
      />
      <main className="relative mx-auto flex h-screen max-w-md flex-col border-x border-border/60 bg-background shadow-[0_0_80px_rgba(43,38,34,0.05)]">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-semibold tracking-tight text-foreground">Ava</span>
          <ScorePill profile={profile} pulsing={pulsing} onToggle={() => setDrawerOpen((o) => !o)} />
        </header>
        <MessageList messages={messages} pending={pending} crisis={crisis} capped={capped} />
        <ChatComposer onSend={send} disabled={locked} />
      </main>
      <RadarDrawer
        open={drawerOpen}
        profile={profile}
        onClose={() => setDrawerOpen(false)}
        onEnd={endCheckIn}
      />
    </div>
  );
}
