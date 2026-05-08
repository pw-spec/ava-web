"use client";

interface Option {
  value: string;
  label: string;
  helper?: string;
}

interface SingleSelectProps {
  options: ReadonlyArray<Option>;
  value: string | undefined;
  onChange: (value: string) => void;
  /** Compact = label only (no helper); used for shorter lists. */
  variant?: "card" | "compact";
}

/** Card-style radio list. Each option is a tappable row with optional helper. */
export function SingleSelect({
  options,
  value,
  onChange,
  variant = "card",
}: SingleSelectProps) {
  return (
    <div className="flex w-full flex-col gap-2.5">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="intake-card flex w-full items-start gap-3 text-left"
            data-selected={selected}
            aria-pressed={selected}
          >
            <Indicator selected={selected} />
            <span className="flex-1">
              <span
                style={{
                  display: "block",
                  fontSize: 15,
                  fontWeight: 500,
                  color: selected
                    ? "var(--text-primary)"
                    : "var(--text-ava)",
                  lineHeight: 1.4,
                }}
              >
                {opt.label}
              </span>
              {variant === "card" && opt.helper && (
                <span
                  style={{
                    display: "block",
                    fontSize: 12.5,
                    color: "var(--text-muted)",
                    marginTop: 2,
                    lineHeight: 1.5,
                  }}
                >
                  {opt.helper}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Indicator({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        borderRadius: "50%",
        border: `1.5px solid ${
          selected ? "var(--accent-light)" : "var(--border-emphasis)"
        }`,
        background: selected ? "var(--accent-primary)" : "transparent",
        marginTop: 1,
        flexShrink: 0,
        transition: "all 220ms ease",
      }}
    >
      {selected && (
        <svg width="9" height="9" viewBox="0 0 9 9" aria-hidden>
          <path
            d="M1.5 4.5 L4 7 L7.5 2"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      )}
    </span>
  );
}
