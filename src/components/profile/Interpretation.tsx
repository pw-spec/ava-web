import type { SeverityLevel } from "@/lib/scoring";

interface InterpretationProps {
  severity: SeverityLevel;
  concernLabel?: string;
  duration?: string;
}

export function Interpretation({
  severity,
  concernLabel,
  duration,
}: InterpretationProps) {
  const concern = concernLabel?.toLowerCase() ?? "what you described";
  const since = duration === "gt1yr" ? "for over a year" : "recently";

  const tone: Record<SeverityLevel, string> = {
    good:
      `Your scores suggest mild indicators in ${concern}. A blood panel will confirm whether anything's actually off — or just stress wearing as fatigue.`,
    moderate:
      `Patterns like yours — ${concern} ${since} — are commonly associated with shifts in testosterone, thyroid, or metabolic markers. A full panel tells us where you actually stand.`,
    poor:
      `Multiple categories are flagging — that's worth investigating. Many men with this pattern see clearer numbers on a hormone panel than on symptoms alone.`,
    severe:
      `Your scores indicate significant indicators across several categories. A clinician should review your bloodwork before recommending anything.`,
  };

  return (
    <section className="section" style={{ paddingBlock: "32px 56px" }}>
      <div className="section-narrow" style={{ maxWidth: 760 }}>
        <div
          className="card"
          style={{
            padding: "28px 28px 32px",
          }}
        >
          <p className="section-eyebrow mb-3">What this might mean</p>
          <p
            style={{
              color: "var(--text-ava)",
              fontSize: 16,
              lineHeight: 1.65,
            }}
          >
            {tone[severity]}
          </p>
          <p
            className="mt-4"
            style={{
              color: "var(--text-muted)",
              fontSize: 12,
              lineHeight: 1.55,
            }}
          >
            This is informational only. Treatment decisions are made by
            licensed clinicians after reviewing your bloodwork.
          </p>
        </div>
      </div>
    </section>
  );
}
