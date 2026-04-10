"use client";

/**
 * ChatMessage — single message renderer.
 *
 * Spec: specs/2026-04-09-chat-first-ui.md
 *
 * Discriminated switch over `message.kind`. The TypeScript exhaustiveness
 * check (`assertNever`) means adding a new chat card requires updating both
 * the union in `types.ts` and this switch — the compiler enforces it.
 */

import type { ChatMessage as ChatMsg, ChatSkillSummary } from "./types";
import { SkillListCard } from "./cards/SkillListCard";
import { CommandHelpCard } from "./cards/CommandHelpCard";
import { SkillExecutor } from "../skill/SkillExecutor";

export interface ChatMessageProps {
  message: ChatMsg;
  onRunSkill?: (skill: ChatSkillSummary) => void;
}

function assertNever(x: never): never {
  throw new Error(`Unhandled chat message kind: ${JSON.stringify(x)}`);
}

function Bubble({
  role,
  children,
}: {
  role: "user" | "dojo";
  children: React.ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-3`}
    >
      <div
        className={`max-w-[88%] ${isUser ? "items-end" : "items-start"} flex flex-col`}
      >
        <span className="mb-0.5 font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/35">
          {isUser ? "You" : "Dojo"}
        </span>
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}

function PlainBubble({
  role,
  content,
  tone = "neutral",
}: {
  role: "user" | "dojo";
  content: string;
  tone?: "neutral" | "warn" | "ok";
}) {
  const isUser = role === "user";
  const toneBorder =
    tone === "warn"
      ? "border-[#8b0000]"
      : tone === "ok"
        ? "border-[#1a1a1a]"
        : "border-[#b8a990]";
  return (
    <div
      className={`whitespace-pre-wrap break-words border bg-[#f8f5ef] px-3 py-2 font-serif text-sm leading-relaxed text-[#1a1a1a] ${toneBorder} ${
        isUser ? "border-l-[3px] border-l-[#1a1a1a]" : ""
      }`}
    >
      {content}
    </div>
  );
}

export function ChatMessage({ message, onRunSkill }: ChatMessageProps) {
  switch (message.kind) {
    case "text":
      return (
        <Bubble role={message.role}>
          <PlainBubble
            role={message.role}
            content={message.content}
            tone={message.role === "dojo" ? message.tone : "neutral"}
          />
        </Bubble>
      );

    case "help":
      return (
        <Bubble role="dojo">
          <CommandHelpCard />
        </Bubble>
      );

    case "skill-list":
      return (
        <Bubble role="dojo">
          <SkillListCard skills={message.skills} onRun={onRunSkill} />
        </Bubble>
      );

    case "skill-executor":
      return (
        <Bubble role="dojo">
          <SkillExecutor skill={message.skill} mode="sandbox" />
        </Bubble>
      );

    case "phase-2-stub":
      return (
        <Bubble role="dojo">
          <PlainBubble
            role="dojo"
            tone="warn"
            content={`"${message.feature}" ships in Phase 2. For now: try "list skills" or "call <skill name>".`}
          />
        </Bubble>
      );

    default:
      return assertNever(message);
  }
}

export default ChatMessage;
