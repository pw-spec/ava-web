import type { ChatRole } from "@/types";

interface MessageBubbleProps {
  role: ChatRole;
  children: React.ReactNode;
}

/**
 * One chat message — Ava on the left (dark), user on the right (teal-tinted).
 * Spec: docs/SPEC.md "Page 2: Chat" + docs/DESIGN.md "Chat Bubble".
 */
export function MessageBubble({ role, children }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[78%]"
        style={{
          background: isUser ? "var(--bg-user-message)" : "var(--bg-ava-message)",
          color: isUser ? "var(--text-user)" : "var(--text-ava)",
          border: `1px solid ${
            isUser ? "var(--accent-border)" : "var(--border-subtle)"
          }`,
          borderRadius: isUser
            ? "16px 16px 4px 16px"
            : "16px 16px 16px 4px",
          padding: "10px 14px",
          fontSize: 14,
          fontWeight: 300,
          lineHeight: 1.55,
          animation: "fade-in 280ms cubic-bezier(0.22, 1, 0.36, 1) both",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {children}
      </div>
    </div>
  );
}
