// Help Center & Category Documentation Pages for Krix MCP Gateway
// Anthropic-inspired editorial layout with crisp bordered containers, live search,
// dedicated /help/:slug category guides, and CSP-safe interactive helpers.

import { escapeHtml, renderPageShell } from "../components.js";
import { renderSvg } from "../icons.js";

export interface HelpSection {
  id: string;
  title: string;
  render: (ctx: { base: string; mcpUrl: string }) => string;
}

export interface HelpCategory {
  slug: string;
  title: string;
  shortTitle: string;
  icon: string;
  badge: string;
  summary: string;
  readTime: string;
  topics: string[];
  keywords: string;
  sections: HelpSection[];
}

function codeBlock(label: string, code: string): string {
  const escaped = escapeHtml(code);
  return `
    <div class="doc-code">
      <div class="doc-code-head">
        <span>${escapeHtml(label)}</span>
        <button type="button" class="btn sm doc-copy-btn" data-copy="${escaped}" aria-label="Copy ${escapeHtml(label)}">
          ${renderSvg("copy", 14)}<span>Copy</span>
        </button>
      </div>
      <pre><code>${escaped}</code></pre>
    </div>`;
}

function callout(
  kind: "info" | "tip" | "warn",
  title: string,
  bodyHtml: string,
): string {
  const icon =
    kind === "warn" ? "warning" : kind === "tip" ? "sparkles" : "info";
  return `
    <div class="doc-callout doc-callout-${kind}">
      <div class="doc-callout-icon" aria-hidden="true">${renderSvg(icon, 16)}</div>
      <div class="doc-callout-body">
        <div class="doc-callout-title">${escapeHtml(title)}</div>
        <div class="doc-callout-text">${bodyHtml}</div>
      </div>
    </div>`;
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    slug: "getting-started",
    title: "Getting Started & Client Setup",
    shortTitle: "Getting Started",
    icon: "zap",
    badge: "Start here",
    summary:
      "Connect Claude, Cursor, Windsurf, Gemini, or any MCP Streamable HTTP client to Krix in under two minutes.",
    readTime: "4 min read",
    topics: [
      "Streamable HTTP endpoint (/mcp)",
      "API key vs OAuth 2.1 setup",
      "Claude Desktop, Cursor, Windsurf & Gemini configs",
      "Verifying your connection & first tool call",
    ],
    keywords:
      "setup connect mcp streamable http claude cursor windsurf gemini chatgpt bearer x-api-key endpoint healthz",
    sections: [
      {
        id: "endpoint",
        title: "1. Your MCP Streamable HTTP endpoint",
        render: ({ mcpUrl }) => `
          <p>Krix exposes a single authenticated <strong>Model Context Protocol (MCP) Streamable HTTP</strong> endpoint at <code class="inline-code">POST/GET /mcp</code>. Every supported assistant connects to this URL using either an API key header or OAuth 2.1 discovery.</p>
          <div class="doc-endpoint-card">
            <div class="doc-endpoint-meta">
              <span class="doc-pill">Streamable HTTP</span>
              <span class="doc-endpoint-note">Recommended transport for all current MCP clients</span>
            </div>
            <div class="endpoint-row">
              <code>${escapeHtml(mcpUrl)}</code>
              <button type="button" class="btn sm doc-copy-btn" data-copy="${escapeHtml(mcpUrl)}" aria-label="Copy MCP endpoint URL">${renderSvg("copy", 14)}<span>Copy</span></button>
            </div>
          </div>
          ${callout(
            "info",
            "Header authentication vs query string",
            `Send your key in the <code class="inline-code">Authorization: Bearer &lt;key&gt;</code> or <code class="inline-code">x-api-key: &lt;key&gt;</code> header. Passing <code class="inline-code">?api_key=</code> in the URL is disabled by default for security unless the server sets <code class="inline-code">ALLOW_QUERY_API_KEY=true</code>.`,
          )}
        `,
      },
      {
        id: "quick-steps",
        title: "2. Three-step setup checklist",
        render: () => `
          <div class="doc-steps">
            <div class="doc-step">
              <div class="doc-step-num">01</div>
              <div class="doc-step-body">
                <h4>Sign in with Google</h4>
                <p>Open <a href="/auth/google">Sign in</a> to initialize your isolated workspace, personal storage quota, and encrypted settings store.</p>
              </div>
            </div>
            <div class="doc-step">
              <div class="doc-step-num">02</div>
              <div class="doc-step-body">
                <h4>Create an API key or authorize via OAuth 2.1</h4>
                <p>Generate a scoped key on <a href="/api/keys">API Keys</a>, or point an OAuth-capable client (Claude, Gemini, ChatGPT) directly at <code class="inline-code">/mcp</code> to complete one-click PKCE consent.</p>
              </div>
            </div>
            <div class="doc-step">
              <div class="doc-step-num">03</div>
              <div class="doc-step-body">
                <h4>Add provider tokens &amp; toggle tool groups</h4>
                <p>Open <a href="/settings">Settings</a> to add your GitHub PAT or Render API key (encrypted with AES-256-GCM) and switch opt-in tool groups on or off.</p>
              </div>
            </div>
          </div>
        `,
      },
      {
        id: "client-configs",
        title: "3. Client configuration examples",
        render: ({ mcpUrl, base }) => `
          <p>Use the snippet matching your AI editor or assistant. Replace <code class="inline-code">YOUR_KRIX_API_KEY</code> with a key from <a href="/api/keys">API Keys</a>, or omit headers when connecting via OAuth 2.1 discovery.</p>
          <div class="doc-grid-2">
            <div class="doc-subcard">
              <div class="doc-subcard-head">${renderSvg("cursor", 18)}<h4>Cursor</h4></div>
              <p>Open <strong>Settings → MCP → Add new global MCP server</strong> (or <code class="inline-code">.cursor/mcp.json</code>).</p>
              ${codeBlock(
                ".cursor/mcp.json",
                `{
  "mcpServers": {
    "krix": {
      "url": "${mcpUrl}",
      "headers": {
        "Authorization": "Bearer YOUR_KRIX_API_KEY"
      }
    }
  }
}`,
              )}
            </div>
            <div class="doc-subcard">
              <div class="doc-subcard-head">${renderSvg("claude", 18)}<h4>Claude Desktop / Claude Code</h4></div>
              <p>Connect via native OAuth 2.1 in Custom Connectors using <code class="inline-code">${escapeHtml(mcpUrl)}</code>, or configure via CLI:</p>
              ${codeBlock(
                "Claude Code CLI",
                `claude mcp add --transport http krix ${mcpUrl} \\
  --header "Authorization: Bearer YOUR_KRIX_API_KEY"`,
              )}
            </div>
            <div class="doc-subcard">
              <div class="doc-subcard-head">${renderSvg("windsurf", 18)}<h4>Windsurf / VS Code / Generic MCP</h4></div>
              <p>Add Krix under <code class="inline-code">mcpServers</code> with Streamable HTTP transport and <code class="inline-code">x-api-key</code>.</p>
              ${codeBlock(
                "mcp_config.json",
                `{
  "mcpServers": {
    "krix": {
      "serverUrl": "${mcpUrl}",
      "headers": {
        "x-api-key": "YOUR_KRIX_API_KEY"
      }
    }
  }
}`,
              )}
            </div>
            <div class="doc-subcard">
              <div class="doc-subcard-head">${renderSvg("gemini", 18)}<h4>Gemini CLI &amp; Discovery Manifests</h4></div>
              <p>Krix publishes native discovery manifests so Gemini and registry clients auto-configure:</p>
              ${codeBlock(
                "Discovery Endpoints",
                `Server card:  ${base}/.well-known/mcp/server-card.json
MCP manifest: ${base}/.well-known/mcp.json
Gemini ext:   ${base}/gemini-extension.json
Health check: ${base}/healthz`,
              )}
            </div>
          </div>
        `,
      },
      {
        id: "first-call",
        title: "4. Verify everything works",
        render: () => `
          <p>Once connected, ask your assistant to run <code class="inline-code">sandbox_status</code> (checks available runtimes, memory, isolation, and storage quota) or <code class="inline-code">get_me</code> (verifies your GitHub token). You can also test any enabled tool directly from the browser in the <a href="/tools">Tools catalog</a>.</p>
          ${callout(
            "tip",
            "Set active context once per session",
            `Ask your assistant to call <code class="inline-code">set_active_context</code> with your default <code class="inline-code">owner</code>, <code class="inline-code">repo</code>, and <code class="inline-code">branch</code> so every subsequent GitHub call stays concise and accurate.`,
          )}
        `,
      },
    ],
  },
  {
    slug: "authentication",
    title: "API Keys, OAuth 2.1 & Permissions",
    shortTitle: "Auth & Keys",
    icon: "key",
    badge: "Access control",
    summary:
      "Understand bearer keys, OAuth 2.1 PKCE consent flows, scopes, per-key credential overrides, and tool toggle precedence.",
    readTime: "4 min read",
    topics: [
      "Dynamic API keys vs owner MCP_API_KEY",
      "OAuth 2.1 (RFC 7591, PKCE S256, RS256)",
      "OAuth scopes: mcp:tools, mcp:sandbox, mcp:admin",
      "4-level tool policy precedence",
    ],
    keywords:
      "api keys oauth 2.1 pkce s256 rs256 scopes permissions toggles precedence revoke client registration",
    sections: [
      {
        id: "auth-methods",
        title: "Two ways to authenticate",
        render: ({ base }) => `
          <div class="doc-table-wrap">
            <table class="doc-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Best for</th>
                  <th>How it works</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Dynamic API Keys</strong></td>
                  <td>Cursor, Windsurf, scripts, CI, per-project isolation</td>
                  <td>Created in <a href="/api/keys">API Keys</a>. Sent via <code class="inline-code">Authorization: Bearer</code> or <code class="inline-code">x-api-key</code>. Supports per-key GitHub/Render overrides and custom tool toggles.</td>
                </tr>
                <tr>
                  <td><strong>OAuth 2.1 (PKCE S256)</strong></td>
                  <td>Claude, Gemini, ChatGPT, browser-driven connectors</td>
                  <td>Clients auto-discover <code class="inline-code">${escapeHtml(base)}/.well-known/oauth-authorization-server</code>, register via <code class="inline-code">/oauth/register</code>, and prompt you on <code class="inline-code">/oauth/authorize</code>. Tokens are RS256-signed and individually revocable.</td>
                </tr>
              </tbody>
            </table>
          </div>
        `,
      },
      {
        id: "oauth-scopes",
        title: "OAuth 2.1 scopes & endpoints",
        render: () => `
          <p>Every OAuth authorization explicitly displays the client domain, favicon, and requested scopes before you approve:</p>
          <div class="doc-grid-3">
            <div class="doc-mini-card">
              <div class="doc-mono-title">mcp:tools</div>
              <p>Access to enabled GitHub, Render, and Code Graph tools within your account's tool policy.</p>
            </div>
            <div class="doc-mini-card">
              <div class="doc-mono-title">mcp:sandbox</div>
              <p>Access to isolated code execution, persistent shell, local git, and Sandbox Store file sharing.</p>
            </div>
            <div class="doc-mini-card">
              <div class="doc-mono-title">mcp:admin</div>
              <p>Elevated repository/service management operations when explicitly enabled in Settings.</p>
            </div>
          </div>
          <p style="margin-top:12px;">You can revoke any API key or OAuth client instantly from <a href="/api/keys">API Keys</a>; revocation immediately invalidates active sessions and clears cached telemetry.</p>
        `,
      },
      {
        id: "precedence",
        title: "How tool availability is decided (precedence)",
        render: () => `
          <p>A single policy resolver (<code class="inline-code">resolveToolState</code>) governs <code class="inline-code">tools/list</code>, <code class="inline-code">tools/call</code>, OAuth scopes, and the Settings UI so they never disagree. Rules evaluate in strict order:</p>
          <div class="doc-steps">
            <div class="doc-step">
              <div class="doc-step-num">1</div>
              <div class="doc-step-body">
                <h4>Hard server &amp; credential blocks</h4>
                <p>If the server disables a category (e.g., <code class="inline-code">ENABLE_SANDBOX=false</code>) or the required GitHub/Render credential is missing, those tools are hidden and blocked.</p>
              </div>
            </div>
            <div class="doc-step">
              <div class="doc-step-num">2</div>
              <div class="doc-step-body">
                <h4>Per-key override</h4>
                <p>Custom toggles or provider tokens configured on a specific key's settings page override workspace defaults for that key alone.</p>
              </div>
            </div>
            <div class="doc-step">
              <div class="doc-step-num">3</div>
              <div class="doc-step-body">
                <h4>Workspace-wide setting</h4>
                <p>Your account toggles in <a href="/settings">Settings</a> apply to all keys that inherit workspace configuration.</p>
              </div>
            </div>
            <div class="doc-step">
              <div class="doc-step-num">4</div>
              <div class="doc-step-body">
                <h4>Built-in defaults</h4>
                <p>By default, <strong>all 15 Sandbox tools</strong> and <strong>17 core GitHub tools</strong> are ON. Extended GitHub (34), Render (21), and Code Graph (30) start OFF until enabled.</p>
              </div>
            </div>
          </div>
        `,
      },
    ],
  },
  {
    slug: "github",
    title: "GitHub Tools (51 Tools)",
    shortTitle: "GitHub Tools",
    icon: "github",
    badge: "51 tools",
    summary:
      "Browse repos, search code, perform surgical line edits, push atomic multi-file commits, and manage PRs, issues, and releases.",
    readTime: "5 min read",
    topics: [
      "Personal Access Token setup & scopes",
      "17 core tools (default on)",
      "34 extended tools (opt-in)",
      "Surgical editing workflow",
    ],
    keywords:
      "github pat token octokit git_tree grep str_replace_editor patch_contents push_files pull request issues releases",
    sections: [
      {
        id: "github-setup",
        title: "Setting up your GitHub token",
        render: () => `
          <p>To unlock GitHub tools, generate either a <strong>Fine-Grained Personal Access Token</strong> (recommended, scoped to selected repositories) or a <strong>Classic PAT</strong> (<code class="inline-code">repo</code> scope for private repos, <code class="inline-code">public_repo</code> for public only).</p>
          <ol class="doc-list">
            <li>Open <a href="/settings">Settings → Provider Credentials</a> (or open a specific API key to bind a separate token per project).</li>
            <li>Paste your GitHub token and click <strong>Save</strong>. Krix encrypts it at rest with <strong>AES-256-GCM</strong> and automatically redacts it from all tool outputs.</li>
            <li>Verify by asking your assistant to call <code class="inline-code">get_me</code> or <code class="inline-code">search_repositories</code>.</li>
          </ol>
          ${callout(
            "warn",
            "Least-privilege recommendation",
            `Use a Fine-Grained PAT limited to <strong>Contents (Read &amp; Write)</strong> and <strong>Pull Requests (Read &amp; Write)</strong> on only the repositories you actively want AI assistants to modify.`,
          )}
        `,
      },
      {
        id: "github-core-vs-extended",
        title: "What works by default vs opt-in",
        render: () => `
          <div class="doc-table-wrap">
            <table class="doc-table">
              <thead>
                <tr>
                  <th>Tier</th>
                  <th>Default</th>
                  <th>Capabilities &amp; Key Tools</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Core GitHub (17 tools)</strong></td>
                  <td><span class="badge success">On by default</span></td>
                  <td><code class="inline-code">set_active_context</code>, <code class="inline-code">get_me</code>, <code class="inline-code">search_repositories</code>, <code class="inline-code">git_tree</code>, <code class="inline-code">view_file_outline</code>, <code class="inline-code">grep</code>, <code class="inline-code">search_code</code>, <code class="inline-code">get_file_contents</code>, <code class="inline-code">str_replace_editor</code>, <code class="inline-code">patch_contents</code>, <code class="inline-code">create_or_update_file</code>, <code class="inline-code">push_files</code>, <code class="inline-code">delete_file</code>, <code class="inline-code">list_branches</code>, <code class="inline-code">create_branch</code>, <code class="inline-code">delete_branch</code>, <code class="inline-code">create_pull_request</code>.</td>
                </tr>
                <tr>
                  <td><strong>Extended GitHub (34 tools)</strong></td>
                  <td><span class="badge">Opt-in in Settings</span></td>
                  <td>Issues &amp; sub-issues, PR reads/updates/merges, line-level code reviews, commit history, tags, releases, team membership, repository admin, secret-scanning alerts, and Copilot assignment.</td>
                </tr>
              </tbody>
            </table>
          </div>
        `,
      },
      {
        id: "github-workflow",
        title: "Recommended surgical editing workflow",
        render: () => `
          <p>Krix is engineered to save tokens and prevent accidental file truncation:</p>
          <ul class="doc-list">
            <li><strong>Explore cheaply:</strong> Start with <code class="inline-code">git_tree</code>, <code class="inline-code">view_file_outline</code> (AST symbols), and <code class="inline-code">grep</code> with line windows instead of downloading full files.</li>
            <li><strong>Edit surgically:</strong> Use <code class="inline-code">str_replace_editor</code> or <code class="inline-code">patch_contents</code> for targeted changes rather than rewriting entire files.</li>
            <li><strong>Commit atomically:</strong> Use <code class="inline-code">push_files</code> to commit multiple coordinated file edits in a single commit, then open a PR with <code class="inline-code">create_pull_request</code>.</li>
          </ul>
        `,
      },
    ],
  },
  {
    slug: "sandbox",
    title: "Isolated Sandbox & Local Git (15 Tools)",
    shortTitle: "Sandbox Runtime",
    icon: "terminal",
    badge: "15 tools",
    summary:
      "Execute code across 11+ language runtimes, run tests, install packages, manage background processes, and use local git safely.",
    readTime: "5 min read",
    topics: [
      "11+ supported language runtimes",
      "Unix UID isolation & scrubbed env",
      "Persistent shell, background jobs & local git",
      "Command & network restriction guardrails",
    ],
    keywords:
      "sandbox run exec install python node typescript go rust java cpp ruby php bash git_clone git_diff isolation uid",
    sections: [
      {
        id: "sandbox-runtimes",
        title: "Supported runtimes & tools",
        render: () => `
          <p>Every sandbox command runs in an isolated child process—never inside the Krix server process. The production Docker image ships with:</p>
          <div class="doc-chip-row">
            <span class="doc-pill">Node.js</span>
            <span class="doc-pill">TypeScript (tsx / bun)</span>
            <span class="doc-pill">Python 3</span>
            <span class="doc-pill">Go</span>
            <span class="doc-pill">Rust</span>
            <span class="doc-pill">Java</span>
            <span class="doc-pill">C / C++</span>
            <span class="doc-pill">Ruby</span>
            <span class="doc-pill">PHP</span>
            <span class="doc-pill">Bash / POSIX sh</span>
            <span class="doc-pill">Git CLI</span>
          </div>
          <div class="doc-table-wrap" style="margin-top:16px;">
            <table class="doc-table">
              <thead>
                <tr>
                  <th>Tool</th>
                  <th>What it does</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><code class="inline-code">sandbox_run</code></td><td>Run inline code (default Python, or specify <code class="inline-code">lang</code>) or execute an existing sandbox file.</td></tr>
                <tr><td><code class="inline-code">sandbox_exec</code></td><td>Run shell commands in your persistent sandbox working directory (supports <code class="inline-code">background: true</code>).</td></tr>
                <tr><td><code class="inline-code">sandbox_file</code></td><td>Read, write, append, find-and-replace (<code class="inline-code">old_str</code>/<code class="inline-code">new_str</code>), or delete files safely without shell escaping.</td></tr>
                <tr><td><code class="inline-code">sandbox_install</code></td><td>Install validated <code class="inline-code">npm</code> or <code class="inline-code">pip</code> packages into your isolated environment.</td></tr>
                <tr><td><code class="inline-code">sandbox_ps</code> &amp; <code class="inline-code">sandbox_output</code></td><td>List/kill background processes and page through truncated command output via <code class="inline-code">outputId</code>.</td></tr>
                <tr><td><code class="inline-code">git_clone</code> / <code class="inline-code">git_checkout</code> / <code class="inline-code">git_diff</code> / <code class="inline-code">git_commit_push</code></td><td>Full local git workflow for cloning, running test suites, inspecting diffs, and pushing commits.</td></tr>
                <tr><td><code class="inline-code">sandbox_status</code> &amp; <code class="inline-code">sandbox_reset</code></td><td>Inspect runtimes, memory, MongoDB storage quota, and uploaded files—or wipe the sandbox clean.</td></tr>
              </tbody>
            </table>
          </div>
        `,
      },
      {
        id: "sandbox-isolation",
        title: "What works & what is restricted",
        render: () => `
          <div class="doc-grid-2">
            <div class="doc-subcard">
              <div class="doc-subcard-head">${renderSvg("check-circle", 18)}<h4>What works</h4></div>
              <ul class="doc-list">
                <li>Private per-user <code class="inline-code">HOME</code>, <code class="inline-code">TMPDIR</code>, and working directory under an unprivileged Unix UID.</li>
                <li>Persistent shell state, local git clones, test runners, build pipelines, and <code class="inline-code">upload/</code> user files.</li>
                <li>Idle cloned repositories are automatically cleaned up after <code class="inline-code">REPO_IDLE_MINUTES</code> (default 30 min) to preserve disk space.</li>
              </ul>
            </div>
            <div class="doc-subcard">
              <div class="doc-subcard-head">${renderSvg("shield", 18)}<h4>Security guardrails</h4></div>
              <ul class="doc-list">
                <li><strong>Scrubbed environment:</strong> Child processes cannot read <code class="inline-code">MCP_API_KEY</code>, GitHub/Render tokens, or <code class="inline-code">MONGODB_URI</code>.</li>
                <li><strong>Command &amp; network guards:</strong> <code class="inline-code">COMMAND_RESTRICTION_LEVEL</code> and <code class="inline-code">NETWORK_RESTRICTION_LEVEL</code> (<code class="inline-code">low</code> / <code class="inline-code">medium</code> / <code class="inline-code">high</code>) block destructive commands and private/loopback network probing.</li>
                <li><strong>Host requirement:</strong> Sandbox tools only activate when <code class="inline-code">ENABLE_SANDBOX=true</code> and OS isolation is available (Docker recommended).</li>
              </ul>
            </div>
          </div>
        `,
      },
    ],
  },
  {
    slug: "render",
    title: "Render Cloud & Postgres (21 Tools)",
    shortTitle: "Render Cloud",
    icon: "render",
    badge: "21 tools",
    summary:
      "Inspect services, trigger deploys, stream runtime logs, monitor CPU/memory metrics, update env vars, and query Render Postgres.",
    readTime: "3 min read",
    topics: [
      "Connecting your Render API key",
      "Services, deploys, logs & metrics",
      "Environment variables & Postgres queries",
      "Safe operational practices",
    ],
    keywords:
      "render deploy logs metrics env vars postgres database cloud web service static site cron",
    sections: [
      {
        id: "render-setup",
        title: "Enabling Render tools",
        render: () => `
          <p>Render tools are <strong>off by default</strong> to keep your tool list focused until needed.</p>
          <ol class="doc-list">
            <li>Create an API key in your <strong>Render Dashboard → Account Settings → API Keys</strong>.</li>
            <li>Paste the key into Krix <a href="/settings">Settings → Provider Credentials</a> (stored AES-256-GCM encrypted).</li>
            <li>Toggle the <strong>Render</strong> tool group ON in Settings (or on a specific API key).</li>
          </ol>
        `,
      },
      {
        id: "render-capabilities",
        title: "What you can manage",
        render: () => `
          <div class="doc-grid-2">
            <div class="doc-subcard">
              <div class="doc-subcard-head">${renderSvg("server", 18)}<h4>Services &amp; Deploys</h4></div>
              <p>List workspaces and services (<code class="inline-code">list_services</code>), create web services or static sites (<code class="inline-code">create_web_service</code>), trigger builds (<code class="inline-code">trigger_deploy</code>), and inspect deploy history.</p>
            </div>
            <div class="doc-subcard">
              <div class="doc-subcard-head">${renderSvg("activity", 18)}<h4>Logs, Metrics &amp; Postgres</h4></div>
              <p>Debug production issues with <code class="inline-code">list_logs</code> and <code class="inline-code">get_metrics</code>, manage configuration with <code class="inline-code">update_env_vars</code>, and inspect databases via <code class="inline-code">query_render_postgres</code>.</p>
            </div>
          </div>
          ${callout(
            "warn",
            "Destructive actions & secret safety",
            `Deleting services or overwriting environment variables takes effect immediately on your Render account. Krix redacts detected secret values from tool responses, and you can disable individual destructive tools per API key.`,
          )}
        `,
      },
    ],
  },
  {
    slug: "code-graph",
    title: "Code Graph & Intelligence (29 Tools + Web Search)",
    shortTitle: "Code Graph",
    icon: "layers",
    badge: "30 tools",
    summary:
      "Index repositories into a structural code graph to trace callers/callees, class hierarchies, dead code, and complexity hotspots.",
    readTime: "3 min read",
    topics: [
      "Enabling the cgc code graph",
      "Indexing repos & querying relationships",
      "Dead code, complexity & architecture reports",
      "When to use Code Graph vs grep",
    ],
    keywords:
      "code graph cgc callers callees hierarchy dead code complexity architecture report web_search ast",
    sections: [
      {
        id: "cg-overview",
        title: "How the Code Graph works",
        render: () => `
          <p>The Code Graph group wraps the <code class="inline-code">cgc</code> CLI to build a structural graph of functions, classes, imports, and call edges across a codebase—ideal for large refactors where plain text search misses indirect call chains.</p>
          <p>This group starts <strong>off by default</strong>. Enable it in <a href="/settings">Settings</a> (or per API key) whenever you want deep static analysis alongside <code class="inline-code">web_search</code>.</p>
        `,
      },
      {
        id: "cg-tools",
        title: "Key workflows & tools",
        render: () => `
          <div class="doc-table-wrap">
            <table class="doc-table">
              <thead>
                <tr>
                  <th>Goal</th>
                  <th>Tool(s) to use</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Index a cloned repository</td><td><code class="inline-code">add_code_to_graph</code></td></tr>
                <tr><td>Locate symbols &amp; definitions</td><td><code class="inline-code">find_code</code></td></tr>
                <tr><td>Trace callers, callees &amp; inheritance</td><td><code class="inline-code">analyze_code_relationships</code></td></tr>
                <tr><td>Audit maintainability &amp; cleanup</td><td><code class="inline-code">find_dead_code</code>, <code class="inline-code">find_most_complex_functions</code></td></tr>
                <tr><td>Summarize system structure</td><td><code class="inline-code">generate_report</code></td></tr>
                <tr><td>Look up external docs</td><td><code class="inline-code">web_search</code></td></tr>
              </tbody>
            </table>
          </div>
          ${callout(
            "tip",
            "Code Graph vs grep",
            `Use <code class="inline-code">grep</code> and <code class="inline-code">view_file_outline</code> for fast single-file lookups; enable Code Graph when mapping multi-file blast radius, dead code, or cross-module dependencies.`,
          )}
        `,
      },
    ],
  },
  {
    slug: "files-and-store",
    title: "Files, Web Uploads & Sandbox Store",
    shortTitle: "Files & Store",
    icon: "folder",
    badge: "Storage",
    summary:
      "Upload local files into your sandbox via /upload, share outputs through MongoDB GridFS, and manage expiration or visibility in /store.",
    readTime: "4 min read",
    topics: [
      "Web Upload sessions (/upload -> upload/)",
      "Sandbox Store tool (share, download, list, delete)",
      "Expiring vs permanent files in /store",
      "Private download SSRF protection",
    ],
    keywords:
      "files upload store gridfs mongodb share link ttl permanent private public download ssrf",
    sections: [
      {
        id: "web-upload",
        title: "Uploading files into your sandbox (/upload)",
        render: () => `
          <p>Need your AI assistant to analyze a local CSV, PDF, archive, or dataset? Open <a href="/upload">Web Upload</a> to start a short-lived upload session (<code class="inline-code">UPLOAD_SESSION_MINUTES</code>).</p>
          <ul class="doc-list">
            <li>Dropped files appear inside your isolated sandbox under the <code class="inline-code">upload/</code> directory.</li>
            <li>Per-session file count, single-file size, and total upload caps are enforced via <code class="inline-code">UPLOAD_MAX_FILES</code>, <code class="inline-code">UPLOAD_MAX_FILE_MB</code>, and <code class="inline-code">UPLOAD_MAX_TOTAL_MB</code>.</li>
            <li>Uploaded session files are automatically cleaned up after <code class="inline-code">UPLOAD_FILE_RETENTION_MINUTES</code> once the session expires.</li>
          </ul>
        `,
      },
      {
        id: "sandbox-store",
        title: "Sharing & managing files with Sandbox Store (/store)",
        render: () => `
          <p>The <code class="inline-code">sandbox_store</code> tool bridges your sandbox, MongoDB GridFS cloud storage, and the web:</p>
          <div class="doc-grid-2">
            <div class="doc-subcard">
              <div class="doc-subcard-head">${renderSvg("upload", 18)}<h4>Share outputs (<code class="inline-code">share</code>)</h4></div>
              <p>Uploads any file generated in your sandbox to MongoDB GridFS and returns a private, expiring download link (default <code class="inline-code">FILE_TTL_HOURS</code>, typically 48 hours).</p>
            </div>
            <div class="doc-subcard">
              <div class="doc-subcard-head">${renderSvg("download", 18)}<h4>Fetch remote files (<code class="inline-code">download</code>)</h4></div>
              <p>Downloads public HTTP(S) assets directly into your sandbox up to <code class="inline-code">DOWNLOAD_MAX_MB</code>. Private/internal IPs are blocked unless <code class="inline-code">ALLOW_PRIVATE_DOWNLOADS=true</code>.</p>
            </div>
          </div>
          <p style="margin-top:14px;">In the <a href="/store">Files dashboard</a>, you can rename files, switch between <strong>Private</strong> and <strong>Public</strong> links, pin important files as <strong>Permanent</strong> (disabling TTL expiry), download them, or delete them immediately.</p>
        `,
      },
    ],
  },
  {
    slug: "security-and-quotas",
    title: "Security, Quotas & Troubleshooting",
    shortTitle: "Security & Quotas",
    icon: "shield-check",
    badge: "Trust & limits",
    summary:
      "Encryption, secret redaction, multi-user resource quotas, email security alerts, account deletion, and fixes for common errors.",
    readTime: "5 min read",
    topics: [
      "AES-256-GCM encryption & secret redaction",
      "Owner vs standard user quotas",
      "Security emails & 30-day account deletion",
      "Common errors & quick fixes",
    ],
    keywords:
      "security encryption aes-256-gcm redaction audit hmac quotas 50mb rate limit email alerts deletion troubleshooting errors",
    sections: [
      {
        id: "security-controls",
        title: "Defense-in-depth security controls",
        render: () => `
          <ul class="doc-list">
            <li><strong>Encryption at rest:</strong> GitHub PATs and Render API keys are encrypted with <strong>AES-256-GCM</strong> derived from <code class="inline-code">KEY_ENCRYPTION_SECRET</code>.</li>
            <li><strong>Automatic secret redaction:</strong> Known environment secrets, per-request tokens, and embedded database passwords are scrubbed before any tool response reaches the AI model.</li>
            <li><strong>Pseudonymized audit logs:</strong> Security events record IP addresses hashed with <strong>HMAC-SHA256</strong> (<code class="inline-code">AUDIT_HASH_SECRET</code>) rather than raw IPs.</li>
            <li><strong>Transport &amp; abuse protection:</strong> Origin validation (<code class="inline-code">ALLOWED_ORIGINS</code>), per-minute rate limits (<code class="inline-code">RATE_LIMIT_PER_MIN</code>), session caps (<code class="inline-code">MAX_SESSIONS</code>), body caps (<code class="inline-code">MAX_BODY_MB</code>), and <code class="inline-code">Cache-Control: no-store</code> on MCP responses.</li>
            <li><strong>Proactive security alerts:</strong> When email delivery is configured (Gmail API or SMTP), Krix alerts you on account creation, new-IP sign-ins, OAuth client authorizations, and account deletion requests.</li>
          </ul>
        `,
      },
      {
        id: "quotas",
        title: "Multi-user roles & resource quotas",
        render: () => `
          <div class="doc-table-wrap">
            <table class="doc-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Storage quota</th>
                  <th>Compute &amp; limits</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Owner</strong> (<code class="inline-code">OWNER_EMAIL</code>)</td>
                  <td>Full server storage allocation</td>
                  <td>Full compute, memory, process limits, and workspace-wide configuration access.</td>
                </tr>
                <tr>
                  <td><strong>Standard User</strong> (Google sign-in)</td>
                  <td><strong>50 MB</strong> isolated storage</td>
                  <td>Isolated workspace and Unix user with ~1/10th of the owner's compute, memory, and process limits.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style="margin-top:12px;">You can inspect live request metrics on <a href="/stats">Usage Stats</a> and schedule or cancel account deletion in <a href="/settings">Settings</a> (deletion has a <strong>30-day grace period</strong>; signing back in cancels it before permanent purge).</p>
        `,
      },
      {
        id: "troubleshooting",
        title: "Troubleshooting common issues",
        render: () => `
          <div class="doc-table-wrap">
            <table class="doc-table">
              <thead>
                <tr>
                  <th>Symptom</th>
                  <th>Likely cause &amp; fix</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>401 Unauthorized on <code class="inline-code">/mcp</code></strong></td>
                  <td>Missing or revoked key, or key passed via <code class="inline-code">?api_key=</code> while <code class="inline-code">ALLOW_QUERY_API_KEY</code> is off. Send <code class="inline-code">Authorization: Bearer &lt;key&gt;</code> instead.</td>
                </tr>
                <tr>
                  <td><strong>Tool missing from assistant's list</strong></td>
                  <td>Render, Extended GitHub, and Code Graph are off by default, or require a GitHub/Render credential. Enable them in <a href="/settings">Settings</a> or on the specific API key.</td>
                </tr>
                <tr>
                  <td><strong>Sandbox tools report disabled</strong></td>
                  <td>The host server has <code class="inline-code">ENABLE_SANDBOX=false</code> or lacks unprivileged Unix isolation. Deploy with the provided Docker image and <code class="inline-code">ENABLE_SANDBOX=true</code>.</td>
                </tr>
                <tr>
                  <td><strong>429 Too Many Requests</strong></td>
                  <td>Your key hit <code class="inline-code">RATE_LIMIT_PER_MIN</code> or <code class="inline-code">MAX_SESSIONS</code>. Close idle MCP sessions or retry after the rate-limit window resets.</td>
                </tr>
              </tbody>
            </table>
          </div>
        `,
      },
    ],
  },
];

