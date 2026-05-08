"use client";

import { useEffect, useState } from "react";
import { AvaOrb } from "@/components/avatar/AvaOrb";

interface AvaQuestionProps {
  /** Stable id — when it changes, the question re-mounts and re-animates. */
  stepId: string;
  message: string;
  helper?: string;
}

/**
 * The "speaking" element — orb on the left, Ava's spoken line on the right.
 * Fades in when stepId changes; orb pulses briefly to signal she's speaking.
 */
export function AvaQuestion({ stepId, message, helper }: AvaQuestionProps) {
  // Force remount on step change so the animation replays.
  return <AvaQuestionImpl key={stepId} message={message} helper={helper} />;
}

function AvaQuestionImpl({
  message,
  helper,
}: {
  message: string;
  helper?: string;
}) {
  const [pulsing, setPulsing] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setPulsing(false), 1500);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      className="question-in flex w-full items-start gap-4 sm:gap-5"
      style={{ paddingBlock: "8px" }}
    >
      <div className={pulsing ? "orb-speak" : undefined} style={{ flexShrink: 0 }}>
        <AvaOrb size={56} />
      </div>

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
          {message}
        </p>
        {helper && (
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
              lineHeight: 1.55,
              maxWidth: 520,
            }}
          >
            {helper}
          </p>
        )}
      </div>
    </div>
  );
}
