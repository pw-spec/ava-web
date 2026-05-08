import Link from "next/link";
import { VideoPlaceholder } from "@/components/video/VideoPlaceholder";
import { brandConfig, BRAND } from "@/lib/brand";

// PRE-LAUNCH ATTORNEY REVIEW REQUIRED
// The trust microline ("Reviewed by board-certified endocrinologists ·
// Quest Diagnostics labs · HIPAA-compliant") makes specific factual claims.
// These become true when the OpenLoop / CareValidate partnership is signed
// and lab integration is in place. DO NOT publish this page publicly until
// each line is substantiated. See docs/COMPLIANCE_BASELINE.md §6 (FTC).
export function Hero() {
  const brand = brandConfig[BRAND];

  return (
    <section className="section relative overflow-hidden">
      {/* Ambient glow behind hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 30% 30%, var(--accent-glow) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 80%, var(--gold-glow) 0%, transparent 60%)",
        }}
      />

      <div className="section-narrow relative grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        {/* Text column */}
        <div className="flex flex-col gap-7">
          <p className="section-eyebrow">{brand.name} · TRT, designed by data</p>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 200,
              fontSize: "clamp(40px, 6.4vw, 72px)",
              lineHeight: 1.02,
              letterSpacing: "-0.025em",
              color: "var(--text-primary)",
            }}
          >
            {brand.tagline}
          </h1>

          <p
            className="max-w-xl"
            style={{
              fontSize: 17,
              fontWeight: 400,
              color: "var(--text-secondary)",
              lineHeight: 1.55,
            }}
          >
            An AI-guided assessment, comprehensive lab work reviewed by
            board-certified clinicians, and treatment if it&apos;s right for
            you. Built for men who want to know what&apos;s actually going on.
          </p>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link href="/qualify" className="cta-primary">
              Talk to Ava — 5 minutes
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
            </Link>
            <Link href="/#how-it-works" className="cta-secondary">
              How it works
            </Link>
          </div>

          <div
            className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2"
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              letterSpacing: "0.01em",
            }}
          >
            <span className="inline-flex items-center gap-1.5">
              <Dot color="var(--accent-light)" /> Reviewed by board-certified
              endocrinologists
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Dot color="var(--accent-light)" /> Quest Diagnostics labs
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Dot color="var(--accent-light)" /> HIPAA-compliant
            </span>
          </div>
        </div>

        {/* Video column — silent looped HeyGen clip */}
        <div className="w-full">
          <VideoPlaceholder
            kind="hero"
            label={`${brand.name} silent intro loop`}
            duration="loop"
          />
          <p
            className="mt-3 text-center"
            style={{ color: "var(--text-dim)", fontSize: 11 }}
          >
            Silent looped intro — sound on inside the assessment.
          </p>
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
