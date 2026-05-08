import Link from "next/link";
import { AvaOrb } from "@/components/avatar/AvaOrb";
import { RadarChart } from "@/components/charts/RadarChart";
import { brandConfig, BRAND } from "@/lib/brand";
import type { HealthScores } from "@/types";

interface ChatTopBarProps {
  scores: HealthScores;
  status: "listening" | "thinking" | "ready" | "crisis";
  /** Where the back-arrow takes the user. Defaults to "/". */
  backHref?: string;
  /** Visible label next to the back arrow. */
  backLabel?: string;
}

const STATUS_LABEL: Record<ChatTopBarProps["status"], string> = {
  listening: "listening",
  thinking: "thinking…",
  ready: "ready",
  crisis: "support resources active",
};

const STATUS_COLOR: Record<ChatTopBarProps["status"], string> = {
  listening: "var(--text-muted)",
  thinking: "var(--text-muted)",
  ready: "var(--text-muted)",
  crisis: "var(--score-moderate)",
};

/** Top bar — back link + orb + name + AI badge + status + mini radar. */
export function ChatTopBar({
  scores,
  status,
  backHref = "/",
  backLabel = "Home",
}: ChatTopBarProps) {
  const brand = brandConfig[BRAND];
  const statusLabel = STATUS_LABEL[status];
  const statusColor = STATUS_COLOR[status];
  const isCrisis = status === "crisis";

  return (
    <header
      className="flex items-center justify-between gap-3 px-5 py-4"
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        background:
          "linear-gradient(180deg, rgba(10, 13, 18, 0.9) 0%, rgba(10, 13, 18, 0.65) 100%)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="inline-flex shrink-0 items-center gap-1.5"
          aria-label={`Back to ${backLabel.toLowerCase()}`}
          style={{
            color: "var(--text-muted)",
            fontSize: 11,
            letterSpacing: "0.04em",
            paddingRight: 8,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden>
            <path
              d="M11 7H3m4 4-4-4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          {backLabel}
        </Link>

        <span
          aria-hidden
          style={{
            width: 1,
            height: 28,
            background: "var(--border-subtle)",
          }}
        />

        <AvaOrb size={36} />
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: "-0.005em",
                color: "var(--text-primary)",
              }}
            >
              {brand.name}
            </span>
            <span
              className="ai-badge"
              title="Ava is an AI companion, not a medical provider"
            >
              <span aria-hidden>ⓘ</span> AI · not a doctor
            </span>
          </div>
          <span
            className="mono inline-flex items-center gap-1.5"
            style={{
              fontSize: 10,
              color: statusColor,
              letterSpacing: "0.1em",
              transition: "color 240ms ease",
            }}
            aria-live="polite"
          >
            {isCrisis && (
              <span
                aria-hidden
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: 9999,
                  background: statusColor,
                  animation: "glow-pulse 1.6s ease-in-out infinite",
                }}
              />
            )}
            {statusLabel}
          </span>
        </div>
      </div>

      <div
        aria-label="Health profile preview"
        className="shrink-0"
        style={{ width: 56, height: 56 }}
      >
        <RadarChart scores={scores} size={56} showLabels={false} />
      </div>
    </header>
  );
}
