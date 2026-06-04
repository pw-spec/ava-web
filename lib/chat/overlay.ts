import {
  AXES,
  computeOverall,
  tierForOverall,
  type AxisScores,
  type RadarProfile,
} from '@/lib/scoring';

/**
 * Merge this session's computed axes over a prior baseline so a returning user keeps
 * continuity: session score if scored this session, else the baseline score, else null (??).
 * Overall + tier are recomputed from the overlaid axes (never carried over). Pure.
 */
export function overlayProfile(
  baseline: { axes: AxisScores } | null,
  session: RadarProfile,
): RadarProfile {
  const axes = {} as AxisScores;
  for (const axis of AXES) {
    axes[axis] = session.axes[axis] ?? baseline?.axes[axis] ?? null;
  }
  const overall = computeOverall(axes);
  return { axes, overall, tier: tierForOverall(overall) };
}
