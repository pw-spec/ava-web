export type { LlmMessage, LlmResponse, LlmCaller } from '@/lib/llm/types';
import type { LlmCaller, LlmMessage } from '@/lib/llm/types';
import type { Axis, Severity } from '@/lib/scoring';

/** A validated per-turn extraction (post Layer-4 `validateSignals`). */
export interface SignalsTurn {
  axis: Axis;
  severities: Severity[];
}

export type EmergencyCategory = 'self_harm' | 'medical_crisis';

export interface EmergencyHit {
  hit: boolean;
  category?: EmergencyCategory;
}

export interface CrisisCard {
  kind: 'crisis';
  headline: string;
  resources: { label: string; contact: string }[];
}

export interface OutputFilterResult {
  blocked: boolean;
  reason?: string;
  matches: string[];
}

export interface ConversationContext {
  recentSummaries?: string[];
  history?: LlmMessage[];
}

/** De-identified compliance events. Never carries symptoms, scores, or message content. */
export type ComplianceEvent =
  | 'emergency_detected'
  | 'filter_block'
  | 'validator_reject'
  | 'llm_error'
  | 'summary_filtered'
  | 'profile_filtered';

export interface ComplianceRecord {
  event: ComplianceEvent;
  outcome: string;
}

export type ComplianceSink = (record: ComplianceRecord) => void;

export interface PipelineInput {
  userMessage: string;
  context?: ConversationContext;
  llm: LlmCaller;
  log?: ComplianceSink;
}

export type PipelineResult =
  | { kind: 'crisis'; card: CrisisCard }
  | { kind: 'reply'; text: string; structured?: unknown; flags: string[] }
  | { kind: 'redirect'; text: string }
  | { kind: 'error'; text: string };
