/** POST to /api/share to mint a brag card. Never throws — HTTP/network failures → { ok: false }. */
export async function createShareCard(
  displayName?: string,
): Promise<{ ok: true; token: string; url: string } | { ok: false }> {
  try {
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(displayName ? { displayName } : {}),
    });
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as { token: string; url: string };
    return { ok: true, token: data.token, url: data.url };
  } catch {
    return { ok: false };
  }
}
