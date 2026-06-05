import type { RadarProfile, Signals } from '@/lib/scoring';
import type { CrisisCard, LlmMessage } from '@/lib/safeguards/types';

export type ChatApiResponse =
  | { kind: 'reply'; reply: string; signals: Signals; profile: RadarProfile; sessionId: string }
  | { kind: 'crisis'; card: CrisisCard; sessionId: string | null }
  | { kind: 'redirect'; text: string; sessionId: string | null }
  | { kind: 'error'; text: string; sessionId?: string | null }
  | { kind: 'cap'; text: string };

const SAFE_ERROR = "Something went wrong on my end. Let's try that again in a moment.";
const OFFLINE = "I couldn't reach the server — check your connection and try again.";

/** POST one turn to /api/chat. Never throws: HTTP/network failures become a safe error kind. */
export async function sendChatTurn(body: {
  messages: LlmMessage[];
  signals: Signals;
  sessionId?: string;
}): Promise<ChatApiResponse> {
  let res: Response;
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return { kind: 'error', text: OFFLINE };
  }
  if (!res.ok) return { kind: 'error', text: SAFE_ERROR };
  return (await res.json()) as ChatApiResponse;
}

/** POST a finished check-in to /api/session/end for summarization + close-out. Never throws. */
export async function endSession(body: {
  messages: LlmMessage[];
  sessionId: string;
}): Promise<{ ok: boolean; summarized?: boolean }> {
  try {
    const res = await fetch('/api/session/end', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false };
    return (await res.json()) as { ok: boolean; summarized?: boolean };
  } catch {
    return { ok: false };
  }
}
