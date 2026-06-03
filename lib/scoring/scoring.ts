import {
  AXES,
  type AxisScores,
  type RadarProfile,
  type Severity,
  type Signals,
  type Tier,
} from './types';

function axisScore(severities: Severity[] | undefined): number | null {
  if (!severities || severities.length === 0) return null;
  const mean = severities.reduce((a, b) => a + b, 0) / severities.length;
  return Math.round((mean / 4) * 100);
}

export function computeAxisScores(signals: Signals): AxisScores {
  const out = {} as AxisScores;
  for (const axis of AXES) {
    out[axis] = axisScore(signals[axis]);
  }
  return out;
}

export function computeOverall(scores: AxisScores): number | null {
  const vals = AXES.map((a) => scores[a]).filter((v): v is number => v !== null);
  if (vals.length === 0) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

const TIERS: { min: number; label: Tier['label']; color: string }[] = [
  { min: 80, label: 'Optimized', color: 'var(--tier-optimized)' },
  { min: 65, label: 'Solid', color: 'var(--tier-solid)' },
  { min: 50, label: 'Room to Grow', color: 'var(--tier-room)' },
  { min: 35, label: 'Needs Attention', color: 'var(--tier-attention)' },
  { min: 20, label: 'Flagged', color: 'var(--tier-flagged)' },
  { min: 0, label: 'Critical', color: 'var(--tier-critical)' },
];

export function tierForOverall(overall: number | null): Tier | null {
  if (overall === null) return null;
  const t = TIERS.find((x) => overall >= x.min);
  // overall is always >= 0, so the last tier (min 0) always matches.
  return t ? { label: t.label, color: t.color } : null;
}

export function computeProfile(signals: Signals): RadarProfile {
  const axes = computeAxisScores(signals);
  const overall = computeOverall(axes);
  return { axes, overall, tier: tierForOverall(overall) };
}
