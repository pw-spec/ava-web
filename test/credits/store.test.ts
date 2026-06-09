import { describe, it, expect, vi } from 'vitest';
import {
  getLedger,
  grantCredits,
  getWellnessProfile,
  upsertEntitlement,
  saveReport,
} from '@/lib/credits/store';

/** A chainable Supabase mock: every builder method returns the builder; the builder is awaitable
 *  (resolves `result`) for terminal `.eq()`-style awaits, and `.maybeSingle()` resolves `result`. */
function mockClient(result: { data?: unknown; error?: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order', 'limit', 'insert', 'upsert', 'update']) {
    builder[m] = vi.fn(() => builder);
  }
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));
  // `builder.then` resolves the same `result` as `.maybeSingle()`, so the mock does not enforce terminal-call shape.
  (builder as { then?: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  // reason: the test mock stands in for SupabaseClient's fluent builder; `never` avoids re-typing it.
  return { client: { from: vi.fn(() => builder) } as never, builder };
}

describe('getLedger', () => {
  it('returns the ledger rows for a user', async () => {
    const { client } = mockClient({ data: [{ delta: 12, unit_price_cents: 242, expires_at: null }], error: null });
    expect(await getLedger(client, 'u1')).toEqual([{ delta: 12, unit_price_cents: 242, expires_at: null }]);
  });
  it('throws on a db error', async () => {
    const { client } = mockClient({ data: null, error: { code: 'XX' } });
    await expect(getLedger(client, 'u1')).rejects.toThrow(/credit_ledger/);
  });
});

describe('grantCredits', () => {
  const input = {
    userId: 'u1',
    delta: 12,
    reason: 'purchase:wellness_profile',
    unitPriceCents: 242,
    expiresAt: null,
    stripeEventId: 'evt_1',
  };
  it('inserts the grant and reports granted', async () => {
    const { client, builder } = mockClient({ error: null });
    expect(await grantCredits(client, input)).toEqual({ granted: true });
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ stripe_event_id: 'evt_1', delta: 12, unit_price_cents: 242 }),
    );
  });
  it('treats a duplicate stripe_event_id (23505) as an idempotent no-op', async () => {
    const { client } = mockClient({ error: { code: '23505' } });
    expect(await grantCredits(client, input)).toEqual({ granted: false });
  });
  it('throws on a non-conflict error', async () => {
    const { client } = mockClient({ error: { code: 'XX' } });
    await expect(grantCredits(client, input)).rejects.toThrow(/credit_ledger/);
  });
});

describe('getWellnessProfile', () => {
  it('returns the latest entitlement', async () => {
    const { client, builder } = mockClient({ data: { id: 'p1', session_id: 's1', status: 'paid', report: null }, error: null });
    expect(await getWellnessProfile(client, 'u1', 's1')).toEqual({
      id: 'p1',
      session_id: 's1',
      status: 'paid',
      report: null,
    });
    expect(builder.eq).toHaveBeenCalledWith('session_id', 's1');
  });
  it('returns null when there is no entitlement', async () => {
    const { client, builder } = mockClient({ data: null, error: null });
    expect(await getWellnessProfile(client, 'u1')).toBeNull();
    expect(builder.eq).toHaveBeenCalledTimes(1);
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1');
  });
});

describe('upsertEntitlement', () => {
  it('upserts on stripe_checkout_id', async () => {
    const { client, builder } = mockClient({ error: null });
    await expect(
      upsertEntitlement(client, { userId: 'u1', sessionId: 's1', stripeCheckoutId: 'cs_1', status: 'paid' }),
    ).resolves.toBeUndefined();
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ stripe_checkout_id: 'cs_1', status: 'paid' }),
      { onConflict: 'stripe_checkout_id' },
    );
  });
});

describe('saveReport', () => {
  it('writes the encrypted report and flips status to ready', async () => {
    const { client, builder } = mockClient({ error: null });
    await expect(saveReport(client, 'p1', 'v1:abc')).resolves.toBeUndefined();
    expect(builder.update).toHaveBeenCalledWith({ report: 'v1:abc', status: 'ready' });
  });
});
