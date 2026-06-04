import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { gateDecision } from '@/lib/auth/gate';
import { makeComplianceSink } from '@/lib/compliance/log';
import { ownsActiveSession, saveSessionSummary, endChatSession } from '@/lib/health/store';
import { summarizeSession } from '@/lib/safeguards/summarizer';
import type { LlmMessage } from '@/lib/safeguards/types';

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(4000) }))
    .min(1),
  sessionId: z.string().uuid(),
});

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Full gate (same as /api/chat — this finalizes a health-signal session).
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

  // Idempotent + safe against forged/foreign ids: only finalize an owned, still-active session.
  if (!(await ownsActiveSession(supabase, user.id, parsed.data.sessionId))) {
    return NextResponse.json({ ok: true, summarized: false });
  }

  // Summarize (Sonnet -> output filter). A failure or a filter-drop must not block the end.
  const admin = getSupabaseAdmin();
  let summary: string | null = null;
  try {
    summary = await summarizeSession({
      messages: parsed.data.messages as LlmMessage[],
      log: makeComplianceSink(admin, user.id),
    });
  } catch {
    summary = null;
  }
  if (summary) {
    try {
      await saveSessionSummary(supabase, user.id, parsed.data.sessionId, summary, 'text');
    } catch {
      // a summary-write glitch must not prevent ending the session
      summary = null;
    }
  }

  await endChatSession(supabase, user.id, parsed.data.sessionId);
  return NextResponse.json({ ok: true, summarized: summary !== null });
}
