import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

beforeAll(() => {
  process.env.NEXT_PUBLIC_APP_URL = 'https://ava.test';
  process.env.STRIPE_PRICE_WELLNESS_PROFILE = 'price_123';
});

const { getUser, maybeSingle, create } = vi.hoisted(() => ({
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  create: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));
vi.mock('@/lib/stripe/server', () => ({
  getStripe: () => ({ checkout: { sessions: { create } } }),
}));

import { POST } from '@/app/api/checkout/route';

function req(body?: unknown): Request {
  return new Request('https://ava.test/api/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('POST /api/checkout', () => {
  beforeEach(() => {
    getUser.mockReset().mockResolvedValue({ data: { user: { id: 'u1' } } });
    maybeSingle.mockReset().mockResolvedValue({ data: { state_code: 'TX', ai_disclosure_accepted_at: 't' } });
    create.mockReset().mockResolvedValue({ url: 'https://checkout.stripe.test/cs_1', id: 'cs_1' });
  });

  it('401 when unauthenticated', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await POST(req({}))).status).toBe(401);
  });

  it('403 when the gate is not satisfied (e.g. disclosure not accepted)', async () => {
    maybeSingle.mockResolvedValue({ data: { state_code: 'TX', ai_disclosure_accepted_at: null } });
    expect((await POST(req({}))).status).toBe(403);
  });

  it('403 for a geo-blocked state', async () => {
    maybeSingle.mockResolvedValue({ data: { state_code: 'CA', ai_disclosure_accepted_at: 't' } });
    expect((await POST(req({}))).status).toBe(403);
  });

  it('creates a Checkout Session with the price + user/session metadata and returns the url', async () => {
    const res = await POST(req({ sessionId: '00000000-0000-0000-0000-000000000001' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: 'https://checkout.stripe.test/cs_1' });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        line_items: [{ price: 'price_123', quantity: 1 }],
        client_reference_id: 'u1',
        metadata: { userId: 'u1', sessionId: '00000000-0000-0000-0000-000000000001' },
        success_url: 'https://ava.test/profile?checkout=success',
        cancel_url: 'https://ava.test/home?checkout=cancelled',
      }),
    );
  });

  it('works without a sessionId (empty string metadata) and rejects a non-uuid sessionId', async () => {
    expect((await POST(req({}))).status).toBe(200);
    expect(create.mock.calls.at(-1)?.[0].metadata).toEqual({ userId: 'u1', sessionId: '' });
    expect((await POST(req({ sessionId: 'not-a-uuid' }))).status).toBe(400);
  });
});