export function getHelpCategory(slug: string): HelpCategory | undefined {
  const clean = (slug || "").trim().toLowerCase();
  return HELP_CATEGORIES.find((c) => c.slug === clean);
}

function renderHelpScripts(nonce?: string): string {
  const nonceAttr = nonce ? ` nonce="${escapeHtml(nonce)}"` : "";
  return `<script${nonceAttr}>
(function () {
  document.addEventListener("click", function (ev) {
    var btn = ev.target && ev.target.closest ? ev.target.closest(".doc-copy-btn") : null;
    if (!btn) return;
    var text = btn.getAttribute("data-copy") || "";
    if (!text) return;
    if (typeof window.copyToClipboard === "function") {
      window.copyToClipboard(text, btn);
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        var span = btn.querySelector("span");
        if (span) {
          var prev = span.textContent;
          span.textContent = "Copied";
          setTimeout(function () { span.textContent = prev; }, 1600);
        }
      }).catch(function () {});
    }
  });

  var searchInput = document.getElementById("helpSearchInput");
  if (searchInput) {
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-help-card]"));
    var emptyState = document.getElementById("helpSearchEmpty");
    var countEl = document.getElementById("helpCategoryCount");
    var filter = function () {
      var q = (searchInput.value || "").trim().toLowerCase();
      var visible = 0;
      cards.forEach(function (card) {
        var hay = (card.getAttribute("data-search") || "").toLowerCase();
        var match = !q || hay.indexOf(q) !== -1;
        card.hidden = !match;
        if (match) visible++;
      });
      if (emptyState) emptyState.hidden = visible > 0;
      if (countEl) countEl.textContent = visible + " of " + cards.length + " guides";
    };
    searchInput.addEventListener("input", filter);
  }
})();
</script>`;
}

