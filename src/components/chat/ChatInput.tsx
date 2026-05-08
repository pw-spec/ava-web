"use client";

import { useState, type FormEvent } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/** Single-line input + circular send button. Spec: docs/SPEC.md "Input area". */
export function ChatInput({
  onSend,
  disabled,
  placeholder = "Talk to Ava...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const canSend = !disabled && value.trim().length > 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    onSend(value);
    setValue("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 100,
        padding: "6px 6px 6px 16px",
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        className="flex-1 bg-transparent outline-none"
        style={{
          color: "var(--text-primary)",
          fontSize: 14,
          fontWeight: 300,
          padding: "10px 0",
        }}
        aria-label="Message Ava"
      />
      <button
        type="submit"
        disabled={!canSend}
        aria-label="Send message"
        className="send-button"
        style={{
          opacity: canSend ? 1 : 0.4,
          background: canSend ? "var(--accent-primary)" : "transparent",
          borderColor: canSend ? "var(--accent-primary)" : "var(--border-subtle)",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
          <path
            d="M7 11.5V2.5M7 2.5L3 6.5M7 2.5L11 6.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </button>
    </form>
  );
}
