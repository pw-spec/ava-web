"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatTopBar } from "@/components/chat/ChatTopBar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { SuggestionPills } from "@/components/chat/SuggestionPills";
import { ChatInput } from "@/components/chat/ChatInput";
import { TypingDots } from "@/components/chat/TypingDots";
import { useChat } from "@/hooks/useChat";
import { useProfileScores } from "@/lib/profileScores";
import { buildContextualGreeting } from "@/lib/contextualGreeting";

/**
 * Free-form follow-up conversation with Ava. Now positioned as a sub-experience
 * after the structured intake at /qualify, not the funnel's front door.
 * Greeting is context-aware when intake is present.
 */
export default function ChatPage() {
  const router = useRouter();
  const { intake, hasProfileScores, setProfileScores } = useProfileScores();

  // Build greeting once, snapshot it. Use intake when available.
  // Intentional empty deps: we want the greeting to lock to the intake state
  // at mount time. If intake updates later (unlikely on this page), we don't
  // want to re-run the greeting logic and replay Ava's first message.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialGreeting = useMemo(() => buildContextualGreeting(intake), []);

  const {
    messages,
    scores,
    phase,
    suggestions,
    isSending,
    isReady,
    error,
    send,
  } = useChat({ initialGreeting });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, isSending, suggestions.length]);

  // Transition back to /profile once Ava signals close
  useEffect(() => {
    if (!isReady) return;
    setProfileScores(scores);
    const timer = window.setTimeout(() => {
      router.push("/profile");
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [isReady, router, scores, setProfileScores]);

  const status =
    phase === "crisis"
      ? "crisis"
      : isReady
        ? "ready"
        : isSending
          ? "thinking"
          : "listening";

  return (
    <main className="flex h-dvh flex-col">
      <ChatTopBar
        scores={scores}
        status={status}
        backHref={hasProfileScores ? "/profile" : "/"}
        backLabel={hasProfileScores ? "Profile" : "Home"}
      />

      <div
        ref={scrollRef}
        className="relative flex-1 overflow-y-auto"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="mx-auto flex w-full max-w-md flex-col gap-2.5 px-5 py-6">
          {messages.map((m) => (
            <MessageBubble key={m.id} role={m.role}>
              {m.content}
            </MessageBubble>
          ))}

          {isSending && (
            <div className="flex justify-start">
              <div
                style={{
                  background: "var(--bg-ava-message)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "16px 16px 16px 4px",
                  padding: "12px 16px",
                }}
              >
                <TypingDots />
              </div>
            </div>
          )}

          {!isSending && !isReady && suggestions.length > 0 && (
            <SuggestionPills
              suggestions={suggestions}
              onPick={send}
              disabled={false}
            />
          )}

          {error && (
            <p
              className="px-2 text-[11px]"
              style={{ color: "var(--score-poor)" }}
              role="alert"
            >
              {error}
            </p>
          )}

          {isReady && <ProfileTransition hasProfile={hasProfileScores} />}
        </div>
      </div>

      <div
        className="px-5 pb-6 pt-3"
        style={{
          borderTop: "1px solid var(--border-subtle)",
          background:
            "linear-gradient(0deg, rgba(10, 13, 18, 0.95) 0%, rgba(10, 13, 18, 0.75) 100%)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="mx-auto w-full max-w-md">
          <ChatInput
            onSend={send}
            disabled={isSending || isReady}
            placeholder={
              isReady
                ? "One sec — heading back to your profile…"
                : hasProfileScores
                  ? "Anything else worth telling Ava?"
                  : "Talk to Ava…"
            }
          />
          <p
            className="mt-2 flex items-center justify-center gap-3"
            style={{
              color: "var(--text-dim)",
              fontSize: 10,
              letterSpacing: "0.04em",
            }}
          >
            <span>Ava is an AI companion, not a medical provider.</span>
            {!hasProfileScores && (
              <>
                <span aria-hidden>·</span>
                <Link
                  href="/qualify"
                  className="underline-offset-4 hover:underline"
                  style={{ color: "var(--text-muted)" }}
                >
                  Take the structured assessment
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}

function ProfileTransition({ hasProfile }: { hasProfile: boolean }) {
  return (
    <div
      className="mt-6 flex flex-col items-center gap-4 py-8 text-center"
      style={{ animation: "fade-in 320ms cubic-bezier(0.22, 1, 0.36, 1) both" }}
    >
      <div
        aria-hidden
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "2px solid rgba(20, 168, 154, 0.18)",
          borderTopColor: "var(--accent-light)",
          animation: "spin 0.9s linear infinite",
        }}
      />
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 18,
          fontWeight: 300,
          color: "var(--text-secondary)",
        }}
      >
        {hasProfile
          ? "Updating your profile…"
          : "Building your profile…"}
      </p>
    </div>
  );
}
