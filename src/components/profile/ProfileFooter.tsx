import Link from "next/link";

export function ProfileFooter() {
  return (
    <footer
      className="flex flex-col items-center justify-center gap-3 px-5 py-8 text-center"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
    >
      <div
        className="flex items-center gap-3"
        style={{ color: "var(--text-dim)", fontSize: 11 }}
      >
        <Link
          href="/privacy"
          className="underline-offset-4 hover:underline"
          style={{ color: "var(--text-muted)" }}
        >
          Privacy
        </Link>
        <span aria-hidden>·</span>
        <Link
          href="/terms"
          className="underline-offset-4 hover:underline"
          style={{ color: "var(--text-muted)" }}
        >
          Terms
        </Link>
      </div>
      <p
        style={{
          color: "var(--text-dim)",
          fontSize: 10,
          letterSpacing: "0.04em",
        }}
      >
        © {new Date().getFullYear()} Eigen Holdings LLC · All treatment
        decisions by licensed providers.
      </p>
    </footer>
  );
}
