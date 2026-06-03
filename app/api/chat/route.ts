import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { gateDecision } from '@/lib/auth/gate';
import { makeComplianceSink } from '@/lib/compliance/log';
import { scanForEmergency } from '@/lib/safeguards/emergency-detection';
import { runChatTurn } from '@/lib/chat/turn';
import type { Signals } from '@/lib/scoring';
import type { LlmMessage } from '@/lib/safeguards/types';

const CAP = Number(process.env.FREE_DAILY_MESSAGE_CAP ?? '10');

const severities = z.array(z.number().int().min(0).max(4));

// Strict per-axis shape: rejects unknown axis keys (defense-in-depth). Zod infers
// `number[]` for the arrays; the route casts to `Signals` below (runtime-validated 0–4).
const signalsSchema = z
  .object({
    energy: severities.optional(),
    strength: severities.optional(),
    sleep: severities.optional(),
    drive: severities.optional(),
    focus: severities.optional(),
    body: severities.optional(),
  })
  .strict()
  .default({});

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(4000) }))
    .min(1),
  signals: signalsSchema,
});

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Full gate (this endpoint collects health signals).
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

  const messages = parsed.data.messages as LlmMessage[];
  const last = messages[messages.length - 1];
  if (last.role !== 'user') return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  // Free daily cap (soft funnel control; fail open on counter error).
  // A crisis message is NEVER capped: the self-harm protocol applies everywhere
  // (CLAUDE.md rules 1 & 6), so emergencies fall through to the safeguarded turn,
  // which serves the crisis card (no model call) and logs the compliance event.
  const admin = getSupabaseAdmin();
  const { data: count, error: bumpErr } = await admin.rpc('bump_chat_usage', { p_user: user.id });
  const overCap = !bumpErr && typeof count === 'number' && count > CAP;
  if (overCap && !scanForEmergency(last.content).hit) {
    return NextResponse.json({
      kind: 'cap',
      text: "That's your free check-in for today — come back tomorrow to keep going.",
    });
  }

  const result = await runChatTurn({
    history: messages.slice(0, -1),
    userMessage: last.content,
    // reason: zod infers number[]; the schema runtime-validates each to an int 0–4 (a Severity).
    signals: parsed.data.signals as Signals,
    log: makeComplianceSink(admin, user.id),
  });
  return NextResponse.json(result);
}
