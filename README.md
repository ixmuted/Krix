# Krix

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-1.32.1-black.svg)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Krix** is an enterprise-grade, multi-user **Model Context Protocol (MCP)** gateway and sandboxed runtime. It connects AI assistants—including Google Gemini, Anthropic Claude, Cursor, and custom MCP clients—to GitHub repositories, Render cloud infrastructure, code intelligence graphs, and isolated execution sandboxes behind strict access controls, zero-leak credential encryption, and real-time security email alerts.

---

## Key Highlights

- **Dual-Protocol MCP Gateway**: Full support for both Streamable HTTP (`/mcp`) and Server-Sent Events (`/sse`) transports with SEP-973 icon discovery.
- **Multi-Tenant Workspace Isolation**: Non-owners receive dedicated, isolated sandbox directories (`sbx_<keyId>`) with strict memory, process, and 50MB storage quotas, preventing cross-tenant contamination.
- **Enterprise Email Notification System**:
  - Dual transport: **Gmail REST API over HTTPS** (bypasses Render/cloud free-tier SMTP firewall port blocks) and **Nodemailer SMTP**.
  - High-contrast, Geist-inspired responsive HTML templates with equal typographical spacing and geometric alignment.
  - Automated security triggers: **Account Creation**, **Account Deletion**, **New Logged-In IP Detection**, and **OAuth Client Authorization**.
