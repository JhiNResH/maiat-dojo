"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, GitFork, Play, Rocket, ShieldCheck } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

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
  eval?: {
    score: number;
    delivered: boolean;
    validFormat: boolean;
    withinSla: boolean;
  };
  error?: string;
  code?: string;
  demo?: boolean;
};

type ForkResult = {
  workflow?: {
    id: string;
    slug: string;
    name: string;
    status: string;
  };
  version?: {
    version: number;
  };
  fork?: {
    id: string;
    royaltyBps: number;
  } | null;
  error?: string;
};

type DeployResult = {
  workflow?: {
    id: string;
    slug: string;
    status: string;
  };
  skill?: {
    id: string;
    gatewaySlug: string | null;
    endpointUrl: string | null;
  };
  runUrl?: string;
  gateway?: string;
  error?: string;
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
        body: "Send one input and receive a structured sandbox result. Production API runs write paid execution receipts through the Dojo gateway.",
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
        body: "Attach an endpoint to a workflow you own. If this is someone else's workflow, fork it first, then deploy your fork as an executable variant.",
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
    "dojo-input font-mono";

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
  const { authenticated, login, getAccessToken } = usePrivy();
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
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const isDemo = workflow.id.startsWith("demo-") || workflow.skill.id.startsWith("demo-");
      if (!isDemo) {
        const token = authenticated ? await getAccessToken() : null;
        if (!token) {
          setPending(false);
          login();
          return;
        }
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(`/api/skills/${workflow.skill.id}/sandbox`, {
        method: "POST",
        headers,
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
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <section className="dojo-card p-5">
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
            className="dojo-action dojo-action-primary w-full disabled:opacity-40"
          >
            {pending ? "Running..." : "Run sandbox"}
          </button>
        </div>
      </section>

      <section id="receipt" className="dojo-card p-5">
        <div className="mb-5 flex items-center justify-between">
          <span className="label-sm">Sandbox receipt preview</span>
          {result && (
            <span className="font-mono text-[11px] text-[var(--text-muted)]">
              {result.latencyMs ?? 0}ms
            </span>
          )}
        </div>
        <pre className="min-h-[360px] overflow-auto rounded-[8px] border border-[var(--border)] bg-[var(--bg-secondary)] p-4 font-mono text-[12px] leading-relaxed text-[var(--text-secondary)]">
          {formatJson(
            result?.ok
              ? result.data
              : result ?? {
                  status: "ready",
                  workflow: workflow.slug,
                  receipt: "Run the workflow to preview the receipt shape.",
                },
          )}
        </pre>
      </section>
    </div>
  );
}

function ForkPanel({ workflow }: { workflow: WorkflowActionData }) {
  const { authenticated, login, getAccessToken } = usePrivy();
  const [name, setName] = useState(`${workflow.name} Fork`);
  const [goal, setGoal] = useState("Customize evaluator policy and publish as my agent workflow.");
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState<ForkResult | null>(null);

  async function createFork() {
    if (pending || !name.trim()) return;
    const token = authenticated ? await getAccessToken() : null;
    if (!token) {
      login();
      return;
    }

    setPending(true);
    setDraft(null);
    try {
      const response = await fetch(`/api/workflows/${workflow.id}/fork`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          slug: slugify(name),
          description: goal.trim() || undefined,
          changeNote: goal.trim() || undefined,
        }),
      });
      const data = (await response.json()) as ForkResult;
      setDraft(response.ok ? data : { error: data.error ?? "Fork failed" });
    } catch (error) {
      setDraft({ error: error instanceof Error ? error.message : "Fork failed" });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <section className="dojo-card p-5">
        <span className="label-sm">Fork draft</span>
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="label-sm mb-2 block">Variant name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="dojo-input"
            />
          </label>
          <label className="block">
            <span className="label-sm mb-2 block">What changes?</span>
            <textarea
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              rows={5}
              className="dojo-input resize-none leading-relaxed"
            />
          </label>
          <button
            onClick={createFork}
            disabled={pending || !name.trim()}
            className="dojo-action dojo-action-primary w-full disabled:opacity-40"
          >
            {pending ? "Creating..." : "Create fork draft"}
          </button>
        </div>
      </section>
      <section className="dojo-card p-5">
        <span className="label-sm">Provenance</span>
        <pre className="mt-5 min-h-[330px] overflow-auto rounded-[8px] border border-[var(--border)] bg-[var(--bg-secondary)] p-4 font-mono text-[12px] leading-relaxed text-[var(--text-secondary)]">
          {formatJson(
            draft ?? {
              parent: workflow.slug,
              parent_runs: workflow.runs,
              parent_trust_score: workflow.trustScore,
              fork_count: workflow.forks,
              note: "Fork creates a draft workflow in your account, then Deploy attaches your endpoint.",
            },
          )}
        </pre>
        {draft?.workflow && (
          <Link
            href={`/workflow/${draft.workflow.id}/deploy`}
            className="dojo-action dojo-action-primary mt-4"
          >
            Deploy fork
          </Link>
        )}
      </section>
    </div>
  );
}

