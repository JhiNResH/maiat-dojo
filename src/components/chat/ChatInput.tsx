"use client";

/**
 * ChatInput — bottom composer.
 *
 * Spec: specs/2026-04-09-chat-first-ui.md
 *
 * Claude-style composer card:
 *   - Single bordered container (no inner textarea border).
 *   - Serif input type for editorial feel, mono hint row.
 *   - Send button lives inside the card on the bottom-right.
 *   - Pressing Enter sends; Shift+Enter inserts a newline.
 */

import { useRef, useState } from "react";
import { CornerDownLeft } from "lucide-react";

export interface ChatInputProps {
  pending?: boolean;
  placeholder?: string;
  onSubmit: (text: string) => void;
}

export function ChatInput({
  pending = false,
  placeholder = 'Ask the front desk — try "list skills", "price of BTC", or "help"',
  onSubmit,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  function send() {
    const text = value.trim();
    if (!text || pending) return;
    onSubmit(text);
    setValue("");
    requestAnimationFrame(() => taRef.current?.focus());
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const canSend = value.trim().length > 0 && !pending;

  return (
    <div className="px-6 pb-5 pt-2">
      <div
        className="border bg-[#f8f5ef] shadow-[0_-1px_0_0_rgba(26,26,26,0.06),0_1px_0_0_rgba(26,26,26,0.04)]"
        style={{ borderColor: "#1a1a1a" }}
      >
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          className="block w-full resize-none border-0 bg-transparent px-4 pt-4 pb-2 font-serif text-[15px] leading-[1.55] text-[#1a1a1a] placeholder:font-serif placeholder:italic placeholder:text-[#1a1a1a]/30 focus:outline-none"
          style={{ maxHeight: "160px" }}
          disabled={pending}
          autoFocus
        />
        <div className="flex items-center justify-between border-t border-dotted border-[#1a1a1a]/20 px-4 py-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#1a1a1a]/35">
            Enter <span className="text-[#1a1a1a]/20">to send</span>
            <span className="mx-2 text-[#1a1a1a]/15">·</span>
            Shift+Enter <span className="text-[#1a1a1a]/20">for newline</span>
          </span>
          <button
            type="button"
            onClick={send}
            disabled={!canSend}
            className="flex items-center gap-1.5 border border-[#1a1a1a] bg-[#1a1a1a] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#f0ece2] transition hover:bg-[#1a1a1a]/85 disabled:cursor-not-allowed disabled:opacity-25"
          >
            Send
            <CornerDownLeft size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatInput;
