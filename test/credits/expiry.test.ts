import { describe, it, expect } from 'vitest';
import { creditExpiry } from '@/lib/credits/expiry';

describe('creditExpiry', () => {
  it('returns an ISO timestamp the given number of months ahead', () => {
    expect(creditExpiry(new Date('2026-06-07T00:00:00.000Z'), 12)).toBe('2027-06-07T00:00:00.000Z');
  });
  it('advances mid-month timestamps by the month count, preserving the time', () => {
    expect(creditExpiry(new Date('2026-06-15T08:30:00.000Z'), 6)).toBe('2026-12-15T08:30:00.000Z');
  });
  it('does not mutate the input date', () => {
    const now = new Date('2026-06-07T00:00:00.000Z');
    creditExpiry(now, 12);
    expect(now.toISOString()).toBe('2026-06-07T00:00:00.000Z');
  });
});
