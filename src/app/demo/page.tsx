"use client";

import { useState } from "react";
import Link from "next/link";

interface StepResult {
  status: "idle" | "running" | "success" | "error";
  data?: unknown;
  error?: string;
}

const STEPS = [
  {
    num: "I",
    title: "Register Agent Identity (KYA-0)",
    desc: "Mint an ERC-8004 identity on BSC. This gives the agent an on-chain ID.",
  },
  {
    num: "II",
    title: "Discover Skill in Marketplace",
    desc: "Browse the Dojo marketplace and find an active skill to call.",
  },
  {
    num: "III",
    title: "Hit Gateway \u2192 Receive 402 + x402 Headers",
    desc: "Call the gateway without a session. Get back a 402 with payment discovery headers.",
  },
  {
    num: "IV",
    title: "Open Session (Fund Escrow)",
    desc: "Open an ERC-8183 escrow session. Budget is locked on-chain.",
  },
  {
    num: "V",
    title: "Call Skill N Times \u2192 Per-Call Eval \u2192 Scores",
    desc: "Invoke the echo skill 3 times via gateway. Each call is evaluated for delivery, format, and SLA.",
  },
  {
    num: "VI",
    title: "Close Session \u2192 Settle \u2192 Attest \u2192 Trust Update",
    desc: "Close the session. Settlement, BAS attestation, and trust score update fire.",
  },
];

