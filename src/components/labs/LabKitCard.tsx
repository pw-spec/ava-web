/** Faux lab-kit illustration — placeholder until real product photography. */
export function LabKitCard() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        width: "100%",
        maxWidth: 380,
        aspectRatio: "4 / 5",
        background:
          "linear-gradient(160deg, rgba(28, 32, 42, 0.95) 0%, rgba(14, 18, 24, 0.95) 100%)",
        border: "1px solid var(--border-divider)",
        boxShadow:
          "0 1px 0 rgba(245, 241, 232, 0.04) inset, 0 32px 80px rgba(0, 0, 0, 0.45)",
      }}
    >
      <div className="absolute inset-x-12 top-12 flex flex-col gap-2">
        <Plate label="AVA · HRP-01" big />
        <Plate label="Lancets x6" />
        <Plate label="Microvette" />
        <Plate label="Return mailer" />
      </div>

      <div className="absolute inset-x-12 bottom-10 flex flex-col gap-2">
        <span
          className="mono"
          style={{
            fontSize: 9,
            color: "var(--text-muted)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Lab kit · what arrives
        </span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 300,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
          }}
        >
          Everything for the panel.
        </span>
      </div>

      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 3px)",
        }}
      />
    </div>
  );
}

function Plate({ label, big = false }: { label: string; big?: boolean }) {
  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, rgba(245, 241, 232, 0.04) 0%, rgba(245, 241, 232, 0.02) 100%)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 8,
        padding: big ? "16px 14px" : "10px 14px",
      }}
    >
      <span
        className="mono"
        style={{
          fontSize: big ? 13 : 11,
          color: big ? "var(--gold-light)" : "var(--text-muted)",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </span>
    </div>
  );
}
