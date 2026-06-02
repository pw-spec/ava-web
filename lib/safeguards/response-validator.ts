import { z } from 'zod';

const axis = z.number().int().min(0).max(100);

export const ScoredSchema = z
  .object({
    energy: axis,
    strength: axis,
    sleep: axis,
    drive: axis,
    focus: axis,
    body: axis,
    overall: axis,
  })
  .strict();

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateScored(input: unknown): ValidationResult {
  const result = ScoredSchema.safeParse(input);
  if (result.success) return { valid: true, errors: [] };
  return {
    valid: false,
    errors: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
  };
}
