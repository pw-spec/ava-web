import { describe, it, expect, vi } from 'vitest';

const getLatestHealthScores = vi.fn();
vi.mock('@/lib/health/store', () => ({
  getLatestHealthScores: (...args: unknown[]) => getLatestHealthScores(...args),
}));

import { buildShareCard, generateShareToken } from '@/lib/share/card';
import type { AxisScores } from '@/lib/scoring';

const axes: AxisScores = { energy: 40, strength: 50, sleep: 60, drive: 0, focus: 45, body: 55 };

describe('buildShareCard', () => {
  it('emits only overall + an anonymized silhouette (same multiset, no labels)', async () => {
    getLatestHealthScores.mockResolvedValue({ axes, overall: 47 });
    const card = await buildShareCard({} as never, 'u1');
    expect(Object.keys(card).sort()).toEqual(['overall', 'silhouette']);
    expect(card.overall).toBe(47);
    expect(card.silhouette).toHaveLength(6);
    expect([...card.silhouette].sort((a, b) => a - b)).toEqual([0, 40, 45, 50, 55, 60]);
  });

  it('maps unscored axes to 0 in the shape', async () => {
    getLatestHealthScores.mockResolvedValue({ axes: { ...axes, body: null }, overall: 40 });
    const card = await buildShareCard({} as never, 'u1');
    expect(card.silhouette.filter((v) => v === 0)).toHaveLength(2);
  });

  it('returns null overall + empty silhouette when there is no baseline', async () => {
    getLatestHealthScores.mockResolvedValue(null);
    expect(await buildShareCard({} as never, 'u1')).toEqual({ overall: null, silhouette: [] });
    getLatestHealthScores.mockResolvedValue({ axes, overall: null });
    expect(await buildShareCard({} as never, 'u1')).toEqual({ overall: null, silhouette: [] });
  });
});

describe('generateShareToken', () => {
  it('produces a url-safe, non-empty, unique token', () => {
    const a = generateShareToken();
    const b = generateShareToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a.length).toBeGreaterThanOrEqual(22); // 16 random bytes → 22 base64url chars (locks the entropy floor)
    expect(a).not.toBe(b);
  });
});
