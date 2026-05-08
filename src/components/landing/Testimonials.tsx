const QUOTES = [
  {
    quote:
      "Bloodwork came back exactly where Ava said it would. First time anyone treated my fatigue like a real signal instead of stress.",
    name: "Marcus",
    age: 41,
    state: "TX",
  },
  {
    quote:
      "Talked to Ava on a Sunday night, lab kit was at my door Tuesday. Thirty days in, sleep is the first thing that came back.",
    name: "Daniel",
    age: 36,
    state: "FL",
  },
  {
    quote:
      "I trained five days a week and still felt cooked. Total T was 280. Three months on protocol and I'm tracking PRs again.",
    name: "Jordan",
    age: 44,
    state: "CA",
  },
  {
    quote:
      "Liked that Ava doesn't pretend to be a doctor. The actual clinician owned the prescribing call — that's the part that matters.",
    name: "Sam",
    age: 38,
    state: "NY",
  },
  {
    quote:
      "The radar chart at the end nailed it — recovery and drive both red. My wife has noticed the difference more than I have.",
    name: "Patrick",
    age: 47,
    state: "WA",
  },
  {
    quote:
      "Hims wanted me to fill out a form. Ava had a conversation. Different experience entirely.",
    name: "Ben",
    age: 33,
    state: "CO",
  },
];

export function Testimonials() {
  return (
    <section className="section">
      <div className="section-narrow">
        <div className="mb-10 flex flex-col gap-3">
          <p className="section-eyebrow">Patient stories</p>
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
            What men said after the first 90 days.
          </h2>
        </div>

        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {QUOTES.map((q) => (
            <li key={q.name + q.state} className="card flex flex-col gap-4">
              <Stars />
              <p
                style={{
                  color: "var(--text-ava)",
                  fontSize: 14,
                  lineHeight: 1.65,
                }}
              >
                &ldquo;{q.quote}&rdquo;
              </p>
              <div
                className="mono mt-auto flex items-center gap-2"
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  paddingTop: 8,
                  borderTop: "1px solid var(--border-subtle)",
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>{q.name}</span>
                <span aria-hidden>·</span>
                <span>{q.age}</span>
                <span aria-hidden>·</span>
                <span>{q.state}</span>
              </div>
            </li>
          ))}
        </ul>

        <p
          className="mt-6 text-center"
          style={{
            color: "var(--text-dim)",
            fontSize: 10.5,
            letterSpacing: "0.04em",
          }}
        >
          Quotes shown are representative placeholders pending real customer
          launch. Individual results may vary. Treatment requires evaluation
          by a licensed provider.
        </p>
      </div>
    </section>
  );
}

function Stars() {
  return (
    <div className="flex gap-1" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 12 12" aria-hidden>
          <path
            d="M6 1l1.5 3.2 3.5.5-2.5 2.4.6 3.5L6 8.9 2.9 10.6l.6-3.5L1 4.7l3.5-.5L6 1z"
            fill="var(--gold-light)"
          />
        </svg>
      ))}
    </div>
  );
}
