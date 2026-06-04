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
