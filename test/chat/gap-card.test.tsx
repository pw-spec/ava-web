// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GapCard } from '@/components/chat/GapCard';
import type { RadarProfile } from '@/lib/scoring';

// 4 scored, 2 blank (drive, focus) — the canonical Gap moment.
const profile: RadarProfile = {
  axes: { energy: 58, strength: 60, sleep: 41, drive: null, focus: null, body: 49 },
  overall: 52,
  tier: { label: 'Room to Grow', color: 'x' },
};

describe('GapCard', () => {
  it('shows the framing line, the teaser, and the keep-going CTA', () => {
    render(<GapCard profile={profile} onKeepGoing={() => {}} />);
    expect(screen.getByText(/where you're landing/i)).toBeInTheDocument();
    expect(screen.getByText(/fills in all six/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /keep going/i })).toBeInTheDocument();
  });

  it('reflects the number of blank axes', () => {
    render(<GapCard profile={profile} onKeepGoing={() => {}} />);
    expect(screen.getByText(/2 still blank/i)).toBeInTheDocument();
  });

  it('renders ?? for each unscored axis', () => {
    const { container } = render(<GapCard profile={profile} onKeepGoing={() => {}} />);
    const tokens = Array.from(container.querySelectorAll('tspan')).map((t) => t.textContent);
    expect(tokens.filter((t) => t === '??')).toHaveLength(2);
  });

  it('exposes the radar SVG with an accessible role/name', () => {
    render(<GapCard profile={profile} onKeepGoing={() => {}} />);
    expect(screen.getByRole('img', { name: /radar/i })).toBeInTheDocument();
  });

  it('renders the numeric value for scored axes', () => {
    const { container } = render(<GapCard profile={profile} onKeepGoing={() => {}} />);
    const tokens = Array.from(container.querySelectorAll('tspan')).map((t) => t.textContent);
    expect(tokens).toContain('58');
    expect(tokens).toContain('60');
  });

  it('does not leak any axis symptom/condition language (labels + values only)', () => {
    render(<GapCard profile={profile} onKeepGoing={() => {}} />);
    expect(screen.queryByText(/testosterone|diagnos|symptom|condition/i)).not.toBeInTheDocument();
  });

  it('calls onKeepGoing when the CTA is clicked', () => {
    const onKeepGoing = vi.fn();
    render(<GapCard profile={profile} onKeepGoing={onKeepGoing} />);
    fireEvent.click(screen.getByRole('button', { name: /keep going/i }));
    expect(onKeepGoing).toHaveBeenCalledTimes(1);
  });
});
