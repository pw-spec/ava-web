/** The credit_ledger fields balance/liability math needs (a plain row, no DB coupling). */
export interface LedgerRow {
  delta: number;
  unit_price_cents: number;
  expires_at: string | null;
}

/** Current balance = sum of all deltas (grants − consumption/expiry/refund). Whole credits. */
export function creditBalance(rows: LedgerRow[]): number {
  return rows.reduce((sum, r) => sum + r.delta, 0);
}

/**
 * Cash we would owe if every live credit were refunded: Σ over unexpired positive grants of
 * (delta × unit_price_cents). Consumption/expiry/refund rows (delta ≤ 0) don't add; expired
 * grants are no longer owed. This is the conservative basis for the future /admin/liability view.
 *
 * Note: credits aren't spent yet (avatar metering is 1F), so no FIFO remaining-credit allocation
 * across grants is needed here; add it when consumption rows exist.
 */
export function outstandingLiability(rows: LedgerRow[], now: Date): number {
  return rows.reduce((sum, r) => {
    if (r.delta <= 0) return sum;
    if (r.expires_at !== null && new Date(r.expires_at) <= now) return sum;
    return sum + r.delta * r.unit_price_cents;
  }, 0);
}
