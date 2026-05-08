import { LabKitCard } from "@/components/labs/LabKitCard";

export function LabsHero() {
  return (
    <section className="section relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 80% 30%, var(--gold-glow) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 20% 70%, var(--accent-glow) 0%, transparent 60%)",
        }}
      />

      <div className="section-narrow relative grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-5">
          <p className="section-eyebrow">03 · Lab kit</p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 200,
              fontSize: "clamp(36px, 5.4vw, 60px)",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              color: "var(--text-primary)",
            }}
          >
            Your hormone panel, properly measured.
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 17,
              lineHeight: 1.55,
              maxWidth: 480,
            }}
          >
            17+ markers across hormones, thyroid, and metabolic health.
            At-home collection or Quest in-person — your call. Reviewed by a
            board-certified clinician within 48 hours of results.
          </p>
          <div
            className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1"
            style={{ fontSize: 12, color: "var(--text-muted)" }}
          >
            <span className="inline-flex items-center gap-1.5">
              <Dot color="var(--accent-light)" /> CLIA-certified labs
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Dot color="var(--accent-light)" /> Quest Diagnostics partner
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Dot color="var(--accent-light)" /> Results in 3-5 days
            </span>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <LabKitCard />
        </div>
      </div>
    </section>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: 4,
        height: 4,
        borderRadius: 9999,
        background: color,
      }}
    />
  );
}
