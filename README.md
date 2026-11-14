# Krix

Krix is a single-owner **Model Context Protocol (MCP) server**. It gives AI agents GitHub access, Render management, a sandboxed shell with local Git, and temporary file storage, behind API-key and OAuth 2.1 authentication with a small web dashboard.

## Quick start

```bash
npm install
cp .env.example .env     # then fill it in
npm run build
npm start                # http://localhost:3000
```

Development: `npm run dev`. Tests: `npm test`. Types: `npm run typecheck`. Node 20+.

Minimum `.env`: `MCP_API_KEY` (required), plus `KEY_ENCRYPTION_SECRET` (32+ bytes) if you want to save per-key GitHub/Render credentials.

## Connecting a client

| Endpoint | Use |
| --- | --- |
| `/mcp` | Streamable HTTP |
| `/sse` | SSE |
| `/.well-known/mcp/server-card.json` | Server card (also `/server-card`) |

Authenticate with `Authorization: Bearer <key>` or `x-api-key`. OAuth 2.1 with dynamic client registration is built in (Gemini, Claude, etc.).

After changing icons or metadata, remove and re-add the server in Gemini so it re-caches the icon.

## Tools

**Enabled by default (need a GitHub token):** `set_active_context`, `get_me`, `get_file_contents`, `str_replace_editor`, `create_or_update_file`, `delete_file`, `grep`, `view_file_outline`, `list_branches`, `create_branch`, `delete_branch`, `push_files`, `create_pull_request`, `search_code`, `search_repositories`, `git_tree`, `patch_contents`.

**Opt-in per key:** the other GitHub tools (issues, pull requests, reviews, releases, tags, collaborators, Copilot), Render tools, Code Graph tools and `web_search`. Turn them on under *API Keys → Info → Tool Permissions* or in *Settings*. Sandbox tools (`sandbox_exec`, `sandbox_run`, `git_*`, …) and `sandbox_store` have their own groups.

### Credential rules

- GitHub tools require a GitHub token; Render tools require a Render API key.
- A key uses its own override (*API Keys → Info → Credential Overrides*). The primary key falls back to `GITHUB_PERSONAL_ACCESS_TOKEN` / `RENDER_API_KEY`.
- Enabling a tool without the credential is rejected by the server (single toggle, bulk save and per-key save), with a message naming the missing credential. The UI reverts the switch.
- Removing a credential switches off the tools that depended on it, and tool calls without it return the same error.

## Dashboard

- **API Keys:** create/rename/delete keys. The ⋮ menu → **Info** shows the token (reveal/copy), client ID, status, created date, credential overrides and tool permissions.
- **OAuth authorizations:** lists authorized apps with their effective scopes (`mcp:tools`, `mcp:sandbox`, `mcp:admin`). A scope disappears when none of its tools are enabled. Delete revokes the app and its tokens.
- **Tools:** browse tools and inspect their parameter schema; sandbox tools can be run in a disposable sandbox.
- **Store / Upload:** temporary file storage (MongoDB GridFS) and a web upload page.

## Configuration

See `.env.example` for every variable. Main groups: server (`PORT`, `PUBLIC_BASE_URL`, `TRUST_PROXY`), auth (`MCP_API_KEY`, `SESSION_SECRET`, `KEY_ENCRYPTION_SECRET`, Google OAuth, `OWNER_EMAIL`), provider defaults, MongoDB, tool flags (`ENABLE_GITHUB_ISSUES_PRS`, `ENABLE_GITHUB_ADMIN`, `ENABLE_RENDER`, `ENABLE_ALL_TOOLS`, `ENABLE_SANDBOX`, `ENABLE_FILE_SHARING`), file/upload limits and hardening.

Sandboxed code runs as an unprivileged user in the provided `Dockerfile`. On Render's shared runtime the sandbox is disabled unless you explicitly acknowledge the risk (`SANDBOX_RENDER_OWNER_ONLY_ACK=true`, `SANDBOX_REQUIRE_ISOLATION=false`). The restriction levels are best-effort guardrails, not a security boundary.

## Project layout

```
src/index.ts          HTTP server, routes, MCP wiring
src/security.ts       tool categories, credential requirements, sandbox paths
src/toolDefaults.ts   default GitHub tool set, credential error messages
src/userSettings.ts   per-key settings and tool policy
src/mcpOAuth.ts       OAuth 2.1 server
src/website/          dashboard pages and styles
test/                 node:test suites
```

## License

MIT
