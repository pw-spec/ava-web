// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScorePill } from '@/components/chat/ScorePill';
import type { RadarProfile } from '@/lib/scoring';

const profile: RadarProfile = {
  axes: { energy: 50, strength: null, sleep: null, drive: null, focus: null, body: null },
  overall: 47,
  tier: { label: 'Room to Grow', color: 'var(--tier-room)' },
};

describe('ScorePill', () => {
  it('shows the overall score and calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<ScorePill profile={profile} pulsing={false} onToggle={onToggle} />);
    const btn = screen.getByRole('button', { name: /wellness score 47/i });
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows a dash when there is no score yet', () => {
    const empty: RadarProfile = { axes: profile.axes, overall: null, tier: null };
    render(<ScorePill profile={empty} pulsing={false} onToggle={() => {}} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
