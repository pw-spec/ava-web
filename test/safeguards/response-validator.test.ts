import { describe, it, expect } from 'vitest';
import { validateScored } from '@/lib/safeguards/response-validator';

const valid = {
  energy: 40,
  strength: 50,
  sleep: 60,
  drive: 30,
  focus: 45,
  body: 55,
  overall: 47,
};

describe('validateScored', () => {
  it('accepts a well-formed scored object', () => {
    expect(validateScored(valid).valid).toBe(true);
  });

  it.each<[string, unknown]>([
    ['below range', { ...valid, energy: -1 }],
    ['above range', { ...valid, energy: 101 }],
    ['non-integer', { ...valid, energy: 40.5 }],
    ['missing axis', (() => {
      const copy: Record<string, unknown> = { ...valid };
      delete copy.sleep;
      return copy;
    })()],
    ['extra field', { ...valid, mood: 50 }],
    ['not an object', 'nope'],
  ])('rejects %s', (_label, input) => {
    expect(validateScored(input).valid).toBe(false);
  });
});
