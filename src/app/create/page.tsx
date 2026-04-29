'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import {
  ArrowLeft,
  CheckCircle2,
  Code2,
  Loader2,
  Play,
  Rocket,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BackgroundEffect } from '@/components/landing/BackgroundEffect';
import { Footer } from '@/components/landing/Footer';
import { Navbar } from '@/components/landing/Navbar';
import { useAutoCreateUser } from '@/hooks/useAutoCreateUser';

const CATEGORIES = ['Security', 'Trading', 'Content', 'DeFi', 'Analytics', 'Infra', 'Social'];

const DEFAULT_INPUT_SCHEMA = `{
  "type": "object",
  "required": ["target"],
  "properties": {
    "target": {
      "type": "string",
      "title": "Target",
      "description": "URL, contract address, repository, or text to process"
    }
  }
}`;

const DEFAULT_EXAMPLE_INPUT = `{
  "target": "https://example.com"
}`;

const QUICK_AUDIT_SCHEMA = `{
  "type": "object",
  "required": ["target"],
  "properties": {
    "target": {
      "type": "string",
      "title": "Target",
      "description": "Contract address, source URL, or repository to triage"
    },
    "chain": {
      "type": "string",
      "title": "Chain",
      "default": "bsc"
    }
  }
}`;

const QUICK_AUDIT_EXAMPLE = `{
  "target": "upgradeable ERC20 token",
  "chain": "bsc"
}`;

type DryRunResult = {
  ok: boolean;
  status: number;
  latencyMs: number;
  data: unknown;
  eval: {
    score: number;
    delivered: boolean;
    validFormat: boolean;
    withinSla: boolean;
  };
};

type PublishedWorkflowResponse = {
  id: string;
  name: string;
  workflow?: {
    id: string;
    slug: string;
  } | null;
};

