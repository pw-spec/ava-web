import { AXES, type RadarProfile } from '@/lib/scoring';

/** How many of the six axes currently have a (non-null) score. */
export function scoredAxisCount(profile: RadarProfile): number {
  return AXES.filter((axis) => profile.axes[axis] !== null).length;
}

/** The Gap reveal fires once the user has mapped at least this many axes (so 2 remain `??`). */
export const GAP_THRESHOLD = 4;
