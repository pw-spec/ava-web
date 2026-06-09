import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

beforeAll(() => {
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  process.env.WELLNESS_PROFILE_CREDITS = '12';
  process.env.WELLNESS_PROFILE_PRICE_CENTS = '2900';
  process.env.CREDIT_EXPIRY_MONTHS = '12';
});

const { constructEvent, grantCredits, upsertEntitlement } = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  grantCredits: vi.fn(),
  upsertEntitlement: vi.fn(),
}));

vi.mock('@/lib/stripe/server', () => ({ getStripe: () => ({ webhooks: { constructEvent } }) }));
vi.mock('@/lib/supabase/admin', () => ({ getSupabaseAdmin: () => ({}) }));
vi.mock('@/lib/credits/store', () => ({ grantCredits, upsertEntitlement }));

import { POST } from '@/app/api/stripe/webhook/route';

function req(sig: string | null = 't=1,v1=abc'): Request {
  return new Request('https://ava.test/api/stripe/webhook', {
    method: 'POST',
    headers: sig === null ? {} : { 'stripe-signature': sig },
    body: '{"raw":"body"}',
  });
}

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    constructEvent.mockReset();
    grantCredits.mockReset().mockResolvedValue({ granted: true });
    upsertEntitlement.mockReset().mockResolvedValue(undefined);
  });

  it('400 when the signature header is missing', async () => {
    expect((await POST(req(null))).status).toBe(400);
    expect(grantCredits).not.toHaveBeenCalled();
  });

  it('400 when signature verification fails (forged)', async () => {
    constructEvent.mockImplementation(() => {
      throw new Error('bad sig');
    });
    expect((await POST(req())).status).toBe(400);
    expect(grantCredits).not.toHaveBeenCalled();
  });

  it('ignores non-checkout events with 200 and no grant', async () => {
    constructEvent.mockReturnValue({ id: 'evt_1', type: 'payment_intent.created', data: { object: {} } });
    expect((await POST(req())).status).toBe(200);
    expect(grantCredits).not.toHaveBeenCalled();
  });

  it('grants credits + entitlement on checkout.session.completed', async () => {
    constructEvent.mockReturnValue({
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_1', metadata: { userId: 'u1', sessionId: 's1' } } },
    });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(grantCredits).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: 'u1',
        delta: 12,
        reason: 'purchase:wellness_profile',
        unitPriceCents: 242, // round(2900 / 12)
        stripeEventId: 'evt_1',
      }),
    );
    // expires_at is an ISO string ~12 months out
    expect(grantCredits.mock.calls[0][1].expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(upsertEntitlement).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ userId: 'u1', sessionId: 's1', stripeCheckoutId: 'cs_1', status: 'paid' }),
    );
  });

  it('maps an empty-string sessionId to null entitlement session', async () => {
    constructEvent.mockReturnValue({
      id: 'evt_2',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_2', metadata: { userId: 'u1', sessionId: '' } } },
    });
    await POST(req());
    expect(upsertEntitlement.mock.calls.at(-1)?.[1]).toEqual(
      expect.objectContaining({ sessionId: null, stripeCheckoutId: 'cs_2' }),
    );
  });

  it('200 without granting when metadata.userId is absent', async () => {
    constructEvent.mockReturnValue({
      id: 'evt_3',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_3', metadata: {} } },
    });
    expect((await POST(req())).status).toBe(200);
    expect(grantCredits).not.toHaveBeenCalled();
  });

  it('still 200 + upserts the entitlement when the grant is an idempotent replay', async () => {
    grantCredits.mockResolvedValue({ granted: false });
    constructEvent.mockReturnValue({
      id: 'evt_dup',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_dup', metadata: { userId: 'u1', sessionId: 's1' } } },
    });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(upsertEntitlement).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ stripeCheckoutId: 'cs_dup', status: 'paid' }),
    );
  });
});
