# @maiat/dojo

Creator CLI for publishing, forking, and deploying Dojo agent workflows.

## Usage

```bash
npx @maiat/dojo init
npm run dojo -- dev-key
DOJO_API_KEY=dojo_sk_... npx @maiat/dojo test --file dojo.workflow.yaml
DOJO_API_KEY=dojo_sk_... npx @maiat/dojo publish --file dojo.workflow.yaml
DOJO_API_KEY=dojo_sk_... npx @maiat/dojo fork --workflow web-scraper --name "My Scraper Fork"
DOJO_API_KEY=dojo_sk_... npx @maiat/dojo deploy --workflow my-scraper-fork --file dojo.workflow.yaml
DOJO_API_KEY=dojo_sk_... npx @maiat/dojo run --skill web-scraper --input '{"url":"https://example.com"}'
```

Use `DOJO_BASE_URL` or `--url` to point at a non-production Dojo instance:

```bash
DOJO_BASE_URL=http://localhost:3000 npx @maiat/dojo publish --file dojo.workflow.yaml
```

For local demos from the repo, generate or reuse a DB-backed key:

```bash
npm run dojo -- dev-key
export DOJO_API_KEY=dojo_sk_...
DOJO_API_KEY=dojo_sk_... npm run dojo -- run \
  --skill web-scraper \
  --input '{"url":"https://example.com"}'
```

`dev-key` is intentionally local-only. It requires the app database config,
selects a user with an agent, creates an API key if needed, and tops up demo
credits to `10` by default. Use `--fund 25` to choose another local demo
balance.

`run` is the Codex/terminal-friendly clearing demo command. It calls
`/api/v1/run`, prints the execution result, and returns the shareable
`/r/<receiptId>` proof URL when the workflow writes a receipt.

## Manifest

`dojo.workflow.yaml` is the canonical workflow manifest:

```yaml
name: Web Scraper
description: Converts any public URL into clean structured markdown.
category: Infra
price_per_run: 0.003
endpoint: https://your-agent.example.com/api/scrape
sla_ms: 2000

input_schema:
  type: object
  required:
    - url
  properties:
    url:
      type: string

example_input:
  url: https://example.com
```

`SKILL.md` files with YAML frontmatter are also supported:

```bash
DOJO_API_KEY=dojo_sk_... npx @maiat/dojo publish --file SKILL.md
```
