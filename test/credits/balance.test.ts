import { describe, it, expect } from 'vitest';
import { creditBalance, outstandingLiability, type LedgerRow } from '@/lib/credits/balance';

const row = (delta: number, unit: number, expires: string | null): LedgerRow => ({
  delta,
  unit_price_cents: unit,
  expires_at: expires,
});

describe('creditBalance', () => {
  it('is 0 for an empty ledger', () => {
    expect(creditBalance([])).toBe(0);
  });
  it('sums deltas (grants minus consumption/expiry/refund)', () => {
    expect(creditBalance([row(12, 242, null), row(-2, 0, null)])).toBe(10);
  });
});

describe('outstandingLiability', () => {
  const now = new Date('2026-06-07T00:00:00Z');
  it('sums unexpired positive grants × their unit price', () => {
    expect(outstandingLiability([row(12, 242, '2027-06-07T00:00:00Z')], now)).toBe(2904);
  });
  it('excludes expired grants and non-grant (≤0) rows', () => {
    expect(
      outstandingLiability(
        [
          row(12, 242, '2026-01-01T00:00:00Z'), // expired grant → not owed
          row(-2, 0, null), // consumption → not a positive grant
          row(8, 150, '2027-06-07T00:00:00Z'), // live grant → 1200
        ],
        now,
      ),
    ).toBe(1200);
  });
  it('treats a null expires_at as never-expiring', () => {
    expect(outstandingLiability([row(4, 100, null)], now)).toBe(400);
  });
});
