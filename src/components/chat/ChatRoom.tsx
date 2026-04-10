"use client";

/**
 * ChatRoom — stateful chat container, intent dispatcher, message log.
 *
 * Spec: specs/2026-04-09-chat-first-ui.md
 *
 * Responsibilities:
 *   - Maintain the message list
 *   - Cache the skill catalog (single GET on first need)
 *   - Parse user input via parseChatIntent (pure)
 *   - Dispatch to the right card / placeholder
 *   - Auto-scroll on new messages
 *
 * Invariants:
 *   - This file does not know about specific skills (no slug literals).
 *   - All skill rendering goes through <SkillExecutor> which dispatches
 *     on profile.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  parseChatIntent,
  findSkillForQuery,
  type ChatIntent,
} from "@/lib/chat-intent";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import {
  nextMessageId,
  type ChatMessage as ChatMsg,
  type ChatSkillSummary,
} from "./types";
import type { SkillExecutorSkill } from "../skill/SkillExecutor";

// Distributive Omit — TS Omit over a union doesn't narrow, so we peel the
// auto fields off each variant individually.
type DistributiveOmit<T, K extends keyof never> = T extends unknown
  ? Omit<T, K>
  : never;
type ChatMsgDraft = DistributiveOmit<ChatMsg, "id" | "ts">;

// Skills returned by /api/skills include all profile fields, but the route
// shape is loose. We treat the catalog as `ChatSkillSummary & SkillExecutorSkill`
// because both halves are present in the same row.
type CatalogSkill = ChatSkillSummary & SkillExecutorSkill;

const GREETING: ChatMsg = {
  id: "m-greeting",
  role: "dojo",
  kind: "text",
  ts: 0,
  content:
    'Welcome to the Dojo. I\'m the front desk for the marketplace.\nTry "list skills" to browse, "price of BTC" to sandbox the oracle, or "help" for the full command list.',
};

export function ChatRoom() {
  const [messages, setMessages] = useState<ChatMsg[]>([GREETING]);
  const [pending, setPending] = useState(false);
  const [catalog, setCatalog] = useState<CatalogSkill[] | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const scrollerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const push = useCallback((msg: ChatMsgDraft) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: nextMessageId(), ts: Date.now() } as ChatMsg,
    ]);
  }, []);

  const loadCatalog = useCallback(async (): Promise<CatalogSkill[]> => {
    if (catalog) return catalog;
    try {
      const res = await fetch("/api/skills?limit=50");
      const json = (await res.json()) as { skills?: CatalogSkill[] };
      const list = json.skills ?? [];
      setCatalog(list);
      setCatalogError(null);
      return list;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "fetch failed";
      setCatalogError(msg);
      return [];
    }
  }, [catalog]);

  const dispatchIntent = useCallback(
    async (intent: ChatIntent) => {
      switch (intent.kind) {
        case "help":
          push({ role: "dojo", kind: "help" });
          return;

        case "list-skills": {
          const list = await loadCatalog();
          if (list.length === 0) {
            push({
              role: "dojo",
              kind: "text",
              tone: "warn",
              content: catalogError
                ? `Couldn't load the skill list (${catalogError}).`
                : "No skills listed yet.",
            });
            return;
          }
          push({ role: "dojo", kind: "skill-list", skills: list });
          return;
        }

        case "call-skill": {
          const list = await loadCatalog();
          if (list.length === 0) {
            push({
              role: "dojo",
              kind: "text",
              tone: "warn",
              content: 'Catalog is empty. Try "list skills" once seed data lands.',
            });
            return;
          }
          const match = findSkillForQuery(list, intent.query);
          if (!match) {
            push({
              role: "dojo",
              kind: "text",
              tone: "warn",
              content: `Couldn't find a skill matching "${intent.query}". Try "list skills" to see what's available.`,
            });
            return;
          }
          push({
            role: "dojo",
            kind: "text",
            content: `Loaded ${match.name}. Sandbox is below — fill the form and run.`,
          });
          push({ role: "dojo", kind: "skill-executor", skill: match });
          return;
        }

        case "my-sessions":
          push({ role: "dojo", kind: "phase-2-stub", feature: "my sessions" });
          return;

        case "close-session":
          push({
            role: "dojo",
            kind: "phase-2-stub",
            feature: "close session",
          });
          return;

        case "unknown":
          push({
            role: "dojo",
            kind: "text",
            tone: "warn",
            content: `I don't follow "${intent.raw}". Try "help" for the command list.`,
          });
          return;
      }
    },
    [catalogError, loadCatalog, push]
  );

  const handleSubmit = useCallback(
    async (text: string) => {
      push({ role: "user", kind: "text", content: text });
      setPending(true);
      try {
        const intent = parseChatIntent(text);
        await dispatchIntent(intent);
      } finally {
        setPending(false);
      }
    },
    [dispatchIntent, push]
  );

  // Triggered from a SkillListCard "Run" button — synthesises a `call <name>` user message
  // so the chat log reads as if the user typed it.
  const handleRunFromList = useCallback(
    (skill: ChatSkillSummary) => {
      void handleSubmit(`call ${skill.name}`);
    },
    [handleSubmit]
  );

  const renderedMessages = useMemo(
    () =>
      messages.map((msg) => (
        <ChatMessage
          key={msg.id}
          message={msg}
          onRunSkill={handleRunFromList}
        />
      )),
    [messages, handleRunFromList]
  );

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ scrollBehavior: "smooth" }}
      >
        {renderedMessages}
        {pending && (
          <div className="mb-3 flex justify-start">
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/40">
              Dojo is thinking…
            </span>
          </div>
        )}
      </div>
      <ChatInput pending={pending} onSubmit={handleSubmit} />
    </div>
  );
}

export default ChatRoom;
