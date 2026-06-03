import { z } from 'zod';

// RFC 5321 caps an email address at 254 characters.
const schema = z.object({ email: z.string().email().max(254) });

export type WaitlistParse =
  | { ok: true; email: string }
  | { ok: false; error: string };

export function parseWaitlistEmail(input: unknown): WaitlistParse {
  const r = schema.safeParse(input);
  if (r.success) return { ok: true, email: r.data.email.toLowerCase() };
  return { ok: false, error: 'Please enter a valid email address.' };
}
