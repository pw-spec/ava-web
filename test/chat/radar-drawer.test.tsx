// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RadarDrawer } from '@/components/chat/RadarDrawer';
import type { RadarProfile } from '@/lib/scoring';

vi.mock('@/lib/share/client', () => ({ createShareCard: vi.fn() }));

const profile: RadarProfile = {
  axes: { energy: 50, strength: null, sleep: null, drive: null, focus: null, body: null },
  overall: 47,
  tier: { label: 'Room to Grow', color: 'var(--tier-room)' },
};

describe('RadarDrawer', () => {
  it('renders the radar and the end button when open', () => {
    render(<RadarDrawer open profile={profile} onClose={() => {}} onEnd={() => {}} />);
    expect(screen.getByRole('img', { name: /wellness radar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /end check-?in/i })).toBeInTheDocument();
  });

  it('fires onEnd and onClose from their controls', () => {
    const onEnd = vi.fn();
    const onClose = vi.fn();
    render(<RadarDrawer open profile={profile} onClose={onClose} onEnd={onEnd} />);
    fireEvent.click(screen.getByRole('button', { name: /end check-?in/i }));
    expect(onEnd).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('is hidden from assistive tech when closed', () => {
    render(<RadarDrawer open={false} profile={profile} onClose={() => {}} onEnd={() => {}} />);
    expect(screen.queryByRole('img', { name: /wellness radar/i })).not.toBeInTheDocument();
  });

  it('offers "Share my baseline" when there is a baseline', () => {
    render(<RadarDrawer open profile={profile} onClose={() => {}} onEnd={() => {}} />);
    expect(screen.getByRole('button', { name: /share my baseline/i })).toBeInTheDocument();
  });

  it('hides the share trigger when there is no baseline', () => {
    const blank: RadarProfile = { ...profile, overall: null, tier: null };
    render(<RadarDrawer open profile={blank} onClose={() => {}} onEnd={() => {}} />);
    expect(screen.queryByRole('button', { name: /share my baseline/i })).not.toBeInTheDocument();
  });
});
