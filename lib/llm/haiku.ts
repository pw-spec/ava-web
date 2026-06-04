import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { AXES } from '@/lib/scoring';
import type { LlmCaller, LlmMessage, LlmResponse } from './types';

// Claude Haiku 4.5 — cheap/fast text chat model (see CLAUDE.md tech stack).
const MODEL = 'claude-haiku-4-5-20251001';

/**
 * One tool the model may call to report the wellness signals it heard this turn.
 * Returning signals via tool-use lets a single model call produce BOTH the warm
 * reply text AND the structured per-axis severities — no second extraction pass.
 */
const RECORD_SIGNALS_TOOL: Anthropic.Tool = {
  name: 'record_signals',
  description:
    'Record the wellness signals the user just shared for ONE axis they discussed. ' +
    'severities are integers 0 (most symptomatic) to 4 (optimized). Call this whenever the user ' +
    'reveals how they are doing on an axis; omit it if they shared nothing scorable this turn.',
  input_schema: {
    type: 'object',
    properties: {
      axis: { type: 'string', enum: [...AXES] },
      severities: {
        type: 'array',
        items: { type: 'integer', minimum: 0, maximum: 4 },
        minItems: 1,
      },
    },
    required: ['axis', 'severities'],
  },
};

/**
 * Split the pipeline's flat message list into Anthropic's shape: `system` is a
 * separate list of text blocks; only user/assistant turns go in `messages`.
 *
 * The first system message is the (large, stable) constitution — it gets its own
 * `cache_control` breakpoint so it caches independently of anything appended after
 * it (per-session summaries, or the Layer-3 regeneration reminder). Bundling it
 * into one joined string would cache-miss the constitution on every regen call.
 */
function splitMessages(messages: LlmMessage[]): {
  system: Anthropic.TextBlockParam[];
  turns: Anthropic.MessageParam[];
} {
  const system: Anthropic.TextBlockParam[] = messages
    .filter((m) => m.role === 'system')
    .map((m, i) =>
      i === 0
        ? { type: 'text', text: m.content, cache_control: { type: 'ephemeral' } }
        : { type: 'text', text: m.content },
    );
  const turns: Anthropic.MessageParam[] = messages
    .filter(
      (m): m is LlmMessage & { role: 'user' | 'assistant' } => m.role !== 'system',
    )
    .map((m) => ({ role: m.role, content: m.content }));
  return { system, turns };
}

/**
 * Production `LlmCaller` backed by the real Haiku model. Server-only.
 * Caches the (stable) constitution prefix with an ephemeral breakpoint so repeated
 * turns reuse it instead of re-billing it every call.
 */
export function createHaikuCaller(): LlmCaller {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  const client = new Anthropic({ apiKey });

  return async (messages: LlmMessage[]): Promise<LlmResponse> => {
    const { system, turns } = splitMessages(messages);
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system,
      tools: [RECORD_SIGNALS_TOOL],
      messages: turns,
    });

    let text = '';
    let structured: unknown;
    for (const block of res.content) {
      if (block.type === 'text') {
        text += block.text;
      } else if (block.type === 'tool_use' && block.name === 'record_signals') {
        structured = block.input;
      }
    }
    return { text: text.trim(), structured };
  };
}
