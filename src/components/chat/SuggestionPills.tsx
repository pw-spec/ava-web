interface SuggestionPillsProps {
  suggestions: string[];
  onPick: (text: string) => void;
  disabled?: boolean;
}

/** Small ghost pills shown after Ava's response. Tapping sends as user msg. */
export function SuggestionPills({
  suggestions,
  onPick,
  disabled,
}: SuggestionPillsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div
      className="flex flex-wrap justify-start gap-2"
      style={{
        animation: "fade-in 320ms cubic-bezier(0.22, 1, 0.36, 1) both",
      }}
    >
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          disabled={disabled}
          className="suggestion-pill"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
