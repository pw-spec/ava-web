import { describe, it, expect } from 'vitest';
import { validateScored, validateSignals } from '@/lib/safeguards/response-validator';

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

describe('validateSignals', () => {
  it('accepts a valid per-turn extraction', () => {
    expect(validateSignals({ axis: 'energy', severities: [2, 3] }).valid).toBe(true);
  });

  it.each<[string, unknown]>([
    ['unknown axis', { axis: 'mood', severities: [2] }],
    ['severity out of range', { axis: 'energy', severities: [9] }],
    ['empty severities', { axis: 'energy', severities: [] }],
    ['extra field', { axis: 'energy', severities: [2], note: 'x' }],
    ['not an object', 'nope'],
  ])('rejects %s', (_label, input) => {
    expect(validateSignals(input).valid).toBe(false);
  });
});
