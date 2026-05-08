interface ProgressBarProps {
  current: number;
  total: number;
}

/** Hairline progress indicator — sits at the very top of the intake. */
export function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (current / total) * 100));

  return (
    <div
      className="relative w-full"
      style={{
        height: 2,
        background: "rgba(245, 241, 232, 0.06)",
      }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={`Step ${current} of ${total}`}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: `${pct}%`,
          background:
            "linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-light) 100%)",
          transition: "width 480ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </div>
  );
}
