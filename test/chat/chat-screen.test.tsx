// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { sendChatTurn, endSession } = vi.hoisted(() => ({ sendChatTurn: vi.fn(), endSession: vi.fn() }));
vi.mock('@/lib/chat/client', () => ({ sendChatTurn, endSession }));

import { ChatScreen } from '@/components/chat/ChatScreen';
import type { RadarProfile } from '@/lib/scoring';

const emptyProfile: RadarProfile = {
  axes: { energy: null, strength: null, sleep: null, drive: null, focus: null, body: null },
  overall: null,
  tier: null,
};

function type(text: string) {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: /send/i }));
}

describe('ChatScreen', () => {
  beforeEach(() => {
    sendChatTurn.mockReset();
    endSession.mockReset().mockResolvedValue({ ok: true, summarized: true });
  });

  it('opens with a greeting so the screen is never empty', () => {
    render(<ChatScreen initialProfile={emptyProfile} />);
    expect(screen.getByText(/i'm ava/i)).toBeInTheDocument();
  });

  it('greets a returning user with a nod to their prior overall', () => {
    const returning: RadarProfile = {
      ...emptyProfile,
      overall: 52,
      tier: { label: 'Room to Grow', color: 'x' },
    };
    render(<ChatScreen initialProfile={returning} />);
    // `/52/` alone would also match the score pill; assert the opener phrase specifically.
    expect(screen.getByText(/landed around 52/i)).toBeInTheDocument();
  });

  it('shows the user message then Ava reply and updates the score pill', async () => {
    sendChatTurn.mockResolvedValue({
      kind: 'reply',
      reply: 'Many men notice that. How is your sleep?',
      signals: { energy: [4] },
      profile: { ...emptyProfile, axes: { ...emptyProfile.axes, energy: 100 }, overall: 100, tier: { label: 'Optimized', color: 'x' } },
      sessionId: 's1',
    });
    render(<ChatScreen initialProfile={emptyProfile} />);
    type('my energy is great');
    expect(screen.getByText('my energy is great')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/how is your sleep/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /wellness score 100/i })).toBeInTheDocument();
  });

  it('sends the prior turns + sessionId on the second message', async () => {
    sendChatTurn.mockResolvedValue({ kind: 'reply', reply: 'ok', signals: {}, profile: emptyProfile, sessionId: 's1' });
    render(<ChatScreen initialProfile={emptyProfile} />);
    type('first');
    await waitFor(() => expect(screen.getByText('ok')).toBeInTheDocument());
    type('second');
    await waitFor(() => expect(sendChatTurn).toHaveBeenCalledTimes(2));
    const secondArg = sendChatTurn.mock.calls[1][0];
    expect(secondArg.sessionId).toBe('s1');
    // The thread now leads with Ava's opener (an assistant turn); the user/assistant turns follow.
    expect(secondArg.messages[0].role).toBe('assistant');
    expect(secondArg.messages.map((m: { content: string }) => m.content).slice(-3)).toEqual([
      'first',
      'ok',
      'second',
    ]);
  });

  it('renders the crisis card and locks the composer', async () => {
    sendChatTurn.mockResolvedValue({ kind: 'crisis', card: { kind: 'crisis', headline: 'help is available', resources: [{ label: '988', contact: 'Call 988' }] }, sessionId: null });
    render(<ChatScreen initialProfile={emptyProfile} />);
    type('I want to end it all');
    await waitFor(() => expect(screen.getByText(/help is available/i)).toBeInTheDocument());
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('disables the composer when capped', async () => {
    sendChatTurn.mockResolvedValue({ kind: 'cap', text: 'come back tomorrow' });
    render(<ChatScreen initialProfile={emptyProfile} />);
    type('hello');
    await waitFor(() => expect(screen.getByRole('textbox')).toBeDisabled());
  });

  it('clears the crisis lock when the check-in is ended (no dead-end)', async () => {
    sendChatTurn.mockResolvedValue({
      kind: 'crisis',
      card: { kind: 'crisis', headline: 'help is available', resources: [{ label: '988', contact: 'Call 988' }] },
      sessionId: null,
    });
    render(<ChatScreen initialProfile={emptyProfile} />);
    type('I want to end it all');
    await waitFor(() => expect(screen.getByText(/help is available/i)).toBeInTheDocument());
    expect(screen.getByRole('textbox')).toBeDisabled();
    // Open the radar drawer (pill is not locked) and end the check-in.
    fireEvent.click(screen.getByRole('button', { name: /wellness score/i }));
    fireEvent.click(screen.getByRole('button', { name: /end check-?in/i }));
    expect(screen.queryByText(/help is available/i)).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeEnabled();
  });

  it('finalizes the session via /api/session/end on End check-in', async () => {
    sendChatTurn.mockResolvedValue({ kind: 'reply', reply: 'ok', signals: {}, profile: emptyProfile, sessionId: 's1' });
    render(<ChatScreen initialProfile={emptyProfile} />);
    type('low energy');
    await waitFor(() => expect(screen.getByText('ok')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /wellness score/i })); // open the drawer
    fireEvent.click(screen.getByRole('button', { name: /end check-?in/i }));
    await waitFor(() => expect(endSession).toHaveBeenCalledTimes(1));
    const arg = endSession.mock.calls[0][0];
    expect(arg.sessionId).toBe('s1');
    expect(arg.messages.some((m: { content: string }) => m.content === 'low energy')).toBe(true);
  });
});
