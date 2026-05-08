"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  NEUTRAL_SCORES,
  type ChatMessage,
  type ChatResponse,
  type ConversationPhase,
  type HealthScores,
} from "@/types";
import { BRAND } from "@/lib/brand";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import { callClaude, ClaudeError, hasClaudeKey, mockClaude } from "@/lib/claude";
import {
  checkEmergency,
  filterResponse,
  SAFE_FALLBACK_RESPONSE,
} from "@/lib/compliance";

export interface UseChatResult {
  messages: ChatMessage[];
  scores: HealthScores;
  phase: ConversationPhase;
  suggestions: string[];
  isSending: boolean;
  isReady: boolean;
  error: string | null;
  /** Send a user message. No-op if sending or ready-to-close. */
  send: (text: string) => Promise<void>;
}

let _id = 0;
const nextId = () => `m_${Date.now().toString(36)}_${(++_id).toString(36)}`;

interface UseChatOptions {
  /** Override Ava's first message — used by /chat to inject a context-aware
   *  greeting that references the user's intake answers. Falls back to the
   *  scripted mock greeting when omitted. */
  initialGreeting?: ChatResponse;
}

export function useChat(options: UseChatOptions = {}): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [scores, setScores] = useState<HealthScores>(NEUTRAL_SCORES);
  const [phase, setPhase] = useState<ConversationPhase>("greeting");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const greetedRef = useRef(false);
  const systemPromptRef = useRef(buildSystemPrompt(BRAND));
  // Snapshot the greeting so changes to the prop after mount don't re-trigger.
  const greetingRef = useRef<ChatResponse | undefined>(options.initialGreeting);
  // Follow-up mode: when a contextual greeting is injected, the user came
  // from /qualify with intake-derived scores already in context. Mock script
  // must NOT overwrite them. See mockClaude FOLLOW_UP_SCRIPT.
  const mockModeRef = useRef<"intake" | "follow_up">(
    options.initialGreeting ? "follow_up" : "intake",
  );

  const applyResponse = useCallback((res: ChatResponse) => {
    setScores((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(res.scores)) {
        if (typeof v === "number") {
          next[k as keyof HealthScores] = v;
        }
      }
      return next;
    });
    setPhase(res.phase);
    setSuggestions(res.suggestions);
    if (res.readyToClose) setIsReady(true);
    setMessages((prev) => [
      ...prev,
      {
        id: nextId(),
        role: "ava",
        content: res.message,
        createdAt: Date.now(),
      },
    ]);
  }, []);

  // Auto-greeting on mount — uses the injected greeting if provided.
  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    const greeting = greetingRef.current ?? mockClaude(0);
    const filtered = filterResponse(greeting.message, true);
    applyResponse({ ...greeting, message: filtered.message });
  }, [applyResponse]);

  const send = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || isSending || isReady) return;

      const userMsg: ChatMessage = {
        id: nextId(),
        role: "user",
        content: text,
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setSuggestions([]);
      setError(null);

      // Layer 4 — emergency detection bypasses Claude.
      const emergency = checkEmergency(text);
      if (emergency.isEmergency && emergency.response) {
        applyResponse(emergency.response);
        return;
      }

      setIsSending(true);
      try {
        const avaTurnIndex = messages.filter((m) => m.role === "ava").length;
        let res: ChatResponse;

        if (hasClaudeKey()) {
          try {
            res = await callClaude({
              systemPrompt: systemPromptRef.current,
              history: messages,
              userMessage: text,
            });
          } catch (e) {
            if (e instanceof ClaudeError) {
              console.warn("Claude error, falling back to mock:", e.message);
            }
            res = mockClaude(avaTurnIndex, mockModeRef.current);
          }
        } else {
          res = mockClaude(avaTurnIndex, mockModeRef.current);
        }

        // Layer 2 — output filter on Ava's response.
        const isFirstAvaMessage =
          messages.filter((m) => m.role === "ava").length === 0;
        const filtered = filterResponse(res.message, isFirstAvaMessage);
        const safe: ChatResponse = filtered.safe
          ? { ...res, message: filtered.message }
          : { ...SAFE_FALLBACK_RESPONSE };

        applyResponse(safe);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setIsSending(false);
      }
    },
    [applyResponse, isReady, isSending, messages],
  );

  return {
    messages,
    scores,
    phase,
    suggestions,
    isSending,
    isReady,
    error,
    send,
  };
}
