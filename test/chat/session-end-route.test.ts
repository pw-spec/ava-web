import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

beforeAll(() => {
  process.env.COMPLIANCE_LOG_SALT = 'test-salt';
});

const { getUser, maybeSingle, store, summarizeSession } = vi.hoisted(() => ({
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  store: {
    ownsActiveSession: vi.fn(),
    saveSessionSummary: vi.fn(),
    endChatSession: vi.fn(),
  },
  summarizeSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({ getSupabaseAdmin: () => ({}) }));
vi.mock('@/lib/health/store', () => store);
vi.mock('@/lib/safeguards/summarizer', () => ({ summarizeSession }));

import { POST } from '@/app/api/session/end/route';

function req(body: unknown): Request {
  return new Request('http://localhost/api/session/end', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const SID = '11111111-1111-4111-8111-111111111111';
const goodBody = { messages: [{ role: 'assistant', content: 'hi' }, { role: 'user', content: 'low energy' }], sessionId: SID };

describe('POST /api/session/end', () => {
  beforeEach(() => {
    getUser.mockReset().mockResolvedValue({ data: { user: { id: 'u1' } } });
    maybeSingle.mockReset().mockResolvedValue({ data: { state_code: 'TX', ai_disclosure_accepted_at: 't' } });
    store.ownsActiveSession.mockReset().mockResolvedValue(true);
    store.saveSessionSummary.mockReset().mockResolvedValue(undefined);
    store.endChatSession.mockReset().mockResolvedValue(undefined);
    summarizeSession.mockReset().mockResolvedValue('energy has been low');
  });

  it('401 when unauthenticated', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await POST(req(goodBody))).status).toBe(401);
  });

  it('403 when the gate is not satisfied', async () => {
    maybeSingle.mockResolvedValue({ data: { state_code: 'TX', ai_disclosure_accepted_at: null } });
    expect((await POST(req(goodBody))).status).toBe(403);
  });

  it('400 on a bad body', async () => {
    expect((await POST(req({ sessionId: 'not-a-uuid' }))).status).toBe(400);
  });

  it('summarizes, saves, ends, and reports summarized:true', async () => {
    const res = await POST(req(goodBody));
    const body = await res.json();
    expect(body).toEqual({ ok: true, summarized: true });
    expect(store.saveSessionSummary).toHaveBeenCalledWith(expect.anything(), 'u1', SID, 'energy has been low', 'text');
    expect(store.endChatSession).toHaveBeenCalledWith(expect.anything(), 'u1', SID);
  });

  it('no-ops for a forged/foreign/already-ended session', async () => {
    store.ownsActiveSession.mockResolvedValue(false);
    const res = await POST(req(goodBody));
    expect(await res.json()).toEqual({ ok: true, summarized: false });
    expect(summarizeSession).not.toHaveBeenCalled();
    expect(store.endChatSession).not.toHaveBeenCalled();
  });

  it('still ends the session when the summarizer fails (summarized:false)', async () => {
    summarizeSession.mockRejectedValue(new Error('no key'));
    const res = await POST(req(goodBody));
    expect(await res.json()).toEqual({ ok: true, summarized: false });
    expect(store.saveSessionSummary).not.toHaveBeenCalled();
    expect(store.endChatSession).toHaveBeenCalledWith(expect.anything(), 'u1', SID);
  });

  it('ends without a summary when the summarizer drops it (null)', async () => {
    summarizeSession.mockResolvedValue(null);
    const res = await POST(req(goodBody));
    expect(await res.json()).toEqual({ ok: true, summarized: false });
    expect(store.saveSessionSummary).not.toHaveBeenCalled();
    expect(store.endChatSession).toHaveBeenCalled();
  });
});
