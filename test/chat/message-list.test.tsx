// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageList } from '@/components/chat/MessageList';
import { CRISIS_CARD } from '@/lib/safeguards/crisis-card';
import type { RadarProfile } from '@/lib/scoring';

const msgs = [
  { id: 1, role: 'user' as const, content: 'hey' },
  { id: 2, role: 'assistant' as const, content: 'how is your energy?' },
];

const gapProfile: RadarProfile = {
  axes: { energy: 58, strength: 60, sleep: 41, drive: null, focus: null, body: 49 },
  overall: 52,
  tier: { label: 'Room to Grow', color: 'x' },
};

describe('MessageList', () => {
  it('renders the conversation turns', () => {
    render(<MessageList messages={msgs} pending={false} crisis={null} capped={false} />);
    expect(screen.getByText('hey')).toBeInTheDocument();
    expect(screen.getByText('how is your energy?')).toBeInTheDocument();
  });

  it('shows the typing indicator while pending', () => {
    render(<MessageList messages={msgs} pending crisis={null} capped={false} />);
    expect(screen.getByLabelText(/ava is typing/i)).toBeInTheDocument();
  });

  it('renders the crisis card with the 988 lifeline', () => {
    render(<MessageList messages={msgs} pending={false} crisis={CRISIS_CARD} capped={false} />);
    // `/988/` alone matches both the resource label and its contact → use the unique contact line.
    expect(screen.getByText(/call or text 988/i)).toBeInTheDocument();
    expect(screen.getByText(/in crisis/i)).toBeInTheDocument();
  });

  it('renders the daily-cap note', () => {
    render(<MessageList messages={msgs} pending={false} crisis={null} capped />);
    expect(screen.getByText(/free check-?in for today/i)).toBeInTheDocument();
  });

  it('renders a GapCard for a gap item in the stream', () => {
    const items = [
      { id: 1, role: 'assistant' as const, content: 'how is your energy?' },
      { id: 2, kind: 'gap' as const, profile: gapProfile },
    ];
    render(<MessageList messages={items} pending={false} crisis={null} capped={false} />);
    expect(screen.getByText(/where you're landing/i)).toBeInTheDocument();
    expect(screen.getByText(/2 still blank/i)).toBeInTheDocument();
  });
});
