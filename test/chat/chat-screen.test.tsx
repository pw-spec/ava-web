// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { sendChatTurn, endSession } = vi.hoisted(() => ({ sendChatTurn: vi.fn(), endSession: vi.fn() }));
vi.mock('@/lib/chat/client', () => ({ sendChatTurn, endSession }));

import { ChatScreen } from '@/components/chat/ChatScreen';
import type { RadarProfile } from '@/lib/scoring';
import { AXES } from '@/lib/scoring';

const emptyProfile: RadarProfile = {
  axes: { energy: null, strength: null, sleep: null, drive: null, focus: null, body: null },
  overall: null,
  tier: null,
};

/** A reply profile with the first `n` axes scored (50), the rest null. */
function profileWith(n: number): RadarProfile {
  const axes = Object.fromEntries(AXES.map((a, i) => [a, i < n ? 50 : null])) as RadarProfile['axes'];
  return { axes, overall: n ? 50 : null, tier: { label: 'Room to Grow', color: 'x' } };
}

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

  it('reveals the Gap card once, when the 4th axis is scored', async () => {
    sendChatTurn
      .mockResolvedValueOnce({ kind: 'reply', reply: 'r1', signals: {}, profile: profileWith(3), sessionId: 's1' })
      .mockResolvedValueOnce({ kind: 'reply', reply: 'r2', signals: {}, profile: profileWith(4), sessionId: 's1' })
      .mockResolvedValueOnce({ kind: 'reply', reply: 'r3', signals: {}, profile: profileWith(5), sessionId: 's1' });
    render(<ChatScreen initialProfile={emptyProfile} />);

    type('a');
    await waitFor(() => expect(screen.getByText('r1')).toBeInTheDocument());
    expect(screen.queryByText(/still blank/i)).not.toBeInTheDocument(); // 3 scored → no gap yet

    type('b');
    await waitFor(() => expect(screen.getByText('r2')).toBeInTheDocument());
    expect(screen.getByText(/still blank/i)).toBeInTheDocument(); // 4 scored → gap appears

    type('c');
    await waitFor(() => expect(screen.getByText('r3')).toBeInTheDocument());
    expect(screen.getAllByText(/still blank/i)).toHaveLength(1); // only once
  });

  it('suppresses the Gap when the session starts already mapped (returning user)', async () => {
    sendChatTurn.mockResolvedValue({ kind: 'reply', reply: 'r', signals: {}, profile: profileWith(5), sessionId: 's1' });
    render(<ChatScreen initialProfile={profileWith(4)} />);
    type('hi');
    await waitFor(() => expect(screen.getByText('r')).toBeInTheDocument());
    expect(screen.queryByText(/still blank/i)).not.toBeInTheDocument();
  });

  it('focuses the composer when "Keep going" is clicked', async () => {
    sendChatTurn.mockResolvedValue({ kind: 'reply', reply: 'r', signals: {}, profile: profileWith(4), sessionId: 's1' });
    render(<ChatScreen initialProfile={emptyProfile} />);
    type('hi');
    await waitFor(() => expect(screen.getByText(/still blank/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /keep going/i }));
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('never sends the inline gap item to the LLM (wire is text-only)', async () => {
    sendChatTurn
      .mockResolvedValueOnce({ kind: 'reply', reply: 'r1', signals: {}, profile: profileWith(4), sessionId: 's1' })
      .mockResolvedValueOnce({ kind: 'reply', reply: 'r2', signals: {}, profile: profileWith(5), sessionId: 's1' });
    render(<ChatScreen initialProfile={emptyProfile} />);
    type('a');
    await waitFor(() => expect(screen.getByText(/still blank/i)).toBeInTheDocument()); // gap is now in the stream
    type('b');
    await waitFor(() => expect(sendChatTurn).toHaveBeenCalledTimes(2));
    const wire = sendChatTurn.mock.calls[1][0].messages;
    // every wire entry is a real text turn — no gap item (which has `kind` and no role/content) leaked in
    expect(wire.every((m: { role?: string; content?: string }) => 'role' in m && 'content' in m)).toBe(true);
    expect(wire.some((m: { kind?: string }) => m.kind === 'gap')).toBe(false);
  });

  it('clears the Gap card after the check-in is ended', async () => {
    sendChatTurn.mockResolvedValue({ kind: 'reply', reply: 'r', signals: {}, profile: profileWith(4), sessionId: 's1' });
    render(<ChatScreen initialProfile={emptyProfile} />);
    type('hi');
    await waitFor(() => expect(screen.getByText(/still blank/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /wellness score/i })); // open the drawer
    fireEvent.click(screen.getByRole('button', { name: /end check-?in/i }));
    expect(screen.queryByText(/still blank/i)).not.toBeInTheDocument();
  });
});
