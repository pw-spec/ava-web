import { describe, it, expect } from 'vitest';
import { scoredAxisCount, GAP_THRESHOLD } from '@/lib/chat/gap';
import { AXES, type RadarProfile } from '@/lib/scoring';

/** A profile with the first `n` axes (in AXES order) scored at 50, the rest null. */
function profileWith(n: number): RadarProfile {
  const axes = Object.fromEntries(AXES.map((a, i) => [a, i < n ? 50 : null])) as RadarProfile['axes'];
  return { axes, overall: n ? 50 : null, tier: null };
}

describe('scoredAxisCount', () => {
  it('counts only the non-null axes', () => {
    expect(scoredAxisCount(profileWith(0))).toBe(0);
    expect(scoredAxisCount(profileWith(3))).toBe(3);
    expect(scoredAxisCount(profileWith(4))).toBe(4);
    expect(scoredAxisCount(profileWith(6))).toBe(6);
  });
});

describe('GAP_THRESHOLD', () => {
  it('is 4 — fires with two axes still unscored', () => {
    expect(GAP_THRESHOLD).toBe(4);
    expect(scoredAxisCount(profileWith(3)) >= GAP_THRESHOLD).toBe(false);
    expect(scoredAxisCount(profileWith(4)) >= GAP_THRESHOLD).toBe(true);
  });
});
