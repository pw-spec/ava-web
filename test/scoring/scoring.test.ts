import { describe, it, expect } from 'vitest';
import {
  computeAxisScores,
  computeOverall,
  tierForOverall,
  computeProfile,
} from '@/lib/scoring';

describe('computeAxisScores', () => {
  it('maps the mean severity to 0-100 (all 4 -> 100, all 0 -> 0, all 2 -> 50)', () => {
    expect(computeAxisScores({ energy: [4, 4, 4] }).energy).toBe(100);
    expect(computeAxisScores({ energy: [0, 0] }).energy).toBe(0);
    expect(computeAxisScores({ energy: [2, 2] }).energy).toBe(50);
  });

  it('rounds to an integer', () => {
    expect(computeAxisScores({ sleep: [1, 2] }).sleep).toBe(38); // mean 1.5 -> 37.5 -> 38
  });

  it('returns null for axes with no signals', () => {
    expect(computeAxisScores({ energy: [4] }).sleep).toBeNull();
  });
});

describe('computeOverall', () => {
  it('averages only the scored axes', () => {
    const scores = computeAxisScores({ energy: [4, 4], sleep: [0, 0] }); // 100 and 0
    expect(computeOverall(scores)).toBe(50);
  });

  it('is null when nothing is scored', () => {
    expect(computeOverall(computeAxisScores({}))).toBeNull();
  });
});

describe('tierForOverall', () => {
  it.each<[number, string]>([
    [80, 'Optimized'],
    [79, 'Solid'],
    [65, 'Solid'],
    [64, 'Room to Grow'],
    [50, 'Room to Grow'],
    [49, 'Needs Attention'],
    [35, 'Needs Attention'],
    [34, 'Flagged'],
    [20, 'Flagged'],
    [19, 'Critical'],
    [0, 'Critical'],
  ])('overall %i -> %s', (overall, label) => {
    expect(tierForOverall(overall)?.label).toBe(label);
  });

  it('is null when overall is null', () => {
    expect(tierForOverall(null)).toBeNull();
  });
});

describe('computeProfile', () => {
  it('bundles axes, overall, and tier', () => {
    const p = computeProfile({ energy: [4, 4], sleep: [4, 4], drive: [4, 4] });
    expect(p.overall).toBe(100);
    expect(p.tier?.label).toBe('Optimized');
    expect(p.axes.focus).toBeNull();
  });
});
