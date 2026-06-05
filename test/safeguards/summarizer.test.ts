import { describe, it, expect, vi } from 'vitest';

const call = vi.fn();
vi.mock('@/lib/llm/sonnet', () => ({ createSonnetCaller: () => call }));

import { summarizeSession } from '@/lib/safeguards/summarizer';
import type { LlmMessage } from '@/lib/safeguards/types';

const convo: LlmMessage[] = [
  { role: 'assistant', content: 'how is your energy?' },
  { role: 'user', content: 'low all week, sleeping badly' },
];

describe('summarizeSession', () => {
  it('returns a clean, non-diagnostic summary', async () => {
    call.mockReset().mockResolvedValue({ text: 'Energy and sleep have been low this week; open to small changes.' });
    const out = await summarizeSession({ messages: convo });
    expect(out).toMatch(/energy/i);
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('regenerates once when the first summary is blocked, then keeps the clean one', async () => {
    call
      .mockReset()
      .mockResolvedValueOnce({ text: 'He clearly has low testosterone.' })
      .mockResolvedValueOnce({ text: 'Energy and drive have felt low; worth tracking.' });
    const log = vi.fn();
    const out = await summarizeSession({ messages: convo, log });
    expect(out).toMatch(/energy/i);
    expect(call).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledWith({ event: 'summary_filtered', outcome: 'regenerated' });
  });

  it('drops the summary (null) and logs when still blocked after regeneration', async () => {
    call.mockReset().mockResolvedValue({ text: 'Diagnosis: hypogonadism; start testosterone.' });
    const log = vi.fn();
    const out = await summarizeSession({ messages: convo, log });
    expect(out).toBeNull();
    expect(call).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledWith({ event: 'summary_filtered', outcome: 'dropped' });
  });
});
