import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

beforeAll(() => {
  process.env.NEXT_PUBLIC_APP_URL = 'https://ava.test';
});

const { getUser, maybeSingle, insert, card } = vi.hoisted(() => ({
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  insert: vi.fn(),
  card: { buildShareCard: vi.fn(), generateShareToken: vi.fn() },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({ getSupabaseAdmin: () => ({ from: () => ({ insert }) }) }));
vi.mock('@/lib/share/card', () => card);

import { POST } from '@/app/api/share/route';

function req(body?: unknown): Request {
  return new Request('https://ava.test/api/share', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('POST /api/share', () => {
  beforeEach(() => {
    getUser.mockReset().mockResolvedValue({ data: { user: { id: 'u1' } } });
    maybeSingle.mockReset().mockResolvedValue({ data: { state_code: 'TX', ai_disclosure_accepted_at: 't' } });
    insert.mockReset().mockResolvedValue({ error: null });
    card.buildShareCard.mockReset().mockResolvedValue({ overall: 47, silhouette: [40, 0, 60, 50, 45, 55] });
    card.generateShareToken.mockReset().mockReturnValue('tok123');
  });

  it('401 when unauthenticated', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await POST(req({}))).status).toBe(401);
  });

  it('403 when the gate is not satisfied', async () => {
    maybeSingle.mockResolvedValue({ data: { state_code: 'TX', ai_disclosure_accepted_at: null } });
    expect((await POST(req({}))).status).toBe(403);
  });

  it('400 when there is no baseline yet', async () => {
    card.buildShareCard.mockResolvedValue({ overall: null, silhouette: [] });
    expect((await POST(req({}))).status).toBe(400);
  });

  it('creates a card and returns the public url', async () => {
    const res = await POST(req({ displayName: 'Pat' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ token: 'tok123', url: 'https://ava.test/share/tok123' });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'tok123', user_id: 'u1', overall: 47, display_name: 'Pat' }),
    );
  });

  it('works with no body (anonymous share)', async () => {
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ display_name: null }));
  });

  it('400 on an over-long displayName', async () => {
    expect((await POST(req({ displayName: 'x'.repeat(80) }))).status).toBe(400);
  });
});
