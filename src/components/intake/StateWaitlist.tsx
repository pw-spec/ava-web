"use client";

import { useState } from "react";
import { AvaOrb } from "@/components/avatar/AvaOrb";
import { blockedStateMessage } from "@/lib/launchStates";

interface StateWaitlistProps {
  stateCode: string;
  /** Called with the captured email so the page can decide what to do next. */
  onSubmit: (email: string) => void;
  /** Called when the user wants to pick a different state. */
  onPickDifferentState: () => void;
}

/**
 * Shown when the user picks a state we don't yet serve. Captures email for
 * waitlist + lets them pick a different state if they share residence with
 * one we cover.
 */
export function StateWaitlist({
  stateCode,
  onSubmit,
  onPickDifferentState,
}: StateWaitlistProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const note =
    blockedStateMessage(stateCode) ??
    "We're not yet available in your state. Drop your email and we'll let you know.";

  if (submitted) {
    return (
      <div className="question-in flex flex-col items-center gap-6 py-8 text-center">
        <AvaOrb size={56} />
        <div>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 24,
              fontWeight: 300,
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
            }}
          >
            Got it. I&apos;ll write to you when we open up {stateCode}.
          </p>
          <p
            className="mt-3"
            style={{
              color: "var(--text-secondary)",
              fontSize: 14,
              lineHeight: 1.55,
            }}
          >
            One email when we&apos;re live. No marketing spam.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="question-in flex flex-col gap-6">
      <div className="flex items-start gap-4 sm:gap-5">
        <AvaOrb size={56} />
        <div className="flex flex-1 flex-col gap-2 pt-1">
          <span
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Ava
          </span>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(20px, 3.2vw, 26px)",
              fontWeight: 300,
              color: "var(--text-primary)",
              lineHeight: 1.35,
              letterSpacing: "-0.01em",
            }}
          >
            {note}
          </p>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
              lineHeight: 1.55,
              maxWidth: 520,
            }}
          >
            Treatment requires a clinician licensed in your state. We&apos;re
            adding states as our clinical partners expand coverage. Drop your
            email and you&apos;ll be the first to know when {stateCode} opens.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="intake-input-wrap">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="intake-input"
            aria-label="Email for state waitlist"
            autoFocus
          />
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onPickDifferentState}
            className="cta-secondary"
            style={{ minWidth: 110 }}
          >
            ← Pick a different state
          </button>
          <button
            type="button"
            onClick={() => {
              if (!valid) return;
              onSubmit(email);
              setSubmitted(true);
            }}
            disabled={!valid}
            className="cta-primary"
            style={{ minWidth: 200 }}
          >
            Notify me
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path
                d="M3 7h8m-3-4 4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
