import { describe, it, expect } from 'vitest';
import { createFixedWindowLimiter } from '@/lib/ratelimit/fixed-window';

describe('createFixedWindowLimiter', () => {
  it('allows up to the limit within a window, then blocks', () => {
    const now = 1000;
    const limiter = createFixedWindowLimiter({ limit: 3, windowMs: 1000, now: () => now });
    expect(limiter.check('ip').allowed).toBe(true); // 1
    expect(limiter.check('ip').allowed).toBe(true); // 2
    expect(limiter.check('ip').allowed).toBe(true); // 3
    expect(limiter.check('ip').allowed).toBe(false); // 4 -> blocked
  });

  it('resets after the window elapses', () => {
    let now = 1000;
    const limiter = createFixedWindowLimiter({ limit: 1, windowMs: 1000, now: () => now });
    expect(limiter.check('ip').allowed).toBe(true);
    expect(limiter.check('ip').allowed).toBe(false);
    now += 1000; // window elapsed
    expect(limiter.check('ip').allowed).toBe(true);
  });

  it('tracks keys independently', () => {
    const now = 1000;
    const limiter = createFixedWindowLimiter({ limit: 1, windowMs: 1000, now: () => now });
    expect(limiter.check('a').allowed).toBe(true);
    expect(limiter.check('b').allowed).toBe(true);
    expect(limiter.check('a').allowed).toBe(false);
  });

  it('can be reset (for test isolation)', () => {
    const now = 1000;
    const limiter = createFixedWindowLimiter({ limit: 1, windowMs: 1000, now: () => now });
    expect(limiter.check('ip').allowed).toBe(true);
    expect(limiter.check('ip').allowed).toBe(false);
    limiter.reset();
    expect(limiter.check('ip').allowed).toBe(true);
  });
});
