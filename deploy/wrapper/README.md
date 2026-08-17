# Streamable-HTTP wrapper for mcp-omnisearch

This subproject packages the upstream
[spences10/mcp-omnisearch](https://github.com/spences10/mcp-omnisearch)
stdio MCP server into a streamable-HTTP endpoint that MCP-aware clients
(Claude Code, Cursor, Codex, Windsurf, etc.) can reach over HTTPS.

It is used by the OpenShip project `mcp-omnisearch` at
`https://omnisearch.v244.net/mcp`.

## How it works

`wrapper.mjs` spawns `mcp-proxy` (punkpeye) as a subprocess listening on
`127.0.0.1:8080`. The wrapper binds the public port (`PORT`, default
`3000`) and forwards every non-`/health` request to that internal
endpoint. `mcp-proxy` then spawns `mcp-omnisearch` as its upstream and
translates stdio MCP traffic into streamable-HTTP responses.

The HTTP wrapper therefore simultaneously speaks the 2025-era MCP
revisions and the 2026-07-28 revision, and supports both `/mcp` and
`/sse` endpoints.

## Endpoints

| Path | Behavior |
|------|----------|
| `GET /health` | returns `{ "status": "ok", "service": "mcp-omnisearch" }` |
| `POST /mcp` | MCP streamable-HTTP entrypoint |
| `GET /mcp` | optional stream for clients that want SSE-style traffic |
| `GET /sse` | legacy SSE transport |

## Required environment

Any subset of the upstream provider keys is enough — providers whose
keys are absent are simply skipped:

- `TAVILY_API_KEY`
- `KAGI_API_KEY`
- `BRAVE_API_KEY`
- `EXA_API_KEY`
- `GITHUB_API_KEY`
- `LINKUP_API_KEY`
- `FIRECRAWL_API_KEY`
- `FIRECRAWL_BASE_URL` (optional, for self-hosted Firecrawl)

Plus the optional `OMNISEARCH_LARGE_RESULT_MODE` (default `file`).

## Build

```sh
docker build -t mcp-omnisearch-http .
docker run --rm -p 3000:3000 \
  -e BRAVE_API_KEY=... \
  -e TAVILY_API_KEY=... \
  mcp-omnisearch-http
```

## Connecting clients

```json
{
  "mcpServers": {
    "omnisearch": {
      "type": "streamableHttp",
      "url": "https://omnisearch.v244.net/mcp",
      "headers": {}
    }
  }
}
```
