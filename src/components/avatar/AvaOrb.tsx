import { useId } from "react";

interface AvaOrbProps {
  size?: number;
  /** Apply the gentle vertical float animation (landing). */
  float?: boolean;
  /** Optional className for the wrapper. */
  className?: string;
  /** Decorative by default; set to false if rendered as a meaningful image. */
  decorative?: boolean;
}

/**
 * Stylized SVG presence — abstract iris/aurora rather than a literal face.
 * Reused at 200px on landing and at 36px in the chat header.
 */
export function AvaOrb({
  size = 200,
  float = false,
  className = "",
  decorative = true,
}: AvaOrbProps) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, "");
  const sphereId = `orb-sphere-${uid}`;
  const irisId = `orb-iris-${uid}`;
  const specId = `orb-spec-${uid}`;

  // Outer ring + halo glow scale with the orb size.
  const halo = `0 0 ${Math.round(size * 0.32)}px ${Math.round(
    size * 0.08,
  )}px var(--accent-glow)`;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden={decorative ? true : undefined}
    >
      {/* Soft halo bloom behind the sphere */}
      <span
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{
          inset: `-${Math.round(size * 0.35)}px`,
          background:
            "radial-gradient(circle, var(--accent-glow) 0%, transparent 65%)",
          filter: "blur(8px)",
        }}
      />

      {/* Hairline accent ring offset 4px from the orb */}
      <span
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{
          inset: "-4px",
          border: "1.5px solid var(--accent-border)",
          boxShadow: halo,
        }}
      />

      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className={float ? "float relative block" : "relative block"}
        role={decorative ? "presentation" : "img"}
        aria-label={decorative ? undefined : "Ava — AI health companion"}
      >
        <defs>
          {/* Main sphere — navy → deep teal at the iris */}
          <radialGradient id={sphereId} cx="50%" cy="42%" r="72%">
            <stop offset="0%" stopColor="#5eead4" stopOpacity="0.18" />
            <stop offset="32%" stopColor="#0d9488" stopOpacity="0.55" />
            <stop offset="62%" stopColor="#0f3460" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#070b14" />
          </radialGradient>

          {/* Iris bloom — luminous center */}
          <radialGradient id={irisId} cx="50%" cy="48%" r="40%">
            <stop offset="0%" stopColor="#5eead4" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#14b8a6" stopOpacity="0.12" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Specular highlight — soft top-left gleam */}
          <radialGradient id={specId} cx="38%" cy="32%" r="35%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.02" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Sphere */}
        <circle cx="100" cy="100" r="99" fill={`url(#${sphereId})`} />

        {/* Iris bloom */}
        <circle cx="100" cy="100" r="72" fill={`url(#${irisId})`} />

        {/* Concentric iris rings — barely-there detail */}
        <circle
          cx="100"
          cy="100"
          r="58"
          fill="none"
          stroke="rgba(94, 234, 212, 0.07)"
          strokeWidth="0.5"
        />
        <circle
          cx="100"
          cy="100"
          r="42"
          fill="none"
          stroke="rgba(94, 234, 212, 0.05)"
          strokeWidth="0.5"
        />
        <circle
          cx="100"
          cy="100"
          r="26"
          fill="none"
          stroke="rgba(94, 234, 212, 0.04)"
          strokeWidth="0.5"
        />

        {/* Tiny pupil — focal point */}
        <circle cx="100" cy="100" r="3" fill="rgba(94, 234, 212, 0.35)" />

        {/* Specular gleam */}
        <circle cx="100" cy="100" r="100" fill={`url(#${specId})`} />
      </svg>
    </div>
  );
}
