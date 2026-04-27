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
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--text)] text-[var(--bg)]">
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
    'w-full rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-3 text-[14px] text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--text)]';

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
        <main className="relative px-6 pb-20 pt-32">
          <section className="mx-auto max-w-xl text-center">
            <div className="glass-card p-8">
              <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--text)] text-[var(--bg)]">
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
                className="mt-7 inline-flex items-center justify-center rounded-full bg-[var(--text)] px-6 py-3 text-[12px] font-semibold uppercase tracking-widest text-[var(--bg)] transition-opacity hover:opacity-80"
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

      <main className="relative mx-auto w-full max-w-6xl px-6 pb-20 pt-32">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Marketplace
        </Link>

        <section className="mb-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[var(--text)] px-4 py-1.5 text-[var(--bg)]">
              <Rocket className="h-3.5 w-3.5" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
                Publish workflow
              </span>
            </div>
            <h1 className="heading-xl text-left">
              Ship a workflow
              <br />
              <span className="heading-xl-muted">agents can actually run.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-[var(--text-secondary)]">
              Register one endpoint as a versioned workflow. Dojo dry-runs it first, then lists it with pricing,
              sandbox execution, fork lineage, and receipts.
            </p>
          </div>

          <aside className="glass-card p-6">
            <span className="label-sm">Publish gate</span>
            <div className="mt-5 space-y-4">
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
            <p className="mt-5 border-t border-[var(--border)] pt-5 text-[13px] leading-relaxed text-[var(--text-muted)]">
              MVP scope: publish creates a one-step workflow backed by your endpoint. Multi-step graph editing comes after
              the marketplace demo is validated.
            </p>
          </aside>
        </section>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 font-mono text-[12px] text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="glass-card p-6">
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

          <section className="glass-card p-6">
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

          <section className="glass-card p-6 lg:col-span-2">
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
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
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
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--border)] px-5 py-3 text-[12px] font-semibold uppercase tracking-widest text-[var(--text)] transition-colors hover:border-[var(--text)] disabled:opacity-40"
                  >
                    {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                    {isTesting ? 'Testing' : 'Run dry-run'}
                  </button>
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={!canPublish}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--text)] px-5 py-3 text-[12px] font-semibold uppercase tracking-widest text-[var(--bg)] transition-opacity hover:opacity-80 disabled:opacity-40"
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
