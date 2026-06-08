/** ISO timestamp `months` calendar months after `now` — the `expires_at` for a credit grant.
 *  Copies the input (does not mutate). Per CREDIT_EXPIRY_MONTHS (default 12). */
export function creditExpiry(now: Date, months: number): string {
  const d = new Date(now.getTime());
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString();
}
