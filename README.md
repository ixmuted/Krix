<div align="center">

<img src="assets/logo.png" alt="Krix logo" width="140" height="140" style="border-radius: 24px;" />

# Krix

**A multi-user Model Context Protocol (MCP) gateway: GitHub, Render, a sandboxed runtime and a code graph behind one authenticated endpoint.**

[![Node](https://img.shields.io/badge/node-%3E%3D20-339933.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.x-3178C6.svg)](https://www.typescriptlang.org/)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.32-black.svg)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## What is Krix?

Krix is a self-hosted server that lets AI assistants (Claude, Gemini, ChatGPT, Cursor or any MCP client) work on real software projects. One connection gives the assistant tools to read and edit GitHub repositories, run code in an isolated sandbox, manage Render services, and analyze code structure through a graph database.

It is built for more than one person: each user signs in with Google, gets their own API keys, their own encrypted provider credentials, their own sandbox, and their own per-tool on/off switches.

## Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Quick start](#quick-start)
4. [Connecting an MCP client](#connecting-an-mcp-client)
5. [Tools](#tools)
6. [Tool availability and toggles](#tool-availability-and-toggles)
7. [Sandbox](#sandbox)
8. [Files, uploads and Sandbox Store](#files-uploads-and-sandbox-store)
9. [Multi-user model and quotas](#multi-user-model-and-quotas)
10. [Security](#security)
11. [Web dashboard and HTTP routes](#web-dashboard-and-http-routes)
12. [Email notifications](#email-notifications)
13. [Configuration](#configuration)
14. [Project layout](#project-layout)
15. [Development and testing](#development-and-testing)
16. [Deployment](#deployment)
17. [Agent skill](#agent-skill)
18. [License](#license)

---

## Features

| Area | What you get |
|---|---|
| **GitHub** | 51 tools: tree/outline/grep/search, surgical edits, atomic multi-file commits, branches, PRs, issues, reviews, releases, teams, admin |
| **Render** | 21 tools: workspaces, services, deploys, logs, metrics, env vars, Postgres queries |
| **Sandbox** | 15 tools: 11 language runtimes, persistent shell, background processes, local git, file ops, file sharing |
| **Code graph** | 29 tools (plus `web_search`): callers/callees, hierarchy, dead code, complexity, architecture reports |
| **Auth** | Bearer / `x-api-key` keys, Google sign-in for the dashboard, OAuth 2.1 with dynamic client registration and PKCE |
| **Isolation** | Per-user sandbox directories and Unix users, resource quotas, scrubbed child environments |
| **Secrets** | Per-key GitHub and Render credentials encrypted at rest with AES-256-GCM; secrets redacted from tool output |
| **Dashboard** | Keys, tool toggles, credentials, file store, usage stats, help pages |
| **Email** | Account and security alerts through the Gmail API (HTTPS) or SMTP |

## Architecture

```
   MCP client (Claude, Gemini, ChatGPT, Cursor, ...)
                      |
        HTTPS: Bearer key  or  OAuth 2.1 token
                      v
 +------------------------------------------------------------+
 |                        Krix server                         |
 |                    (Express 5, Node 20+)                   |
 |                                                            |
 |  Auth + sessions     Tool policy       Web dashboard       |
 |  keys, OAuth, Google resolveToolState  /settings /store    |
 |                                                            |
 |  +--------+ +--------+ +----------+ +-----------+          |
 |  | GitHub | | Render | | Sandbox  | | Code graph|          |
 |  |  tools | |  tools | | + files  | | (cgc CLI) |          |
 |  +---+----+ +---+----+ +----+-----+ +-----+-----+          |
 +------|----------|-----------|-------------|----------------+
        v          v           v             v
    GitHub API  Render API  Unprivileged   cgc graph
    (Octokit)   (REST)      child procs    database
                            per user
                      MongoDB (state, stats, file store)
```

**Request flow:** a client calls `/mcp` with a key or token. Krix authenticates it, builds an MCP session, and on every `tools/list` and `tools/call` decides which tools that key may use. Tool calls run against GitHub or Render with that key's credentials, or in that user's sandbox.

## Quick start

**Prerequisites:** Node.js 20+, a MongoDB database (required in production), a Google OAuth client for dashboard sign-in. Docker is recommended if you want the sandbox.

```bash
git clone https://github.com/ixmuted/Krix.git
cd Krix
npm install

cp .env.example .env
# Fill in .env. In production the server refuses to start with weak or placeholder secrets.
# Generate each secret with:  openssl rand -hex 32

npm run dev          # tsx watch, reloads on change
# or
npm run build && npm start
```

The server listens on `PORT` (default `3000`). Check `GET /healthz`, then open the site and sign in with the `OWNER_EMAIL` Google account to create your first API key.

## Connecting an MCP client

Krix serves MCP over **Streamable HTTP** at `POST/GET /mcp`.

```
URL:     https://<your-host>/mcp
Header:  Authorization: Bearer <your API key>      (or)   x-api-key: <your API key>
```

Two ways to authenticate:

1. **API key.** Create one in the dashboard (API Keys page). Each key can carry its own GitHub/Render credentials and tool settings. `MCP_API_KEY` from `.env` is the primary (owner) key.
2. **OAuth 2.1.** Clients that support discovery register themselves and send the user through consent. Tokens are scoped to `mcp:tools`, `mcp:sandbox`, `mcp:admin`.

| Endpoint | Purpose |
|---|---|
| `/mcp` | MCP Streamable HTTP transport |
| `/.well-known/oauth-protected-resource` | OAuth resource metadata |
| `/.well-known/oauth-authorization-server` | OAuth server metadata |
| `/.well-known/jwks.json` | Token signing keys |
| `/oauth/register`, `/oauth/authorize`, `/oauth/token`, `/oauth/revoke` | OAuth 2.1 flow (RFC 7591, PKCE S256) |
| `/server.json`, `/.well-known/mcp.json`, `/.well-known/mcp/server-card.json` | Discovery documents |
| `/gemini-extension.json` | Gemini CLI extension manifest |

Passing the key in the query string (`?api_key=`) is off unless `ALLOW_QUERY_API_KEY=true`.

## Tools

Krix exposes 117 tools in four groups. Full parameter docs live in [`skills/references/`](skills/references).

| Group | Count | Highlights | Reference |
|---|---|---|---|
| GitHub (core) | 17 | `set_active_context`, `git_tree`, `view_file_outline`, `grep`, `search_code`, `get_file_contents`, `str_replace_editor`, `patch_contents`, `push_files`, `create_pull_request` | [github.md](skills/references/github.md) |
| GitHub (extended) | 34 | issues, sub-issues, PR reads/updates/merges, line-level reviews, commits, tags, releases, teams, repo admin, secret scanning, Copilot assignment | [github.md](skills/references/github.md) |
| Render | 21 | `list_services`, `create_web_service`, `trigger_deploy`, `list_logs`, `get_metrics`, `update_env_vars`, `query_render_postgres` | [render.md](skills/references/render.md) |
| Sandbox | 15 | `sandbox_run`, `sandbox_exec`, `sandbox_install`, `sandbox_file`, `sandbox_store`, `git_clone`, `git_diff`, `git_commit_push` | [sandbox.md](skills/references/sandbox.md) |
| Code graph | 29 + 1 | `add_code_to_graph`, `find_code`, `analyze_code_relationships`, `find_dead_code`, `find_most_complex_functions`, `generate_report`, `web_search` | [code-graph.md](skills/references/code-graph.md) |

Design choices worth knowing:

- **Surgical edits first.** `str_replace_editor` and `patch_contents` change a few lines instead of resending whole files; `push_files` commits many files atomically.
- **Context defaults.** `set_active_context` stores `owner`, `repo`, `branch`, sandbox `cwd` and `env`, so later calls can omit them.
- **Bounded output.** Responses are size-limited and passed through a redactor so tokens and keys do not leak into the model's context.

## Tool availability and toggles

Not every tool is on for every key. Whether a tool is on is decided in one place (`resolveToolState` in `src/toolDefaults.ts`) and used by `tools/list`, `tools/call`, OAuth scopes and the Settings pages, so they always agree.

Order of precedence:

1. **Hard blocks**: the server forbids the category (e.g. sandbox), or the tool needs a credential that is missing (GitHub token / Render key).
2. **This key's own override.**
3. **Workspace-wide override.**
4. **Default.**

Defaults: all sandbox and file tools plus 17 core GitHub tools are on. Extended GitHub tools, Render, and the code graph are **off until enabled** in Settings.

Because clients see only what is enabled, an assistant must not assume a tool exists. The bundled [skill](#agent-skill) tells the model to check its tool list and to report a disabled tool instead of retrying.

## Sandbox

The sandbox runs user-driven code in child processes, never inside the server's own process.

- **Runtimes:** Node, TypeScript (tsx, bun), Python, Go, Java, C++, Rust, Ruby, PHP, Bash and more (see `Dockerfile`).
- **Persistent shell** per user, background process tracking (`sandbox_ps`, `sandbox_output`), package installs with validated registry specs.
- **Local git** for clone, checkout, pull, status, diff, commit and push. Idle repositories are released after `REPO_IDLE_MINUTES` (default 30).
- **Isolation:** each child runs as an unprivileged Unix user (a per-user uid from `SANDBOX_UID_BASE`..`+SANDBOX_UID_RANGE`, or a single shared `SANDBOX_UID`). Its cwd, `HOME` and `TMPDIR` sit in a private directory, and its environment is rebuilt from a small allowlist, so it cannot read `MCP_API_KEY`, GitHub/Render tokens or `MONGODB_URI`.
- **Restriction levels:** `COMMAND_RESTRICTION_LEVEL` and `NETWORK_RESTRICTION_LEVEL` (`low`, `medium`, `high`) add best-effort guards against dangerous commands and private/internal addresses. They are guardrails, not a firewall: enforce real egress control at the container or network layer.
- **Where it runs:** the sandbox only starts when the server can isolate it. On Render it needs the Docker image (runs as root, drops to the sandbox user) and `ENABLE_SANDBOX=true`. Otherwise the tools are reported as disabled by the server.

## Files, uploads and Sandbox Store

- **Sandbox Store** (`sandbox_store`): `share` uploads a sandbox file to MongoDB GridFS and returns a private, expiring download URL; `download` fetches an HTTP(S) URL into the sandbox (private/internal addresses are refused unless `ALLOW_PRIVATE_DOWNLOADS=true`); `list` and `delete` manage entries. Files expire after `FILE_TTL_HOURS` unless made permanent in the dashboard.
- **Web upload** (`/upload`): a user opens a short-lived upload session (`UPLOAD_SESSION_MINUTES`) and drops files; they appear in the sandbox under `upload/`. Limits: `UPLOAD_MAX_FILES`, `UPLOAD_MAX_FILE_MB`, `UPLOAD_MAX_TOTAL_MB`. Files are kept for `UPLOAD_FILE_RETENTION_MINUTES` after the session ends.
- **File browser** (`/store`): rename, change privacy, make permanent, download, delete.

## Multi-user model and quotas

- **Owner** (`OWNER_EMAIL`): full limits, can manage workspace settings.
- **Other users** (any Google account, unless `MULTI_USER=false` or restricted by `ALLOWED_EMAILS`): isolated workspace with 50 MB storage and roughly one tenth of the owner's compute, memory and process limits.
- **Per-key settings:** each API key can override tool toggles and provider credentials; keys inherit workspace settings otherwise.
- **Account deletion** starts a 30-day grace period; signing in again cancels it, after which a background job purges keys, files and the workspace.

## Security

- **Startup validation (production):** the server refuses to boot unless `PUBLIC_BASE_URL` is a credential-free HTTPS origin, `MCP_API_KEY`, `SESSION_SECRET`, `AUDIT_HASH_SECRET` and `KEY_ENCRYPTION_SECRET` are each at least 32 bytes, non-placeholder and different from one another, and MongoDB is configured.
- **Encryption at rest:** provider credentials use AES-256-GCM keyed from `KEY_ENCRYPTION_SECRET`.
- **Secret redaction:** known secrets (env values, per-request tokens, passwords inside connection strings) are scrubbed from every tool result.
- **Audit log:** security events are stored with IPs pseudonymized by HMAC-SHA256 using `AUDIT_HASH_SECRET`.
- **Transport hardening:** `checkOrigin` against `ALLOWED_ORIGINS`, per-minute rate limiting (`RATE_LIMIT_PER_MIN`), session cap (`MAX_SESSIONS`), body size cap (`MAX_BODY_MB`), `no-store` on MCP responses, authentication before body parsing.
- **OAuth:** PKCE S256, RS256-signed tokens (set `RSA_PRIVATE_KEY`/`RSA_PUBLIC_KEY` to keep them stable across restarts), per-client scopes, revocable authorizations.

## Web dashboard and HTTP routes

| Page | Path |
|---|---|
| Home / sign-in | `/` , `/auth/*` , `/logout` |
| API keys | `/api/keys` (and the keys UI) |
| Settings, tool toggles, credentials | `/settings` |
| Tool catalog and live execution | `/tools` |
| File store | `/store` |
| Web upload | `/upload` |
| Usage stats | `/stats` |
| Help, terms, privacy | `/help` , `/terms` , `/privacy` |
| Health check | `/healthz` |

JSON APIs back these pages: `/api/keys`, `/api/settings`, `/api/account/*`, `/settings/api/*`, `/store/api/*`, `/stats/api`.

## Email notifications

Krix emails the user on account creation, account deletion requests, sign-in from a new IP, and OAuth client authorization. Two transports:

- **Gmail API over HTTPS** (`GMAIL_*` variables). Recommended on hosts that block outbound SMTP ports, such as free cloud tiers.
- **SMTP via Nodemailer** (`SMTP_*` variables, or `SMTP_URL`).

If neither is configured, Krix logs one notice and skips sending; nothing else is affected.

## Configuration

Copy [`.env.example`](.env.example) to `.env`. Every variable is documented in that file. Summary:

| Group | Variables |
|---|---|
| Server | `PORT`, `NODE_ENV`, `PUBLIC_BASE_URL`, `TRUST_PROXY`, `ALLOWED_ORIGINS`, `KRIX_DATA_DIR` |
| Secrets (required in prod) | `MCP_API_KEY`, `SESSION_SECRET`, `AUDIT_HASH_SECRET`, `KEY_ENCRYPTION_SECRET` |
| Sign-in | `OWNER_EMAIL`, `ALLOWED_EMAILS`, `MULTI_USER`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| OAuth | `RSA_PRIVATE_KEY`, `RSA_PUBLIC_KEY`, `KRIX_OAUTH_LOGO_URI` |
| Database | `MONGODB_URI`, `MONGODB_DB` |
| Providers | `GITHUB_PERSONAL_ACCESS_TOKEN`, `RENDER_API_KEY` |
| Email | `GMAIL_*`, `SMTP_*`, `EMAIL_FROM` |
| Sandbox | `ENABLE_SANDBOX`, `SANDBOX_REQUIRE_ISOLATION`, `SANDBOX_UID`, `SANDBOX_GID`, `SANDBOX_PER_USER_UID`, `SANDBOX_UID_BASE`, `SANDBOX_UID_RANGE`, `SANDBOX_MAX_TOTAL_MB`, `REPO_IDLE_MINUTES` |
| Files and uploads | `ENABLE_FILE_SHARING`, `FILE_*`, `DOWNLOAD_MAX_MB`, `ALLOW_PRIVATE_DOWNLOADS`, `ENABLE_WEB_UPLOAD`, `UPLOAD_*` |
| Hardening | `COMMAND_RESTRICTION_LEVEL`, `NETWORK_RESTRICTION_LEVEL`, `ALLOW_QUERY_API_KEY`, `RATE_LIMIT_PER_MIN`, `MAX_SESSIONS`, `MAX_BODY_MB`, `AUTH_CONTEXT_TTL_MS` |

Tool categories (Render, extended GitHub, code graph) are **not** switched by environment flags; use the Settings pages. The only deployment-level switches are `ENABLE_SANDBOX` and `ENABLE_FILE_SHARING`.

## Project layout

```
src/
  index.ts            Express app, auth middleware, MCP session handling, HTTP routes
  toolDefaults.ts     Single source of truth for default-on tools and resolveToolState
  toolSchemas.ts      Shared tool schema helpers
  githubTools.ts      GitHub tools (Octokit)
  renderTools.ts      Render tools
  sandboxTools.ts     Sandbox, local git and file tools
  sandboxProc.ts      Child-process execution, isolation policy
  sandboxIdentity.ts  Per-user uid allocation
  codeGraphTools.ts   Code graph tools (wraps the cgc CLI) and web_search
  fileShare.ts        Sandbox Store (GridFS), downloads
  fileShareRegistry.ts  File metadata registry
  uploadSessions.ts   Web upload sessions
  mcpOAuth.ts         OAuth 2.1 server, dynamic client registration
  googleAuth.ts       Google sign-in, sessions, account lifecycle
  userSettings.ts     Per-user/per-key settings, credential encryption, quotas
  security.ts         Redaction, command/network guards, session context
  securityControls.ts Audit log, production config validation
  emailService.ts     Gmail API / SMTP notifications
  stats.ts            Usage statistics
  rateLimit.ts        Rate limiting
  website/            Server-rendered pages, components, design tokens, client scripts
skills/               Agent skill (SKILL.md + 4 reference guides)
test/                 node:test suites (tsx)
scripts/run-tests.mjs Test runner with a throwaway data dir
assets/               Logo and icons
docs/                 Design notes (website revamp spec)
Dockerfile            Production image with runtimes and the unprivileged sandbox user
```

## Development and testing

```bash
npm run dev         # watch mode
npm run typecheck   # tsc --noEmit
npm run build       # compile to dist/
npm test            # all suites in test/
npm test -- test/tool_defaults.test.ts   # a single file
```

`npm test` points `KRIX_DATA_DIR` at a temporary folder, so tests never touch your real `./data`. Suites cover tool toggles and defaults, OAuth and auth, per-user sandbox isolation, security isolation, uploads, email, stats and the website pages.

## Deployment

**Docker (recommended).** The image installs the language runtimes, creates the unprivileged `sandbox` user (uid/gid 10001), runs under `tini`, and sets `SANDBOX_REQUIRE_ISOLATION=true`. It exposes port 3000 and has a `/healthz` healthcheck.

```bash
docker build -t krix .
docker run -d --name krix -p 3000:3000 --env-file .env krix
```

**Render.** Deploy the Dockerfile as a web service, add the variables from `.env.example` in the dashboard, set `ENABLE_SANDBOX=true` for the isolated sandbox, and use the Gmail API transport for email since free tiers block SMTP. Set `PUBLIC_BASE_URL` to the service's HTTPS URL and `TRUST_PROXY=1`.

**VPS / bare metal.** `npm ci && npm run build && npm start` behind a TLS reverse proxy. Without Docker the sandbox will not start unless you provide equivalent isolation yourself.

The code graph tools additionally need the `cgc` CLI on the host; they stay unavailable without it.

## Agent skill

[`skills/SKILL.md`](skills/SKILL.md) is a ready-to-use skill for AI agents. It routes the model to one of four references (GitHub, Render, Sandbox, Code Graph), explains the recommended edit-verify-ship workflow, and tells the model that tools can be disabled by the server owner, so it should rely on its actual tool list.

## License

MIT. See [LICENSE](LICENSE).
