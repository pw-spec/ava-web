import 'server-only';
import { createHaikuCaller } from '@/lib/llm/haiku';
import { runChatPipeline } from './pipeline';
import type { ComplianceSink, LlmMessage, PipelineResult } from './types';

/** Production entrypoint: wires the real Haiku caller into the safeguard pipeline. */
export async function runSafeguardedTurn(input: {
  history: LlmMessage[];
  userMessage: string;
  recentSummaries?: string[];
  log?: ComplianceSink;
}): Promise<PipelineResult> {
  return runChatPipeline({
    userMessage: input.userMessage,
    context: { history: input.history, recentSummaries: input.recentSummaries },
    llm: createHaikuCaller(),
    log: input.log,
  });
}