export function renderHelpPage(params: {
  owner?: any;
  base?: string;
  nonce?: string;
}): string {
  const base = (params.base || "https://krix.onrender.com").replace(/\/+$/, "");
  const mcpUrl = `${base}/mcp`;

  const categoryCards = HELP_CATEGORIES.map((cat) => {
    const searchIndex = `${cat.title} ${cat.summary} ${cat.topics.join(" ")} ${cat.keywords}`;
    const topicItems = cat.topics
      .map((t) => `<li>${escapeHtml(t)}</li>`)
      .join("");
    return `
      <a href="/help/${escapeHtml(cat.slug)}" class="help-cat-card" data-help-card data-search="${escapeHtml(searchIndex)}">
        <div class="help-cat-top">
          <span class="help-cat-icon" aria-hidden="true">${renderSvg(cat.icon, 20)}</span>
          <span class="doc-pill">${escapeHtml(cat.badge)}</span>
        </div>
        <h3 class="help-cat-title">${escapeHtml(cat.title)}</h3>
        <p class="help-cat-summary">${escapeHtml(cat.summary)}</p>
        <ul class="help-cat-topics">${topicItems}</ul>
        <div class="help-cat-foot">
          <span>${escapeHtml(cat.readTime)}</span>
          <span class="help-cat-arrow">Read guide ${renderSvg("chevron-right", 15)}</span>
        </div>
      </a>`;
  }).join("");

  const content = `
    <div class="doc-hero">
      <div class="doc-hero-copy">
        <span class="hm-kicker"><i></i><span>Krix Documentation &amp; Help Center</span></span>
        <h1 class="doc-hero-title">Everything you need to set up and master Krix</h1>
        <p class="doc-hero-sub">Step-by-step client guides, tool permissions, sandbox isolation, file storage, and security architecture—organized by category.</p>
        <div class="doc-search-wrap">
          <span class="doc-search-icon" aria-hidden="true">${renderSvg("search", 16)}</span>
          <label for="helpSearchInput" class="sr-only">Search help categories</label>
          <input id="helpSearchInput" class="doc-search-input" type="search" placeholder="Search guides (e.g. Cursor, OAuth, GitHub PAT, sandbox, Render, quotas)..." autocomplete="off">
        </div>
      </div>

      <div class="doc-endpoint-panel">
        <div class="doc-endpoint-panel-head">
          <span class="doc-eyebrow">MCP Endpoint</span>
          <span class="badge success">Streamable HTTP</span>
        </div>
        <div class="endpoint-row">
          <code>${escapeHtml(mcpUrl)}</code>
          <button type="button" class="btn sm doc-copy-btn" data-copy="${escapeHtml(mcpUrl)}" aria-label="Copy MCP endpoint URL">${renderSvg("copy", 14)}<span>Copy</span></button>
        </div>
        <p class="doc-endpoint-hint">Authenticate with <code class="inline-code">Authorization: Bearer &lt;key&gt;</code>, <code class="inline-code">x-api-key</code>, or OAuth 2.1 auto-discovery.</p>
        <div class="doc-quick-links">
          <a href="/api/keys" class="btn sm">${renderSvg("key", 14)}<span>API Keys</span></a>
          <a href="/settings" class="btn sm">${renderSvg("settings", 14)}<span>Settings</span></a>
          <a href="/tools" class="btn sm">${renderSvg("sliders", 14)}<span>Tools</span></a>
          <a href="/store" class="btn sm">${renderSvg("folder", 14)}<span>Files</span></a>
        </div>
      </div>
    </div>

    <section class="doc-section" aria-labelledby="help-categories-heading">
      <div class="doc-section-head">
        <div>
          <span class="doc-eyebrow">Browse by category</span>
          <h2 id="help-categories-heading" class="doc-section-title">Feature guides &amp; setup playbooks</h2>
        </div>
        <span id="helpCategoryCount" class="doc-count-pill">${HELP_CATEGORIES.length} of ${HELP_CATEGORIES.length} guides</span>
      </div>

      <div class="help-cat-grid">
        ${categoryCards}
      </div>

      <div id="helpSearchEmpty" class="panel empty" hidden>
        No matching guides found. Try searching for <strong>OAuth</strong>, <strong>GitHub</strong>, <strong>Sandbox</strong>, <strong>Render</strong>, or <strong>Quotas</strong>.
      </div>
    </section>

    <section class="doc-section" aria-labelledby="help-architecture-heading">
      <div class="doc-section-head">
        <div>
          <span class="doc-eyebrow">At a glance</span>
          <h2 id="help-architecture-heading" class="doc-section-title">What works out of the box</h2>
        </div>
      </div>
      <div class="panel flush">
        <div class="doc-table-wrap">
          <table class="doc-table">
            <thead>
              <tr>
                <th>Tool Group</th>
                <th>Tools</th>
                <th>Default State</th>
                <th>Requirement</th>
                <th>Guide</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Sandbox &amp; Local Git</strong></td>
                <td>15</td>
                <td><span class="badge success">Enabled</span></td>
                <td>Server <code class="inline-code">ENABLE_SANDBOX=true</code></td>
                <td><a class="doc-inline-link" href="/help/sandbox">Sandbox guide</a></td>
              </tr>
              <tr>
                <td><strong>GitHub (Core)</strong></td>
                <td>17</td>
                <td><span class="badge success">Enabled</span></td>
                <td>GitHub PAT in Settings</td>
                <td><a class="doc-inline-link" href="/help/github">GitHub guide</a></td>
              </tr>
              <tr>
                <td><strong>GitHub (Extended)</strong></td>
                <td>34</td>
                <td><span class="badge">Opt-in</span></td>
                <td>GitHub PAT + toggle in Settings</td>
                <td><a class="doc-inline-link" href="/help/github">GitHub guide</a></td>
              </tr>
              <tr>
                <td><strong>Render Cloud</strong></td>
                <td>21</td>
                <td><span class="badge">Opt-in</span></td>
                <td>Render API key + toggle in Settings</td>
                <td><a class="doc-inline-link" href="/help/render">Render guide</a></td>
              </tr>
              <tr>
                <td><strong>Code Graph + Web Search</strong></td>
                <td>30</td>
                <td><span class="badge">Opt-in</span></td>
                <td>Toggle ON in Settings</td>
                <td><a class="doc-inline-link" href="/help/code-graph">Code Graph guide</a></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="doc-section" aria-labelledby="help-faq-heading">
      <div class="doc-section-head">
        <div>
          <span class="doc-eyebrow">Common questions</span>
          <h2 id="help-faq-heading" class="doc-section-title">Frequently asked questions</h2>
        </div>
      </div>
      <div class="doc-faq-list">
        <details class="doc-faq">
          <summary>Why do some tools not appear in my AI assistant?</summary>
          <div class="doc-faq-body">
            Krix hides tools that are disabled or missing credentials so your assistant never wastes turns calling them. Extended GitHub, Render, and Code Graph start off by default—enable them in <a href="/settings">Settings</a> or on your API key's settings page, and make sure the corresponding GitHub or Render token is saved.
          </div>
        </details>
        <details class="doc-faq">
          <summary>Can I use different GitHub or Render credentials per API key?</summary>
          <div class="doc-faq-body">
            Yes. Open any key on <a href="/api/keys">API Keys</a> to configure key-specific provider tokens and tool overrides. Keys without overrides automatically inherit your workspace settings.
          </div>
        </details>
        <details class="doc-faq">
          <summary>How are my tokens and sandbox files protected?</summary>
          <div class="doc-faq-body">
            Provider credentials are encrypted at rest with AES-256-GCM, scrubbed from tool outputs by the redactor, and never exposed in sandbox child process environments. Each user's sandbox runs under an unprivileged Unix user in an isolated directory. See <a href="/help/security-and-quotas">Security &amp; Quotas</a> and our <a href="/privacy">Privacy Policy</a>.
          </div>
        </details>
        <details class="doc-faq">
          <summary>How long are uploaded and shared files kept?</summary>
          <div class="doc-faq-body">
            Files shared from the sandbox via <code class="inline-code">sandbox_store</code> expire automatically after <code class="inline-code">FILE_TTL_HOURS</code> (typically 48 hours) unless you mark them <strong>Permanent</strong> in <a href="/store">Files</a>. Web uploads via <a href="/upload">/upload</a> are retained for the configured retention window after the upload session closes.
          </div>
        </details>
      </div>
    </section>

    <div class="doc-legal-banner">
      <div>
        <div class="doc-legal-banner-title">Policies &amp; Governance</div>
        <p class="doc-legal-banner-sub">Review how Krix handles credentials, retention, sandbox boundaries, and acceptable use.</p>
      </div>
      <div class="cluster">
        <a href="/privacy" class="btn sm">${renderSvg("shield", 14)}<span>Privacy Policy</span></a>
        <a href="/terms" class="btn sm">${renderSvg("file-text", 14)}<span>Terms of Service</span></a>
      </div>
    </div>

    ${renderHelpScripts(params.nonce)}
  `;

  return renderPageShell({
    title: "Help Center - Krix",
    activeTab: "home",
    wide: true,
    content,
    owner: params.owner,
    nonce: params.nonce,
  });
}

