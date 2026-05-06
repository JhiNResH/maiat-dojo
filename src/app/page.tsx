"use client";

/**
 * Dojo home — AI workflow marketplace + clearing receipts.
 *
 * Vertical stack, no sidebars:
 *   - Floating glass navbar
 *   - Centered hero + CTAs
 *   - LandingHero (marketplace discovery -> run/fork/publish)
 *   - For Developers (API quick-start)
 *   - Multi-column footer
 */

import { LandingHero } from "@/components/landing/LandingHero";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

/* ── API step for developer section ── */
function ApiStep({
  step,
  method,
  path,
  desc,
  code,
}: {
  step: string;
  method: string;
  path: string;
  desc: string;
  code: string;
}) {
  return (
    <div className="border-b border-[var(--border-light)] py-5 last:border-b-0">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-secondary)] font-mono text-[11px] font-semibold text-[var(--text-muted)]">
          {step}
        </span>
        {method && (
          <span className="rounded-md bg-[var(--bg-secondary)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--text-secondary)]">
            {method}
          </span>
        )}
        <span className="font-mono text-[12px] text-[var(--text-muted)]">
          {path}
        </span>
      </div>
      <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
        {desc}
      </p>
      <pre className="code-block mt-3">{code}</pre>
    </div>
  );
}

export default function DojoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      {/* ═══ AMBIENT GRADIENT MESH ═══ */}
      <div className="atmosphere" />

      <Navbar />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-16 pt-28 sm:px-6">
        <main className="mb-16">
          <LandingHero />
        </main>

        {/* ═══ FOR DEVELOPERS ═══ */}
        <section id="developers" className="mb-20">
          <details className="dojo-dev-details glass-card p-5 sm:p-6">
            <summary>
              <div>
                <span className="label-sm">Developers</span>
                <h2 className="mt-2 text-[22px] font-semibold leading-tight text-[var(--text)]">
                  Run the same workflows through the API.
                </h2>
                <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
                  Use this when you want Dojo inside an agent, MCP server, CLI, or backend job.
                </p>
              </div>
              <span className="dojo-dev-summary-action">View API quick start</span>
            </summary>

            <div className="mt-6 border-t border-[var(--border-light)] pt-5">
              <p className="max-w-2xl text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
                Marketplace users can run from the UI. Developers can call the same
                workflows through REST: Dojo executes the workflow, evaluates the
                result, returns a receipt, and records settlement metadata on the
                BNB Smart Chain testnet rail.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="dojo-api-panel">
                <ApiStep
                  step="01"
                  method="GET"
                  path="/api/v1/skills"
                  desc="Browse ready-to-run AI workflows ranked by execution history."
                  code={`curl https://maiat-dojo.vercel.app/api/v1/skills`}
                />
                <ApiStep
                  step="02"
                  method="GET"
                  path="/api/v1/balance"
                  desc="Check your remaining API credits."
                  code={`curl https://maiat-dojo.vercel.app/api/v1/balance \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                />
              </div>
              <div className="dojo-api-panel">
                <ApiStep
                  step="03"
                  method="POST"
                  path="/api/v1/run"
                  desc="Run a workflow by gateway slug. One request = execute, evaluate, return a receipt."
                  code={`curl -X POST https://maiat-dojo.vercel.app/api/v1/run \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"skill":"agent-repo-analyst","input":{"repo_url":"https://github.com/garrytan/gbrain"}}'`}
                />
                <ApiStep
                  step="04"
                  method=""
                  path="Response"
                  desc="Result, API credit cost, evaluator score, settlement status, and receipt metadata."
                  code={`{
  "result": { "verdict": "strong_fit_for_agent_memory", "fit_score": 0.91 },
  "cost": 0.003,
  "balance": 9.997,
  "score": 1.0,
  "session_id": "cls...",
  "latency_ms": 842,
  "workflow_receipt": {
    "id": "cm...",
    "workflow_id": "cw...",
    "version_id": "cv...",
    "settlement_status": "paid",
    "anchor_status": "pending"
  }
}`}
                />
              </div>
            </div>
          </details>
        </section>
      </div>
      <Footer />
    </div>
  );
}
