'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createShareCard } from '@/lib/share/client';

type State = { kind: 'idle' } | { kind: 'sharing' } | { kind: 'done'; url: string } | { kind: 'error' };

/** "Share my baseline" — mints a brag card and reveals the public link (copy + native share).
 *  Renders nothing until the user has a baseline (`canShare`). */
export function ShareBaseline({ canShare }: { canShare: boolean }) {
  const [state, setState] = useState<State>({ kind: 'idle' });
  if (!canShare) return null;

  async function share() {
    setState({ kind: 'sharing' });
    const res = await createShareCard();
    if (!res.ok) {
      setState({ kind: 'error' });
      return;
    }
    setState({ kind: 'done', url: res.url });
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ url: res.url, title: 'My wellness baseline' });
      } catch {
        // user dismissed the native share sheet — the link is still shown for copy
      }
    }
  }

  if (state.kind === 'done') {
    return (
      <div className="mt-3 rounded-2xl border border-border bg-background p-3">
        <p className="text-xs text-muted-foreground">Your shareable link</p>
        <div className="mt-1 flex items-center gap-2">
          <input
            readOnly
            value={state.url}
            aria-label="Share link"
            className="min-w-0 flex-1 truncate rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground"
          />
          <Button
            type="button"
            onClick={() => void navigator.clipboard?.writeText(state.url)}
            className="shrink-0"
          >
            Copy
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <Button
        type="button"
        variant="outline"
        onClick={share}
        disabled={state.kind === 'sharing'}
        className="w-full"
      >
        {state.kind === 'sharing' ? 'Creating link…' : 'Share my baseline'}
      </Button>
      {state.kind === 'error' && (
        <p className="mt-1 text-center text-xs text-destructive">Couldn&apos;t create a link — try again.</p>
      )}
    </div>
  );
}
