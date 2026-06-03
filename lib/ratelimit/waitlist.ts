import { createFixedWindowLimiter } from './fixed-window';

// 5 submissions per minute per IP. Best-effort (per-instance on serverless);
// the durable layer is a Vercel Firewall rate-limit rule, added at deploy.
export const waitlistLimiter = createFixedWindowLimiter({ limit: 5, windowMs: 60_000 });
