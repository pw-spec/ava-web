export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmResponse {
  text: string;
  /** Present only when the turn is expected to carry structured scores. */
  structured?: unknown;
}

export type LlmCaller = (messages: LlmMessage[]) => Promise<LlmResponse>;
