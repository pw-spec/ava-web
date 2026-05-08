import Link from "next/link";

export function NextSteps() {
  return (
    <section className="section" style={{ paddingBlock: "32px 96px" }}>
      <div
        className="section-narrow flex flex-col items-center gap-5 text-center"
        style={{ maxWidth: 580 }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 200,
            fontSize: "clamp(24px, 3.6vw, 34px)",
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          A blood panel is the next move.
        </h2>

        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: 14.5,
            lineHeight: 1.6,
            maxWidth: 480,
          }}
        >
          17+ markers — testosterone, thyroid, metabolic, prostate — collected
          at home, reviewed by a board-certified clinician.
        </p>

        <div className="mt-2 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Link href="/labs" className="cta-primary">
            Get your lab kit
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
          <Link href="/chat" className="cta-secondary">
            Talk to Ava more
          </Link>
        </div>

        <p
          className="mt-1"
          style={{
            color: "var(--text-dim)",
            fontSize: 11,
            letterSpacing: "0.04em",
          }}
        >
          At-home or Quest in-person · Results in 3-5 days · Treatment if
          medically appropriate
        </p>
      </div>
    </section>
  );
}
