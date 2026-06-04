import { describe, it, expect } from 'vitest';
import { overlayProfile } from '@/lib/chat/overlay';
import type { AxisScores, RadarProfile } from '@/lib/scoring';

function prof(axes: Partial<AxisScores>): RadarProfile {
  const full = { energy: null, strength: null, sleep: null, drive: null, focus: null, body: null, ...axes } as AxisScores;
  return { axes: full, overall: null, tier: null };
}

describe('overlayProfile', () => {
  it('returns the session axes when there is no baseline', () => {
    const res = overlayProfile(null, prof({ energy: 80, sleep: 40 }));
    expect(res.axes.energy).toBe(80);
    expect(res.axes.sleep).toBe(40);
    expect(res.axes.drive).toBeNull();
    expect(res.overall).toBe(60); // mean of 80,40
    expect(res.tier?.label).toBe('Room to Grow');
  });

  it('falls back to baseline for axes untouched this session', () => {
    const baseline = { axes: { energy: 50, strength: 50, sleep: 50, drive: 50, focus: 50, body: 50 } as AxisScores };
    const res = overlayProfile(baseline, prof({ energy: 90 }));
    expect(res.axes.energy).toBe(90); // session wins
    expect(res.axes.sleep).toBe(50); // baseline retained
  });

  it('keeps a session score of 0 (does not treat 0 as missing)', () => {
    const baseline = { axes: { energy: 50, strength: 50, sleep: 50, drive: 50, focus: 50, body: 50 } as AxisScores };
    const res = overlayProfile(baseline, prof({ energy: 0 }));
    expect(res.axes.energy).toBe(0);
  });

  it('is all-?? when both are empty', () => {
    const res = overlayProfile(null, prof({}));
    expect(res.overall).toBeNull();
    expect(res.tier).toBeNull();
  });
});
