import { escapeHtml } from "../components.js";
import { renderSvg } from "../icons.js";
import { callout, codeBlock } from "./docsKit.js";
import type { HelpCategory } from "./helpTypes.js";

export const HELP_CORE: HelpCategory[] = [  {
    slug: "getting-started",
    title: "Getting started and client setup",
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
        title: "1. Your MCP endpoint",
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
        title: "2. Set up in three steps",
        render: () => `
          <div class="doc-steps">
            <div class="doc-step">
              <div class="doc-step-num">1</div>
              <div class="doc-step-body">
                <h4>Sign in with Google</h4>
                <p>Open <a href="/auth/google">Sign in</a> to initialize your isolated workspace, personal storage quota, and encrypted settings store.</p>
              </div>
            </div>
            <div class="doc-step">
              <div class="doc-step-num">2</div>
              <div class="doc-step-body">
                <h4>Create an API key or authorize via OAuth 2.1</h4>
                <p>Generate a scoped key on <a href="/api/keys">API Keys</a>, or point an OAuth-capable client (Claude, Gemini, ChatGPT) directly at <code class="inline-code">/mcp</code> to complete one-click PKCE consent.</p>
              </div>
            </div>
            <div class="doc-step">
              <div class="doc-step-num">3</div>
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
        title: "3. Configure your client",
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
        title: "4. Verify the connection",
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
    title: "API keys, OAuth 2.1 and permissions",
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
        title: "OAuth 2.1 scopes and endpoints",
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
          <p>You can revoke any API key or OAuth client instantly from <a href="/api/keys">API Keys</a>; revocation immediately invalidates active sessions and clears cached telemetry.</p>
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
    title: "GitHub tools",
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
    title: "Isolated sandbox and local Git",
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
        title: "Supported runtimes and tools",
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
          <div class="doc-table-wrap">
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
        title: "What works and what is restricted",
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
];
