"use client";

/**
 * ChatInput — bottom input bar with submit-on-Enter.
 *
 * Spec: specs/2026-04-09-chat-first-ui.md
 *
 * Pure presentational. The parent ChatRoom owns the message list and the
 * intent dispatch — this component only collects text and forwards it.
 */

import { useRef, useState } from "react";
import { Send } from "lucide-react";

export interface ChatInputProps {
  pending?: boolean;
  placeholder?: string;
  onSubmit: (text: string) => void;
}

export function ChatInput({
  pending = false,
  placeholder = 'Try "list skills", "price of BTC", or "help"',
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

  return (
    <div className="border-t border-[#1a1a1a]/20 bg-[#f0ece2] p-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 resize-none border border-[#b8a990] bg-[#f8f5ef] px-3 py-2 font-mono text-xs leading-relaxed text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 focus:border-[#1a1a1a] focus:outline-none"
          style={{ maxHeight: "120px" }}
          disabled={pending}
        />
        <button
          type="button"
          onClick={send}
          disabled={pending || value.trim().length === 0}
          className="flex h-9 items-center gap-1 border border-[#1a1a1a] bg-[#1a1a1a] px-3 font-mono text-[10px] uppercase tracking-wider text-[#f0ece2] transition disabled:opacity-40"
        >
          <Send size={12} />
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatInput;
