import { describe, it, expect, beforeEach } from 'vitest';
import { randomBytes } from 'node:crypto';
import { decryptField, encryptField } from '@/lib/crypto/field';
import {
  saveHealthScores,
  getLatestHealthScores,
  saveSessionSummary,
  saveUserFacts,
  getRecentSummaries,
  getUserFacts,
  createChatSession,
  userOwnsSession,
  upsertSessionScores,
  getBaselineScores,
} from '@/lib/health/store';

beforeEach(() => {
  process.env.SUPABASE_DB_ENCRYPTION_KEY = randomBytes(32).toString('base64');
});

/** Captures the row passed to insert/upsert. */
function captureClient(method: 'insert' | 'upsert') {
  const captured: { row?: Record<string, unknown> } = {};
  const fn = (row: Record<string, unknown>) => {
    captured.row = row;
    return Promise.resolve({ error: null });
  };
  return { client: { from: () => ({ [method]: fn }) } as never, captured };
}

/** A client whose select chain resolves to a single prebuilt row (via maybeSingle). */
function singleRowClient(row: Record<string, unknown> | null) {
  const result = Promise.resolve({ data: row, error: null });
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order', 'limit']) chain[m] = () => chain;
  chain.maybeSingle = () => result;
  return { from: () => chain } as never;
}

/** A client whose select chain resolves to many rows (limit returns the promise). */
function multiRowClient(rows: Record<string, unknown>[]) {
  const result = Promise.resolve({ data: rows, error: null });
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order']) chain[m] = () => chain;
  chain.limit = () => result;
  return { from: () => chain } as never;
}

const AXES = { energy: 40, strength: 50, sleep: 60, drive: 30, focus: 45, body: 55 };

describe('saveHealthScores', () => {
  it('encrypts per-axis and keeps overall plaintext', async () => {
    const { client, captured } = captureClient('insert');
    await saveHealthScores(client, 'u1', { axes: AXES, overall: 47 });
    const row = captured.row!;
    expect(row.overall).toBe(47);
    expect(row.user_id).toBe('u1');
    expect(row.energy as string).toMatch(/^v1:/);
    expect(decryptField(row.energy as string)).toBe('40');
  });

  it('stores null for an unscored axis', async () => {
    const { client, captured } = captureClient('insert');
    await saveHealthScores(client, 'u1', { axes: { ...AXES, body: null }, overall: 47 });
    expect(captured.row!.body).toBeNull();
  });

  it('throws on a DB error (no silent health-data loss)', async () => {
    const client = { from: () => ({ insert: () => Promise.resolve({ error: { code: '23505' } }) }) } as never;
    await expect(saveHealthScores(client, 'u1', { axes: AXES, overall: 47 })).rejects.toThrow(/health_scores/);
  });
});

describe('getLatestHealthScores', () => {
  it('decrypts per-axis back to numbers', async () => {
    const stored: Record<string, unknown> = { user_id: 'u1', overall: 47, created_at: 't' };
    for (const [k, v] of Object.entries(AXES)) stored[k] = encryptField(String(v));
    const res = await getLatestHealthScores(singleRowClient(stored), 'u1');
    expect(res).toEqual({ axes: AXES, overall: 47 });
  });

  it('returns null when there is no row', async () => {
    expect(await getLatestHealthScores(singleRowClient(null), 'u1')).toBeNull();
  });
});

describe('saveSessionSummary / saveUserFacts', () => {
  it('encrypts the summary, leaves session_type plaintext', async () => {
    const { client, captured } = captureClient('insert');
    await saveSessionSummary(client, 'u1', 'slept poorly, low drive', 'text');
    expect(captured.row!.session_type).toBe('text');
    expect(decryptField(captured.row!.summary as string)).toBe('slept poorly, low drive');
  });

  it('encrypts lifestyle json, leaves age_band/wearable plaintext', async () => {
    const { client, captured } = captureClient('upsert');
    await saveUserFacts(client, 'u1', { ageBand: '30-39', lifestyle: { sleepHrs: 6 }, wearable: 'oura' });
    expect(captured.row!.age_band).toBe('30-39');
    expect(captured.row!.wearable).toBe('oura');
    expect(JSON.parse(decryptField(captured.row!.lifestyle as string))).toEqual({ sleepHrs: 6 });
  });
});

