import { describe, it, expect } from 'vitest';
import { parseCredentials, parseSignUp } from '@/lib/auth/validate';

describe('parseCredentials', () => {
  it('accepts a valid email + password', () => {
    expect(parseCredentials({ email: 'a@b.com', password: 'longenough' }).ok).toBe(true);
  });
  it.each<[string, unknown]>([
    ['bad email', { email: 'nope', password: 'longenough' }],
    ['short password', { email: 'a@b.com', password: 'short' }],
  ])('rejects %s', (_label, input) => {
    expect(parseCredentials(input).ok).toBe(false);
  });
});

describe('parseSignUp', () => {
  it('requires a 2-letter state code', () => {
    expect(parseSignUp({ email: 'a@b.com', password: 'longenough', stateCode: 'TX' }).ok).toBe(true);
    expect(parseSignUp({ email: 'a@b.com', password: 'longenough', stateCode: '' }).ok).toBe(false);
  });
});
