import { describe, it, expect, vi, beforeEach } from 'vitest';

const insert = vi.fn();
vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => ({ from: () => ({ insert }) }),
}));

import { POST } from '@/app/api/waitlist/route';

function req(body: unknown): Request {
  return new Request('http://localhost/api/waitlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/waitlist', () => {
  beforeEach(() => insert.mockReset());

  it('rejects an invalid email with 400', async () => {
    const res = await POST(req({ email: 'nope' }));
    expect(res.status).toBe(400);
  });

  it('stores a valid email and returns 200', async () => {
    insert.mockResolvedValue({ error: null });
    const res = await POST(req({ email: 'a@b.com' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(insert).toHaveBeenCalledWith({ email: 'a@b.com' });
  });

  it('treats a duplicate as success (200)', async () => {
    insert.mockResolvedValue({ error: { code: '23505' } });
    const res = await POST(req({ email: 'a@b.com' }));
    expect(res.status).toBe(200);
  });

  it('returns 500 on an unexpected database error', async () => {
    insert.mockResolvedValue({ error: { code: '500' } });
    const res = await POST(req({ email: 'a@b.com' }));
    expect(res.status).toBe(500);
  });
});
