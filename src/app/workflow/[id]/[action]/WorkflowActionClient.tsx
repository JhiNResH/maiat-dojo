"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, GitFork, Play, Rocket, ShieldCheck } from "lucide-react";

type WorkflowAction = "run" | "fork" | "deploy";

type SchemaProperty = {
  type?: string;
  title?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
};

type SchemaObject = {
  required?: string[];
  properties?: Record<string, SchemaProperty>;
};

export type WorkflowActionData = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  pricePerRun: number;
  royaltyBps: number;
  runs: number;
  forks: number;
  trustScore: number;
  creatorName: string;
  skill: {
    id: string;
    name: string;
    gatewaySlug: string;
    inputSchema: string | null;
    exampleInput: string | null;
  };
  version: {
    version: number;
    summary: string;
    slaMs: number | null;
  } | null;
};

type RunResult = {
  ok?: boolean;
  status?: number;
  latencyMs?: number;
  data?: unknown;
  error?: string;
  code?: string;
  demo?: boolean;
};

function safeParseSchema(raw: string | null): SchemaObject | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SchemaObject;
  } catch {
    return null;
  }
}

function safeParseRecord(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function defaultsFromSchema(schema: SchemaObject | null, example: Record<string, unknown>) {
  const seed: Record<string, unknown> = { ...example };
  for (const [key, prop] of Object.entries(schema?.properties ?? {})) {
    if (seed[key] === undefined && prop.default !== undefined) {
      seed[key] = prop.default;
    }
  }
  return seed;
}

function coerce(prop: SchemaProperty, value: string) {
  if (value === "") return "";
  if (prop.type === "number" || prop.type === "integer") {
    const n = Number(value);
    return Number.isFinite(n) ? n : value;
  }
  if (prop.type === "boolean") return value === "true";
  return value;
}

function actionCopy(action: WorkflowAction) {
  switch (action) {
    case "run":
      return {
        icon: Play,
        label: "Run workflow",
        eyebrow: "Execution",
        title: "Run a proven workflow.",
        body: "Send one input, receive a structured result and execution receipt. This is the path buyers use before they fork or deploy a variant.",
      };
    case "fork":
      return {
        icon: GitFork,
        label: "Fork workflow",
        eyebrow: "Derivative",
        title: "Create your own variant.",
        body: "Fork the workflow logic, keep provenance attached, and prepare a draft version you can customize before publishing.",
      };
    case "deploy":
      return {
        icon: Rocket,
        label: "Deploy workflow",
        eyebrow: "Runtime",
        title: "Ship it behind a gateway.",
        body: "Turn a workflow into an executable endpoint with pricing, receipts, and reputation tracking wired in.",
      };
  }
}

function formatJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function Nav() {
  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex justify-center px-6 pt-4">
      <nav className="glass-nav flex w-full max-w-4xl items-center justify-between px-5 py-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--text)]">
            <span className="text-[11px] font-black text-[var(--bg)]">D</span>
          </span>
          <span className="text-[14px] font-bold tracking-tight text-[var(--text)]">
            The Dojo
          </span>
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text)]">
            Marketplace
          </Link>
          <Link href="/leaderboard" className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text)]">
            Leaderboard
          </Link>
          <a href="#receipt" className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text)]">
            Receipt
          </a>
        </div>
      </nav>
    </div>
  );
}

