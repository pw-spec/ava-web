import Link from "next/link";

export function LabsTopBar() {
  return (
    <header
      className="flex items-center justify-between px-5 py-4 sm:px-8"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
    >
      <Link
        href="/"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 18,
          fontWeight: 300,
          color: "var(--text-primary)",
          letterSpacing: "-0.01em",
          textDecoration: "none",
        }}
      >
        Ava
      </Link>
      <span className="ai-badge" style={{ fontSize: 10 }}>
        <span aria-hidden>ⓘ</span> AI · not a doctor
      </span>
    </header>
  );
}
