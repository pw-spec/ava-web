const QA = [
  {
    q: "Is Ava a doctor?",
    a: "No. Ava is an AI health companion, not a medical provider. She conducts the assessment and explains what your numbers mean. All treatment decisions are made by board-certified clinicians who review your labs and medical history independently.",
  },
  {
    q: "How long until I get results?",
    a: "Lab kit ships within 48 hours of qualification. Sample collection takes about 5 minutes at home. Results return in 3–5 business days. A clinician reviews them and contacts you within 48 hours of results landing.",
  },
  {
    q: "Will I definitely get a prescription?",
    a: "No — and that's the point. A prescription is a clinical decision, not a default. If your bloodwork and history don't indicate TRT is appropriate, your clinician will say so. We refund your first month if treatment isn't right for you.",
  },
  {
    q: "Why do you test 17 markers when most clinics test one or two?",
    a: "Total testosterone alone is a misleading number. SHBG, estradiol, thyroid, and metabolic markers all interact with how testosterone behaves in your body. A full panel keeps your clinician from prescribing in the dark.",
  },
  {
    q: "What's the difference between Base and Premium?",
    a: "Base ($199/mo) includes the assessment, full lab panel, clinician review, and TRT if appropriate. Premium ($299/mo) adds peptide and longevity protocols (Sermorelin, NAD+), advanced biomarkers, and quarterly video consults.",
  },
  {
    q: "What about fertility? I might want kids in the next few years.",
    a: "Tell your clinician this on the call. Injectable testosterone reduces sperm production while you're on it — for men still planning a family, the standard alternatives are enclomiphene (a SERM that stimulates your own production while preserving fertility) or TRT paired with HCG to maintain testicular function. Your clinician decides which protocol fits, based on your bloodwork and your timeline. Ava's intake captures family-planning intent so it's part of the chart from day one.",
  },
  {
    q: "Do I need to take anastrozole or worry about estrogen?",
    a: "Sometimes. When testosterone goes up, some of it converts to estrogen (E2) via the aromatase enzyme. Most men don't need anything to manage this — but if your bloodwork shows E2 climbing past the safe range, your clinician may add anastrozole (an aromatase inhibitor). It's part of standard TRT protocol when clinically indicated. Not everyone needs it, and you don't pay extra when it's the right call.",
  },
  {
    q: "What about my privacy? Where does my data live?",
    a: "Your conversation and labs are stored encrypted in a HIPAA-aligned environment. We don't sell data. We don't share identifiable health data with advertisers. Read the full policy at /privacy.",
  },
  {
    q: "Which states do you cover?",
    a: "We're live in 30+ US states through our clinical-services partner. New York and California are intentionally on the waitlist for now — both have new AI-companion regulations we're working through carefully before opening enrollment. You can confirm availability during the assessment, before any payment.",
  },
  {
    q: "What if I'm in a crisis?",
    a: "If you're experiencing thoughts of self-harm, please call or text 988 (Suicide & Crisis Lifeline). If you're having a medical emergency, call 911. Ava is not equipped to provide emergency care and will redirect you to these resources immediately.",
  },
];

export function FAQ() {
  return (
    <section className="section">
      <div className="section-narrow" style={{ maxWidth: 820 }}>
        <div className="mb-10 flex flex-col gap-3">
          <p className="section-eyebrow">Common questions</p>
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
            What men ask before they start.
          </h2>
        </div>

        <ul className="flex flex-col" role="list">
          {QA.map((item, i) => (
            <li
              key={item.q}
              style={{
                borderTop:
                  i === 0 ? "1px solid var(--border-divider)" : "none",
                borderBottom: "1px solid var(--border-divider)",
              }}
            >
              <details className="group">
                <summary
                  className="flex cursor-pointer items-center justify-between py-5"
                  style={{ listStyle: "none" }}
                >
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      paddingRight: 16,
                      lineHeight: 1.4,
                    }}
                  >
                    {item.q}
                  </span>
                  <Plus />
                </summary>
                <p
                  className="pb-6"
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: 14.5,
                    lineHeight: 1.7,
                    maxWidth: 680,
                  }}
                >
                  {item.a}
                </p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Plus() {
  return (
    <span
      aria-hidden
      style={{
        position: "relative",
        width: 16,
        height: 16,
        flexShrink: 0,
        color: "var(--text-muted)",
        transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), color 220ms ease",
      }}
      className="group-open:rotate-45 group-open:[color:var(--accent-light)]"
    >
      <svg width="16" height="16" viewBox="0 0 16 16">
        <line
          x1="8"
          y1="2"
          x2="8"
          y2="14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="2"
          y1="8"
          x2="14"
          y2="8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
