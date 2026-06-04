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

  /** This slice: end = reset the conversation (scores already persisted per turn). 1C-b-iii adds the summary. */
  function endCheckIn() {
    setDrawerOpen(false);
    setMessages([]);
    setSignals({});
    setSessionId(undefined);
    setProfile(initialProfile);
    setCapped(false);
    setCrisis(null); // clear the crisis lock too — a reset must not leave a dead-end disabled composer
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
