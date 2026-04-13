"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { LogIn } from "lucide-react";
import { useDarkMode } from "@/app/DarkModeContext";
import CheckoutCard from "@/components/CheckoutCard";
import { useEscrowFund, type EscrowStep } from "@/hooks/useEscrowFund";
import { formatUnits } from "viem";

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

interface PassiveResult {
  content: string;
  fileType: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getOrCreateAgent(
  privyId: string,
  token: string,
  displayName: string | undefined,
  walletAddress: string | undefined
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
      walletAddress,
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
  const { isDark } = useDarkMode();
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [passiveResult, setPassiveResult] = useState<PassiveResult | null>(null);
  const [closing, setClosing] = useState(false);
  const [budget, setBudget] = useState<string>(
    skill.pricePerCall ? String(Math.max(1, Math.round(skill.pricePerCall * 20))) : "5"
  );
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetMsg, setFaucetMsg] = useState<string | null>(null);

  // Agent self-pay escrow hook
  const escrow = useEscrowFund();

  const isPassive = skill.skillType === "passive";
  const isFree = skill.price === 0;

  // Dark mode tokens
  const ink = isDark ? "text-white" : "text-[#1a1a1a]";
  const bg = isDark ? "bg-[#0A0A0A]" : "bg-[#f0ece2]";
  const muted = isDark ? "text-gray-500" : "text-[#1a1a1a]/60";
  const faint = isDark ? "text-gray-600" : "text-[#1a1a1a]/40";
  const fainter = isDark ? "text-gray-700" : "text-[#1a1a1a]/30";
  const rule = isDark ? "border-white/10" : "border-dotted border-[#1a1a1a]/15";
  const ruleLight = isDark ? "border-white/[0.06]" : "border-[#1a1a1a]/10";
  const btnBg = isDark
    ? "bg-white text-[#0A0A0A] hover:bg-white/90"
    : "bg-[#1a1a1a] text-[#f0ece2] hover:bg-[#1a1a1a]/80";
  const inputBorder = isDark ? "border-white/15 bg-white/[0.04]" : "border-[#1a1a1a]/20 bg-[#1a1a1a]/[0.02]";
  const codeBg = isDark ? "bg-white/[0.04] border-white/[0.06]" : "bg-[#1a1a1a]/[0.03] border-[#1a1a1a]/10";
  const successBg = isDark
    ? "text-emerald-400 bg-emerald-400/10 border-emerald-400"
    : "text-green-800 bg-green-800/10 border-green-800";

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