function parseJsonField(label: string, value: string) {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${label} must be valid JSON.`);
  }
}

function isValidHttpsUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.hostname === 'localhost';
  } catch {
    return false;
  }
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="label-sm mb-2 block">{label}</span>
      {children}
      {hint && (
        <span className="mt-2 block text-[12px] leading-relaxed text-[var(--text-muted)]">
          {hint}
        </span>
      )}
    </label>
  );
}

function SectionHeader({
  icon: Icon,
  label,
  title,
}: {
  icon: LucideIcon;
  label: string;
  title: string;
}) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[var(--text)] text-[var(--bg)]">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <span className="label-sm">{label}</span>
        <h2 className="mt-1 text-[20px] font-semibold leading-tight text-[var(--text)]">
          {title}
        </h2>
      </div>
    </div>
  );
}

export default function CreateWorkflowPage() {
  const router = useRouter();
  const { ready, authenticated, login, user, getAccessToken } = usePrivy();
  useAutoCreateUser();

  const [name, setName] = useState('Quick Audit Workflow');
  const [description, setDescription] = useState(
    'Run a focused security pass and return structured findings.',
  );
  const [category, setCategory] = useState('Security');
  const [pricePerRun, setPricePerRun] = useState('0.01');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [inputSchema, setInputSchema] = useState(DEFAULT_INPUT_SCHEMA);
  const [exampleInput, setExampleInput] = useState(DEFAULT_EXAMPLE_INPUT);
  const [outputShape, setOutputShape] = useState('json');
  const [slaMs, setSlaMs] = useState(5000);
  const [dryRun, setDryRun] = useState<DryRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const inputClass =
    'dojo-input min-h-[42px] text-[13px]';

  const parsedPrice = useMemo(() => Number(pricePerRun), [pricePerRun]);
  const canDryRun =
    authenticated &&
    name.trim().length > 0 &&
    description.trim().length > 0 &&
    isValidHttpsUrl(endpointUrl);
  const canPublish =
    canDryRun &&
    dryRun?.ok === true &&
    Number.isFinite(parsedPrice) &&
    parsedPrice > 0 &&
    !isPublishing;

  async function authHeaders() {
    const token = await getAccessToken();
    if (!token) throw new Error('Session expired. Sign in again.');
    return { Authorization: `Bearer ${token}` };
  }

  async function handleDryRun() {
    if (!canDryRun || isTesting) return;
    setError(null);
    setDryRun(null);
    setIsTesting(true);

    try {
      const parsedExampleInput = parseJsonField('Example input', exampleInput);
      const headers = await authHeaders();
      const response = await fetch('/api/skills/dry-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          endpointUrl: endpointUrl.trim(),
          input: parsedExampleInput,
        }),
      });
      const json = (await response.json()) as DryRunResult | { error?: string };
      if (!response.ok) {
        throw new Error('error' in json && json.error ? json.error : 'Dry run failed.');
      }
      setDryRun(json as DryRunResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dry run failed.');
    } finally {
      setIsTesting(false);
    }
  }

  function useSampleWorkflow() {
    const origin =
      typeof window === 'undefined' ? 'https://maiat-dojo.vercel.app' : window.location.origin;
    setName('Quick Audit Workflow');
    setDescription('Run a focused smart-contract triage and return structured findings.');
    setCategory('Security');
    setPricePerRun('0.015');
    setEndpointUrl(`${origin}/api/skills-internal/quick-audit`);
    setInputSchema(QUICK_AUDIT_SCHEMA);
    setExampleInput(QUICK_AUDIT_EXAMPLE);
    setOutputShape('json');
    setSlaMs(5000);
    setDryRun(null);
    setError(null);
  }

  async function handlePublish() {
    if (!canPublish || !user?.id) return;
    setError(null);
    setIsPublishing(true);

    try {
      const parsedInputSchema = parseJsonField('Input schema', inputSchema);
      const parsedExampleInput = parseJsonField('Example input', exampleInput);
      const headers = await authHeaders();

      const response = await fetch('/api/skills/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          privyId: user.id,
          email: user.email?.address,
          walletAddress: user.wallet?.address,
          displayName: user.google?.name ?? user.email?.address?.split('@')[0],
          name: name.trim(),
          description: description.trim(),
          longDescription: description.trim(),
          category,
          icon: 'W',
          price: parsedPrice,
          pricePerCall: parsedPrice,
          endpointUrl: endpointUrl.trim(),
          executionKind: 'sync',
          inputShape: 'form',
          outputShape,
          estLatencyMs: slaMs,
          sandboxable: true,
          authRequired: false,
          inputSchema: parsedInputSchema,
          exampleInput: parsedExampleInput,
        }),
      });

      const json = (await response.json()) as PublishedWorkflowResponse & { error?: string };
      if (!response.ok) throw new Error(json.error || 'Publish failed.');

      router.push(`/workflow/${json.workflow?.id ?? json.id}/run`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed.');
    } finally {
      setIsPublishing(false);
    }
  }

  if (ready && !authenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-700">
        <BackgroundEffect />
        <Navbar />
        <main className="dojo-page-shell dojo-page-shell-narrow">
          <section className="text-center">
            <div className="dojo-card p-8">
              <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-[8px] bg-[var(--text)] text-[var(--bg)]">
                <Rocket className="h-4 w-4" />
              </div>
              <span className="label-sm">Creator gateway</span>
              <h1 className="mt-3 text-[34px] font-semibold leading-tight text-[var(--text)]">
                Publish an executable workflow.
              </h1>
              <p className="mx-auto mt-4 max-w-sm text-[14px] leading-relaxed text-[var(--text-muted)]">
                Sign in to dry-run your endpoint, attach pricing, and list it as a workflow agents can run.
              </p>
              <button
                onClick={login}
                className="dojo-action dojo-action-primary mt-7 px-6"
              >
                Sign in to publish
              </button>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-700">
      <BackgroundEffect />
      <Navbar />

      <main className="dojo-page-shell dojo-page-shell-wide">
        <Link
          href="/"
          className="dojo-back-link"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Marketplace
        </Link>

        <section className="mb-5 flex flex-col gap-4 border-b border-[var(--border-light)] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-[6px] bg-[var(--text)] px-3 py-1.5 text-[var(--bg)]">
              <Rocket className="h-3.5 w-3.5" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
                Publish workflow
              </span>
            </div>
            <h1 className="text-[28px] font-bold leading-tight tracking-[-0.025em] text-[var(--text)] md:text-[34px]">
              quick-audit-workflow
              <span className="ml-3 align-middle font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                draft
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[var(--text-secondary)]">
              Register one endpoint as a versioned workflow. Dojo dry-runs it first, then lists it with pricing,
              sandbox execution, fork lineage, and receipts.
            </p>
          </div>

          <aside className="dojo-card min-w-[280px] p-4">
            <span className="label-sm">Publish gate</span>
            <div className="mt-4 space-y-3">
              {[
                ['Endpoint', isValidHttpsUrl(endpointUrl)],
                ['Dry run', dryRun?.ok === true],
                ['Workflow record', dryRun?.ok === true],
              ].map(([label, done]) => (
                <div key={String(label)} className="flex items-center gap-3">
                  <CheckCircle2
                    className={`h-4 w-4 ${done ? 'text-emerald-600' : 'text-[var(--text-muted)]'}`}
                  />
                  <span className="text-[13px] text-[var(--text-secondary)]">{label}</span>
                </div>
              ))}
            </div>
            <button type="button" onClick={useSampleWorkflow} className="dojo-action mt-4 w-full">
              Use sample workflow
            </button>
          </aside>
        </section>

        <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-[var(--border-light)] pb-4 font-mono text-[10.5px] uppercase tracking-[0.1em]">
          {[
            ['01', 'Manifest', true],
            ['02', 'Endpoint', isValidHttpsUrl(endpointUrl)],
            ['03', 'Dry-run', dryRun?.ok === true],
            ['04', 'Pricing', Number.isFinite(parsedPrice) && parsedPrice > 0],
            ['05', 'Publish', canPublish],
          ].map(([step, label, done]) => (
            <div key={String(step)} className="flex items-center gap-2 text-[var(--text-secondary)]">
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                done ? 'border-[var(--signal)] bg-[var(--signal)] text-white' : 'border-[var(--border)] text-[var(--text-muted)]'
              }`}>
                {done ? '✓' : step}
              </span>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-[8px] border border-red-500/20 bg-red-500/5 px-4 py-3 font-mono text-[12px] text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[300px_1fr_360px]">
          <section className="dojo-card p-5">
            <SectionHeader icon={Code2} label="01 Metadata" title="Define the workflow listing." />
            <div className="space-y-4">
              <Field label="Workflow name">
                <input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
              </Field>
              <Field label="Description">
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  className={`${inputClass} resize-none leading-relaxed`}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Category">
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className={inputClass}
                  >
                    {CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Price per run">
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={pricePerRun}
                    onChange={(event) => setPricePerRun(event.target.value)}
                    className={`${inputClass} font-mono`}
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="dojo-card p-5 lg:col-span-2">
            <SectionHeader icon={Play} label="02 Runtime" title="Attach the endpoint Dojo will call." />
            <div className="space-y-4">
              <Field
                label="Creator endpoint"
                hint="Production requires https. Dojo sends POST JSON and later signs calls with X-Dojo-Hmac."
              >
                <input
                  value={endpointUrl}
                  onChange={(event) => {
                    setEndpointUrl(event.target.value);
                    setDryRun(null);
                  }}
                  placeholder="https://api.example.com/workflows/quick-audit/run"
                  className={`${inputClass} font-mono text-[13px]`}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Output shape">
                  <select
                    value={outputShape}
                    onChange={(event) => setOutputShape(event.target.value)}
                    className={inputClass}
                  >
                    <option value="json">json</option>
                    <option value="text">text</option>
                    <option value="html">html</option>
                  </select>
                </Field>
                <Field label={`SLA ${slaMs}ms`}>
                  <input
                    type="range"
                    min={500}
                    max={10000}
                    step={500}
                    value={slaMs}
                    onChange={(event) => setSlaMs(Number(event.target.value))}
                    className="w-full accent-[var(--text)]"
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="dojo-card p-5 lg:col-span-3">
            <SectionHeader icon={ShieldCheck} label="03 Contract" title="Dry-run the workflow before it can publish." />
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Input schema" hint="JSON Schema used to render the Run form.">
                <textarea
                  value={inputSchema}
                  onChange={(event) => setInputSchema(event.target.value)}
                  rows={12}
                  className={`${inputClass} resize-y font-mono text-[12px] leading-relaxed`}
                />
              </Field>
              <div className="space-y-4">
                <Field label="Example input" hint="Dojo sends this payload to your endpoint during dry-run.">
                  <textarea
                    value={exampleInput}
                    onChange={(event) => setExampleInput(event.target.value)}
                    rows={6}
                    className={`${inputClass} resize-y font-mono text-[12px] leading-relaxed`}
                  />
                </Field>
                <div className="rounded-[8px] border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="label-sm">Dry-run result</span>
                    {dryRun && (
                      <span className="font-mono text-[11px] text-[var(--text-muted)]">
                        {dryRun.latencyMs}ms
                      </span>
                    )}
                  </div>
                  <pre className="min-h-[150px] overflow-auto font-mono text-[12px] leading-relaxed text-[var(--text-secondary)]">
                    {JSON.stringify(
                      dryRun ?? {
                        status: 'waiting_for_test',
                        note: 'Run dry-run before publishing.',
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleDryRun}
                    disabled={!canDryRun || isTesting}
                    className="dojo-action flex-1 disabled:opacity-40"
                  >
                    {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                    {isTesting ? 'Testing' : 'Run dry-run'}
                  </button>
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={!canPublish}
                    className="dojo-action dojo-action-primary flex-1 disabled:opacity-40"
                  >
                    {isPublishing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Rocket className="h-3.5 w-3.5" />
                    )}
                    {isPublishing ? 'Publishing' : 'Publish workflow'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
