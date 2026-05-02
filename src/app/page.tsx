"use client";

/**
 * Dojo home — clearing-network landing (matching app.maiat.io layout).
 *
 * Vertical stack, no sidebars:
 *   - Floating glass navbar
 *   - Centered hero + CTAs
 *   - LandingHero (clearing loop -> receipts -> workflow discovery)
 *   - For Developers (API quick-start)
 *   - Multi-column footer
 */

import Link from "next/link";
import { LandingHero } from "@/components/landing/LandingHero";
import { Navbar } from "@/components/landing/Navbar";

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
          <div className="mb-8">
            <span className="label-sm">For Developers</span>
            <h2 className="heading-lg mt-3 text-[var(--text)]">
              Clear agent work from any surface.
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
              Your agent does not need wallet plumbing, sessions, or nonces.
              Pick a workflow, run it through the gateway, and let Dojo evaluate,
              settle, and write the receipt.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="glass-card p-6">
              <ApiStep
                step="01"
                method="GET"
                path="/api/v1/skills"
                desc="Browse workflows ranked by cleared execution history."
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
            <div className="glass-card p-6">
              <ApiStep
                step="03"
                method="POST"
                path="/api/v1/run"
                desc="Run a workflow by gateway slug. One request = authorize, execute, evaluate, settle, receipt."
                code={`curl -X POST https://maiat-dojo.vercel.app/api/v1/run \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"skill":"web-scraper","input":{"url":"…"}}'`}
              />
              <ApiStep
                step="04"
                method=""
                path="Response"
                desc="Result, API credit cost, evaluator score, settlement, and receipt metadata."
                code={`{
  "result": { "content": "..." },
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
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="mt-auto border-t border-[var(--border)] pt-10">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <span className="text-[15px] font-bold text-[var(--text)]">
                The Dojo
              </span>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-muted)]">
                Clearing venue for paid
                <br />
                agent work.
              </p>
            </div>
            <div>
              <span className="label-sm">Product</span>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link
                    href="/leaderboard"
                    className="text-[13px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]"
                  >
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="text-[13px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/demo"
                    className="text-[13px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]"
                  >
                    Demo
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <span className="label-sm">Developers</span>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link
                    href="/#developers"
                    className="text-[13px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]"
                  >
                    REST API
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/JhiNResH/maiat-dojo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <span className="label-sm">Get Started</span>
              <div className="mt-3 flex flex-col gap-2">
                <Link href="/create" className="btn-primary w-full justify-center text-[12px]">
                  Publish Workflow
                </Link>
                <Link href="/#developers" className="btn-outline w-full justify-center text-[12px]">
                  View Docs
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-10 flex items-center justify-between border-t border-[var(--border)] py-4">
            <span className="text-[12px] text-[var(--text-muted)]">
              &copy; 2026 Maiat Protocol. All rights reserved.
            </span>
            <span className="text-[12px] text-[var(--text-muted)]">
              Preview rail
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
