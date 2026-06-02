import { describe, it, expect } from 'vitest';
import { CONSTITUTION, buildConstitutionMessages } from '@/lib/safeguards/constitution';

describe('constitution', () => {
  it('states the core identity and prohibitions', () => {
    expect(CONSTITUTION).toMatch(/not a doctor/i);
    expect(CONSTITUTION).toMatch(/never diagnose/i);
    expect(CONSTITUTION).toMatch(/wellness indicators/i);
  });
});

describe('buildConstitutionMessages', () => {
  it('puts the constitution first and the user message last', () => {
    const messages = buildConstitutionMessages('I am tired', {
      recentSummaries: ['slept poorly last week'],
    });
    expect(messages[0]).toEqual({ role: 'system', content: CONSTITUTION });
    expect(messages.at(-1)).toEqual({ role: 'user', content: 'I am tired' });
  });

  it('omits the context message when there are no summaries', () => {
    const messages = buildConstitutionMessages('hello');
    expect(messages).toHaveLength(2);
  });
});
