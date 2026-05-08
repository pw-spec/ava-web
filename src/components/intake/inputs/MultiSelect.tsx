"use client";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: ReadonlyArray<Option>;
  value: string[];
  onChange: (next: string[]) => void;
  /** Special "None of these" option — clears all others when picked. */
  noneValue: string;
  noneLabel: string;
}

/**
 * Multi-select with mutually-exclusive "None" option.
 * Picking "None" clears every other selection. Picking any condition
 * removes "None".
 */
export function MultiSelect({
  options,
  value,
  onChange,
  noneValue,
  noneLabel,
}: MultiSelectProps) {
  const noneSelected = value.includes(noneValue);

  const togglePos = (v: string) => {
    if (v === noneValue) {
      onChange(noneSelected ? [] : [noneValue]);
      return;
    }
    const without = value.filter((x) => x !== noneValue && x !== v);
    onChange(value.includes(v) ? without : [...without, v]);
  };

  return (
    <div className="flex w-full flex-col gap-2.5">
      {options.map((opt) => {
        const selected = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => togglePos(opt.value)}
            className="intake-card flex w-full items-center gap-3 text-left"
            data-selected={selected}
            aria-pressed={selected}
          >
            <Box selected={selected} />
            <span
              style={{
                fontSize: 14.5,
                fontWeight: 500,
                color: selected ? "var(--text-primary)" : "var(--text-ava)",
                lineHeight: 1.4,
              }}
            >
              {opt.label}
            </span>
          </button>
        );
      })}

      <div
        aria-hidden
        style={{
          height: 1,
          background: "var(--border-subtle)",
          margin: "6px 0 4px",
        }}
      />

      <button
        type="button"
        onClick={() => togglePos(noneValue)}
        className="intake-card flex w-full items-center gap-3 text-left"
        data-selected={noneSelected}
        aria-pressed={noneSelected}
      >
        <Box selected={noneSelected} />
        <span
          style={{
            fontSize: 14.5,
            fontWeight: 500,
            color: noneSelected ? "var(--text-primary)" : "var(--text-ava)",
            lineHeight: 1.4,
          }}
        >
          {noneLabel}
        </span>
      </button>
    </div>
  );
}

function Box({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        borderRadius: 4,
        border: `1.5px solid ${
          selected ? "var(--accent-light)" : "var(--border-emphasis)"
        }`,
        background: selected ? "var(--accent-primary)" : "transparent",
        flexShrink: 0,
        transition: "all 220ms ease",
      }}
    >
      {selected && (
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
          <path
            d="M2 5.2 L4.2 7.5 L8 3"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      )}
    </span>
  );
}
