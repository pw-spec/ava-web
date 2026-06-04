import 'server-only';
import { createSonnetCaller } from '@/lib/llm/sonnet';
import { scanOutput } from './output-filter';
import type { ComplianceSink, LlmMessage } from './types';

const SUMMARY_SYSTEM =
  'You write a short private memory note (2-3 sentences) summarizing a wellness check-in, so a ' +
  'companion can recall it next time. Describe only self-reported wellness indicators and durable ' +
  'context ("energy has been low", "started a stressful job", "sleeping ~6h"). Never name medical ' +
  'conditions, drugs, doses, or give any clinical assessment or diagnosis. Write in plain third person.';

const STRICTER =
  'Reminder: do NOT name conditions, drugs, or doses, and do not assess or diagnose. Reframe ' +
  'everything as neutral wellness indicators.';

/**
 * Summarize a finished check-in into an encrypted-at-rest memory note. The summary passes through
 * the same Layer-3 output filter as conversation; on a block it regenerates once, then is dropped
 * (returns null) rather than stored. The sole consumer of the Sonnet caller (import boundary).
 */
export async function summarizeSession(input: {
  messages: LlmMessage[];
  log?: ComplianceSink;
}): Promise<string | null> {
  const call = createSonnetCaller();
  const transcript = input.messages.map((m) => `${m.role}: ${m.content}`).join('\n');
  const base: LlmMessage[] = [
    { role: 'system', content: SUMMARY_SYSTEM },
    { role: 'user', content: `Conversation:\n${transcript}\n\nWrite the memory note.` },
  ];

  let res = await call(base);
  if (scanOutput(res.text).blocked) {
    res = await call([...base, { role: 'system', content: STRICTER }]);
    if (scanOutput(res.text).blocked) {
      input.log?.({ event: 'summary_filtered', outcome: 'dropped' });
      return null;
    }
    input.log?.({ event: 'summary_filtered', outcome: 'regenerated' });
  }
  const text = res.text.trim();
  return text.length > 0 ? text : null;
}
