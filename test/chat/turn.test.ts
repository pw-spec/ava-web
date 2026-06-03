import { describe, it, expect, vi } from 'vitest';

const { runSafeguardedTurn } = vi.hoisted(() => ({ runSafeguardedTurn: vi.fn() }));
vi.mock('@/lib/safeguards/runtime', () => ({ runSafeguardedTurn }));

import { runChatTurn } from '@/lib/chat/turn';

describe('runChatTurn', () => {
  it('passes a crisis result through', async () => {
    runSafeguardedTurn.mockResolvedValue({ kind: 'crisis', card: { kind: 'crisis' } });
    const res = await runChatTurn({ history: [], userMessage: 'hi', signals: {} });
    expect(res.kind).toBe('crisis');
  });

  it('merges extracted signals and computes the profile', async () => {
    runSafeguardedTurn.mockResolvedValue({
      kind: 'reply',
      text: 'Many men notice that. How is your sleep?',
      structured: { axis: 'energy', severities: [4, 4] },
      flags: [],
    });
    const res = await runChatTurn({ history: [], userMessage: 'great energy', signals: {} });
    expect(res.kind).toBe('reply');
    if (res.kind !== 'reply') return;
    expect(res.signals.energy).toEqual([4, 4]);
    expect(res.profile.axes.energy).toBe(100);
    expect(res.reply).toContain('sleep');
  });

  it('leaves signals unchanged when the model extracted none', async () => {
    runSafeguardedTurn.mockResolvedValue({ kind: 'reply', text: 'ok', structured: undefined, flags: [] });
    const res = await runChatTurn({ history: [], userMessage: 'hmm', signals: { sleep: [2] } });
    if (res.kind !== 'reply') throw new Error('expected reply');
    expect(res.signals).toEqual({ sleep: [2] });
  });

  it('passes redirect/error through', async () => {
    runSafeguardedTurn.mockResolvedValue({ kind: 'error', text: 'oops' });
    const res = await runChatTurn({ history: [], userMessage: 'x', signals: {} });
    expect(res.kind).toBe('error');
  });
});
