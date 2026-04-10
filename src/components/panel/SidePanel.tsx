"use client";

/**
 * SidePanel — role-aware container for the right rail.
 *
 * Spec: specs/2026-04-09-chat-first-ui.md
 *
 * Phase 1: always renders <BuyerPanel>. Phase 2 will add a <CreatorPanel>
 * and a role toggle. Keeping the indirection here means the page-level
 * layout doesn't need to learn about roles.
 */

import { BuyerPanel } from "./BuyerPanel";

export type PanelRole = "buyer" | "creator";

export interface SidePanelProps {
  role?: PanelRole;
}

export function SidePanel({ role = "buyer" }: SidePanelProps) {
  if (role === "creator") {
    // Phase 2 stub — creator panel lands with the publish wizard.
    return (
      <aside className="flex h-full items-center justify-center px-4 py-4">
        <div
          className="border border-dashed p-4 text-center"
          style={{ borderColor: "#b8a990" }}
        >
          <div className="mb-1 font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/40">
            Creator Panel
          </div>
          <p className="font-serif text-xs italic text-[#1a1a1a]/30">
            Ships in Phase 2 with the publish wizard.
          </p>
        </div>
      </aside>
    );
  }
  return <BuyerPanel />;
}

export default SidePanel;
