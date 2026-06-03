import { computeProfile, type RadarProfile, type Signals } from '@/lib/scoring';
import { runSafeguardedTurn } from '@/lib/safeguards/runtime';
import type { ComplianceSink, CrisisCard, LlmMessage, SignalsTurn } from '@/lib/safeguards/types';
import { mergeSignals } from './signals';

export type ChatTurnResult =
  | { kind: 'crisis'; card: CrisisCard }
  | { kind: 'reply'; reply: string; signals: Signals; profile: RadarProfile }
  | { kind: 'redirect'; text: string }
  | { kind: 'error'; text: string };

export async function runChatTurn(input: {
  history: LlmMessage[];
  userMessage: string;
  signals: Signals;
  log?: ComplianceSink;
}): Promise<ChatTurnResult> {
  const result = await runSafeguardedTurn({
    history: input.history,
    userMessage: input.userMessage,
    log: input.log,
  });

  if (result.kind === 'crisis') return { kind: 'crisis', card: result.card };
  if (result.kind === 'redirect') return { kind: 'redirect', text: result.text };
  if (result.kind === 'error') return { kind: 'error', text: result.text };

  // result.kind === 'reply'
  const signals =
    result.structured !== undefined
      ? mergeSignals(input.signals, result.structured as SignalsTurn)
      : input.signals;
  return { kind: 'reply', reply: result.text, signals, profile: computeProfile(signals) };
}
