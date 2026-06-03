export const AXES = ['energy', 'strength', 'sleep', 'drive', 'focus', 'body'] as const;
export type Axis = (typeof AXES)[number];

/** 0 = most symptomatic, 4 = optimized. */
export type Severity = 0 | 1 | 2 | 3 | 4;

export type Signals = Partial<Record<Axis, Severity[]>>;

export type AxisScores = Record<Axis, number | null>;

export type TierLabel =
  | 'Optimized'
  | 'Solid'
  | 'Room to Grow'
  | 'Needs Attention'
  | 'Flagged'
  | 'Critical';

export interface Tier {
  label: TierLabel;
  /** CSS custom-property reference, defined in globals.css */
  color: string;
}

export interface RadarProfile {
  axes: AxisScores;
  overall: number | null;
  tier: Tier | null;
}

export const AXIS_META: Record<Axis, { label: string; icon: string }> = {
  energy: { label: 'Energy', icon: '⚡' },
  strength: { label: 'Strength', icon: '💪' },
  sleep: { label: 'Sleep', icon: '🌙' },
  drive: { label: 'Drive', icon: '🔥' },
  focus: { label: 'Focus', icon: '🧠' },
  body: { label: 'Body', icon: '📊' },
};
