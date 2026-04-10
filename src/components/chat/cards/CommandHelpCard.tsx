"use client";

/**
 * CommandHelpCard — buyer "help" intent renderer.
 *
 * Spec: specs/2026-04-09-chat-first-ui.md (5 buyer intents listed)
 *
 * Lists the 5 Phase 1 buyer intents the chat understands. Phase 2 intents
 * (sessions, close) are listed but greyed out so users see what's coming.
 */

interface CommandRow {
  cmd: string;
  desc: string;
  phase2?: boolean;
}

const COMMANDS: CommandRow[] = [
  { cmd: "list skills", desc: "Browse the marketplace" },
  { cmd: "call <name>", desc: "Sandbox-run a skill in chat" },
  { cmd: "price of BTC", desc: "Shortcut → Token Price Oracle" },
  { cmd: "echo", desc: "Shortcut → Echo Test" },
  { cmd: "help", desc: "Show this list" },
  { cmd: "my sessions", desc: "Phase 2 — open sessions list", phase2: true },
  { cmd: "close session <id>", desc: "Phase 2 — settle a session", phase2: true },
];

export function CommandHelpCard() {
  return (
    <div
      className="border bg-[#f8f5ef] p-3"
      style={{
        borderColor: "#b8a990",
        borderLeftWidth: "3px",
        borderLeftColor: "#1a1a1a",
      }}
    >
      <div className="mb-2 font-mono text-[9px] uppercase tracking-wider text-[#1a1a1a]/50">
        Commands
      </div>
      <table className="w-full font-mono text-[10px]">
        <tbody>
          {COMMANDS.map((row) => (
            <tr
              key={row.cmd}
              className={
                row.phase2 ? "text-[#1a1a1a]/30" : "text-[#1a1a1a]"
              }
            >
              <td className="py-0.5 pr-3 align-top">
                <span
                  className={`font-bold ${row.phase2 ? "" : "text-[#8b0000]"}`}
                >
                  {row.cmd}
                </span>
              </td>
              <td className="py-0.5 align-top">{row.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CommandHelpCard;