function FieldInput({
  name,
  prop,
  value,
  onChange,
}: {
  name: string;
  prop: SchemaProperty;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const label = prop.title ?? name;
  const current = value ?? "";
  const base =
    "w-full rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-3 font-mono text-[13px] text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--text)]";

  return (
    <label className="block">
      <span className="label-sm mb-2 block">{label}</span>
      {Array.isArray(prop.enum) && prop.enum.length > 0 ? (
        <select
          value={String(current)}
          onChange={(event) => onChange(coerce(prop, event.target.value))}
          className={base}
        >
          {prop.enum.map((option) => (
            <option key={String(option)} value={String(option)}>
              {String(option)}
            </option>
          ))}
        </select>
      ) : (
        <input
          value={String(current)}
          onChange={(event) => onChange(coerce(prop, event.target.value))}
          placeholder={prop.description ?? ""}
          type={prop.type === "number" || prop.type === "integer" ? "number" : "text"}
          className={base}
        />
      )}
      {prop.description && (
        <span className="mt-2 block text-[12px] leading-relaxed text-[var(--text-muted)]">
          {prop.description}
        </span>
      )}
    </label>
  );
}

function RunPanel({ workflow }: { workflow: WorkflowActionData }) {
  const schema = useMemo(() => safeParseSchema(workflow.skill.inputSchema), [workflow.skill.inputSchema]);
  const example = useMemo(() => safeParseRecord(workflow.skill.exampleInput), [workflow.skill.exampleInput]);
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    defaultsFromSchema(schema, example),
  );
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  const fields = Object.entries(schema?.properties ?? {});
  const required = new Set(schema?.required ?? []);
  const missingRequired = fields.some(
    ([key]) => required.has(key) && (values[key] === "" || values[key] == null),
  );

  async function runWorkflow() {
    if (pending || missingRequired) return;
    setPending(true);
    setResult(null);
    try {
      const response = await fetch(`/api/skills/${workflow.skill.id}/sandbox`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: values }),
      });
      const data = (await response.json()) as RunResult;
      setResult(data);
    } catch (error) {
      setResult({
        ok: false,
        status: 0,
        latencyMs: 0,
        error: error instanceof Error ? error.message : "Network error",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="glass-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <span className="label-sm">Input</span>
          <span className="font-mono text-[11px] text-[var(--text-muted)]">
            {workflow.version?.slaMs ?? 1200}ms SLA
          </span>
        </div>
        <div className="space-y-4">
          {fields.length > 0 ? (
            fields.map(([key, prop]) => (
              <FieldInput
                key={key}
                name={key}
                prop={prop}
                value={values[key]}
                onChange={(value) => setValues((prev) => ({ ...prev, [key]: value }))}
              />
            ))
          ) : (
            <p className="text-[14px] text-[var(--text-muted)]">
              This workflow takes an empty payload.
            </p>
          )}
          <button
            onClick={runWorkflow}
            disabled={pending || missingRequired}
            className="w-full rounded-full bg-[var(--text)] px-5 py-3 text-[12px] font-semibold uppercase tracking-widest text-[var(--bg)] transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            {pending ? "Running..." : "Run sandbox"}
          </button>
        </div>
      </section>

      <section id="receipt" className="glass-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <span className="label-sm">Execution receipt</span>
          {result && (
            <span className="font-mono text-[11px] text-[var(--text-muted)]">
              {result.latencyMs ?? 0}ms
            </span>
          )}
        </div>
        <pre className="min-h-[360px] overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 font-mono text-[12px] leading-relaxed text-[var(--text-secondary)]">
          {formatJson(
            result?.ok
              ? result.data
              : result ?? {
                  status: "ready",
                  workflow: workflow.slug,
                  receipt: "Run the workflow to generate an execution receipt.",
                },
          )}
        </pre>
      </section>
    </div>
  );
}

function ForkPanel({ workflow }: { workflow: WorkflowActionData }) {
  const [name, setName] = useState(`${workflow.name} Fork`);
  const [goal, setGoal] = useState("Customize evaluator policy and publish as my agent workflow.");
  const [draft, setDraft] = useState<unknown>(null);

  return (
    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="glass-card p-6">
        <span className="label-sm">Fork draft</span>
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="label-sm mb-2 block">Variant name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-3 text-[14px] text-[var(--text)] outline-none focus:border-[var(--text)]"
            />
          </label>
          <label className="block">
            <span className="label-sm mb-2 block">What changes?</span>
            <textarea
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              rows={5}
              className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-3 text-[14px] leading-relaxed text-[var(--text)] outline-none focus:border-[var(--text)]"
            />
          </label>
          <button
            onClick={() =>
              setDraft({
                status: "fork_draft_ready",
                parent_workflow: workflow.id,
                draft_slug: slugify(name),
                royalty_to_parent_bps: workflow.royaltyBps,
                inherited_reputation: workflow.trustScore,
                next: ["Edit workflow graph", "Attach creator endpoint", "Deploy variant"],
              })
            }
            className="w-full rounded-full bg-[var(--text)] px-5 py-3 text-[12px] font-semibold uppercase tracking-widest text-[var(--bg)] hover:opacity-80"
          >
            Create fork draft
          </button>
        </div>
      </section>
      <section className="glass-card p-6">
        <span className="label-sm">Provenance</span>
        <pre className="mt-5 min-h-[330px] overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 font-mono text-[12px] leading-relaxed text-[var(--text-secondary)]">
          {formatJson(
            draft ?? {
              parent: workflow.slug,
              parent_runs: workflow.runs,
              parent_trust_score: workflow.trustScore,
              fork_count: workflow.forks,
              note: "Fork keeps lineage and royalty routing attached.",
            },
          )}
        </pre>
      </section>
    </div>
  );
}

function DeployPanel({ workflow }: { workflow: WorkflowActionData }) {
  const [endpoint, setEndpoint] = useState(`https://api.example.com/${workflow.slug}/run`);
  const [environment, setEnvironment] = useState("preview");
  const [plan, setPlan] = useState<unknown>(null);

  return (
    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="glass-card p-6">
        <span className="label-sm">Deploy target</span>
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="label-sm mb-2 block">Creator endpoint</span>
            <input
              value={endpoint}
              onChange={(event) => setEndpoint(event.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-3 font-mono text-[13px] text-[var(--text)] outline-none focus:border-[var(--text)]"
            />
          </label>
          <label className="block">
            <span className="label-sm mb-2 block">Environment</span>
            <select
              value={environment}
              onChange={(event) => setEnvironment(event.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-3 font-mono text-[13px] text-[var(--text)] outline-none focus:border-[var(--text)]"
            >
              <option value="preview">preview</option>
              <option value="testnet">testnet</option>
              <option value="mainnet">mainnet</option>
            </select>
          </label>
          <button
            onClick={() =>
              setPlan({
                status: "deploy_plan_ready",
                workflow: workflow.slug,
                environment,
                gateway_route: `/api/gateway/workflows/${workflow.slug}/run`,
                creator_endpoint: endpoint,
                metering: `$${workflow.pricePerRun.toFixed(3)} per run`,
                reputation: "execution receipts update trust score after successful runs",
              })
            }
            className="w-full rounded-full bg-[var(--text)] px-5 py-3 text-[12px] font-semibold uppercase tracking-widest text-[var(--bg)] hover:opacity-80"
          >
            Generate deploy plan
          </button>
        </div>
      </section>
      <section className="glass-card p-6">
        <span className="label-sm">Gateway plan</span>
        <pre className="mt-5 min-h-[330px] overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 font-mono text-[12px] leading-relaxed text-[var(--text-secondary)]">
          {formatJson(
            plan ?? {
              workflow: workflow.slug,
              route: "Dojo Gateway will meter calls, settle payment, and write receipts.",
              required_before_public_launch: ["creator endpoint", "evaluator policy", "pricing"],
            },
          )}
        </pre>
      </section>
    </div>
  );
}

export function WorkflowActionClient({
  action,
  workflow,
}: {
  action: WorkflowAction;
  workflow: WorkflowActionData;
}) {
  const copy = actionCopy(action);
  const Icon = copy.icon;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <div className="atmosphere" />
      <Nav />
      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-16 pt-28">
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
              <Icon className="h-3.5 w-3.5" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
                {copy.eyebrow}
              </span>
            </div>
            <h1 className="heading-xl text-left">
              {copy.title}
              <br />
              <span className="heading-xl-muted">{workflow.name}</span>
            </h1>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-[var(--text-secondary)]">
              {copy.body}
            </p>
          </div>

          <aside className="glass-card p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <span className="label-sm">{workflow.category}</span>
                <h2 className="mt-2 text-[20px] font-semibold text-[var(--text)]">
                  {workflow.name}
                </h2>
              </div>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 font-mono text-[12px] text-[var(--text-secondary)]">
                ${workflow.pricePerRun.toFixed(3)}
              </span>
            </div>
            <p className="text-[14px] leading-relaxed text-[var(--text-muted)]">
              {workflow.description}
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[var(--border)] pt-5">
              {[
                ["runs", workflow.runs],
                ["forks", workflow.forks],
                ["trust", workflow.trustScore],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="font-mono text-[20px] font-semibold text-[var(--text)]">
                    {value}
                  </div>
                  <div className="label-sm mt-1">{label}</div>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <div className="mb-6 flex flex-wrap gap-2">
          {(["run", "fork", "deploy"] as const).map((item) => (
            <Link
              key={item}
              href={`/workflow/${workflow.id}/${item}`}
              className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-widest transition-colors ${
                action === item
                  ? "border-[var(--text)] bg-[var(--text)] text-[var(--bg)]"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]"
              }`}
            >
              {item}
            </Link>
          ))}
        </div>

        {action === "run" && <RunPanel workflow={workflow} />}
        {action === "fork" && <ForkPanel workflow={workflow} />}
        {action === "deploy" && <DeployPanel workflow={workflow} />}

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            ["Executable", workflow.skill.gatewaySlug],
            ["Version", workflow.version ? `v${workflow.version.version}` : "demo"],
            ["Creator", workflow.creatorName],
          ].map(([label, value]) => (
            <div key={label} className="glass-card flex items-center gap-3 p-5">
              <ShieldCheck className="h-4 w-4 text-[var(--text-secondary)]" />
              <div>
                <div className="label-sm">{label}</div>
                <div className="mt-1 font-mono text-[12px] text-[var(--text)]">{value}</div>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
