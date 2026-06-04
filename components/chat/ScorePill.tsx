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
