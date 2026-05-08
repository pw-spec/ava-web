import Link from "next/link";

// PRICING — see docs/business_context.md §6 (May 2026 audit) and
// docs/COMPLIANCE_BASELINE.md §6 (FTC). All-inclusive pricing on landing
// is required by FTC click-to-cancel + transparent-pricing rules. Tier
// changes need to update Labs page + FAQ + COMPLIANCE_BASELINE in lockstep.
const TIERS = [
  {
    name: "Base",
    price: 199,
    description: "Everything you need to get evaluated and treated.",
    highlight: false,
    features: [
      "AI-guided assessment with Ava",
      "Comprehensive 17+ marker hormone panel",
      "Board-certified clinician review",
      "Treatment if medically appropriate",
      "Quarterly lab monitoring",
      "Unlimited Ava check-ins",
    ],
  },
  {
    name: "Premium",
    price: 299,
    description: "For men optimizing beyond the baseline.",
    highlight: true,
    features: [
      "Everything in Base",
      "Peptides + longevity stack (Sermorelin, NAD+)",
      "Quarterly deep-dive video consult",
      "Priority clinician messaging",
      "Advanced markers (IGF-1, hsCRP, ferritin)",
    ],
  },
];

export function Pricing() {
  return (
    <section className="section">
      <div className="section-narrow">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <p className="section-eyebrow">Pricing</p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 200,
              fontSize: "clamp(28px, 4vw, 44px)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            One subscription. Everything included.
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 14,
              maxWidth: 480,
            }}
          >
            HSA / FSA approved. Cancel anytime. 30-day money-back guarantee on
            your first month if treatment isn&apos;t right for you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className="relative flex flex-col gap-5"
              style={{
                background: t.highlight
                  ? "linear-gradient(180deg, rgba(28, 32, 42, 0.8) 0%, rgba(20, 24, 33, 0.8) 100%)"
                  : "var(--bg-card)",
                border: `1px solid ${
                  t.highlight ? "var(--gold-border)" : "var(--border-subtle)"
                }`,
                borderRadius: 18,
                padding: 28,
                boxShadow: t.highlight
                  ? "0 1px 0 rgba(245, 241, 232, 0.04) inset, 0 30px 80px rgba(200, 168, 115, 0.08)"
                  : "none",
              }}
            >
              {t.highlight && (
                <span
                  className="mono absolute right-5 top-5"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    color: "var(--gold-light)",
                    background: "var(--gold-glow)",
                    border: "1px solid var(--gold-border)",
                    borderRadius: 100,
                    padding: "4px 10px",
                    textTransform: "uppercase",
                  }}
                >
                  Premium
                </span>
              )}

              <div className="flex flex-col gap-1">
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  {t.name}
                </span>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: 14,
                    marginTop: 4,
                  }}
                >
                  {t.description}
                </p>
              </div>

              <div
                className="flex items-baseline gap-2"
                style={{ paddingBlock: 4 }}
              >
                <span
                  className="tnum"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 200,
                    fontSize: 56,
                    lineHeight: 1,
                    color: t.highlight
                      ? "var(--gold-light)"
                      : "var(--text-primary)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  ${t.price}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    color: "var(--text-muted)",
                    fontWeight: 400,
                  }}
                >
                  / month
                </span>
              </div>

              <ul className="flex flex-col gap-2.5">
                {t.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5"
                    style={{
                      fontSize: 13.5,
                      color: "var(--text-ava)",
                      lineHeight: 1.5,
                    }}
                  >
                    <Check
                      color={
                        t.highlight ? "var(--gold-light)" : "var(--accent-light)"
                      }
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/qualify"
                className={t.highlight ? "cta-primary" : "cta-secondary"}
                style={{ marginTop: "auto" }}
              >
                Start with {t.name}
              </Link>
            </div>
          ))}
        </div>

        <p
          className="mt-8 text-center"
          style={{
            color: "var(--text-dim)",
            fontSize: 11,
            letterSpacing: "0.04em",
          }}
        >
          Treatment requires evaluation by a licensed provider. Prescription
          not guaranteed.
        </p>
      </div>
    </section>
  );
}

function Check({ color }: { color: string }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      aria-hidden
      style={{ marginTop: 4, flexShrink: 0 }}
    >
      <path
        d="M2.5 6.5 L5.5 9.5 L10.5 3.5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
