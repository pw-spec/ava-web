import { describe, it, expect, vi, beforeEach } from 'vitest';

const insert = vi.fn();
vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => ({ from: () => ({ insert }) }),
}));

import { POST } from '@/app/api/waitlist/route';
import { waitlistLimiter } from '@/lib/ratelimit/waitlist';

function req(body: unknown, ip = '1.2.3.4'): Request {
  return new Request('http://localhost/api/waitlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

describe('POST /api/waitlist', () => {
  beforeEach(() => {
    insert.mockReset();
    waitlistLimiter.reset();
  });

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

  it('silently drops a submission that fills the honeypot (200, no insert)', async () => {
    insert.mockResolvedValue({ error: null });
    const res = await POST(req({ email: 'a@b.com', website: 'http://spam' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(insert).not.toHaveBeenCalled();
  });

  it('rate-limits a single IP after the limit (429)', async () => {
    insert.mockResolvedValue({ error: null });
    let last = 200;
    for (let i = 0; i < 6; i++) {
      const res = await POST(req({ email: `u${i}@b.com` }, '9.9.9.9'));
      last = res.status;
    }
    expect(last).toBe(429);
  });

  it('does not rate-limit different IPs', async () => {
    insert.mockResolvedValue({ error: null });
    const a = await POST(req({ email: 'a@b.com' }, '10.0.0.1'));
    const b = await POST(req({ email: 'b@b.com' }, '10.0.0.2'));
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
  });
});