export default function DemoPage() {
  const [results, setResults] = useState<StepResult[]>(
    STEPS.map(() => ({ status: "idle" as const }))
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [skillSlug] = useState("echo-test");

  function updateStep(i: number, r: StepResult) {
    setResults((prev) => {
      const next = [...prev];
      next[i] = r;
      return next;
    });
  }

  // Step 1: Discover skills (just fetch the list)
  async function runStep1() {
    updateStep(0, { status: "running" });
    try {
      const res = await fetch("/api/skills?limit=5");
      const data = await res.json();
      updateStep(0, { status: "success", data: { skills: data.skills?.length ?? 0, message: "Skills fetched. KYA-0 mint requires wallet connection." } });
    } catch (e) {
      updateStep(0, { status: "error", error: (e as Error).message });
    }
  }

  // Step 2: Find echo-test skill
  async function runStep2() {
    updateStep(1, { status: "running" });
    try {
      const res = await fetch("/api/skills?limit=20");
      const data = await res.json();
      const echo = data.skills?.find((s: { gatewaySlug?: string }) => s.gatewaySlug === skillSlug);
      if (!echo) throw new Error(`Skill '${skillSlug}' not found. Run seed first.`);
      updateStep(1, {
        status: "success",
        data: { id: echo.id, name: echo.name, slug: echo.gatewaySlug, pricePerCall: echo.pricePerCall },
      });
    } catch (e) {
      updateStep(1, { status: "error", error: (e as Error).message });
    }
  }

  // Step 3: Hit gateway without session → 402
  async function runStep3() {
    updateStep(2, { status: "running" });
    try {
      const res = await fetch(`/api/gateway/skills/${skillSlug}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "hello" }),
      });
      const headers: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        if (k.toLowerCase().startsWith("x-payment")) headers[k] = v;
      });
      const body = await res.json();
      updateStep(2, {
        status: res.status === 402 ? "success" : "error",
        data: { httpStatus: res.status, headers, body },
        error: res.status !== 402 ? `Expected 402, got ${res.status}` : undefined,
      });
    } catch (e) {
      updateStep(2, { status: "error", error: (e as Error).message });
    }
  }

  // Step 4: Open session (requires auth — simulated via direct API)
  async function runStep4() {
    updateStep(3, { status: "running" });
    try {
      // Find the echo skill first
      const skillRes = await fetch("/api/skills?limit=20");
      const skillData = await skillRes.json();
      const echo = skillData.skills?.find((s: { gatewaySlug?: string }) => s.gatewaySlug === skillSlug);
      if (!echo) throw new Error("Echo skill not found");

      // Open session via API
      const res = await fetch("/api/sessions/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: echo.id,
          budgetUsdc: 1.0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSessionId(data.session?.id ?? null);
      updateStep(3, { status: "success", data: data.session });
    } catch (e) {
      updateStep(3, {
        status: "error",
        error: `${(e as Error).message} — Session open requires Privy auth in production. For demo, seed test sessions manually.`,
      });
    }
  }

  // Step 5: Call skill 3 times via gateway (requires session headers)
  async function runStep5() {
    updateStep(4, { status: "running" });
    if (!sessionId) {
      updateStep(4, {
        status: "error",
        error: "No session — run Step IV first or provide session ID.",
      });
      return;
    }
    try {
      const callResults = [];
      for (let i = 0; i < 3; i++) {
        const body = JSON.stringify({ message: `call-${i + 1}`, ts: Date.now() });
        const res = await fetch(`/api/gateway/skills/${skillSlug}/run`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Dojo-Auth": "demo-sig",
            "X-Dojo-JobId": sessionId,
            "X-Dojo-AgentTokenId": "1",
            "X-Dojo-Nonce": String(i + 1),
            "X-Dojo-ExpiresAt": String(Math.floor(Date.now() / 1000) + 60),
            "X-Dojo-RequestHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
          },
          body,
        });
        const data = await res.json();
        callResults.push({
          nonce: i + 1,
          status: res.status,
          budgetRemaining: res.headers.get("X-Dojo-BudgetRemaining"),
          callCount: res.headers.get("X-Dojo-CallCount"),
          body: data,
        });
      }
      updateStep(4, { status: "success", data: callResults });
    } catch (e) {
      updateStep(4, { status: "error", error: (e as Error).message });
    }
  }

  // Step 6: Close session
  async function runStep6() {
    updateStep(5, { status: "running" });
    if (!sessionId) {
      updateStep(5, {
        status: "error",
        error: "No session — run Step IV first.",
      });
      return;
    }
    try {
      const res = await fetch(`/api/sessions/${sessionId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privyId: "demo" }),
      });
      const data = await res.json();
      updateStep(5, {
        status: res.ok ? "success" : "error",
        data,
        error: !res.ok ? data.error : undefined,
      });
    } catch (e) {
      updateStep(5, { status: "error", error: (e as Error).message });
    }
  }

  const runners = [runStep1, runStep2, runStep3, runStep4, runStep5, runStep6];

  return (
    <div className="min-h-screen bg-[#f0ece2]">
      <div className="max-w-4xl mx-auto px-6 py-8 page-container">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#1a1a1a]/30 hover:text-[#1a1a1a] transition-colors">
              &larr; Back to Dojo
            </Link>
          </div>
          <div className="masthead-rule mb-2" />
          <div className="text-center py-3">
            <h1 className="font-serif font-black text-5xl tracking-tight text-[#1a1a1a] leading-none">
              DEMO
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#1a1a1a]/40 mt-2">
              Maiat Protocol &middot; 6-Step Walkthrough &middot; Live API Calls
            </p>
          </div>
          <div className="masthead-rule" />
        </header>

        <p className="font-serif text-sm text-[#1a1a1a]/50 text-center mb-8 max-w-lg mx-auto">
          Each step calls the real Dojo API. Click &ldquo;Run Step&rdquo; sequentially to see the full agent-to-skill lifecycle.
        </p>

        {/* Steps */}
        <div className="space-y-4">
          {STEPS.map((step, i) => (
            <div key={step.num} className="classified" data-label={`Step ${step.num}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-serif font-bold text-base text-[#1a1a1a] mb-1">
                    {step.title}
                  </h3>
                  <p className="font-serif text-sm text-[#1a1a1a]/50">{step.desc}</p>
                </div>
                <button
                  onClick={runners[i]}
                  disabled={results[i].status === "running"}
                  className="shrink-0 bg-[#1a1a1a] text-[#f0ece2] font-mono text-xs px-4 py-2 hover:bg-[#1a1a1a]/80 transition-colors tracking-wider disabled:opacity-30"
                >
                  {results[i].status === "running" ? "RUNNING..." : "RUN STEP"}
                </button>
              </div>

              {/* Result */}
              {results[i].status !== "idle" && (
                <div className="mt-3 pt-3 border-t border-dotted border-[#1a1a1a]/15">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${
                        results[i].status === "success"
                          ? "text-green-800 bg-green-100"
                          : results[i].status === "error"
                          ? "text-red-800 bg-red-100"
                          : "text-blue-800 bg-blue-100"
                      }`}
                    >
                      {results[i].status}
                    </span>
                    {results[i].error && (
                      <span className="font-mono text-[10px] text-red-700">{results[i].error}</span>
                    )}
                  </div>
                  {results[i].data != null && (
                    <pre className="font-mono text-[11px] text-[#1a1a1a]/60 bg-[#1a1a1a]/5 p-3 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {JSON.stringify(results[i].data, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-12">
          <div className="masthead-rule mb-3" />
          <div className="flex justify-between items-center py-2">
            <span className="font-mono text-[10px] text-[#1a1a1a]/25 tracking-wider uppercase">
              Dojo Demo &middot; Maiat Protocol &middot; BSC Testnet
            </span>
            <Link href="/dashboard" className="font-mono text-[10px] text-[#1a1a1a]/30 hover:text-[#1a1a1a] underline">
              Dashboard &rarr;
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
