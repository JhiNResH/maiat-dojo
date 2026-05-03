'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, PlayCircle, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { BackgroundEffect } from '@/components/landing/BackgroundEffect';

interface StepResult {
  status: 'idle' | 'running' | 'success' | 'error';
  data?: unknown;
  error?: string;
}

const STEPS = [
  {
    num: 'I',
    title: 'Pick the live workflow',
    desc: 'Use Agent Repo Analyst, the single curated demo workflow for public agent repositories.',
  },
  {
    num: 'II',
    title: 'Analyze Garry Tan\'s GBrain repo',
    desc: 'Call the real repo analyst endpoint against the public garrytan/gbrain README.',
  },
  {
    num: 'III',
    title: 'Run through clearing API',
    desc: 'The CLI/API path executes the same workflow online, evaluates JSON delivery, and charges credits.',
  },
  {
    num: 'IV',
    title: 'Open the receipt',
    desc: 'The result becomes a paid execution receipt with score, settlement, and provenance.',
  },
];

export default function DemoPage() {
  const [results, setResults] = useState<StepResult[]>(
    STEPS.map(() => ({ status: 'idle' as const }))
  );
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [skillSlug] = useState('agent-repo-analyst');

  function updateStep(i: number, r: StepResult) {
    setResults((prev) => {
      const next = [...prev];
      next[i] = r;
      return next;
    });
  }

  async function runStep1() {
    updateStep(0, { status: 'running' });
    try {
      const res = await fetch('/api/skills?limit=5');
      const data = await res.json();
      updateStep(0, {
        status: 'success',
        data: { skills: data.skills?.length ?? 0, primary: skillSlug },
      });
    } catch (e) {
      updateStep(0, { status: 'error', error: (e as Error).message });
    }
  }

  async function runStep2() {
    updateStep(1, { status: 'running' });
    try {
      const res = await fetch('/api/skills?limit=20');
      const data = await res.json();
      const workflow = data.skills?.find(
        (s: { gatewaySlug?: string }) => s.gatewaySlug === skillSlug
      );
      if (!workflow) throw new Error(`Workflow '${skillSlug}' not found. Run seed first.`);
      updateStep(1, {
        status: 'success',
        data: {
          id: workflow.id,
          name: workflow.name,
          slug: workflow.gatewaySlug,
          pricePerCall: workflow.pricePerCall,
        },
      });
    } catch (e) {
      updateStep(1, { status: 'error', error: (e as Error).message });
    }
  }

  async function runStep3() {
    updateStep(2, { status: 'running' });
    try {
      const res = await fetch('/api/skills-internal/repo-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_url: 'https://github.com/garrytan/gbrain',
          question: 'Is this useful for building persistent-memory agents?',
        }),
      });
      const body = await res.json();
      updateStep(2, {
        status: res.ok ? 'success' : 'error',
        data: { httpStatus: res.status, body },
        error: !res.ok ? body.error : undefined,
      });
    } catch (e) {
      updateStep(2, { status: 'error', error: (e as Error).message });
    }
  }

  async function runStep4() {
    updateStep(3, { status: 'running' });
    try {
      const res = await fetch('/api/v1/receipts/cmop19dlo000g106kgfthrls2');
      const data = await res.json();
      const nextReceipt = data.receipt?.id
        ? `/r/${data.receipt.id}`
        : '/r/cmop19dlo000g106kgfthrls2';
      setReceiptUrl(nextReceipt);
      updateStep(3, { status: 'success', data: { receiptUrl: nextReceipt, receipt: data.receipt ?? data } });
    } catch (e) {
      updateStep(3, { status: 'error', error: (e as Error).message });
    }
  }

  const runners = [runStep1, runStep2, runStep3, runStep4];

  const glassCard = 'border border-[var(--border)] bg-[var(--card-bg)]';

  const glassStyle = {
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  } as const;

  const statusStyle = (s: StepResult['status']) => {
    if (s === 'success') return 'text-[var(--text)] border-[var(--border)] bg-[var(--bg-secondary)]';
    if (s === 'error') return 'text-[var(--text-muted)] border-[var(--border)] bg-[var(--bg-secondary)]';
    if (s === 'running') return 'text-[var(--text-secondary)] border-[var(--border)] bg-[var(--bg-secondary)]';
    return 'text-[var(--text-muted)] border-[var(--border-light)] bg-[var(--bg-secondary)]';
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-700">
      <BackgroundEffect />
      <Navbar />

      <main className="dojo-page-shell dojo-page-shell-narrow">
        <div>
          <Link
            href="/"
            className="dojo-back-link"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to marketplace
          </Link>

          {/* Header */}
          <header className="dojo-page-header dojo-page-header-centered">
            <div className="dojo-page-kicker">
              <Sparkles className="w-3 h-3" />
              <span>Live walkthrough</span>
            </div>
            <h1 className="dojo-page-title">
              Watch it settle.
            </h1>
            <p className="dojo-page-subtitle">
              One real public repo. Online workflow execution. Paid clearing receipt.
            </p>
          </header>

          {/* Steps */}
          <div className="space-y-4">
            {STEPS.map((step, i) => {
              const r = results[i];
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className={`rounded-[8px] p-6 border ${glassCard}`}
                  style={glassStyle}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-[8px] flex items-center justify-center border font-mono text-xs font-bold shrink-0 border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                      {step.num}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-sans font-semibold text-base mb-1 text-[var(--text)]">
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                        {step.desc}
                      </p>
                    </div>
                    <button
                      onClick={runners[i]}
                      disabled={r.status === 'running'}
                      className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition-all hover:scale-[1.02] disabled:opacity-40 bg-[var(--text)] text-[var(--bg)]"
                    >
                      <PlayCircle className="w-3 h-3" />
                      {r.status === 'running' ? 'Running…' : 'Run step'}
                    </button>
                  </div>

                  {r.status !== 'idle' && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)]">
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className={`inline-flex items-center text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-1 rounded-full border ${statusStyle(
                            r.status
                          )}`}
                        >
                          {r.status}
                        </span>
                        {r.error && (
                          <span className="font-mono text-[10px] text-[var(--text-muted)]">
                            {r.error}
                          </span>
                        )}
                      </div>
                      {r.data != null && (
                        <pre className="font-mono text-[11px] rounded-[8px] p-4 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
                          {JSON.stringify(r.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-center mt-8 text-[var(--text-muted)]">
            Maiat protocol · BSC testnet · Live API
          </p>
          {receiptUrl && (
            <div className="mt-4 text-center">
              <Link href={receiptUrl} className="btn-primary inline-flex">
                Open receipt
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
