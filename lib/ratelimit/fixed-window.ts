export interface RateLimiter {
  check(key: string): { allowed: boolean };
  reset(): void;
}

interface Window {
  count: number;
  resetAt: number;
}

/**
 * Best-effort in-memory fixed-window rate limiter.
 *
 * NOTE: state lives in the process, so on serverless (Vercel) this is per-instance
 * and resets on cold start — it is defense-in-depth, not the durable layer. At deploy,
 * back the public endpoints with a Vercel Firewall rate-limit rule (and/or Upstash).
 */
export function createFixedWindowLimiter(opts: {
  limit: number;
  windowMs: number;
  now?: () => number;
}): RateLimiter {
  const now = opts.now ?? Date.now;
  const windows = new Map<string, Window>();

  return {
    check(key: string): { allowed: boolean } {
      const t = now();
      const w = windows.get(key);
      if (!w || t >= w.resetAt) {
        windows.set(key, { count: 1, resetAt: t + opts.windowMs });
        return { allowed: true };
      }
      if (w.count >= opts.limit) return { allowed: false };
      w.count += 1;
      return { allowed: true };
    },
    reset(): void {
      windows.clear();
    },
  };
}
