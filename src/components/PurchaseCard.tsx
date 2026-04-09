"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { LogIn } from "lucide-react";

interface Skill {
  id: string;
  name: string;
  skillType: string;
  price: number;
  pricePerCall: number | null;
  gatewaySlug: string | null;
  fileContent: string | null;
}

interface Props {
  skill: Skill;
}

type Step = "idle" | "loading" | "done" | "error";

interface ActiveResult {
  sessionId: string;
  budgetTotal: number;
  gatewayUrl: string;
  expiresAt: string;
}

interface PassiveResult {
  content: string;
  fileType: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getOrCreateAgent(
  privyId: string,
  token: string,
  displayName: string | undefined
): Promise<string> {
  const key = `dojo_agent_${privyId}`;
  const cached = localStorage.getItem(key);
  if (cached) return cached;

  const res = await fetch("/api/agents/create", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      privyId,
      displayName,
      agent: {
        name: `${displayName || "My"} Agent`,
        description: "Default agent created by Dojo",
      },
    }),
  });
  if (!res.ok) throw new Error("Failed to create agent");
  const data = await res.json();
  localStorage.setItem(key, data.id);
  return data.id;
}

async function syncUser(
  privyId: string,
  token: string,
  opts: { email?: string; walletAddress?: string; displayName?: string }
) {
  await fetch("/api/users/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ privyId, ...opts }),
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PurchaseCard({ skill }: Props) {
  const { ready, authenticated, login, user, getAccessToken } = usePrivy();
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<ActiveResult | null>(null);
  const [passiveResult, setPassiveResult] = useState<PassiveResult | null>(null);
  const [budget, setBudget] = useState<string>(
    skill.pricePerCall ? String(Math.max(1, Math.round(skill.pricePerCall * 20))) : "5"
  );

  const isPassive = skill.skillType === "passive";
  const isFree = skill.price === 0;

  // ── Passive purchase ──────────────────────────────────────────────────────
  async function handlePassiveBuy() {
    setStep("loading");
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token || !user) throw new Error("Not authenticated");

      await syncUser(user.id, token, {
        email: user.email?.address ?? undefined,
        walletAddress: user.wallet?.address ?? undefined,
        displayName: user.google?.name ?? undefined,
      });

      // Buy (free)
      const buyRes = await fetch("/api/skills/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          privyId: user.id,
          skillId: skill.id,
          paymentMethod: "free",
        }),
      });
      const buyData = await buyRes.json();
      if (!buyRes.ok && buyRes.status !== 409) {
        throw new Error(buyData.error || "Purchase failed");
      }

      // Fetch content
      const contentRes = await fetch(`/api/skills/${skill.id}/content`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contentData = await contentRes.json();
      if (!contentRes.ok) throw new Error(contentData.error || "Could not fetch content");

      setPassiveResult({ content: contentData.content, fileType: contentData.fileType });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("error");
    }
  }

  // ── Active: open session ──────────────────────────────────────────────────
  async function handleFundSession() {
    setStep("loading");
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token || !user) throw new Error("Not authenticated");

      await syncUser(user.id, token, {
        email: user.email?.address ?? undefined,
        walletAddress: user.wallet?.address ?? undefined,
        displayName: user.google?.name ?? undefined,
      });

      const agentId = await getOrCreateAgent(user.id, token, user.google?.name ?? undefined);

      const sessionRes = await fetch("/api/sessions/open", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          privyId: user.id,
          agentId,
          skillId: skill.id,
          budgetTotal: parseFloat(budget),
        }),
      });
      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) throw new Error(sessionData.error || "Failed to open session");

      setActiveResult({
        sessionId: sessionData.session.id,
        budgetTotal: sessionData.session.budgetTotal,
        gatewayUrl: `/api/gateway/skills/${skill.gatewaySlug}/run`,
        expiresAt: sessionData.session.expiresAt,
      });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("error");
    }
  }

  // ── Not authenticated ─────────────────────────────────────────────────────
  if (!ready) return null;

  if (!authenticated) {
    return (
      <div className="classified" data-label={isPassive ? "Acquire" : "Use This Skill"}>
        <p className="font-serif text-sm text-[#1a1a1a]/60 mb-4">
          Connect your wallet to {isPassive ? "download" : "use"} this skill.
        </p>
        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] text-[#f0ece2] font-mono text-xs uppercase tracking-wider py-3 hover:bg-[#1a1a1a]/80 transition-colors"
        >
          <LogIn size={12} />
          Connect Wallet
        </button>
      </div>
    );
  }

  // ── Done: passive ─────────────────────────────────────────────────────────
  if (step === "done" && isPassive && passiveResult) {
    return (
      <div className="classified" data-label="Downloaded">
        <div className="text-xs font-mono text-green-800 bg-green-800/10 border-l-2 border-green-800 px-2 py-1 mb-4">
          ✓ Content delivered
        </div>
        <button
          onClick={() => {
            const blob = new Blob([passiveResult.content], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${skill.name.replace(/\s+/g, "-").toLowerCase()}.md`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="w-full bg-[#1a1a1a] text-[#f0ece2] font-mono text-xs uppercase tracking-wider py-3 hover:bg-[#1a1a1a]/80 transition-colors mb-2"
        >
          Download .md
        </button>
        <button
          onClick={() => { setStep("idle"); setPassiveResult(null); }}
          className="w-full font-mono text-[10px] text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-colors py-1"
        >
          View again
        </button>
      </div>
    );
  }

  // ── Done: active ──────────────────────────────────────────────────────────
  if (step === "done" && !isPassive && activeResult) {
    return (
      <div className="classified" data-label="Session Active">
        <div className="text-xs font-mono text-green-800 bg-green-800/10 border-l-2 border-green-800 px-2 py-1 mb-4">
          ✓ Session open · ${activeResult.budgetTotal} USD locked
        </div>

        <div className="space-y-0 mb-4">
          {[
            { label: "Session ID", value: activeResult.sessionId.slice(0, 16) + "…" },
            {
              label: "Expires",
              value: new Date(activeResult.expiresAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric",
              }),
            },
            { label: "Budget", value: `$${activeResult.budgetTotal} USD` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-1.5 border-b border-dotted border-[#1a1a1a]/15 last:border-b-0">
              <span className="font-mono text-[10px] text-[#1a1a1a]/40 uppercase tracking-wider">{label}</span>
              <span className="font-mono text-[10px] text-[#1a1a1a] font-bold">{value}</span>
            </div>
          ))}
        </div>

        <div className="font-mono text-[10px] text-[#1a1a1a]/40 bg-[#1a1a1a]/[0.03] p-2 border border-[#1a1a1a]/10 mb-3 break-all">
          POST {activeResult.gatewayUrl}
        </div>

        <p className="font-mono text-[10px] text-[#1a1a1a]/30 border-l-2 border-[#1a1a1a]/15 pl-2">
          Pass <code>X-Session-Id: {activeResult.sessionId.slice(0, 8)}…</code> in your agent headers.
        </p>
      </div>
    );
  }

  // ── Passive: buy form ─────────────────────────────────────────────────────
  if (isPassive) {
    return (
      <div className="classified" data-label="Acquire">
        <div className="mb-3">
          <span className="font-serif font-black text-3xl text-[#1a1a1a]">
            {isFree ? "Free" : `$${skill.price.toFixed(2)}`}
          </span>
        </div>
        <p className="font-mono text-[10px] text-[#1a1a1a]/50 mb-4 pb-3 border-b border-dotted border-[#1a1a1a]/15">
          One-time · Instant delivery · .md file
        </p>

        {step === "error" && error && (
          <p className="font-mono text-[10px] text-red-700 mb-3">{error}</p>
        )}

        <button
          onClick={handlePassiveBuy}
          disabled={step === "loading"}
          className="w-full bg-[#1a1a1a] text-[#f0ece2] font-mono text-xs uppercase tracking-wider py-3 hover:bg-[#1a1a1a]/80 transition-colors disabled:opacity-40"
        >
          {step === "loading" ? "Preparing…" : "Download Free"}
        </button>
      </div>
    );
  }

  // ── Active: fund session form ─────────────────────────────────────────────
  const estimatedCalls = skill.pricePerCall && parseFloat(budget) > 0
    ? Math.floor(parseFloat(budget) / skill.pricePerCall)
    : 0;

  return (
    <div className="classified" data-label="Use This Skill">
      <div className="mb-1">
        <span className="font-serif font-black text-3xl text-[#1a1a1a]">
          {skill.pricePerCall ? `$${skill.pricePerCall.toFixed(2)}` : "FREE"}
        </span>
        <span className="font-mono text-xs text-[#1a1a1a]/40 ml-1">/ call</span>
      </div>
      <p className="font-mono text-[10px] text-[#1a1a1a]/50 mb-4 pb-3 border-b border-dotted border-[#1a1a1a]/15">
        USD via ERC-8183 on-chain escrow
      </p>

      {/* Budget input */}
      <div className="mb-4">
        <label className="font-mono text-[10px] uppercase tracking-wider text-[#1a1a1a]/40 block mb-1.5">
          Budget (USD)
        </label>
        <div className="flex items-center border border-[#1a1a1a]/20 bg-[#1a1a1a]/[0.02]">
          <span className="font-mono text-sm text-[#1a1a1a]/40 px-3">$</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="flex-1 bg-transparent font-mono text-sm text-[#1a1a1a] py-2 pr-3 outline-none"
          />
        </div>
        {estimatedCalls > 0 && (
          <p className="font-mono text-[10px] text-[#1a1a1a]/30 mt-1">
            ≈ {estimatedCalls} calls
          </p>
        )}
      </div>

      {step === "error" && error && (
        <p className="font-mono text-[10px] text-red-700 mb-3">{error}</p>
      )}

      <button
        onClick={handleFundSession}
        disabled={step === "loading" || !budget || parseFloat(budget) <= 0}
        className="w-full bg-[#1a1a1a] text-[#f0ece2] font-mono text-xs uppercase tracking-wider py-3 hover:bg-[#1a1a1a]/80 transition-colors disabled:opacity-40 mb-2"
      >
        {step === "loading" ? "Opening Session…" : "Fund & Start"}
      </button>

      <div className="text-[10px] font-mono text-[#1a1a1a]/30 border-l-2 border-[#1a1a1a]/15 pl-2">
        Session expires in 24h · unused USD refunded
      </div>
    </div>
  );
}
