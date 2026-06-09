import type { ReactNode } from 'react';
import { AvaBubble } from '@/components/chat/AvaBubble';

/** One chat turn. Ava = card surface (left); the user = terracotta brand (right). */
export function MessageBubble({ role, children }: { role: 'user' | 'assistant'; children: ReactNode }) {
  if (role === 'assistant') {
    return <AvaBubble className="max-w-[80%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">{children}</AvaBubble>;
  }
  return (
    <div className="flex w-full justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-primary-foreground">
        {children}
      </div>
    </div>
  );
}