describe('getRecentSummaries / getUserFacts', () => {
  it('decrypts each recent summary', async () => {
    const rows = [
      { summary: encryptField('a'), session_type: 'text', created_at: 't2' },
      { summary: encryptField('b'), session_type: 'avatar', created_at: 't1' },
    ];
    const res = await getRecentSummaries(multiRowClient(rows), 'u1');
    expect(res.map((r) => r.summary)).toEqual(['a', 'b']);
  });

  it('handles a null lifestyle on read', async () => {
    const res = await getUserFacts(
      singleRowClient({ age_band: '30-39', lifestyle: null, wearable: null }),
      'u1',
    );
    expect(res).toEqual({ ageBand: '30-39', lifestyle: null, wearable: null });
  });
});

describe('createChatSession', () => {
  it('inserts a row and returns the new id', async () => {
    const chain: Record<string, unknown> = {};
    chain.insert = () => chain;
    chain.select = () => chain;
    chain.single = () => Promise.resolve({ data: { id: 'sess-1' }, error: null });
    const client = { from: () => chain } as never;
    expect(await createChatSession(client, 'u1')).toBe('sess-1');
  });
});

describe('userOwnsSession', () => {
  function ownsClient(row: Record<string, unknown> | null) {
    const result = Promise.resolve({ data: row, error: null });
    const chain: Record<string, unknown> = {};
    for (const m of ['select', 'eq']) chain[m] = () => chain;
    chain.maybeSingle = () => result;
    return { from: () => chain } as never;
  }

  it('returns true when the session row exists for the user', async () => {
    expect(await userOwnsSession(ownsClient({ id: 's1' }), 'u1', 's1')).toBe(true);
  });

  it('returns false for a foreign or missing session', async () => {
    expect(await userOwnsSession(ownsClient(null), 'u1', 's1')).toBe(false);
  });
});

describe('upsertSessionScores', () => {
  it('upserts an encrypted snapshot keyed by session_id', async () => {
    const captured: { row?: Record<string, unknown>; opts?: unknown } = {};
    const client = {
      from: () => ({
        upsert: (row: Record<string, unknown>, opts: unknown) => {
          captured.row = row;
          captured.opts = opts;
          return Promise.resolve({ error: null });
        },
      }),
    } as never;
    await upsertSessionScores(client, 'u1', 'sess-1', { axes: AXES, overall: 47 });
    expect(captured.row!.session_id).toBe('sess-1');
    expect(captured.row!.user_id).toBe('u1');
    expect(captured.row!.overall).toBe(47);
    expect(decryptField(captured.row!.energy as string)).toBe('40');
    expect(captured.opts).toEqual({ onConflict: 'session_id' });
  });

  it('throws on a DB error', async () => {
    const client = {
      from: () => ({ upsert: () => Promise.resolve({ error: { code: '23505' } }) }),
    } as never;
    await expect(
      upsertSessionScores(client, 'u1', 'sess-1', { axes: AXES, overall: 47 }),
    ).rejects.toThrow(/health_scores/);
  });
});

describe('getBaselineScores', () => {
  function baselineClient(row: Record<string, unknown> | null) {
    const result = Promise.resolve({ data: row, error: null });
    const chain: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'neq', 'order', 'limit']) chain[m] = () => chain;
    chain.maybeSingle = () => result;
    return { from: () => chain } as never;
  }

  it('decrypts the latest non-active snapshot', async () => {
    const stored: Record<string, unknown> = { overall: 47 };
    for (const [k, v] of Object.entries(AXES)) stored[k] = encryptField(String(v));
    const res = await getBaselineScores(baselineClient(stored), 'u1', 'active-sess');
    expect(res).toEqual({ axes: AXES, overall: 47 });
  });

  it('returns null when there is no prior snapshot', async () => {
    expect(await getBaselineScores(baselineClient(null), 'u1', 'active-sess')).toBeNull();
  });
});
