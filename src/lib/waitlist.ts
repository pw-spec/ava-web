/**
 * Waitlist email capture for geo-blocked states (NY, CA — see launchStates.ts).
 *
 * TODO(waitlist-backend): When the AWS backend ships, replace the env-driven
 * fetch below with a call to the production /waitlist endpoint that lives
 * inside the HIPAA-aligned zone. Until then:
 *
 *   - If NEXT_PUBLIC_WAITLIST_URL is set (e.g. a Mailchimp / ConvertKit /
 *     Vercel KV no-PHI endpoint), POST {state, email, source} to it.
 *   - Otherwise log to dev console as a visible signal during testing.
 *
 * We intentionally do NOT fall back to localStorage / sessionStorage even
 * though email-only is technically not PHI under HIPAA — a user picking
 * "California" implicitly signals they're seeking a controlled-substance
 * health service, which is health-context information per OCR guidance.
 * Better to lose a capture during dev than to write health-context data
 * to client storage. See docs/COMPLIANCE_BASELINE.md §7 (HIPAA).
 */

interface WaitlistEntry {
  state: string;
  email: string;
  source: "qualify-state-block";
}

export async function captureWaitlistEntry(
  entry: WaitlistEntry,
): Promise<void> {
  const endpoint = process.env.NEXT_PUBLIC_WAITLIST_URL;

  if (endpoint) {
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      return;
    } catch (err) {
      // Don't surface to user — the friendly "we'll let you know" message
      // already played. Log so dev can investigate.
      console.warn("[waitlist] POST failed:", (err as Error).message, entry);
      return;
    }
  }

  console.warn(
    "[waitlist] no NEXT_PUBLIC_WAITLIST_URL set — entry not persisted:",
    entry,
  );
}
