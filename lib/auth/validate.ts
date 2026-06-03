import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(72), // bcrypt input cap
});

export const signUpSchema = credentialsSchema.extend({
  stateCode: z.string().length(2),
});

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

function parse<T>(schema: z.ZodType<T>, input: unknown): ParseResult<T> {
  const r = schema.safeParse(input);
  return r.success
    ? { ok: true, value: r.data }
    : { ok: false, error: r.error.issues[0]?.message ?? 'Invalid input.' };
}

export function parseCredentials(input: unknown) {
  return parse(credentialsSchema, input);
}

export function parseSignUp(input: unknown) {
  return parse(signUpSchema, input);
}
