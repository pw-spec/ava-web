const STEPS = [
  {
    n: "01",
    title: "Talk to Ava",
    body: "A 5-minute conversation. Ava asks the right questions about your energy, recovery, sleep, and more. Your answers structure into a clinical intake.",
  },
  {
    n: "02",
    title: "Get your labs",
    body: "Comprehensive hormone panel — Total T, Free T, SHBG, Estradiol, plus thyroid and metabolic markers. At-home collection or Quest in-person.",
  },
  {
    n: "03",
    title: "Treatment if right for you",
    body: "A board-certified clinician reviews your results and decides what's medically appropriate. Treatment is a decision, not a guarantee.",
  },
];

export function HowItWorks() {
  return (
    <section className="section">
      <div className="section-narrow">
        <div className="mb-10 flex flex-col gap-3">
          <p className="section-eyebrow">How it works</p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 200,
              fontSize: "clamp(28px, 4vw, 40px)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            From symptom to plan, in three weeks.
          </h2>
        </div>

        <ol className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          {STEPS.map((s) => (
            <li key={s.n} className="card flex flex-col gap-4">
              <span
                className="mono"
                style={{
                  fontSize: 12,
                  color: "var(--accent-light)",
                  letterSpacing: "0.12em",
                }}
              >
                {s.n}
              </span>
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.01em",
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
