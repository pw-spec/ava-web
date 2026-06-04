import { scanForEmergency } from './emergency-detection';
import { CRISIS_CARD } from './crisis-card';
import { scanOutput } from './output-filter';
import { validateSignals } from './response-validator';
import { buildConstitutionMessages } from './constitution';
import type {
  ComplianceSink,
  LlmMessage,
  LlmResponse,
  PipelineInput,
  PipelineResult,
} from './types';

const SAFE_REDIRECT =
  "I can't help with that, but a licensed provider can look into it with you. " +
  'Want to keep exploring your wellness indicators?';
const SAFE_ERROR = "Something went wrong on my end. Let's try that again in a moment.";
const STRICTER_REMINDER =
  'Reminder: do not name conditions, drugs, or doses, and do not give a clinical assessment. ' +
  'Reframe everything as wellness indicators.';

function noop(): void {}

export async function runChatPipeline(input: PipelineInput): Promise<PipelineResult> {
  const log: ComplianceSink = input.log ?? noop;
  const { userMessage, context, llm } = input;

  // Layer 1 — emergency detection. On hit, the LLM is never called.
  if (scanForEmergency(userMessage).hit) {
    log({ event: 'emergency_detected', outcome: 'bypassed_llm' });
    return { kind: 'crisis', card: CRISIS_CARD };
  }

  const messages = buildConstitutionMessages(userMessage, context);

  let raw: LlmResponse;
  try {
    raw = await llm(messages);
  } catch {
    log({ event: 'llm_error', outcome: 'fallback' });
    return { kind: 'error', text: SAFE_ERROR };
  }

  const retryMessages: LlmMessage[] = [
    ...messages,
    { role: 'system', content: STRICTER_REMINDER },
  ];

  // Layer 3 — output filter. Regenerate once, then redirect.
  if (scanOutput(raw.text).blocked) {
    try {
      raw = await llm(retryMessages);
    } catch {
      log({ event: 'llm_error', outcome: 'fallback' });
      return { kind: 'error', text: SAFE_ERROR };
    }
    if (scanOutput(raw.text).blocked) {
      log({ event: 'filter_block', outcome: 'redirected' });
      return { kind: 'redirect', text: SAFE_REDIRECT };
    }
    log({ event: 'filter_block', outcome: 'regenerated' });
  }

  // Layer 4 — response validator validates the model's extracted signals
  // (only when structured output is present).
  if (raw.structured !== undefined && !validateSignals(raw.structured).valid) {
    try {
      raw = await llm(retryMessages);
    } catch {
      log({ event: 'llm_error', outcome: 'fallback' });
      return { kind: 'error', text: SAFE_ERROR };
    }
    // The regenerated text must clear the output filter too.
    if (scanOutput(raw.text).blocked) {
      log({ event: 'filter_block', outcome: 'redirected' });
      return { kind: 'redirect', text: SAFE_REDIRECT };
    }
    if (raw.structured === undefined || !validateSignals(raw.structured).valid) {
      log({ event: 'validator_reject', outcome: 'errored' });
      return { kind: 'error', text: SAFE_ERROR };
    }
    log({ event: 'validator_reject', outcome: 'regenerated' });
  }

  return { kind: 'reply', text: raw.text, structured: raw.structured, flags: [] };
}
