import { describe, it, expect, vi, afterEach } from 'vitest';
import { createShareCard } from '@/lib/share/client';

afterEach(() => vi.unstubAllGlobals());

function stubFetch(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body }),
  );
}

describe('createShareCard', () => {
  it('returns the token + url on 200', async () => {
    stubFetch(200, { token: 't', url: 'https://ava.test/share/t' });
    expect(await createShareCard('Pat')).toEqual({ ok: true, token: 't', url: 'https://ava.test/share/t' });
  });

  it('returns ok:false on a non-2xx', async () => {
    stubFetch(400, { error: 'x' });
    expect(await createShareCard()).toEqual({ ok: false });
  });

  it('returns ok:false on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await createShareCard()).toEqual({ ok: false });
  });
});
