import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/** The public, sensitive-data-stripped card (no user_id, no per-axis labels). */
export interface PublicShareCard {
  overall: number;
  silhouette: number[];
  displayName: string | null;
}

/** Read one brag card by token (service-role; the table has no anon grant). Returns only the
 *  public fields — never user_id/created_at. null on missing/error/malformed. */
export async function getShareCard(token: string): Promise<PublicShareCard | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('share_cards')
    .select('overall, silhouette, display_name')
    .eq('token', token)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as { overall: number | null; silhouette: unknown; display_name: string | null };
  if (row.overall === null || !Array.isArray(row.silhouette) || row.silhouette.length === 0) {
    return null;
  }
  return {
    overall: row.overall,
    silhouette: (row.silhouette as unknown[]).map(Number),
    displayName: row.display_name,
  };
}
