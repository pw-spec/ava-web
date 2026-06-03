import { describe, it, expect } from 'vitest';
import { CONSTITUTION, buildConstitutionMessages } from '@/lib/safeguards/constitution';
import type { LlmMessage } from '@/lib/safeguards/types';

describe('constitution', () => {
  it('states the core identity and prohibitions', () => {
    expect(CONSTITUTION).toMatch(/not a doctor/i);
    expect(CONSTITUTION).toMatch(/never diagnose/i);
    expect(CONSTITUTION).toMatch(/wellness indicators/i);
  });

  it('sets a warm, supportive tone bounded by a mental-health-care guardrail', () => {
    // Warm + emotionally present (drives attachment) ...
    expect(CONSTITUTION).toMatch(/warm|encouraging|in (?:his|your) corner/i);
    // ... but explicitly not therapy / not a substitute for mental-health care.
    expect(CONSTITUTION).toMatch(/not a (?:therapist|substitute for mental-health)/i);
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

  it('splices conversation history before the latest user message', () => {
    const history: LlmMessage[] = [
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hey, how is your energy?' },
    ];
    const msgs = buildConstitutionMessages('pretty low', { history });
    expect(msgs.at(-1)).toEqual({ role: 'user', content: 'pretty low' });
    expect(msgs.some((m) => m.role === 'assistant' && m.content.includes('how is your energy'))).toBe(true);
  });
});
