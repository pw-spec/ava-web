import { ImageResponse } from 'next/og';
import { getShareCard } from '@/lib/share/read';

export const alt = 'Ava wellness baseline';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Robust, satori-friendly still (flexbox + inline styles only). Leads with the overall number +
// branding so the link previews as a card.
export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const card = await getShareCard(token);
  const overall = card?.overall ?? null;
  const who = card?.displayName ? `${card.displayName}'s` : 'My';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f6f0e8, #ead9bd)',
          color: '#2b2622',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: 2 }}>Ava</div>
        <div style={{ fontSize: 240, fontWeight: 800, lineHeight: 1, color: '#c8643c' }}>
          {overall ?? '—'}
        </div>
        <div style={{ fontSize: 40, fontWeight: 700 }}>{who} wellness baseline</div>
      </div>
    ),
    { ...size },
  );
}
