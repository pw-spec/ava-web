import { describe, it, expect, vi } from 'vitest';

const call = vi.fn();
vi.mock('@/lib/llm/sonnet', () => ({ createSonnetCaller: () => call }));

import { generateProfileReport } from '@/lib/safeguards/profile-report';
import type { LlmMessage } from '@/lib/safeguards/types';

const convo: LlmMessage[] = [
  { role: 'assistant', content: 'how is your energy?' },
  { role: 'user', content: 'low all week, sleeping badly' },
];

describe('generateProfileReport', () => {
  it('returns a clean, non-diagnostic report', async () => {
    call.mockReset().mockResolvedValue({
      text: 'Your energy and sleep have been running low together this week. Worth paying attention to.',
    });
    const out = await generateProfileReport({ messages: convo });
    expect(out).toMatch(/energy/i);
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('regenerates once when the first report is blocked, then keeps the clean one', async () => {
    call
      .mockReset()
      .mockResolvedValueOnce({ text: 'You clearly have low testosterone.' })
      .mockResolvedValueOnce({ text: 'Your drive and energy have felt low; worth tracking over time.' });
    const log = vi.fn();
    const out = await generateProfileReport({ messages: convo, log });
    expect(out).toMatch(/drive/i);
    expect(call).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledWith({ event: 'profile_filtered', outcome: 'regenerated' });
  });

  it('drops the report (null) and logs when still blocked after regeneration', async () => {
    call.mockReset().mockResolvedValue({ text: 'Diagnosis: hypogonadism; start testosterone therapy.' });
    const log = vi.fn();
    const out = await generateProfileReport({ messages: convo, log });
    expect(out).toBeNull();
    expect(call).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledWith({ event: 'profile_filtered', outcome: 'dropped' });
  });
});
