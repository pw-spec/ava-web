const STEPS = [
  {
    n: "01",
    title: "Lab kit ships",
    body: "Free shipping. 48-hour turnaround on dispatch from our partner pharmacy network.",
  },
  {
    n: "02",
    title: "5-minute collection",
    body: "Finger-prick samples at home — or schedule a free Quest Diagnostics draw.",
  },
  {
    n: "03",
    title: "Clinician review",
    body: "Board-certified endocrinologist reviews your panel within 48 hours of results.",
  },
  {
    n: "04",
    title: "Walkthrough with Ava",
    body: "She'll explain every marker — what's in range, what isn't, what it actually means.",
  },
  {
    n: "05",
    title: "Treatment, if appropriate",
    body: "If your clinician determines TRT is right for you, medication ships from a US-licensed pharmacy.",
  },
];

export function ProcessSteps() {
  return (
    <section className="section">
      <div className="section-narrow">
        <p className="section-eyebrow mb-7">How it works</p>
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-5">
          {STEPS.map((s) => (
            <li key={s.n} className="card flex flex-col gap-3">
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--accent-light)",
                  letterSpacing: "0.16em",
                }}
              >
                {s.n}
              </span>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.005em",
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: 13,
                  lineHeight: 1.55,
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
