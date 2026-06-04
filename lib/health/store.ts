import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AXES, type AxisScores } from '@/lib/scoring';
import { decryptField, encryptField } from '@/lib/crypto/field';

/** Health data is not best-effort: surface DB errors so callers don't silently lose data. */
function ensureOk(table: string, error: { code?: string; message?: string } | null): void {
  if (error) throw new Error(`${table} query failed: ${error.code ?? error.message}`);
}

export async function saveHealthScores(
  client: SupabaseClient,
  userId: string,
  scores: { axes: AxisScores; overall: number | null },
): Promise<void> {
  const row: Record<string, string | number | null> = { user_id: userId, overall: scores.overall };
  for (const axis of AXES) {
    const v = scores.axes[axis];
    row[axis] = v === null ? null : encryptField(String(v));
  }
  const { error } = await client.from('health_scores').insert(row);
  ensureOk('health_scores', error);
}

export async function getLatestHealthScores(
  client: SupabaseClient,
  userId: string,
): Promise<{ axes: AxisScores; overall: number | null } | null> {
  const { data, error } = await client
    .from('health_scores')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  ensureOk('health_scores', error);
  if (!data) return null;
  const row = data as Record<string, unknown>;
  const axes = {} as AxisScores;
  for (const axis of AXES) {
    const v = row[axis];
    axes[axis] = v == null ? null : Number(decryptField(v as string));
  }
  return { axes, overall: (row.overall as number | null) ?? null };
}

export async function saveSessionSummary(
  client: SupabaseClient,
  userId: string,
  summary: string,
  sessionType: 'text' | 'avatar',
): Promise<void> {
  const { error } = await client.from('session_summaries').insert({
    user_id: userId,
    summary: encryptField(summary),
    session_type: sessionType,
  });
  ensureOk('session_summaries', error);
}

export async function getRecentSummaries(
  client: SupabaseClient,
  userId: string,
): Promise<{ summary: string; sessionType: string; createdAt: string }[]> {
  const { data, error } = await client
    .from('session_summaries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(3);
  ensureOk('session_summaries', error);
  return ((data as Record<string, unknown>[] | null) ?? []).map((r) => ({
    summary: decryptField(r.summary as string),
    sessionType: r.session_type as string,
    createdAt: r.created_at as string,
  }));
}

export async function saveUserFacts(
  client: SupabaseClient,
  userId: string,
  facts: { ageBand?: string; lifestyle?: unknown; wearable?: string },
): Promise<void> {
  const { error } = await client.from('user_facts').upsert(
    {
      user_id: userId,
      age_band: facts.ageBand ?? null,
      lifestyle: facts.lifestyle === undefined ? null : encryptField(JSON.stringify(facts.lifestyle)),
      wearable: facts.wearable ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  ensureOk('user_facts', error);
}

export async function getUserFacts(
  client: SupabaseClient,
  userId: string,
): Promise<{ ageBand: string | null; lifestyle: unknown; wearable: string | null } | null> {
  const { data, error } = await client
    .from('user_facts')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  ensureOk('user_facts', error);
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    ageBand: (row.age_band as string | null) ?? null,
    lifestyle: row.lifestyle ? JSON.parse(decryptField(row.lifestyle as string)) : null,
    wearable: (row.wearable as string | null) ?? null,
  };
}
