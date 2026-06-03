import type { Tier } from '@/lib/scoring';

export function TierBadge({ overall, tier }: { overall: number | null; tier: Tier | null }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span data-testid="overall" className="text-5xl font-semibold tabular-nums text-[var(--fg)]">
        {overall ?? '—'}
      </span>
      {tier && (
        <span
          className="rounded-full px-3 py-1 text-sm font-medium text-white"
          style={{ backgroundColor: tier.color }}
        >
          {tier.label}
        </span>
      )}
    </div>
  );
}
