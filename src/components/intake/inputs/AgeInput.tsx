"use client";

interface AgeInputProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

export function AgeInput({ value, min, max, onChange }: AgeInputProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex w-full flex-col items-center gap-6 py-2">
      <span
        className="tnum"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 80,
          fontWeight: 200,
          lineHeight: 1,
          color: "var(--text-primary)",
          letterSpacing: "-0.03em",
        }}
      >
        {value}
      </span>

      <div className="relative w-full" style={{ maxWidth: 420 }}>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="age-range"
          aria-label={`Age, currently ${value}`}
          style={{ ["--pct" as never]: `${pct}%` }}
        />
        <div
          className="mt-2 flex justify-between"
          style={{
            color: "var(--text-dim)",
            fontSize: 11,
            fontFamily: "var(--font-jetbrains-mono)",
            letterSpacing: "0.06em",
          }}
        >
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>

      <p
        style={{
          color: "var(--text-muted)",
          fontSize: 12,
        }}
      >
        Drag, or use ← → keys.
      </p>
    </div>
  );
}
