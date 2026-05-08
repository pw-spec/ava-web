/** Three pulsing teal dots — shown while Ava is "thinking". */
export function TypingDots({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      aria-label="Ava is thinking"
      role="status"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          style={{
            display: "block",
            width: 6,
            height: 6,
            borderRadius: 9999,
            background: "var(--accent-light)",
            animation: "pulse-dot 1.2s infinite ease-in-out",
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
    </span>
  );
}
