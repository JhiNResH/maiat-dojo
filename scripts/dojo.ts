#!/usr/bin/env node
/**
 * Dojo creator CLI
 *
 * Publish one executable workflow endpoint into Dojo:
 *   npm run dojo -- init
 *   DOJO_API_KEY=dojo_sk_... npm run dojo -- test --file dojo.workflow.yaml
 *   DOJO_API_KEY=dojo_sk_... npm run dojo -- publish --file dojo.workflow.yaml
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { basename, resolve } from 'path';
import matter from 'gray-matter';

const yaml = require('js-yaml') as {
  load(input: string): unknown;
};

type Flags = Record<string, string | boolean>;

type WorkflowManifest = {
  name?: string;
  description?: string;
  long_description?: string;
  longDescription?: string;
  category?: string;
  icon?: string;
  tags?: string[] | string;
  price?: number | string;
  price_per_run?: number | string;
  pricePerRun?: number | string;
  endpoint?: string;
  endpoint_url?: string;
  endpointUrl?: string;
  endpoint_auth_header?: string;
  authHeader?: string;
  sla_ms?: number | string;
  slaMs?: number | string;
  input_schema?: unknown;
  inputSchema?: unknown;
  output_schema?: unknown;
  outputSchema?: unknown;
  example_input?: unknown;
  exampleInput?: unknown;
  example_output?: unknown;
  exampleOutput?: unknown;
};

type DryRunResponse = {
  ok?: boolean;
  status?: number;
  latencyMs?: number;
  data?: unknown;
  eval?: {
    score?: number;
    delivered?: boolean;
    validFormat?: boolean;
    withinSla?: boolean;
  };
  error?: string;
};

type PublishResponse = {
  id?: string;
  name?: string;
  gatewaySlug?: string;
  workflow?: {
    id?: string;
    slug?: string;
  } | null;
  error?: string;
};

type LoadedManifest = {
  manifest: WorkflowManifest;
  raw: string;
  fileType: 'markdown' | 'text';
};

const TEMPLATE = `name: Quick Audit Workflow
description: Audit a repo, contract, or agent task and return a structured risk brief.
category: Security
price_per_run: 0.25
endpoint: http://localhost:3000/api/skills-internal/quick-audit
sla_ms: 8000
tags:
  - security
  - audit
  - agent-workflow

input_schema:
  type: object
  required:
    - target
  properties:
    target:
      type: string
    depth:
      type: string
      enum:
        - quick
        - standard

example_input:
  target: https://github.com/example/repo
  depth: quick

output_schema:
  type: object
  required:
    - summary
    - risks
  properties:
    summary:
      type: string
    risks:
      type: array
`;

function parseFlags(argv: string[]): { command: string; flags: Flags } {
  const [command = 'help', ...rest] = argv;
  const flags: Flags = {};

  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];
    if (!token.startsWith('--')) continue;

    const [rawKey, inlineValue] = token.slice(2).split(/=(.*)/s);
    if (inlineValue !== undefined && inlineValue !== '') {
      flags[rawKey] = inlineValue;
      continue;
    }

    const next = rest[i + 1];
    if (next && !next.startsWith('--')) {
      flags[rawKey] = next;
      i += 1;
    } else {
      flags[rawKey] = true;
    }
  }

  return { command, flags };
}

function flagString(flags: Flags, name: string, fallback?: string): string | undefined {
  const value = flags[name];
  if (typeof value === 'string') return value;
  return fallback;
}

function flagBool(flags: Flags, name: string): boolean {
  return flags[name] === true;
}

function resolveConfig(flags: Flags) {
  const file = resolve(flagString(flags, 'file', 'dojo.workflow.yaml') ?? 'dojo.workflow.yaml');
  const baseUrl = (
    flagString(flags, 'url') ??
    process.env.DOJO_BASE_URL ??
    'http://localhost:3000'
  ).replace(/\/$/, '');
  const apiKey = flagString(flags, 'api-key') ?? process.env.DOJO_API_KEY;
  return { file, baseUrl, apiKey };
}

function readManifest(file: string): LoadedManifest {
  if (!existsSync(file)) {
    fail(`Manifest not found: ${file}\nRun: npm run dojo -- init --file ${basename(file)}`);
  }

  const raw = readFileSync(file, 'utf8');
  const isFrontmatter = raw.trimStart().startsWith('---');
  const parsed = isFrontmatter
    ? matter(raw).data
    : yaml.load(raw);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    fail(`Manifest must be a YAML object: ${file}`);
  }

  return {
    manifest: parsed as WorkflowManifest,
    raw,
    fileType: isFrontmatter || file.toLowerCase().endsWith('.md') ? 'markdown' : 'text',
  };
}

function normalizeManifest(manifest: WorkflowManifest) {
  const endpointUrl = manifest.endpointUrl ?? manifest.endpoint_url ?? manifest.endpoint;
  const priceValue = manifest.pricePerRun ?? manifest.price_per_run ?? manifest.price;
  const price = Number(priceValue);
  const slaMsValue = manifest.slaMs ?? manifest.sla_ms;
  const slaMs = slaMsValue === undefined ? undefined : Number(slaMsValue);
  const exampleInput = manifest.exampleInput ?? manifest.example_input ?? {};
  const exampleOutput = manifest.exampleOutput ?? manifest.example_output;
  const inputSchema = manifest.inputSchema ?? manifest.input_schema;
  const outputSchema = manifest.outputSchema ?? manifest.output_schema;
  const tags = Array.isArray(manifest.tags) ? manifest.tags.join(',') : manifest.tags;
  const authHeader =
    manifest.authHeader ??
    manifest.endpoint_auth_header ??
    process.env.DOJO_ENDPOINT_AUTH_HEADER;

  const missing: string[] = [];
  if (!manifest.name) missing.push('name');
  if (!manifest.description) missing.push('description');
  if (!manifest.category) missing.push('category');
  if (!endpointUrl) missing.push('endpoint');
  if (priceValue === undefined) missing.push('price_per_run');
  if (Number.isNaN(price) || price <= 0) missing.push('price_per_run > 0');

  if (missing.length > 0) {
    fail(`Invalid workflow manifest. Missing or invalid: ${missing.join(', ')}`);
  }

  return {
    name: manifest.name,
    description: manifest.description,
    longDescription: manifest.longDescription ?? manifest.long_description,
    category: manifest.category,
    icon: manifest.icon ?? 'W',
    tags: tags ?? '',
    price,
    endpointUrl,
    slaMs,
    inputSchema,
    outputSchema,
    exampleInput,
    exampleOutput,
    authHeader,
  };
}

async function requestJson<T>(
  url: string,
  options: RequestInit,
): Promise<{ ok: boolean; status: number; data: T }> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    fail(`Could not reach Dojo at ${url}: ${message}`);
  }

  const text = await res.text();
  let data: T;
  try {
    data = text ? JSON.parse(text) as T : ({} as T);
  } catch {
    data = { error: text } as T;
  }
  return { ok: res.ok, status: res.status, data };
}

function authHeaders(apiKey?: string): Record<string, string> {
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
}

async function dryRun(
  baseUrl: string,
  apiKey: string | undefined,
  manifest: ReturnType<typeof normalizeManifest>,
) {
  console.log(`Testing endpoint: ${manifest.endpointUrl}`);

  const { ok, status, data } = await requestJson<DryRunResponse>(
    `${baseUrl}/api/skills/dry-run`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(apiKey),
      },
      body: JSON.stringify({
        endpointUrl: manifest.endpointUrl,
        input: manifest.exampleInput,
        ...(manifest.authHeader ? { authHeader: manifest.authHeader } : {}),
      }),
    },
  );

  if (!ok || !data.ok) {
    const reason = data.error ?? JSON.stringify(data.eval ?? data);
    fail(`Dry-run failed (HTTP ${status}): ${reason}`);
  }

  console.log(`Dry-run passed: status=${data.status} latency=${data.latencyMs}ms score=${data.eval?.score}`);
  return data;
}

async function publish(
  baseUrl: string,
  apiKey: string | undefined,
  manifest: ReturnType<typeof normalizeManifest>,
  source: LoadedManifest,
) {
  if (!apiKey) {
    console.warn('No DOJO_API_KEY provided. This only works against a local server with DOJO_SKIP_PRIVY_AUTH=true.');
  }

  const { ok, status, data } = await requestJson<PublishResponse>(
    `${baseUrl}/api/skills/create`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(apiKey),
      },
      body: JSON.stringify({
        name: manifest.name,
        description: manifest.description,
        longDescription: manifest.longDescription,
        category: manifest.category,
        icon: manifest.icon,
        price: manifest.price,
        pricePerCall: manifest.price,
        tags: manifest.tags,
        fileContent: source.raw,
        fileType: source.fileType,
        endpointUrl: manifest.endpointUrl,
        executionKind: 'one_step_endpoint',
        inputSchema: manifest.inputSchema,
        outputSchema: manifest.outputSchema,
        exampleInput: manifest.exampleInput,
        exampleOutput: manifest.exampleOutput,
        estLatencyMs: manifest.slaMs,
        sandboxable: true,
        authRequired: Boolean(manifest.authHeader),
      }),
    },
  );

  if (!ok) {
    fail(`Publish failed (HTTP ${status}): ${data.error ?? JSON.stringify(data)}`);
  }

  console.log('Workflow published.');
  console.log(`  skillId: ${data.id}`);
  if (data.gatewaySlug) console.log(`  gatewaySlug: ${data.gatewaySlug}`);
  if (data.workflow?.id) console.log(`  workflowId: ${data.workflow.id}`);
  if (data.workflow?.slug) console.log(`  workflowUrl: ${baseUrl}/workflow/${data.workflow.slug}/run`);
  return data;
}

function printHelp() {
  console.log(`Dojo creator CLI

Usage:
  npm run dojo -- init [--file dojo.workflow.yaml]
  DOJO_API_KEY=dojo_sk_... npm run dojo -- test [--file dojo.workflow.yaml] [--url http://localhost:3000]
  DOJO_API_KEY=dojo_sk_... npm run dojo -- publish [--file dojo.workflow.yaml] [--url http://localhost:3000]
  DOJO_API_KEY=dojo_sk_... npm run dojo -- publish --file SKILL.md

Environment:
  DOJO_API_KEY                 Creator API key for production publish
  DOJO_BASE_URL                Dojo instance URL
  DOJO_ENDPOINT_AUTH_HEADER    Optional Authorization header sent to your endpoint during dry-run

Notes:
  - Production endpoints must be public HTTPS.
  - publish runs dry-run first unless --skip-test is passed.
  - dojo.workflow.yaml is canonical; SKILL.md frontmatter is supported for compatibility.
`);
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

async function main() {
  const { command, flags } = parseFlags(process.argv.slice(2));
  const { file, baseUrl, apiKey } = resolveConfig(flags);

  if (command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command === 'init') {
    if (existsSync(file) && !flagBool(flags, 'force')) {
      fail(`Refusing to overwrite existing manifest: ${file}\nUse --force to replace it.`);
    }
    writeFileSync(file, TEMPLATE, 'utf8');
    console.log(`Created ${file}`);
    return;
  }

  if (command === 'test') {
    const source = readManifest(file);
    const manifest = normalizeManifest(source.manifest);
    await dryRun(baseUrl, apiKey, manifest);
    return;
  }

  if (command === 'publish') {
    const source = readManifest(file);
    const manifest = normalizeManifest(source.manifest);
    if (!flagBool(flags, 'skip-test')) {
      await dryRun(baseUrl, apiKey, manifest);
    }
    await publish(baseUrl, apiKey, manifest, source);
    return;
  }

  printHelp();
  fail(`Unknown command: ${command}`);
}

main().catch((err) => {
  fail(err instanceof Error ? err.message : String(err));
});
