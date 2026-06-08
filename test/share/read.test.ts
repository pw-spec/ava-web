import { describe, it, expect, vi } from 'vitest';

const maybeSingle = vi.fn();
vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }) }),
}));

import { getShareCard } from '@/lib/share/read';

describe('getShareCard', () => {
  it('returns only the stripped public fields for a known token', async () => {
    maybeSingle.mockResolvedValue({
      data: { overall: 47, silhouette: [40, 0, 60, 50, 45, 55], display_name: 'Pat' },
      error: null,
    });
    const card = await getShareCard('tok123');
    expect(card).toEqual({ overall: 47, silhouette: [40, 0, 60, 50, 45, 55], displayName: 'Pat' });
    expect(Object.keys(card!).sort()).toEqual(['displayName', 'overall', 'silhouette']);
  });

  it('returns null for an unknown token', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await getShareCard('nope')).toBeNull();
  });

  it('returns null on a db error or a malformed row', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'boom' } });
    expect(await getShareCard('x')).toBeNull();
    maybeSingle.mockResolvedValue({ data: { overall: null, silhouette: [], display_name: null }, error: null });
    expect(await getShareCard('x')).toBeNull();
  });
});
