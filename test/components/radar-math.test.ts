import { describe, it, expect } from 'vitest';
import { pointForValue, scoresToValues } from '@/components/radar/geometry';
import { lerp, lerpArray } from '@/components/radar/animate';

describe('pointForValue', () => {
  it('puts axis 0 at the top at full value', () => {
    const p = pointForValue(0, 100, 100, 100, 80); // cx,cy=100, radius=80
    expect(p.x).toBeCloseTo(100, 1);
    expect(p.y).toBeCloseTo(20, 1); // straight up
  });

  it('puts value 0 at the center', () => {
    const p = pointForValue(2, 0, 100, 100, 80);
    expect(p.x).toBeCloseTo(100, 1);
    expect(p.y).toBeCloseTo(100, 1);
  });
});

describe('scoresToValues', () => {
  it('treats null axes as 0 for the polygon shape', () => {
    expect(scoresToValues({ energy: 50, strength: null, sleep: 100, drive: null, focus: null, body: null }))
      .toEqual([50, 0, 100, 0, 0, 0]);
  });
});

describe('lerp', () => {
  it('interpolates', () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
    expect(lerpArray([0, 0], [100, 50], 0.5)).toEqual([50, 25]);
  });
});