function DeployPanel({ workflow }: { workflow: WorkflowActionData }) {
  const { authenticated, login, getAccessToken } = usePrivy();
  const [endpoint, setEndpoint] = useState(`https://api.example.com/${workflow.slug}/run`);
  const [pricePerRun, setPricePerRun] = useState(workflow.pricePerRun.toFixed(3));
  const [inputSchema, setInputSchema] = useState(workflow.skill.inputSchema ?? "{}");
  const [exampleInput, setExampleInput] = useState(workflow.skill.exampleInput ?? "{}");
  const [dryRun, setDryRun] = useState<RunResult | null>(null);
  const [pending, setPending] = useState<"dry-run" | "deploy" | null>(null);
  const [plan, setPlan] = useState<DeployResult | null>(null);

  async function getAuthToken() {
    const token = authenticated ? await getAccessToken() : null;
    if (!token) {
      login();
      return null;
    }
    return token;
  }

  function parseJsonInput(label: string, value: string) {
    try {
      return JSON.parse(value);
    } catch {
      throw new Error(`${label} must be valid JSON`);
    }
  }

  async function runDeployDryRun() {
    if (pending) return;
    const token = await getAuthToken();
    if (!token) return;

    setPending("dry-run");
    setDryRun(null);
    setPlan(null);
    try {
      const payload = parseJsonInput("Example input", exampleInput);
      const response = await fetch("/api/skills/dry-run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpointUrl: endpoint,
          input: payload,
        }),
      });
      const data = (await response.json()) as RunResult;
      setDryRun(response.ok ? data : { ok: false, error: data.error ?? "Dry run failed" });
    } catch (error) {
      setDryRun({
        ok: false,
        error: error instanceof Error ? error.message : "Dry run failed",
      });
    } finally {
      setPending(null);
    }
  }

  async function deployWorkflow() {
    if (pending || dryRun?.ok !== true) return;
    const token = await getAuthToken();
    if (!token) return;

    setPending("deploy");
    setPlan(null);
    try {
      const parsedPrice = Number(pricePerRun);
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        throw new Error("Price per run must be greater than 0");
      }

      const response = await fetch(`/api/workflows/${workflow.id}/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpointUrl: endpoint,
          pricePerRun: parsedPrice,
          inputSchema: parseJsonInput("Input schema", inputSchema),
          exampleInput: parseJsonInput("Example input", exampleInput),
          outputShape: "json",
          slaMs: workflow.version?.slaMs ?? 5000,
        }),
      });
      const data = (await response.json()) as DeployResult;
      const fallback =
        response.status === 403
          ? "Only the workflow creator can deploy this workflow. Fork it first, then deploy your fork."
          : "Deploy failed";
      setPlan(response.ok ? data : { error: data.error ?? fallback });
    } catch (error) {
      setPlan({ error: error instanceof Error ? error.message : "Deploy failed" });
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <section className="dojo-card p-5">
        <span className="label-sm">Deploy target</span>
        <p className="mt-3 rounded-[8px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-[12px] leading-relaxed text-[var(--text-muted)]">
          Deploy updates a workflow you own. To customize another creator&apos;s workflow, create a fork draft first,
          then attach your endpoint to that fork.
        </p>
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="label-sm mb-2 block">Creator endpoint</span>
            <input
              value={endpoint}
              onChange={(event) => setEndpoint(event.target.value)}
              className="dojo-input font-mono"
            />
          </label>
          <label className="block">
            <span className="label-sm mb-2 block">Price per run</span>
            <input
              type="number"
              min="0.001"
              step="0.001"
              value={pricePerRun}
              onChange={(event) => setPricePerRun(event.target.value)}
              className="dojo-input font-mono"
            />
          </label>
          <label className="block">
            <span className="label-sm mb-2 block">Input schema</span>
            <textarea
              value={inputSchema}
              onChange={(event) => {
                setInputSchema(event.target.value);
                setDryRun(null);
              }}
              rows={6}
              className="dojo-input resize-y font-mono text-[12px]"
            />
          </label>
          <label className="block">
            <span className="label-sm mb-2 block">Example input</span>
            <textarea
              value={exampleInput}
              onChange={(event) => {
                setExampleInput(event.target.value);
                setDryRun(null);
              }}
              rows={4}
              className="dojo-input resize-y font-mono text-[12px]"
            />
          </label>
          <button
            onClick={runDeployDryRun}
            disabled={pending !== null}
            className="dojo-action w-full disabled:opacity-40"
          >
            {pending === "dry-run" ? "Testing..." : "Run dry-run"}
          </button>
          <button
            onClick={deployWorkflow}
            disabled={pending !== null || dryRun?.ok !== true}
            className="dojo-action dojo-action-primary w-full disabled:opacity-40"
          >
            {pending === "deploy" ? "Deploying..." : "Deploy workflow"}
          </button>
        </div>
      </section>
      <section className="dojo-card p-5">
        <span className="label-sm">Gateway state</span>
        <pre className="mt-5 min-h-[330px] overflow-auto rounded-[8px] border border-[var(--border)] bg-[var(--bg-secondary)] p-4 font-mono text-[12px] leading-relaxed text-[var(--text-secondary)]">
          {formatJson(
            plan ?? {
              workflow: workflow.slug,
              dry_run: dryRun ?? "required_before_deploy",
              deploy_effect: "Creates or updates active skill, links it to workflow, publishes workflow.",
            },
          )}
        </pre>
        {plan?.runUrl && (
          <Link
            href={plan.runUrl}
            className="dojo-action dojo-action-primary mt-4"
          >
            Open run page
          </Link>
        )}
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
      <main className="dojo-page-shell dojo-page-shell-wide">
        <Link
          href="/"
          className="dojo-back-link"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Marketplace
        </Link>

        <section className="mb-5 flex flex-col gap-5 border-b border-[var(--border-light)] pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-[6px] bg-[var(--text)] px-3 py-1.5 text-[var(--bg)]">
              <Icon className="h-3.5 w-3.5" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
                {copy.eyebrow}
              </span>
            </div>
            <div className="mb-2 flex flex-wrap items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              <Link href="/" className="hover:text-[var(--text)]">Workflows</Link>
              <span>/</span>
              <span>{workflow.category}</span>
              <span>/</span>
              <span className="text-[var(--text)]">{workflow.slug}</span>
            </div>
            <h1 className="text-[28px] font-bold leading-tight tracking-[-0.025em] text-[var(--text)] md:text-[34px]">
              {workflow.name}
              <span className="ml-3 align-middle font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--signal-deep)]">
                active
              </span>
            </h1>
            <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-[var(--text-secondary)]">
              {workflow.description || copy.body}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-[12px]">
              {[
                ["Runs", workflow.runs],
                ["Trust", workflow.trustScore],
                ["p95", workflow.version?.slaMs ? `${workflow.version.slaMs}ms` : "1.2s"],
                ["Forks", workflow.forks],
                ["Creator", workflow.creatorName],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1">
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    {label}
                  </span>
                  <span className="font-mono text-[12px] font-semibold text-[var(--text)]">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <aside className="dojo-card min-w-[330px] p-3">
            <div className="grid grid-cols-3 overflow-hidden rounded-[8px] border border-[var(--border)]">
              {(["run", "fork", "deploy"] as const).map((item) => (
                <Link
                  key={item}
                  href={`/workflow/${workflow.id}/${item}`}
                  className={`inline-flex items-center justify-center gap-2 border-r border-[var(--border)] px-4 py-3 text-[12px] font-semibold capitalize last:border-r-0 ${
                    action === item
                      ? "bg-[var(--text)] text-[var(--bg)]"
                      : "bg-[var(--card-bg)] text-[var(--text-secondary)] hover:text-[var(--text)]"
                  }`}
                >
                  {item === "run" && <Play className="h-3.5 w-3.5 fill-current" />}
                  {item === "fork" && <GitFork className="h-3.5 w-3.5" />}
                  {item === "deploy" && <Rocket className="h-3.5 w-3.5" />}
                  {item === "run" ? `Run · $${workflow.pricePerRun.toFixed(3)}` : item}
                </Link>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between font-mono text-[10.5px] text-[var(--text-muted)]">
              <span>balance</span>
              <span className="font-semibold text-[var(--text)]">9.842 USDC</span>
              <span>est. {Math.max(1, Math.floor(9.842 / Math.max(workflow.pricePerRun, 0.001)))} runs</span>
            </div>
          </aside>
        </section>

        {action === "run" && <RunPanel workflow={workflow} />}
        {action === "fork" && <ForkPanel workflow={workflow} />}
        {action === "deploy" && <DeployPanel workflow={workflow} />}

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            ["Executable", workflow.skill.gatewaySlug],
            ["Version", workflow.version ? `v${workflow.version.version}` : "demo"],
            ["Creator", workflow.creatorName],
          ].map(([label, value]) => (
            <div key={label} className="dojo-card flex items-center gap-3 p-5">
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
