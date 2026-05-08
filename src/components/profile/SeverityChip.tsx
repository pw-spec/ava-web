import type { SeverityLevel } from "@/lib/scoring";

const MAP: Record<SeverityLevel, { label: string; tone: string }> = {
  good: { label: "Mild indicators", tone: "var(--score-good)" },
  moderate: { label: "Moderate indicators", tone: "var(--score-moderate)" },
  poor: { label: "Significant indicators", tone: "var(--score-poor)" },
  severe: { label: "Considerable indicators", tone: "var(--score-severe)" },
};

export function SeverityChip({ severity }: { severity: SeverityLevel }) {
  const m = MAP[severity];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 12px",
        borderRadius: 100,
        border: `1px solid ${m.tone}33`,
        background: `${m.tone}14`,
        color: m.tone,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: 9999,
          background: m.tone,
        }}
      />
      {m.label}
    </span>
  );
}
