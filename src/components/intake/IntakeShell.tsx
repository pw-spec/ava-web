"use client";

import Link from "next/link";
import { ProgressBar } from "./ProgressBar";

interface IntakeShellProps {
  current: number;
  total: number;
  children: React.ReactNode;
}

/** Top progress bar + step counter + exit, footer disclosure, content slot. */
export function IntakeShell({ current, total, children }: IntakeShellProps) {
  return (
    <main className="flex min-h-dvh flex-col">
      <ProgressBar current={current} total={total} />

      {/* Top bar */}
      <header
        className="flex items-center justify-between px-5 py-4 sm:px-8"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2"
          style={{
            color: "var(--text-muted)",
            fontSize: 12,
            letterSpacing: "0.04em",
          }}
          aria-label="Exit intake"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <path
              d="M11 7H3m4 4-4-4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          Save & exit
        </Link>

        <span
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {current.toString().padStart(2, "0")}{" "}
          <span style={{ color: "var(--text-dim)" }}>/ {total.toString().padStart(2, "0")}</span>
        </span>
      </header>

      <div className="flex flex-1 flex-col">{children}</div>

      <footer
        className="flex items-center justify-center px-5 py-4"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <span
          className="ai-badge"
          style={{ fontSize: 10 }}
        >
          <span aria-hidden>ⓘ</span> AI · not a doctor · 100% private
        </span>
      </footer>
    </main>
  );
}
