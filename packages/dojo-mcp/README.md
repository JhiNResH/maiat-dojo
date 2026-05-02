# @maiat/dojo-mcp

Minimal stdio MCP server for Dojo clearing demos.

## Tools

- `dojo_search_workflows` — list public workflows from `/api/v1/skills`
- `dojo_run_workflow` — run a workflow through `/api/v1/run`
- `dojo_get_receipt` — inspect a receipt through `/api/v1/receipts/:id`

## Local usage

```bash
DOJO_BASE_URL=http://localhost:3000 DOJO_API_KEY=dojo_sk_... npm --workspace @maiat/dojo-mcp run build
DOJO_BASE_URL=http://localhost:3000 DOJO_API_KEY=dojo_sk_... node packages/dojo-mcp/dist/server.js
```

## MCP config

```json
{
  "mcpServers": {
    "dojo": {
      "command": "node",
      "args": ["/Users/jhinresh/maiat-dojo/packages/dojo-mcp/dist/server.js"],
      "env": {
        "DOJO_BASE_URL": "http://localhost:3000",
        "DOJO_API_KEY": "dojo_sk_..."
      }
    }
  }
}
```
