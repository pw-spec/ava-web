import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashUserRef, writeComplianceEvent, makeComplianceSink } from '@/lib/compliance/log';

beforeEach(() => {
  process.env.COMPLIANCE_LOG_SALT = 'test-salt';
});

function fakeClient() {
  const insert = vi.fn().mockResolvedValue({ error: null });
  return { client: { from: vi.fn(() => ({ insert })) } as never, insert };
}

describe('hashUserRef', () => {
  it('is deterministic per user and differs across users', () => {
    expect(hashUserRef('u1')).toBe(hashUserRef('u1'));
    expect(hashUserRef('u1')).not.toBe(hashUserRef('u2'));
  });
  it('does not contain the raw user id', () => {
    expect(hashUserRef('user-123')).not.toContain('user-123');
  });
  it('throws when the salt is missing', () => {
    delete process.env.COMPLIANCE_LOG_SALT;
    expect(() => hashUserRef('u1')).toThrow();
  });
});

describe('writeComplianceEvent', () => {
  it('inserts a de-identified row', async () => {
    const { client, insert } = fakeClient();
    await writeComplianceEvent(client, { userRef: 'ref', event: 'disclosure_accepted', outcome: 'accepted' });
    expect(insert).toHaveBeenCalledWith({ user_ref: 'ref', event: 'disclosure_accepted', outcome: 'accepted' });
  });

  it('rejects when the DB returns an error', async () => {
    const client = { from: () => ({ insert: () => Promise.resolve({ error: { code: '42501' } }) }) } as never;
    await expect(
      writeComplianceEvent(client, { userRef: 'ref', event: 'geo_block', outcome: 'blocked' }),
    ).rejects.toThrow(/compliance_log insert failed/);
  });
});

describe('makeComplianceSink', () => {
  it('writes the hashed user_ref with the event/outcome', () => {
    const { client, insert } = fakeClient();
    const sink = makeComplianceSink(client, 'u1');
    sink({ event: 'emergency_detected', outcome: 'bypassed_llm' });
    expect(insert).toHaveBeenCalledWith({
      user_ref: hashUserRef('u1'),
      event: 'emergency_detected',
      outcome: 'bypassed_llm',
    });
  });

  it('swallows a failing audit write (never throws to the caller)', async () => {
    const client = { from: () => ({ insert: () => Promise.reject(new Error('db down')) }) } as never;
    const sink = makeComplianceSink(client, 'u1');
    expect(() => sink({ event: 'filter_block', outcome: 'redirected' })).not.toThrow();
    // let the rejected promise settle without an unhandled rejection
    await new Promise((r) => setTimeout(r, 0));
  });
});
