import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { gateDecision } from '@/lib/auth/gate';
import { makeComplianceSink } from '@/lib/compliance/log';
import { getWellnessProfile, saveReport } from '@/lib/credits/store';
import { generateProfileReport } from '@/lib/safeguards/profile-report';
import { encryptField } from '@/lib/crypto/field';
import type { LlmMessage } from '@/lib/safeguards/types';

const bodySchema = z.object({
  sessionId: z.string().uuid(),
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(4000) }))
    .min(1),
});

/** Generate the paid Wellness Profile report from the posted transcript. Gated on a paid entitlement
 *  (created by the Stripe webhook). Idempotent (ready → no-op). Transcript is used then discarded. */
export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users')
    .select('state_code, ai_disclosure_accepted_at')
    .eq('id', user.id)
    .maybeSingle();
  const stateCode = (profile?.state_code as string | null) ?? null;
  const decision = gateDecision({
    hasSession: true,
    disclosureAccepted: Boolean(profile?.ai_disclosure_accepted_at),
    hasState: Boolean(stateCode),
    geoState: stateCode,
  });
  if (decision !== 'allow') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  // Entitlement gate: only a paid entitlement (created by the webhook) for THIS user+session can
  // generate. No entitlement yet → the webhook hasn't landed → pending (the client retries).
  const entitlement = await getWellnessProfile(supabase, user.id, parsed.data.sessionId);
  if (!entitlement) return NextResponse.json({ status: 'pending' });
  if (entitlement.status === 'ready') return NextResponse.json({ status: 'ready' });

  // status 'paid', no report yet → generate (Sonnet → output filter), encrypt, store, discard transcript.
  const admin = getSupabaseAdmin();
  let report: string | null = null;
  try {
    report = await generateProfileReport({
      messages: parsed.data.messages as LlmMessage[],
      log: makeComplianceSink(admin, user.id),
    });
  } catch {
    report = null;
  }
  if (!report) return NextResponse.json({ status: 'pending' }); // filter-drop/failure → retryable

  await saveReport(admin, entitlement.id, encryptField(report));
  return NextResponse.json({ status: 'ready' });
}
