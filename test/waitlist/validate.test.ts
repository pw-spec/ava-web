import { describe, it, expect } from 'vitest';
import { parseWaitlistEmail } from '@/lib/waitlist/validate';

describe('parseWaitlistEmail', () => {
  it('accepts a valid email and lowercases it', () => {
    const r = parseWaitlistEmail({ email: 'Test@Example.COM' });
    expect(r).toEqual({ ok: true, email: 'test@example.com' });
  });

  it.each<[string, unknown]>([
    ['missing', {}],
    ['empty', { email: '' }],
    ['not an email', { email: 'nope' }],
    ['non-string', { email: 42 }],
    ['null body', null],
    ['over 254 chars', { email: `${'a'.repeat(250)}@b.com` }],
  ])('rejects %s', (_label, input) => {
    expect(parseWaitlistEmail(input).ok).toBe(false);
  });
});