  // ── Active: close session ─────────────────────────────────────────────────
  async function handleCloseSessionById(sessionId: string) {
    setClosing(true);
    try {
      const token = await getAccessToken();
      if (!token || !user) throw new Error("Not authenticated");
      await fetch(`/api/sessions/${sessionId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ privyId: user.id }),
      });
      escrow.reset();
      setStep("idle");
    } catch {
      // silent — session will expire naturally
    } finally {
      setClosing(false);
    }
  }

  // ── Active: fund escrow via agent wallet ──────────────────────────────────
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

      const agentId = await getOrCreateAgent(user.id, token, user.google?.name ?? undefined, user.wallet?.address ?? undefined);

      await escrow.fund({
        agentId,
        skillId: skill.id,
        budgetTotal: parseFloat(budget),
        gatewaySlug: skill.gatewaySlug || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("error");
    }
  }

  // ── Testnet faucet ──────────────────────────────────────────────────────
  async function handleFaucet() {
    setFaucetLoading(true);
    setFaucetMsg(null);
    try {
      const token = await getAccessToken();
      if (!token || !user) throw new Error("Not authenticated");
      const res = await fetch("/api/faucet/usdc", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ privyId: user.id, walletAddress: escrow.walletAddress }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Faucet failed");
      setFaucetMsg(`${data.amount} USDC sent`);
      escrow.reset(); // triggers balance refetch on next render
    } catch (err) {
      setFaucetMsg(err instanceof Error ? err.message : "Faucet error");
    } finally {
      setFaucetLoading(false);
    }
  }

  // Map escrow step to label
  function escrowStepLabel(s: EscrowStep): string {
    switch (s) {
      case 'preparing': return 'Preparing...';
      case 'approving': return 'Approve USDC (1/4)...';
      case 'creating_job': return 'Create Job (2/4)...';
      case 'setting_budget': return 'Set Budget (3/4)...';
      case 'funding': return 'Fund Escrow (4/4)...';
      case 'confirming': return 'Confirming...';
      default: return 'Fund & Start';
    }
  }

  // ── Not authenticated ─────────────────────────────────────────────────────
  if (!ready) return null;

  if (!authenticated) {
    return (
      <div className="classified" data-label={isPassive ? "Acquire" : "Use This Skill"}>
        <p className={`font-serif text-sm ${muted} mb-4`}>
          Connect your wallet to {isPassive ? "download" : "use"} this skill.
        </p>
        <button
          onClick={login}
          className={`w-full flex items-center justify-center gap-2 ${btnBg} font-mono text-xs uppercase tracking-wider py-3 transition-colors`}
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
        <div className={`text-xs font-mono ${successBg} border-l-2 px-2 py-1 mb-4`}>
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
          className={`w-full ${btnBg} font-mono text-xs uppercase tracking-wider py-3 transition-colors mb-2`}
        >
          Download .md
        </button>
        <button
          onClick={() => { setStep("idle"); setPassiveResult(null); }}
          className={`w-full font-mono text-[10px] ${faint} hover:opacity-100 transition-colors py-1`}
        >
          View again
        </button>
      </div>
    );
  }

  // ── Done: active (escrow funded by agent wallet) ──────────────────────────
  if (escrow.step === "done" && !isPassive && escrow.result) {
    const ar = escrow.result;
    return (
      <div className="classified" data-label="Session Active">
        <div className={`text-xs font-mono ${successBg} border-l-2 px-2 py-1 mb-4`}>
          ✓ Session open · ${ar.budgetTotal} USD locked (agent-funded)
        </div>

        <div className="space-y-0 mb-4">
          {[
            { label: "Session ID", value: ar.sessionId.slice(0, 16) + "…" },
            {
              label: "Expires",
              value: new Date(ar.expiresAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric",
              }),
            },
            { label: "Budget", value: `$${ar.budgetTotal} USD` },
            { label: "On-chain Job", value: `#${ar.onchainJobId}` },
          ].map(({ label, value }) => (
            <div key={label} className={`flex justify-between items-center py-1.5 border-b border-dotted ${ruleLight} last:border-b-0`}>
              <span className={`font-mono text-[10px] ${faint} uppercase tracking-wider`}>{label}</span>
              <span className={`font-mono text-[10px] ${ink} font-bold`}>{value}</span>
            </div>
          ))}
        </div>

        <CheckoutCard />

        <div className={`font-mono text-[10px] ${faint} ${codeBg} p-2 border mb-3 break-all`}>
          POST {ar.gatewayUrl}
        </div>

        <p className={`font-mono text-[10px] ${fainter} border-l-2 ${ruleLight} pl-2 mb-4`}>
          Pass <code>X-Session-Id: {ar.sessionId.slice(0, 8)}…</code> in your agent headers.
        </p>

        <button
          onClick={() => {
            // Close uses the escrow result's sessionId
            handleCloseSessionById(ar.sessionId);
          }}
          disabled={closing}
          className={`w-full font-mono text-[10px] ${faint} hover:opacity-80 transition-colors py-1 border border-dotted ${ruleLight} disabled:opacity-40`}
        >
          {closing ? "Closing…" : "Close Session & Refund"}
        </button>
      </div>
    );
  }

  // ── Passive: buy form ─────────────────────────────────────────────────────
  if (isPassive) {
    return (
      <div className="classified" data-label="Acquire">
        <div className="mb-3">
          <span className={`font-serif font-black text-3xl ${ink}`}>
            {isFree ? "Free" : `$${skill.price.toFixed(2)}`}
          </span>
        </div>
        <p className={`font-mono text-[10px] ${muted} mb-4 pb-3 border-b border-dotted ${ruleLight}`}>
          One-time · Instant delivery · .md file
        </p>

        {step === "error" && error && (
          <p className="font-mono text-[10px] text-red-500 mb-3">{error}</p>
        )}

        <button
          onClick={handlePassiveBuy}
          disabled={step === "loading"}
          className={`w-full ${btnBg} font-mono text-xs uppercase tracking-wider py-3 transition-colors disabled:opacity-40`}
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

  const isEscrowBusy = escrow.step !== 'idle' && escrow.step !== 'done' && escrow.step !== 'error';
  const formattedBalance = escrow.usdcBalance != null
    ? parseFloat(formatUnits(escrow.usdcBalance as bigint, 18)).toFixed(2)
    : null;

  return (
    <div className="classified" data-label="Use This Skill">
      <div className="mb-1">
        <span className={`font-serif font-black text-3xl ${ink}`}>
          {skill.pricePerCall ? `$${skill.pricePerCall.toFixed(2)}` : "FREE"}
        </span>
        <span className={`font-mono text-xs ${faint} ml-1`}>/ call</span>
      </div>
      <p className={`font-mono text-[10px] ${muted} mb-4 pb-3 border-b border-dotted ${ruleLight}`}>
        Agent-funded · ERC-8183 on-chain escrow
      </p>

      {/* USDC Balance */}
      {escrow.walletAddress && (
        <div className={`flex justify-between items-center mb-3 pb-2 border-b border-dotted ${ruleLight}`}>
          <span className={`font-mono text-[10px] ${faint} uppercase tracking-wider`}>USDC Balance</span>
          <span className={`font-mono text-[10px] ${ink} font-bold`}>
            {formattedBalance != null ? `$${formattedBalance}` : "—"}
          </span>
        </div>
      )}

      {/* Budget input */}
      <div className="mb-4">
        <label className={`font-mono text-[10px] uppercase tracking-wider ${faint} block mb-1.5`}>
          Budget (USD)
        </label>
        <div className={`flex items-center border ${inputBorder}`}>
          <span className={`font-mono text-sm ${faint} px-3`}>$</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            disabled={isEscrowBusy}
            className={`flex-1 bg-transparent font-mono text-sm ${ink} py-2 pr-3 outline-none disabled:opacity-40`}
          />
        </div>
        {estimatedCalls > 0 && (
          <p className={`font-mono text-[10px] ${fainter} mt-1`}>
            ≈ {estimatedCalls} calls
          </p>
        )}
      </div>

      {/* Escrow progress */}
      {isEscrowBusy && (
        <div className={`mb-3 ${codeBg} border p-2`}>
          <div className={`font-mono text-[10px] ${ink} mb-1`}>
            {escrowStepLabel(escrow.step)}
          </div>
          <div className="w-full h-1 bg-white/10 overflow-hidden">
            <div
              className="h-full bg-current transition-all duration-300"
              style={{ width: `${(escrow.txCount / escrow.totalTxs) * 100}%` }}
            />
          </div>
          <div className={`font-mono text-[9px] ${fainter} mt-1`}>
            {escrow.txCount}/{escrow.totalTxs} txs confirmed
          </div>
        </div>
      )}

      {/* Errors */}
      {(step === "error" || escrow.step === "error") && (error || escrow.error) && (
        <p className="font-mono text-[10px] text-red-500 mb-3">{escrow.error || error}</p>
      )}

      <button
        onClick={handleFundSession}
        disabled={isEscrowBusy || step === "loading" || !budget || parseFloat(budget) <= 0}
        className={`w-full ${btnBg} font-mono text-xs uppercase tracking-wider py-3 transition-colors disabled:opacity-40 mb-2`}
      >
        {isEscrowBusy ? escrowStepLabel(escrow.step) : "Fund & Start"}
      </button>

      {/* Testnet faucet */}
      {escrow.walletAddress && (
        <button
          onClick={handleFaucet}
          disabled={faucetLoading}
          className={`w-full font-mono text-[10px] ${faint} hover:opacity-80 transition-colors py-1.5 border border-dotted ${ruleLight} disabled:opacity-40 mb-1`}
        >
          {faucetLoading ? "Sending..." : "Get Test USDC (Testnet)"}
        </button>
      )}
      {faucetMsg && (
        <p className={`font-mono text-[10px] ${faucetMsg.includes("sent") ? "text-green-600" : "text-red-500"} mb-1`}>
          {faucetMsg}
        </p>
      )}

      <div className={`text-[10px] font-mono ${fainter} border-l-2 ${ruleLight} pl-2 mt-2`}>
        Session expires in 24h · unused USD refunded
      </div>
    </div>
  );
}
