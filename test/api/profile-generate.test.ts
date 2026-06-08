import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getUser, maybeSingle, getWellnessProfile, saveReport, generateProfileReport, encryptField } =
  vi.hoisted(() => ({
    getUser: vi.fn(),
    maybeSingle: vi.fn(),
    getWellnessProfile: vi.fn(),
    saveReport: vi.fn(),
    generateProfileReport: vi.fn(),
    encryptField: vi.fn(),
  }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({ getSupabaseAdmin: () => ({}) }));
vi.mock('@/lib/credits/store', () => ({ getWellnessProfile, saveReport }));
vi.mock('@/lib/safeguards/profile-report', () => ({ generateProfileReport }));
vi.mock('@/lib/crypto/field', () => ({ encryptField }));
vi.mock('@/lib/compliance/log', () => ({ makeComplianceSink: () => vi.fn() }));

import { POST } from '@/app/api/profile/generate/route';

const SID = '00000000-0000-0000-0000-000000000001';
function req(body: unknown = { sessionId: SID, messages: [{ role: 'user', content: 'low energy' }] }): Request {
  return new Request('https://ava.test/api/profile/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/profile/generate', () => {
  beforeEach(() => {
    getUser.mockReset().mockResolvedValue({ data: { user: { id: 'u1' } } });
    maybeSingle.mockReset().mockResolvedValue({ data: { state_code: 'TX', ai_disclosure_accepted_at: 't' } });
    getWellnessProfile.mockReset();
    saveReport.mockReset().mockResolvedValue(undefined);
    generateProfileReport.mockReset();
    encryptField.mockReset().mockReturnValue('v1:enc');
  });

  it('401 when unauthenticated', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await POST(req())).status).toBe(401);
  });

  it('403 when the gate is not satisfied', async () => {
    maybeSingle.mockResolvedValue({ data: { state_code: 'CA', ai_disclosure_accepted_at: 't' } });
    expect((await POST(req())).status).toBe(403);
  });

  it('400 on an invalid body', async () => {
    expect((await POST(req({ sessionId: 'nope' }))).status).toBe(400);
  });

  it('pending when there is no entitlement yet (webhook not landed)', async () => {
    getWellnessProfile.mockResolvedValue(null);
    const res = await POST(req());
    expect(await res.json()).toEqual({ status: 'pending' });
    expect(generateProfileReport).not.toHaveBeenCalled();
  });

  it('ready (idempotent) without regenerating when already ready', async () => {
    getWellnessProfile.mockResolvedValue({ id: 'p1', session_id: SID, status: 'ready', report: 'v1:x' });
    const res = await POST(req());
    expect(await res.json()).toEqual({ status: 'ready' });
    expect(generateProfileReport).not.toHaveBeenCalled();
  });

  it('generates, encrypts, saves, and returns ready when paid', async () => {
    getWellnessProfile.mockResolvedValue({ id: 'p1', session_id: SID, status: 'paid', report: null });
    generateProfileReport.mockResolvedValue('Your energy has been low; worth tracking.');
    const res = await POST(req());
    expect(await res.json()).toEqual({ status: 'ready' });
    expect(encryptField).toHaveBeenCalledWith('Your energy has been low; worth tracking.');
    expect(saveReport).toHaveBeenCalledWith(expect.anything(), 'p1', 'v1:enc');
  });

  it('stays pending (retryable) when generation is filtered/dropped', async () => {
    getWellnessProfile.mockResolvedValue({ id: 'p1', session_id: SID, status: 'paid', report: null });
    generateProfileReport.mockResolvedValue(null);
    const res = await POST(req());
    expect(await res.json()).toEqual({ status: 'pending' });
    expect(saveReport).not.toHaveBeenCalled();
  });
});
