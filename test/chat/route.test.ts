import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

// The route builds a real compliance sink (only @/lib/compliance/log's deps that
// matter are the salt + service-role client); the sink hashes the user id, which
// needs COMPLIANCE_LOG_SALT. Provide it the same way the runtime does.
beforeAll(() => {
  process.env.COMPLIANCE_LOG_SALT = 'test-salt';
});

// vi.hoisted so the (hoisted) vi.mock factories can reference these without a TDZ error.
const { getUser, maybeSingle, rpc, runChatTurn } = vi.hoisted(() => ({
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  rpc: vi.fn(),
  runChatTurn: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({ getSupabaseAdmin: () => ({ rpc }) }));
vi.mock('@/lib/chat/turn', () => ({ runChatTurn }));

import { POST } from '@/app/api/chat/route';

function req(body: unknown): Request {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const goodBody = { messages: [{ role: 'user', content: 'hi' }], signals: {} };

describe('POST /api/chat', () => {
  beforeEach(() => {
    getUser.mockReset();
    maybeSingle.mockReset();
    rpc.mockReset();
    runChatTurn.mockReset();
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    maybeSingle.mockResolvedValue({ data: { state_code: 'TX', ai_disclosure_accepted_at: 't' } });
    rpc.mockResolvedValue({ data: 1, error: null });
    runChatTurn.mockResolvedValue({ kind: 'reply', reply: 'hey', signals: {}, profile: {} });
  });

  it('401 when unauthenticated', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await POST(req(goodBody))).status).toBe(401);
  });

  it('403 when the gate is not satisfied (no disclosure)', async () => {
    maybeSingle.mockResolvedValue({ data: { state_code: 'TX', ai_disclosure_accepted_at: null } });
    expect((await POST(req(goodBody))).status).toBe(403);
  });

  it('400 on a bad body', async () => {
    expect((await POST(req({ messages: 'nope' }))).status).toBe(400);
  });

  it('returns a cap response without calling the model when over the daily cap', async () => {
    rpc.mockResolvedValue({ data: 11, error: null }); // cap default 10
    const res = await POST(req(goodBody));
    expect(res.status).toBe(200);
    expect((await res.json()).kind).toBe('cap');
    expect(runChatTurn).not.toHaveBeenCalled();
  });

  it('runs the turn on the happy path', async () => {
    const res = await POST(req(goodBody));
    expect(res.status).toBe(200);
    expect((await res.json()).kind).toBe('reply');
    expect(runChatTurn).toHaveBeenCalled();
  });

  it('never caps a crisis message — emergencies reach the safeguarded turn (crisis card)', async () => {
    // Over the daily cap, but the latest message is a self-harm disclosure. The cap
    // must not short-circuit it; the safeguard pipeline (via runChatTurn) handles it.
    rpc.mockResolvedValue({ data: 11, error: null });
    runChatTurn.mockResolvedValue({ kind: 'crisis', card: { kind: 'crisis' } });
    const body = { messages: [{ role: 'user', content: 'I want to kill myself' }], signals: {} };
    const res = await POST(req(body));
    expect(res.status).toBe(200);
    expect((await res.json()).kind).toBe('crisis');
    expect(runChatTurn).toHaveBeenCalled();
  });
});
