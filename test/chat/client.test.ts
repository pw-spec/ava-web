import { describe, it, expect, vi, afterEach } from 'vitest';
import { sendChatTurn } from '@/lib/chat/client';

afterEach(() => vi.unstubAllGlobals());

function stubFetch(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body }),
  );
}

describe('sendChatTurn', () => {
  it('returns the parsed reply on 200', async () => {
    stubFetch(200, { kind: 'reply', reply: 'hi', signals: {}, profile: {}, sessionId: 's1' });
    const res = await sendChatTurn({ messages: [{ role: 'user', content: 'hey' }], signals: {} });
    expect(res.kind).toBe('reply');
    if (res.kind === 'reply') expect(res.sessionId).toBe('s1');
  });

  it('maps a non-2xx response to a safe error', async () => {
    stubFetch(403, { error: 'Forbidden' });
    const res = await sendChatTurn({ messages: [{ role: 'user', content: 'x' }], signals: {} });
    expect(res.kind).toBe('error');
  });

  it('maps a network throw to a safe error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const res = await sendChatTurn({ messages: [{ role: 'user', content: 'x' }], signals: {} });
    expect(res.kind).toBe('error');
  });
});
