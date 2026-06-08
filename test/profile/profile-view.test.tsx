// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileView } from '@/components/profile/ProfileView';
import type { RadarProfile } from '@/lib/scoring';

const profile: RadarProfile = {
  axes: { energy: 58, strength: 60, sleep: 41, drive: 47, focus: 44, body: 49 },
  overall: 50,
  tier: { label: 'Room to Grow', color: 'x' },
};

describe('ProfileView', () => {
  it('locked: shows the upsell and a way back to a check-in', () => {
    render(<ProfileView state="locked" />);
    expect(screen.getByText(/wellness profile/i)).toBeInTheDocument();
    expect(screen.getByText(/\$29/)).toBeInTheDocument();
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('preparing: shows a preparing message', () => {
    render(<ProfileView state="preparing" />);
    expect(screen.getByText(/preparing your profile/i)).toBeInTheDocument();
  });

  it('ready: renders the written report and the radar', () => {
    render(<ProfileView state="ready" report={'Your energy has been low this week.'} profile={profile} />);
    expect(screen.getByText(/your energy has been low/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /wellness radar/i })).toBeInTheDocument();
  });
});