export function renderHelpCategoryPage(params: {
  slug: string;
  owner?: any;
  base?: string;
  nonce?: string;
}): string | null {
  const category = getHelpCategory(params.slug);
  if (!category) return null;

  const base = (params.base || "https://krix.onrender.com").replace(/\/+$/, "");
  const mcpUrl = `${base}/mcp`;
  const idx = HELP_CATEGORIES.findIndex((c) => c.slug === category.slug);
  const prevCat = idx > 0 ? HELP_CATEGORIES[idx - 1] : null;
  const nextCat =
    idx >= 0 && idx < HELP_CATEGORIES.length - 1
      ? HELP_CATEGORIES[idx + 1]
      : null;

  const sidebarCats = HELP_CATEGORIES.map(
    (c) => `
      <a href="/help/${escapeHtml(c.slug)}" class="doc-side-link${c.slug === category.slug ? " active" : ""}">
        ${renderSvg(c.icon, 15)}
        <span>${escapeHtml(c.shortTitle)}</span>
      </a>`,
  ).join("");

  const tocLinks = category.sections
    .map(
      (s) =>
        `<a href="#${escapeHtml(s.id)}" class="doc-toc-link">${escapeHtml(s.title)}</a>`,
    )
    .join("");

  const sectionsHtml = category.sections
    .map(
      (s) => `
      <section id="${escapeHtml(s.id)}" class="doc-article-card prose">
        <h2>${escapeHtml(s.title)}</h2>
        ${s.render({ base, mcpUrl })}
      </section>`,
    )
    .join("");

  const content = `
    <nav class="doc-breadcrumb" aria-label="Breadcrumb">
      <a href="/help">Help Center</a>
      <span aria-hidden="true">${renderSvg("chevron-right", 14)}</span>
      <span aria-current="page">${escapeHtml(category.shortTitle)}</span>
    </nav>

    <div class="doc-article-header">
      <div class="doc-article-header-top">
        <span class="help-cat-icon lg" aria-hidden="true">${renderSvg(category.icon, 22)}</span>
        <span class="doc-pill">${escapeHtml(category.badge)}</span>
        <span class="doc-meta-dot" aria-hidden="true">·</span>
        <span class="doc-meta-text">${escapeHtml(category.readTime)}</span>
      </div>
      <h1 class="doc-article-title">${escapeHtml(category.title)}</h1>
      <p class="doc-article-sub">${escapeHtml(category.summary)}</p>
    </div>

    <div class="doc-layout">
      <aside class="doc-sidebar" aria-label="Documentation navigation">
        <div class="doc-side-card">
          <div class="doc-side-label">On this page</div>
          <nav class="doc-toc">${tocLinks}</nav>
        </div>
        <div class="doc-side-card">
          <div class="doc-side-label">All categories</div>
          <nav class="doc-side-nav">
            <a href="/help" class="doc-side-link">${renderSvg("book", 15)}<span>Overview</span></a>
            ${sidebarCats}
          </nav>
        </div>
      </aside>

      <article class="doc-main">
        ${sectionsHtml}

        <nav class="doc-pager" aria-label="Adjacent guides">
          ${
            prevCat
              ? `<a href="/help/${escapeHtml(prevCat.slug)}" class="doc-pager-card">
                  <span class="doc-pager-dir">${renderSvg("chevron-left", 14)} Previous</span>
                  <span class="doc-pager-title">${escapeHtml(prevCat.title)}</span>
                </a>`
              : `<a href="/help" class="doc-pager-card">
                  <span class="doc-pager-dir">${renderSvg("chevron-left", 14)} Back</span>
                  <span class="doc-pager-title">Help Center Overview</span>
                </a>`
          }
          ${
            nextCat
              ? `<a href="/help/${escapeHtml(nextCat.slug)}" class="doc-pager-card doc-pager-next">
                  <span class="doc-pager-dir">Next ${renderSvg("chevron-right", 14)}</span>
                  <span class="doc-pager-title">${escapeHtml(nextCat.title)}</span>
                </a>`
              : `<a href="/tools" class="doc-pager-card doc-pager-next">
                  <span class="doc-pager-dir">Explore ${renderSvg("chevron-right", 14)}</span>
                  <span class="doc-pager-title">Live Tools Catalog</span>
                </a>`
          }
        </nav>
      </article>
    </div>

    ${renderHelpScripts(params.nonce)}
  `;

  return renderPageShell({
    title: `${category.shortTitle} - Help - Krix`,
    activeTab: "home",
    width: "wide",
    content,
    owner: params.owner,
    nonce: params.nonce,
  });
}
