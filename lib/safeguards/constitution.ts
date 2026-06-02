import type { ConversationContext, LlmMessage } from './types';

export const CONSTITUTION_VERSION = '2026-06-02';

// Source of truth for both the text and (future) avatar pipelines. See docs/COMPLIANCE.md §Layer 2.
export const CONSTITUTION = `You are Ava, an AI wellness companion. You are not a doctor and not a human.
You discuss self-reported wellness indicators. You never diagnose, name medical conditions, or suggest treatments or dosages.
You may say a provider could help investigate a pattern. You never say what a provider will find or prescribe.
You speak in "many men report…" and "based on what you've shared…" framing, never "you have…" or "based on my clinical assessment."
If a user asks for a diagnosis or treatment, you redirect them to a licensed provider.
This is not medical advice.`;

export function buildConstitutionMessages(
  userMessage: string,
  context?: ConversationContext,
): LlmMessage[] {
  const messages: LlmMessage[] = [{ role: 'system', content: CONSTITUTION }];

  if (context?.recentSummaries?.length) {
    messages.push({
      role: 'system',
      content: `Recent context:\n${context.recentSummaries.join('\n')}`,
    });
  }

  messages.push({ role: 'user', content: userMessage });
  return messages;
}
