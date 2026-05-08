import { AvaOrb } from "@/components/avatar/AvaOrb";

interface VideoPlaceholderProps {
  /** "hero" — wide silent loop. "hook" — vertical TikTok clip. "demo" — wide click-to-play. */
  kind: "hero" | "hook" | "demo";
  label?: string;
  caption?: string;
  className?: string;
  /** Optional duration label, e.g. "0:08" for hooks, "1:02" for demo. */
  duration?: string;
}

/**
 * Visual stand-in for HeyGen video assets we haven't generated yet.
 * Renders a poster-styled frame with the Ava orb watermark and a play icon,
 * sized to the right aspect ratio per video kind. Swap to a real <video> tag
 * once HeyGen clips exist.
 */
export function VideoPlaceholder({
  kind,
  label,
  caption,
  className = "",
  duration,
}: VideoPlaceholderProps) {
  const aspect = kind === "hook" ? "9 / 16" : "16 / 9";
  const orbSize = kind === "hook" ? 56 : kind === "demo" ? 96 : 72;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        aspectRatio: aspect,
        background:
          "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(20, 168, 154, 0.18) 0%, rgba(10, 13, 18, 0.4) 60%, rgba(10, 13, 18, 0.85) 100%), linear-gradient(180deg, #0d1218 0%, #0a0d12 100%)",
        border: "1px solid var(--border-divider)",
        boxShadow:
          "0 1px 0 rgba(245, 241, 232, 0.04) inset, 0 32px 80px rgba(0, 0, 0, 0.45)",
      }}
      role="img"
      aria-label={label ?? `Ava video preview (${kind})`}
    >
      {/* Subtle scanline / film texture */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 3px)",
        }}
      />

      {/* Orb watermark — center of the frame */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AvaOrb size={orbSize} />
      </div>

      {/* Play affordance — corner badge */}
      <div
        className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
        style={{
          background: "rgba(10, 13, 18, 0.7)",
          border: "1px solid var(--border-divider)",
          backdropFilter: "blur(8px)",
        }}
      >
        <svg width="9" height="9" viewBox="0 0 9 9" aria-hidden>
          <path d="M2 1.5 L7 4.5 L2 7.5 Z" fill="var(--accent-light)" />
        </svg>
        <span
          className="mono"
          style={{
            fontSize: 10,
            color: "var(--text-secondary)",
            letterSpacing: "0.04em",
          }}
        >
          {duration ?? (kind === "hero" ? "loop" : kind === "hook" ? "0:12" : "1:00")}
        </span>
      </div>

      {/* AI disclosure badge — required during any video */}
      <span
        className="ai-badge absolute bottom-3 left-3"
        style={{ fontSize: 9, padding: "3px 9px" }}
      >
        <span aria-hidden>ⓘ</span> AI · not a doctor
      </span>

      {/* Hook label overlay */}
      {kind === "hook" && label && (
        <div
          className="absolute inset-x-3 bottom-10"
          style={{
            color: "var(--text-primary)",
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.35,
            textShadow: "0 2px 8px rgba(0,0,0,0.6)",
          }}
        >
          {label}
        </div>
      )}

      {/* Demo caption */}
      {kind === "demo" && caption && (
        <div
          className="absolute inset-x-6 bottom-12 text-center"
          style={{
            color: "var(--text-secondary)",
            fontSize: 13,
            fontWeight: 400,
            letterSpacing: "0.02em",
          }}
        >
          {caption}
        </div>
      )}
    </div>
  );
}
