"use client";

const DISCLOSURE_TEXT =
  "I understand that Ava is an AI and that all treatment decisions will be made by a licensed provider.";

interface DisclosureGateProps {
  tierName: string;
  tierPrice: number;
  acknowledged: boolean;
  onToggle: (next: boolean) => void;
  onStart: () => void;
  checkoutNotice: boolean;
}

export function DisclosureGate({
  tierName,
  tierPrice,
  acknowledged,
  onToggle,
  onStart,
  checkoutNotice,
}: DisclosureGateProps) {
  return (
    <section className="section" style={{ paddingTop: 16, paddingBottom: 56 }}>
      <div className="section-narrow flex flex-col gap-5" style={{ maxWidth: 620 }}>
        <label
          className="flex w-full cursor-pointer items-start gap-3 text-left"
          style={{
            background: "var(--bg-card)",
            border: `1px solid ${
              acknowledged ? "var(--accent-border)" : "var(--border-subtle)"
            }`,
            borderRadius: 12,
            padding: "14px 16px",
            transition: "border-color 240ms ease",
          }}
        >
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => onToggle(e.target.checked)}
            className="mt-[3px] shrink-0"
            style={{
              accentColor: "var(--accent-primary)",
              width: 16,
              height: 16,
            }}
            aria-describedby="disclosure-text"
          />
          <span
            id="disclosure-text"
            style={{
              color: "var(--text-ava)",
              fontSize: 13.5,
              lineHeight: 1.55,
            }}
          >
            {DISCLOSURE_TEXT}
          </span>
        </label>

        <button
          type="button"
          onClick={onStart}
          disabled={!acknowledged}
          aria-disabled={!acknowledged}
          className="cta-primary"
          style={{
            opacity: acknowledged ? 1 : 0.4,
            cursor: acknowledged ? "pointer" : "not-allowed",
            minHeight: 48,
          }}
        >
          Start my {tierName} plan — ${tierPrice}/mo
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
        </button>

        {checkoutNotice && (
          <p
            role="status"
            style={{
              color: "var(--text-muted)",
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            Stripe checkout integration lands in a future phase. No lab order
            has been started.
          </p>
        )}

        <p
          className="text-center"
          style={{
            color: "var(--text-dim)",
            fontSize: 11,
            letterSpacing: "0.04em",
          }}
        >
          All treatment decisions by licensed providers. Prescription not
          guaranteed.
        </p>
      </div>
    </section>
  );
}
