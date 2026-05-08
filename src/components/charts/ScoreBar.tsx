interface ScoreBarProps {
  label: string;
  emoji: string;
  score: number;
  className?: string;
}

/** Severity color thresholds — see docs/SPEC.md "Page 3: Profile". */
function severityColor(score: number): string {
  if (score >= 65) return "var(--score-good)";
  if (score >= 45) return "var(--score-moderate)";
  if (score >= 25) return "var(--score-poor)";
  return "var(--score-severe)";
}

export function ScoreBar({ label, emoji, score, className = "" }: ScoreBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  return (
    <div className={`flex w-full items-center gap-3 ${className}`}>
      <span className="w-5 text-center text-[14px] leading-none" aria-hidden>
        {emoji}
      </span>
      <span
        className="w-16 text-[12px]"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </span>
      <div
        className="relative flex-1 overflow-hidden rounded-[2px]"
        style={{ background: "rgba(148, 163, 184, 0.06)", height: 3 }}
      >
        <div
          className="h-full rounded-[2px]"
          style={{
            width: `${clamped}%`,
            background: severityColor(clamped),
            transition:
              "width 0.8s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label} score`}
        />
      </div>
      <span
        className="w-8 text-right text-[12px]"
        style={{
          color: "var(--text-secondary)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {clamped}
      </span>
    </div>
  );
}
