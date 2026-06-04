import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import type { LlmCaller, LlmMessage, LlmResponse } from './types';

// Claude Sonnet 4.6 — the summaries/reports model (see CLAUDE.md tech stack).
const MODEL = 'claude-sonnet-4-6';

function splitMessages(messages: LlmMessage[]): {
  system: string;
  turns: Anthropic.MessageParam[];
} {
  const system = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n');
  const turns: Anthropic.MessageParam[] = messages
    .filter((m): m is LlmMessage & { role: 'user' | 'assistant' } => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }));
  return { system, turns };
}

/** Plain-text Sonnet caller (no tools). Server-only. Used only by the session summarizer. */
export function createSonnetCaller(): LlmCaller {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  const client = new Anthropic({ apiKey });

  return async (messages: LlmMessage[]): Promise<LlmResponse> => {
    const { system, turns } = splitMessages(messages);
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      system,
      messages: turns,
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    return { text: text.trim() };
  };
}
