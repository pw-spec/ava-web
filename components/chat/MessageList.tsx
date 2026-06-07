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
      {/* mt-auto pins a sparse thread to the bottom (near the composer) instead of leaving a
          gap up top; it collapses once the conversation overflows, so scrolling stays normal. */}
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
    </div>
  );
}