- **OAuth 2.1 & Dynamic Client Registration**: Compliant with RFC 7591 / 8414 with PKCE (S256), RSA key signing, and per-client tool permission scoping.
- **Unified Pill Design System**: Consistent 34px-height interactive controls, rounded-full search inputs, and symmetrically aligned adjacent selectors across mobile and PC viewports.
- **Zero-Leak Secret Storage**: Per-key GitHub and Render credentials encrypted at rest with AES-256-GCM via `KEY_ENCRYPTION_SECRET`.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quick Start](#quick-start)
3. [Connecting MCP Clients](#connecting-mcp-clients)
4. [Email Notifications](#email-notifications)
5. [Multi-User Access & Quotas](#multi-user-access--quotas)
6. [Tool Catalog & Capabilities](#tool-catalog--capabilities)
7. [Design System & UI Standards](#design-system--ui-standards)
8. [Configuration (.env)](#configuration-env)
9. [Development & Testing](#development--testing)
10. [Deployment (Render / Docker / VPS)](#deployment-render--docker--vps)
11. [License](#license)

---

## Architecture Overview

```
                          ┌──────────────────────────────────────┐
                          │     AI Assistant / Model Client      │
                          │   (Gemini, Claude, Cursor, Custom)   │
                          └──────────────────┬───────────────────┘
                                             │ HTTP / SSE / OAuth 2.1
                                             ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   Krix Gateway                                        │
│                                                                                        │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌─────────────────────────────┐  │
│  │   Auth & Sessions     │  │   Email Notification │  │      Web Dashboard          │  │
│  │ Google Auth / Bearer  │  │ Gmail API / SMTP     │  │ Geist UI, 34px Pill Design  │  │
│  │ User Account Registry │  │ IP Geo / Device Parse│  │ Dynamic Keys & OAuth Mgt    │  │
│  └──────────┬────────────┘  └──────────┬───────────┘  └──────────────┬──────────────┘  │
│             │                          │                             │                 │
│             ▼                          ▼                             ▼                 │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                 Tool Router                                      │  │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌──────────────────────┐  │  │
│  │  │ GitHub Tools  │ │ Render Tools  │ │ Code Graph    │ │ Sandbox Exec / Git   │  │  │
│  │  │ 51 Operations │ │ 21 Cloud APIs │ │ 29 AST Tools  │ │ 15 Isolated Shell/FS │  │  │
│  │  └───────────────┘ └───────────────┘ └───────────────┘ └──────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────┬───────────────────────────────────────────┘
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      ▼                                             ▼
       ┌─────────────────────────────┐               ┌─────────────────────────────┐
       │     Isolated Sandboxes      │               │     MongoDB Database        │
       │ sbx_<id> (Non-owners, 50MB) │               │ Stats, Telemetry, OAuth,    │
       │ owner (Server Admin, 300MB) │               │ GridFS Ephemeral File Store │
       └─────────────────────────────┘               └─────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- **Node.js**: `v20.0.0` or higher (Node LTS recommended)
- **MongoDB**: v6.0+ (Local or MongoDB Atlas)
- **Package Manager**: `npm` (v10+)

### Setup

```bash
# 1. Clone repository
git clone https://github.com/imunmuted/Krix.git
cd Krix

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your secrets (see Configuration below)

# 4. Build TypeScript
npm run build

# 5. Start the server
npm start
# Server listens on http://localhost:3000
```

For live development with auto-reloading:

```bash
npm run dev
```

---

## Connecting MCP Clients

Krix exposes standards-compliant endpoints for MCP client discovery, streaming, and OAuth consent:

| Endpoint                            | Protocol           | Description                                                       |
| ----------------------------------- | ------------------ | ----------------------------------------------------------------- |
| `/mcp`                              | Streamable HTTP    | Primary JSON-RPC 2.0 tool invocation transport                    |
| `/sse`                              | Server-Sent Events | Persistent bi-directional event stream                            |
| `/.well-known/mcp/server-card.json` | JSON               | Automatic server card discovery for agentic frameworks            |
| `/oauth/authorize`                  | OAuth 2.1          | User authorization & consent endpoint                             |
| `/oauth/token`                      | OAuth 2.1          | RFC 6749 Token Exchange (Authorization Code & Client Credentials) |

### Authorization Options

1. **Bearer API Key**:
   Pass your dynamic or primary API key in the `Authorization` header:

   ```http
   Authorization: Bearer krix_live_...
   ```

   Or via `x-api-key: krix_live_...`.

2. **OAuth 2.1 Handshake**:
   Clients supporting dynamic discovery can register automatically via `/oauth/register` and redirect the user to `/oauth/authorize`. Once consented, tokens are scoped strictly to the granted permissions.

---

## Email Notifications

Krix includes a built-in security and lifecycle email service engineered for high reliability in containerized and cloud environments.

### Dual-Transport Engine

- **Transport 1: Gmail REST API over HTTPS**:
  - Uses Google Cloud OAuth2 with an automated token refresher (`https://oauth2.googleapis.com/token`).
  - Messages are constructed in RFC 2822 format, RFC 2047 encoded, and posted directly to `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`.
  - **Why it matters**: Cloud hosts like Render block outbound SMTP ports (25, 465, 587) on free tiers. The HTTPS REST API guarantees 100% delivery without open SMTP ports.
- **Transport 2: Standard SMTP (Nodemailer)**:
  - Supports self-hosted SMTP relays, AWS SES, SendGrid, Mailgun, and custom mail servers.
- **Graceful Fallback**:
  - If no email credentials are set in `.env`, the server logs a single startup notice and cleanly skips dispatch without throwing or blocking requests.

### Notification Events

1. **Account Creation**:
   Sent upon first sign-in via Google OAuth. Displays the assigned user role, isolated sandbox ID, client device, browser, IP address, and resolved location.
2. **Account Deletion (30-Day Asynchronous Grace Period)**:
   Triggered when a user initiates deletion in the Settings Danger Zone. Rather than deleting immediately, the account enters an asynchronous **30-day grace period**. An email notification is sent with the exact deletion deadline timestamp; signing back in before the deadline automatically cancels deletion and restores the account. Once the deadline passes, background schedulers permanently purge the account, API keys, and workspace storage.
3. **New Logged-In IP Detection**:
   Tracks every known IP per user account. When an existing account signs in from an unrecognized network address, a security alert is dispatched with IP, device, and approximate location.
4. **OAuth Client Setup & Authorization**:
   Sent whenever an external assistant (e.g. Gemini, Cursor) is authorized, documenting the client name, client ID, granted scopes, and redirect URI.

### Design Standards

- Single-column card layout (max-width: 580px) with responsive fluid typography.
- Dark brand header (`#09090b`) featuring the official Krix logo and event badge pills.
- Neutral Geist typography hierarchy with monospace pills for addresses, IDs, and tokens.
- Strict equal padding (11px table row gutters, fixed 42px icon / 145px label columns) with full inline CSS for rock-solid cross-client email alignment.

---

## Multi-User Access & Quotas

Krix allows non-owner users to access the platform with isolated workspaces while maintaining administrative authority for the server owner.

| Quota Dimension            | Server Owner (`role: owner`)                     | Standard Developer (`role: user`)            |
| -------------------------- | ------------------------------------------------ | -------------------------------------------- |
| **Storage Quota**          | 300 MB (configurable via `SANDBOX_MAX_TOTAL_MB`) | 50 MB distributed sandbox quota              |
| **Max Single File Upload** | 25 MB                                            | 2.5 MB (1/10th)                              |
| **Total Uploads Capacity** | 100 MB                                           | 10 MB (1/10th)                               |
| **Download Stream Cap**    | 50 MB                                            | 5 MB (1/10th)                                |
| **Rate Limiting**          | 600 requests / minute                            | 60 requests / minute                         |
| **Sandbox Workspace ID**   | `owner` (root master sandbox)                    | `sbx_<cleanKeyId>` (isolated directory)      |
| **Administrative Access**  | Full settings, key generation, owner overrides   | Self-service key management & upload sandbox |

---

## Tool Catalog & Capabilities

Krix bundles **117 MCP tools** across 6 core operational categories:

### 1. GitHub Integration (51 Tools)

- **Repository Navigation & Inspection**: `get_file_contents`, `grep`, `view_file_outline`, `git_tree`, `search_code`, `search_repositories`.
- **Branch & Pull Request Management**: `list_branches`, `create_branch`, `delete_branch`, `create_pull_request`, `list_pull_requests`, `pull_request_read`, `pull_request_review_write`.
- **Commit & Tree Operations**: `push_files`, `str_replace_editor`, `create_or_update_file`, `delete_file`, `patch_contents`.
- **Issue Tracking & Project Management**: `list_issues`, `issue_read`, `issue_write`, `sub_issue_write`, `search_issues`.

### 2. Render Cloud Management (21 Tools)

- **Services & Workspaces**: `list_services`, `get_service`, `list_workspaces`, `select_workspace`.
- **Deployments & Workflows**: `list_deploys`, `trigger_deploy`, `list_workflows`, `start_flow_run`.
- **Managed Databases & Secrets**: `list_postgres_instances`, `get_postgres`, `query_render_postgres`, `list_key_value`, `update_environment_variables`.

### 3. Isolated Sandbox & Local Git (15 Tools)

- **Execution**: `sandbox_exec`, `sandbox_run` with ulimit CPU/process guardrails and execution timeouts.
- **Filesystem**: `sandbox_read`, `sandbox_write`, `sandbox_edit`, `sandbox_delete`, `sandbox_list`.
- **Local Git Operations**: `git_status`, `git_diff`, `git_commit`, `git_checkout`, `git_branch`.

### 4. Code Graph & AST Intelligence (29 Tools)

- **Codebase Indexing**: `add_code_to_graph`, `add_package_to_graph`, `watch_directory`.
- **Structural Analysis**: `find_code`, `analyze_code_relationships`, `calculate_cyclomatic_complexity`, `find_most_complex_functions`.
- **Architectural Simulation**: `simulate_architectural_change`, `analyze_architectural_evolution`, `generate_report`.

### 5. Web Search & Intelligence (1 Tool)

- `web_search`: Live Internet search with domain filtering and content summarization.

### 6. Ephemeral & Permanent Storage

- GridFS-backed file sharing, web upload sessions with nonce-based CSP, and multi-tenant file privacy toggles.

---

## Design System & UI Standards

The Krix web interface strictly follows the **Geist Design System** and Vercel UI guidelines:

- **Pill Symmetry**: Interactive dropdowns, year/days selectors, search inputs, and view toggles adhere to a fixed **34px height** and full border radius (`border-radius: var(--radius-full)`). Adjacent pills maintain identical vertical dimensions.
- **Dark Neutral Palette**: Pure black `#000000`, canvas background `#09090b`, elevated cards `#121214`, subtle borders `#27272a`, and muted labels `#71717a`.
- **Responsive Geometry**: Viewports from mobile phones (375px) to ultra-wide displays maintain clean flex wrapping, overflow prevention, and touch-target padding (minimum 34px).

---

## Configuration (.env)

Below are the primary configuration variables available in `.env.example`:

```bash
# ── Server ───────────────────────────────────────────────────────────────
PORT=3000
NODE_ENV=production
PUBLIC_BASE_URL=https://krix.example.com
TRUST_PROXY=1

# ── Authentication (REQUIRED) ────────────────────────────────────────────
MCP_API_KEY=your_secret_mcp_api_key_32_bytes_hex
SESSION_SECRET=your_long_session_signing_secret
KEY_ENCRYPTION_SECRET=your_32_plus_bytes_aes_gcm_secret_key

# ── Google OAuth & Identity ──────────────────────────────────────────────
OWNER_EMAIL=admin@example.com
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ── Email Notifications (Dual Transport) ─────────────────────────────────
# Option A: Gmail REST API over HTTPS (Recommended for Render & Cloud)
GMAIL_USER=notifications@yourdomain.com
GMAIL_CLIENT_ID=your-oauth-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-oauth-client-secret
GMAIL_REFRESH_TOKEN=your-oauth-refresh-token

# Option B: Standard SMTP
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@yourdomain.com
SMTP_PASS=your-smtp-password
SMTP_SECURE=false
EMAIL_FROM="Krix Security" <notifications@yourdomain.com>

# ── Provider Defaults (Fallback for Primary Key) ─────────────────────────
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...
RENDER_API_KEY=rnd_...

# ── MongoDB Persistence ──────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://...
MONGODB_DB=krix

# ── Storage & Upload Quotas ──────────────────────────────────────────────
SANDBOX_MAX_TOTAL_MB=300
FILE_TTL_HOURS=72
FILE_MAX_MB=25
ENABLE_WEB_UPLOAD=true
```

---

## Development & Testing

Krix enforces deterministic verification across all modules:

```bash
# Run complete test suite (133 tests)
npm test

# Run focused email service and security tests
npx tsx --test test/email_service.test.ts

# Run static TypeScript typecheck
npm run typecheck

# Full production build
npm run build
```

---

## Deployment (Render / Docker / VPS)

### Render Blueprint (`render.yaml`)

Krix includes native configuration for one-click deployment on Render as a Web Service:

1. Connect your repository to Render.
2. Select **Node** environment with Build Command: `npm install && npm run build` and Start Command: `npm start`.
3. Set environment variables in the Render Dashboard (specifically `GMAIL_USER`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, and `GMAIL_REFRESH_TOKEN` for notifications).

### Docker Container

```bash
# Build Docker image
docker build -t krix:latest .

# Run container with environment file
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name krix-gateway \
  krix:latest
```

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
