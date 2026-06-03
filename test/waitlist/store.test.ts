import { describe, it, expect, vi } from 'vitest';
import { saveEmail } from '@/lib/waitlist/store';

function fakeClient(insertResult: { error: { code?: string } | null }) {
  const insert = vi.fn().mockResolvedValue(insertResult);
  const from = vi.fn().mockReturnValue({ insert });
  // reason: minimal structural stand-in for SupabaseClient in tests
  return { client: { from } as never, insert, from };
}

describe('saveEmail', () => {
  it('inserts the email into the waitlist table', async () => {
    const { client, from, insert } = fakeClient({ error: null });
    const res = await saveEmail(client, 'a@b.com');
    expect(from).toHaveBeenCalledWith('waitlist');
    expect(insert).toHaveBeenCalledWith({ email: 'a@b.com' });
    expect(res).toEqual({ duplicate: false });
  });

  it('treats a unique-violation (23505) as a duplicate, not an error', async () => {
    const { client } = fakeClient({ error: { code: '23505' } });
    await expect(saveEmail(client, 'a@b.com')).resolves.toEqual({ duplicate: true });
  });

  it('throws on any other database error', async () => {
    const { client } = fakeClient({ error: { code: '500' } });
    await expect(saveEmail(client, 'a@b.com')).rejects.toThrow();
  });
});
