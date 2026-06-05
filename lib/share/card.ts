import 'server-only';
import { randomBytes, randomInt } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AXES } from '@/lib/scoring';
import { getLatestHealthScores } from '@/lib/health/store';

/** Crypto-random Fisher–Yates shuffle — anonymizes axis order so a spoke can't be mapped to an axis. */
function shuffle(values: number[]): number[] {
  const a = [...values];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Unguessable, url-safe share token (~22 chars from 16 random bytes). */
export function generateShareToken(): string {
  return randomBytes(16).toString('base64url');
}

/**
 * THE single assembler of the stripped brag card. Reads the user's latest scores (their RLS client,
 * decrypted) and emits ONLY the overall + an anonymized 6-value silhouette (the *shape*, never which
 * axis or a labeled value). Never imports the private-profile/report path → the two artifacts never merge.
 */
export async function buildShareCard(
  client: SupabaseClient,
  userId: string,
): Promise<{ overall: number | null; silhouette: number[] }> {
  const latest = await getLatestHealthScores(client, userId);
  if (!latest || latest.overall === null) return { overall: null, silhouette: [] };
  const values = AXES.map((axis) => latest.axes[axis] ?? 0);
  return { overall: latest.overall, silhouette: shuffle(values) };
}
