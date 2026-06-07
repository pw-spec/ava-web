import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** The shared Ava (assistant) bubble surface — left-aligned card. `className` tunes
 *  padding/width per use (a text turn vs. the richer Gap card). */
export function AvaBubble({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className="flex w-full justify-start">
      <div className={cn('rounded-2xl rounded-bl-sm border border-border bg-card text-card-foreground', className)}>
        {children}
      </div>
    </div>
  );
}
