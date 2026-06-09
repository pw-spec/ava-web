import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { LedgerRow } from './balance';

/** Credit/profile data is not best-effort: surface DB errors so callers don't silently lose data. */
function ensureOk(table: string, error: { code?: string; message?: string } | null): void {
  if (error) throw new Error(`${table} query failed: ${error.code ?? error.message}`);
}

/** All ledger rows for a user, read via the caller's client (user RLS client or admin). The
 *  selected columns match `LedgerRow` exactly, so the result feeds `creditBalance`/`outstandingLiability`. */
export async function getLedger(client: SupabaseClient, userId: string): Promise<LedgerRow[]> {
  const { data, error } = await client
    .from('credit_ledger')
    .select('delta, unit_price_cents, expires_at')
    .eq('user_id', userId);
  ensureOk('credit_ledger', error);
  return (data ?? []) as LedgerRow[];
}

export interface GrantInput {
  userId: string;
  delta: number;
  reason: string;
  unitPriceCents: number;
  expiresAt: string | null;
  stripeEventId: string;
}

/**
 * Insert a credit grant via the service-role client. Idempotent on `stripe_event_id`: a duplicate
 * (Postgres 23505) is treated as already-processed (`granted: false`), so webhook retries never
 * double-grant. Other errors throw.
 */
export async function grantCredits(
  admin: SupabaseClient,
  input: GrantInput,
): Promise<{ granted: boolean }> {
  const { error } = await admin.from('credit_ledger').insert({
    user_id: input.userId,
    delta: input.delta,
    reason: input.reason,
    unit_price_cents: input.unitPriceCents,
    expires_at: input.expiresAt,
    stripe_event_id: input.stripeEventId,
  });
  if (error) {
    if (error.code === '23505') return { granted: false };
    ensureOk('credit_ledger', error);
  }
  return { granted: true };
}

/** The wellness-profile lifecycle: paid (entitlement granted) → ready (report generated). */
export type ProfileStatus = 'paid' | 'ready';

export interface WellnessProfileRecord {
  id: string;
  session_id: string | null;
  status: ProfileStatus;
  report: string | null;
}

/** The user's most-recent wellness-profile entitlement (optionally scoped to one session). */
export async function getWellnessProfile(
  client: SupabaseClient,
  userId: string,
  sessionId?: string,
): Promise<WellnessProfileRecord | null> {
  let query = client
    .from('wellness_profiles')
    .select('id, session_id, status, report')
    .eq('user_id', userId);
  if (sessionId) query = query.eq('session_id', sessionId);
  const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
  ensureOk('wellness_profiles', error);
  return (data as WellnessProfileRecord | null) ?? null;
}

export interface EntitlementInput {
  userId: string;
  sessionId: string | null;
  stripeCheckoutId: string;
  status: ProfileStatus;
}

/** Create/refresh the purchase entitlement via the service-role client. Idempotent on stripe_checkout_id. */
export async function upsertEntitlement(admin: SupabaseClient, input: EntitlementInput): Promise<void> {
  const { error } = await admin.from('wellness_profiles').upsert(
    {
      user_id: input.userId,
      session_id: input.sessionId,
      stripe_checkout_id: input.stripeCheckoutId,
      status: input.status,
    },
    { onConflict: 'stripe_checkout_id' },
  );
  ensureOk('wellness_profiles', error);
}

/** Store the (already-encrypted) report and flip status to ready. Service-role write. */
export async function saveReport(admin: SupabaseClient, id: string, encryptedReport: string): Promise<void> {
  const { error } = await admin
    .from('wellness_profiles')
    .update({ report: encryptedReport, status: 'ready' })
    .eq('id', id);
  ensureOk('wellness_profiles', error);
}
