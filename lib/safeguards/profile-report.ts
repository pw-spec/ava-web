import 'server-only';
import { createSonnetCaller } from '@/lib/llm/sonnet';
import { scanOutput } from './output-filter';
import type { ComplianceSink, LlmMessage } from './types';

const REPORT_SYSTEM =
  'You write a private wellness profile for a man who just finished a self-reported check-in with ' +
  'an AI companion. In 2-4 short paragraphs, reflect back the patterns across his six wellness axes ' +
  '(energy, strength, sleep, drive, focus, body): what stands out, what tends to move together, and ' +
  'a few gentle, non-prescriptive things worth attention or worth raising with a clinician. Warm, ' +
  'plain, second person ("you"). Describe only self-reported wellness indicators. NEVER name medical ' +
  'conditions, drugs, or doses, and never give a diagnosis or clinical assessment.';

const STRICTER =
  'Reminder: do NOT name conditions, drugs, or doses, and do not assess or diagnose. Reframe ' +
  'everything as neutral wellness indicators and general lifestyle reflection.';

/**
 * Generate the paid private wellness-profile report from a finished check-in transcript. Passes
 * through the same Layer-3 output filter as conversation; on a block it regenerates once, then is
 * dropped (returns null) rather than stored. Lives under /lib/safeguards (the /lib/llm boundary);
 * a second Sonnet consumer alongside the summarizer.
 */
export async function generateProfileReport(input: {
  messages: LlmMessage[];
  log?: ComplianceSink;
}): Promise<string | null> {
  const call = createSonnetCaller();
  const transcript = input.messages.map((m) => `${m.role}: ${m.content}`).join('\n');
  const base: LlmMessage[] = [
    { role: 'system', content: REPORT_SYSTEM },
    { role: 'user', content: `Conversation:\n${transcript}\n\nWrite his wellness profile.` },
  ];

  let res = await call(base);
  if (scanOutput(res.text).blocked) {
    res = await call([...base, { role: 'system', content: STRICTER }]);
    if (scanOutput(res.text).blocked) {
      input.log?.({ event: 'profile_filtered', outcome: 'dropped' });
      return null;
    }
    input.log?.({ event: 'profile_filtered', outcome: 'regenerated' });
  }
  const text = res.text.trim();
  return text.length > 0 ? text : null;
}
