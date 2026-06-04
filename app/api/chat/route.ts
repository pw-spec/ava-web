import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { gateDecision } from '@/lib/auth/gate';
import { makeComplianceSink } from '@/lib/compliance/log';
import { scanForEmergency } from '@/lib/safeguards/emergency-detection';
import { runChatTurn } from '@/lib/chat/turn';
import {
  getRecentSummaries,
  getUserFacts,
  createChatSession,
  userOwnsSession,
  getBaselineScores,
  upsertSessionScores,
} from '@/lib/health/store';
import { overlayProfile } from '@/lib/chat/overlay';
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
  sessionId: z.string().uuid().optional(),
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

  // Memory load (user's RLS-scoped client; never round-trips through the client).
  const [summaries, facts] = await Promise.all([
    getRecentSummaries(supabase, user.id),
    getUserFacts(supabase, user.id),
  ]);
  const recentSummaries: string[] = [];
  if (facts) {
    const parts: string[] = [];
    if (facts.ageBand) parts.push(`age band ${facts.ageBand}`);
    if (facts.wearable) parts.push(`wears a ${facts.wearable}`);
    if (parts.length) recentSummaries.push(`Known facts: ${parts.join(', ')}.`);
  }
  // Oldest→newest reads naturally as "recent context".
  for (const s of [...summaries].reverse()) recentSummaries.push(s.summary);

  const result = await runChatTurn({
    history: messages.slice(0, -1),
    userMessage: last.content,
    // reason: zod infers number[]; the schema runtime-validates each to an int 0–4 (a Severity).
    signals: parsed.data.signals as Signals,
    recentSummaries,
    log: makeComplianceSink(admin, user.id),
  });

  if (result.kind !== 'reply') {
    return NextResponse.json({ ...result, sessionId: parsed.data.sessionId ?? null });
  }

  // Persist a per-session snapshot, overlaid on the user's prior baseline (continuity).
  // Only reuse a client-supplied session the caller actually owns; a forged/foreign id
  // starts a fresh session (never writes against another user's session).
  const provided = parsed.data.sessionId;
  const sessionId =
    provided && (await userOwnsSession(supabase, user.id, provided))
      ? provided
      : await createChatSession(supabase, user.id);
  const baseline = await getBaselineScores(supabase, user.id, sessionId);
  const overlaid = overlayProfile(baseline, result.profile);
  try {
    await upsertSessionScores(supabase, user.id, sessionId, overlaid);
  } catch {
    // A score-save glitch must never break the conversation; the reply still returns.
  }
  return NextResponse.json({ ...result, profile: overlaid, sessionId });
}
