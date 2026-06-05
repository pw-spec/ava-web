import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { gateDecision } from '@/lib/auth/gate';
import { buildShareCard, generateShareToken } from '@/lib/share/card';

const bodySchema = z.object({ displayName: z.string().trim().min(1).max(40).optional() });

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Full gate (sharing derives from health data).
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

  // Body is optional (anonymous share). An unparseable/missing body is treated as {}.
  let raw: unknown = {};
  try {
    raw = await request.json();
  } catch {
    raw = {};
  }
  const parsed = bodySchema.safeParse(raw ?? {});
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const cardData = await buildShareCard(supabase, user.id);
  if (cardData.overall === null) {
    return NextResponse.json({ error: 'Finish a check-in first.' }, { status: 400 });
  }

  // Insert via the service-role admin client (share_cards has no owner policy). 16-byte token →
  // collisions are astronomically unlikely; regenerate once on the off chance of a unique violation.
  const admin = getSupabaseAdmin();
  const row = {
    user_id: user.id,
    overall: cardData.overall,
    silhouette: cardData.silhouette,
    display_name: parsed.data.displayName ?? null,
  };
  let token = generateShareToken();
  let { error } = await admin.from('share_cards').insert({ token, ...row });
  if (error && (error as { code?: string }).code === '23505') {
    token = generateShareToken();
    ({ error } = await admin.from('share_cards').insert({ token, ...row }));
  }
  if (error) return NextResponse.json({ error: 'Could not create share link.' }, { status: 500 });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
  return NextResponse.json({ token, url: `${base}/share/${token}` });
}
