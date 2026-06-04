'use client';
import type { RadarProfile } from '@/lib/scoring';
import { RadarChart } from '@/components/radar/RadarChart';
import { Button } from '@/components/ui/button';

/**
 * Controlled bottom drawer holding the full radar. When closed it renders nothing
 * (so it stays out of the a11y tree).
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
