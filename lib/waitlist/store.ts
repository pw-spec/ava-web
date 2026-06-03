import type { SupabaseClient } from '@supabase/supabase-js';

const UNIQUE_VIOLATION = '23505';

export async function saveEmail(
  client: SupabaseClient,
  email: string,
): Promise<{ duplicate: boolean }> {
  const { error } = await client.from('waitlist').insert({ email });
  if (!error) return { duplicate: false };
  if (error.code === UNIQUE_VIOLATION) return { duplicate: true };
  throw new Error(`waitlist insert failed: ${error.code ?? 'unknown'}`);
}
