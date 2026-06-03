import 'server-only';
import { createHmac } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ComplianceEvent, ComplianceRecord, ComplianceSink } from '@/lib/safeguards/types';

/** Events recorded to compliance_log: the safeguard-pipeline set plus onboarding/lifecycle events. */
export type ComplianceLogEvent = ComplianceEvent | 'disclosure_accepted' | 'geo_block' | 'refund';

/** Non-reversible, salted, stable per user. Survives PII deletion (not a foreign key). */
export function hashUserRef(userId: string): string {
  const salt = process.env.COMPLIANCE_LOG_SALT;
  if (!salt) throw new Error('COMPLIANCE_LOG_SALT is not set');
  return createHmac('sha256', salt).update(userId).digest('hex');
}

/** Inserts one de-identified audit row. Rejects if the DB returns an error (so `await`ing
 *  callers see failures); best-effort callers wrap this in `.catch`/try-catch. */
export async function writeComplianceEvent(
  client: SupabaseClient,
  record: { userRef: string; event: ComplianceLogEvent; outcome: string },
): Promise<void> {
  const { error } = await client.from('compliance_log').insert({
    user_ref: record.userRef,
    event: record.event,
    outcome: record.outcome,
  });
  if (error) throw new Error(`compliance_log insert failed: ${error.code ?? error.message}`);
}

/** Adapts the safeguard pipeline's sink to the de-identified compliance_log (service-role client). */
export function makeComplianceSink(client: SupabaseClient, userId: string): ComplianceSink {
  const userRef = hashUserRef(userId);
  return (record: ComplianceRecord) => {
    // best-effort: never block the user path on an audit-write failure
    void writeComplianceEvent(client, { userRef, event: record.event, outcome: record.outcome }).catch(
      () => {},
    );
  };
}
