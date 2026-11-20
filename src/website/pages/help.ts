// Help Center & Category Documentation Pages for Krix MCP Gateway
// Modeled on the homepage visual system (.hm) with detailed tool references,
// user-facing account limits, and zero internal security implementation leakage.

import { escapeHtml, renderPageShell } from "../components.js";
import { renderSvg } from "../icons.js";

export interface HelpSection {
  id: string;
  title: string;
  render: (ctx: { base: string; mcpUrl: string }) => string;
}

export interface HelpCategory {
  slug: string;
  num: string;
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

function darkCodeBlock(label: string, code: string): string {
  const escaped = escapeHtml(code);
  return `
    <div class="ant-code">
      <div class="ant-code-head">
        <span>${escapeHtml(label)}</span>
        <button type="button" class="ant-copy-dark doc-copy-btn" data-copy="${escaped}" aria-label="Copy ${escapeHtml(label)}">
          ${renderSvg("copy", 13)}<span>Copy</span>
        </button>
      </div>
      <pre><code>${escaped}</code></pre>
    </div>`;
}

function editorialNote(
  kind: "info" | "tip" | "warn",
  title: string,
  bodyHtml: string,
): string {
  const icon =
    kind === "warn" ? "warning" : kind === "tip" ? "sparkles" : "info";
  return `
    <div class="ant-note ${kind}">
      <div class="ant-note-icon" aria-hidden="true">${renderSvg(icon, 16)}</div>
      <div>
        <div class="ant-note-title">${escapeHtml(title)}</div>
        <div class="ant-note-text">${bodyHtml}</div>
      </div>
    </div>`;
}

function renderHelpSpotIllustration(): string {
  return `<svg class="hlp-spot-svg" viewBox="0 0 260 210" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="132" cy="106" r="84" fill="var(--bg-surface-2)" />
    <path d="M48 142 C66 108, 94 82, 130 76 C164 70, 188 92, 206 68" stroke="#d97757" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="4 5"/>
    <rect x="42" y="56" width="84" height="58" rx="12" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.5"/>
    <line x1="58" y1="76" x2="108" y2="76" stroke="var(--fg)" stroke-width="2" stroke-linecap="round"/>
    <line x1="58" y1="88" x2="98" y2="88" stroke="var(--fg-3)" stroke-width="1.6" stroke-linecap="round"/>
    <line x1="58" y1="98" x2="86" y2="98" stroke="var(--fg-3)" stroke-width="1.6" stroke-linecap="round"/>
    <rect x="124" y="98" width="92" height="64" rx="14" fill="#141413" stroke="rgba(250,249,245,0.16)" stroke-width="1.5"/>
    <circle cx="140" cy="114" r="3" fill="#d97757"/>
    <circle cx="150" cy="114" r="3" fill="#b0aea5"/>
    <circle cx="160" cy="114" r="3" fill="#788c5d"/>
    <path d="M139 132 L149 139 L139 146" stroke="#d97757" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="156" y1="146" x2="188" y2="146" stroke="#faf9f5" stroke-width="2" stroke-linecap="round"/>
    <circle cx="196" cy="50" r="15" fill="var(--accent-soft)" stroke="#d97757" stroke-width="1.5"/>
    <path d="M191 50 H201 M196 45 V55" stroke="#d97757" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    slug: "getting-started",
    num: "01",
    title: "Connecting an MCP client",
    shortTitle: "Getting started",
    icon: "zap",
    badge: "Setup",
    summary:
      "Connect any Streamable HTTP MCP client, desktop editor, or CLI agent to Krix and verify your first tool call.",
    readTime: "4 min read",
    topics: [
      "Streamable HTTP endpoint (/mcp)",
      "Desktop, IDE, and CLI configurations",
      "OAuth 2.1 automatic discovery",
      "Testing your first tool call",
    ],
    keywords:
      "setup connect mcp streamable http client editor cli agent bearer x-api-key endpoint oauth discovery",
    sections: [
      {
        id: "endpoint",
        title: "1. Streamable HTTP endpoint",
        render: ({ mcpUrl }) => `
          <p>Krix serves the Model Context Protocol over <strong>Streamable HTTP</strong> at <code class="inline-code">POST/GET /mcp</code>. Any MCP-compatible desktop editor, web assistant, or terminal agent connects using this single HTTPS endpoint.</p>
          ${darkCodeBlock(
            "MCP Transport",
            `URL:     ${mcpUrl}
Header:  Authorization: Bearer YOUR_KRIX_API_KEY
   (or)  x-api-key: YOUR_KRIX_API_KEY`,
          )}
          ${editorialNote(
            "info",
            "Use header authentication",
            `Always send your API key in the <code class="inline-code">Authorization</code> or <code class="inline-code">x-api-key</code> HTTP header rather than embedding secrets in query strings.`,
          )}
        `,
      },
      {
        id: "client-configs",
        title: "2. Client configuration templates",
        render: ({ mcpUrl }) => `
          <p>If your client supports <strong>OAuth 2.1 discovery</strong>, paste only the <code class="inline-code">/mcp</code> URL and approve access in the browser consent dialog—no manual key header is needed. For static API key connections, use one of the standard templates below.</p>
          <div class="ant-two-col">
            <div class="ant-col-block">
              <h4>${renderSvg("command", 16)} Desktop &amp; IDE JSON config</h4>
              <p>Add Krix under <code class="inline-code">mcpServers</code> in your editor or desktop client configuration:</p>
              ${darkCodeBlock(
                "mcp_config.json",
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
            <div class="ant-col-block">
              <h4>${renderSvg("terminal", 16)} CLI &amp; HTTP clients</h4>
              <p>For terminal agents or custom HTTP integrations using the <code class="inline-code">x-api-key</code> header:</p>
              ${darkCodeBlock(
                "Streamable HTTP",
                `{
  "transport": "streamable-http",
  "serverUrl": "${mcpUrl}",
  "headers": {
    "x-api-key": "YOUR_KRIX_API_KEY"
  }
}`,
              )}
            </div>
          </div>
        `,
      },
      {
        id: "first-call",
        title: "3. Verify your connection",
        render: () => `
          <p>Once connected, run a quick health check through your assistant or test any enabled tool directly in the browser from the <a class="ant-link" href="/tools">Tools catalog</a>:</p>
          <ul>
            <li>Call <code class="inline-code">sandbox_status</code> to verify available language runtimes, active repository state, and remaining storage quota.</li>
            <li>Call <code class="inline-code">get_me</code> after adding a GitHub token to confirm your authenticated GitHub account.</li>
            <li>Call <code class="inline-code">set_active_context</code> once per session with your default <code class="inline-code">owner</code>, <code class="inline-code">repo</code>, and <code class="inline-code">branch</code> so follow-up calls stay concise.</li>
          </ul>
        `,
      },
    ],
  },
  {
    slug: "adding-keys",
    num: "02",
    title: "Adding API keys & credentials",
    shortTitle: "Adding keys",
    icon: "key",
    badge: "Keys & auth",
    summary:
      "Create Krix API keys, attach GitHub and Render credentials, configure per-key overrides, and manage OAuth authorizations.",
    readTime: "5 min read",
    topics: [
      "Creating a Krix API key",
      "Adding GitHub and Render tokens",
      "Workspace defaults vs. per-key overrides",
      "OAuth 2.1 scopes and instant revocation",
    ],
    keywords:
      "add key create api key bearer x-api-key github pat render token credentials settings override oauth revoke",
    sections: [
      {
        id: "create-krix-key",
        title: "1. Creating a Krix API key",
        render: () => `
          <p>Krix separates <strong>gateway API keys</strong> (used by your MCP client to authenticate with Krix) from <strong>provider tokens</strong> (your GitHub or Render credentials used when Krix calls external APIs on your behalf).</p>
          <ol>
            <li><strong>Sign in:</strong> Open <a class="ant-link" href="/auth/google">Sign in</a> to initialize your isolated workspace and storage quota.</li>
            <li><strong>Open API keys:</strong> Navigate to <a class="ant-link" href="/api">API keys</a> and click <strong>Create API Key</strong>.</li>
            <li><strong>Label the key:</strong> Name each key by device or purpose (for example, <em>Laptop Editor</em> or <em>Docs Automation</em>) so you can track usage in <a class="ant-link" href="/stats">Usage</a> and revoke individually.</li>
            <li><strong>Store securely:</strong> Copy the key once and add it to your client's <code class="inline-code">Authorization: Bearer</code> or <code class="inline-code">x-api-key</code> header.</li>
          </ol>
        `,
      },
      {
        id: "add-provider-tokens",
        title: "2. Adding GitHub and Render tokens",
        render: () => `
          <p>GitHub and Render tools remain hidden until a valid token is saved, so your assistant never encounters broken authentication errors. You can configure credentials in two ways:</p>
          <div class="ant-two-col">
            <div class="ant-col-block">
              <h4>${renderSvg("settings", 16)} Workspace defaults</h4>
              <p>Open <a class="ant-link" href="/settings">Settings</a> to save your default <strong>GitHub Personal Access Token</strong> and <strong>Render API Key</strong>. All API keys and OAuth sessions inherit these credentials automatically unless overridden.</p>
            </div>
            <div class="ant-col-block">
              <h4>${renderSvg("sliders", 16)} Per-key overrides</h4>
              <p>Open any individual key on <a class="ant-link" href="/api">API keys</a> to bind a dedicated GitHub or Render token exclusively to that key—ideal for separating personal repositories, client projects, or read-only access.</p>
            </div>
          </div>
          ${editorialNote(
            "tip",
            "Strong credential protection",
            `All provider tokens are strongly encrypted at rest, never logged in analytics, and automatically filtered out of tool responses and sandbox environments.`,
          )}
        `,
      },
      {
        id: "precedence",
        title: "3. How tool permissions work",
        render: () => `
          <p>Tool availability is evaluated consistently across client discovery, tool execution, OAuth consent, and the Settings dashboard:</p>
          <ol>
            <li><strong>Credential requirements:</strong> GitHub and Render tools only activate when their respective token is present.</li>
            <li><strong>Per-key toggles:</strong> Custom enable/disable rules on an individual API key override your workspace defaults for that key alone.</li>
            <li><strong>Workspace settings:</strong> Your account-level toggles in <a class="ant-link" href="/settings">Settings</a> apply to all keys that inherit workspace configuration.</li>
            <li><strong>Starting defaults:</strong> Sandbox (15) and Core GitHub (17) tools start enabled. Extended GitHub (34), Render (21), and Code Graph (30) start off until you switch them on.</li>
          </ol>
        `,
      },
      {
        id: "oauth-and-revocation",
        title: "4. OAuth 2.1 connections and revocation",
        render: () => `
          <p>Clients that support OAuth 2.1 connect through a standard browser consent screen showing the requesting application and scopes (<code class="inline-code">mcp:tools</code>, <code class="inline-code">mcp:sandbox</code>, <code class="inline-code">mcp:admin</code>).</p>
          <p style="margin-top:10px;">You can revoke any API key or connected OAuth client at any time from <a class="ant-link" href="/api">API keys</a>. Revocation takes effect immediately and clears cached telemetry for that key.</p>
        `,
      },
    ],
  },
  {
    slug: "github",
    num: "03",
    title: "GitHub repositories & workflows",
    shortTitle: "GitHub",
    icon: "github",
    badge: "51 tools",
    summary:
      "Complete reference for all 17 core and 34 extended GitHub tools—repository search, surgical edits, branches, PRs, reviews, issues, and releases.",
    readTime: "7 min read",
    topics: [
      "Token setup & recommended scopes",
      "17 core tools (default enabled)",
      "34 extended tools (issues, PRs, releases, teams)",
      "Surgical editing workflow",
    ],
    keywords:
      "github pat token git_tree grep view_file_outline str_replace_editor patch_contents push_files pull request issues reviews releases tags commits",
    sections: [
      {
        id: "github-setup",
        title: "1. Token setup",
        render: () => `
          <p>Create a <strong>Fine-Grained Personal Access Token</strong> in GitHub scoped only to the repositories you want to work on (with <em>Contents: Read &amp; Write</em> and <em>Pull Requests: Read &amp; Write</em>, plus <em>Issues</em> if using extended tools), or a Classic PAT with <code class="inline-code">repo</code> scope.</p>
          <p style="margin-top:10px;">Save the token in <a class="ant-link" href="/settings">Settings</a> or on a dedicated key in <a class="ant-link" href="/api">API keys</a>. All GitHub tools automatically fall back to the default <code class="inline-code">owner</code>, <code class="inline-code">repo</code>, and <code class="inline-code">branch</code> set via <code class="inline-code">set_active_context</code>.</p>
        `,
      },
      {
        id: "github-core-read",
        title: "2. Core tools: Context, browsing & search (8 tools — enabled by default)",
        render: () => `
          <div class="ant-table-wrap">
            <table class="ant-table">
              <thead>
                <tr><th>Tool</th><th>What it does</th></tr>
              </thead>
              <tbody>
                <tr><td><code class="inline-code">set_active_context</code></td><td>Sets default <code class="inline-code">owner</code>, <code class="inline-code">repo</code>, <code class="inline-code">branch</code>, and optional sandbox directory for the session.</td></tr>
                <tr><td><code class="inline-code">get_me</code></td><td>Returns the authenticated GitHub user profile to verify token identity.</td></tr>
                <tr><td><code class="inline-code">search_repositories</code></td><td>Searches repositories or lists repositories accessible to your account.</td></tr>
                <tr><td><code class="inline-code">git_tree</code></td><td>Retrieves the recursive file path tree for a repository and branch.</td></tr>
                <tr><td><code class="inline-code">view_file_outline</code></td><td>Extracts top-level AST symbols (classes, functions, exports) from a source file without downloading its full body.</td></tr>
                <tr><td><code class="inline-code">grep</code></td><td>Pattern search across repository files with configurable line windows and path filters.</td></tr>
                <tr><td><code class="inline-code">search_code</code></td><td>GitHub code search across repositories by query, language, or path.</td></tr>
                <tr><td><code class="inline-code">get_file_contents</code></td><td>Reads a file or specific line range (<code class="inline-code">startLine</code> / <code class="inline-code">endLine</code>) from a branch or ref.</td></tr>
              </tbody>
            </table>
          </div>
        `,
      },
      {
        id: "github-core-write",
        title: "3. Core tools: Editing, branches & pull requests (9 tools — enabled by default)",
        render: () => `
          <div class="ant-table-wrap">
            <table class="ant-table">
              <thead>
                <tr><th>Tool</th><th>What it does</th></tr>
              </thead>
              <tbody>
                <tr><td><code class="inline-code">str_replace_editor</code></td><td>Replaces an exact block of text in a file and commits the change directly to the target branch.</td></tr>
                <tr><td><code class="inline-code">patch_contents</code></td><td>Replaces a specified 1-indexed line range in a file and commits the update.</td></tr>
                <tr><td><code class="inline-code">create_or_update_file</code></td><td>Creates a new file or overwrites an existing file with a commit message.</td></tr>
                <tr><td><code class="inline-code">delete_file</code></td><td>Removes a file from a branch with a commit message.</td></tr>
                <tr><td><code class="inline-code">push_files</code></td><td>Commits and pushes multiple file changes together in a single atomic commit.</td></tr>
                <tr><td><code class="inline-code">list_branches</code></td><td>Lists branches in a repository.</td></tr>
                <tr><td><code class="inline-code">create_branch</code></td><td>Creates a new branch from a base branch or commit SHA.</td></tr>
                <tr><td><code class="inline-code">delete_branch</code></td><td>Deletes a branch from the repository.</td></tr>
                <tr><td><code class="inline-code">create_pull_request</code></td><td>Opens a pull request with title, body, head branch, and base branch.</td></tr>
              </tbody>
            </table>
          </div>
          ${editorialNote(
            "tip",
            "Recommended editing workflow",
            `Use <code class="inline-code">git_tree</code>, <code class="inline-code">view_file_outline</code>, and <code class="inline-code">grep</code> to locate target lines first, then apply focused changes with <code class="inline-code">str_replace_editor</code> or <code class="inline-code">patch_contents</code>—or batch multi-file updates atomically with <code class="inline-code">push_files</code>.`,
          )}
        `,
      },
      {
        id: "github-extended",
        title: "4. Extended GitHub tools (34 tools — opt-in in Settings)",
        render: () => `
          <p>Switch on Extended GitHub in <a class="ant-link" href="/settings">Settings</a> (or per API key) to enable full issue tracking, PR review threads, releases, and repository administration:</p>
          <div class="ant-table-wrap" style="margin-top:14px;">
            <table class="ant-table">
              <thead>
                <tr><th>Area</th><th>Tools</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Issues &amp; sub-issues (6)</strong></td>
                  <td><code class="inline-code">list_issues</code>, <code class="inline-code">issue_read</code>, <code class="inline-code">issue_write</code>, <code class="inline-code">sub_issue_write</code>, <code class="inline-code">add_issue_comment</code>, <code class="inline-code">search_issues</code></td>
                </tr>
                <tr>
                  <td><strong>Pull requests &amp; reviews (9)</strong></td>
                  <td><code class="inline-code">list_pull_requests</code>, <code class="inline-code">pull_request_read</code>, <code class="inline-code">update_pull_request</code>, <code class="inline-code">update_pull_request_branch</code>, <code class="inline-code">merge_pull_request</code>, <code class="inline-code">pull_request_review_write</code>, <code class="inline-code">add_comment_to_pending_review</code>, <code class="inline-code">add_reply_to_pull_request_comment</code>, <code class="inline-code">search_pull_requests</code></td>
                </tr>
                <tr>
                  <td><strong>Commits, releases, tags &amp; labels (10)</strong></td>
                  <td><code class="inline-code">get_commit</code>, <code class="inline-code">search_commits</code>, <code class="inline-code">list_commits</code>, <code class="inline-code">get_label</code>, <code class="inline-code">list_issue_fields</code>, <code class="inline-code">list_issue_types</code>, <code class="inline-code">get_release</code>, <code class="inline-code">list_releases</code>, <code class="inline-code">get_tag</code>, <code class="inline-code">list_tags</code></td>
                </tr>
                <tr>
                  <td><strong>Teams &amp; collaborators (4)</strong></td>
                  <td><code class="inline-code">get_teams</code>, <code class="inline-code">get_team_members</code>, <code class="inline-code">list_repository_collaborators</code>, <code class="inline-code">search_users</code></td>
                </tr>
                <tr>
                  <td><strong>Repository &amp; automation (5)</strong></td>
                  <td><code class="inline-code">create_repository</code>, <code class="inline-code">fork_repository</code>, <code class="inline-code">run_secret_scanning</code>, plus automated PR review and issue assignment tools.</td>
                </tr>
              </tbody>
            </table>
          </div>
        `,
      },
    ],
  },
  {
    slug: "sandbox",
    num: "04",
    title: "Isolated sandbox & local git",
    shortTitle: "Sandbox",
    icon: "terminal",
    badge: "15 tools",
    summary:
      "Full reference for all 15 sandbox tools: multi-language execution, persistent shell, file editing, package installs, background jobs, and local git.",
    readTime: "6 min read",
    topics: [
      "11+ pre-installed language runtimes",
      "Execution, files & package tools (8)",
      "Local git workflow tools (6)",
      "Cloud file sharing & workspace lifecycle",
    ],
    keywords:
      "sandbox run exec install file ps output reset store python node typescript go rust java cpp ruby php bash git_clone git_checkout git_pull git_status git_diff git_commit_push",
    sections: [
      {
        id: "sandbox-runtimes",
        title: "1. Pre-installed language runtimes",
        render: () => `
          <p>Every account runs inside a dedicated, isolated Linux workspace with a persistent working directory and pre-installed developer toolchains:</p>
          <div class="ant-chips">
            <span class="ant-chip">Node.js</span>
            <span class="ant-chip">TypeScript (tsx / bun)</span>
            <span class="ant-chip">Python 3</span>
            <span class="ant-chip">Go</span>
            <span class="ant-chip">Rust</span>
            <span class="ant-chip">Java</span>
            <span class="ant-chip">C / C++</span>
            <span class="ant-chip">Ruby</span>
            <span class="ant-chip">PHP</span>
            <span class="ant-chip">Bash</span>
            <span class="ant-chip">Git CLI</span>
          </div>
        `,
      },
      {
        id: "sandbox-exec-tools",
        title: "2. Execution, files & process management (8 tools)",
        render: () => `
          <div class="ant-table-wrap">
            <table class="ant-table">
              <thead>
                <tr><th>Tool</th><th>What it does &amp; key usage</th></tr>
              </thead>
              <tbody>
                <tr><td><code class="inline-code">sandbox_status</code></td><td>Checks available runtimes, memory, storage quota usage, active cloned repo/branch, and files in <code class="inline-code">upload/</code>.</td></tr>
                <tr><td><code class="inline-code">sandbox_run</code></td><td>Runs inline code (Python by default, or pass <code class="inline-code">lang</code> for Node, TS, Go, Rust, C++, Java, Ruby, PHP, Bash) or executes an existing <code class="inline-code">filePath</code>.</td></tr>
                <tr><td><code class="inline-code">sandbox_exec</code></td><td>Runs shell commands in a persistent terminal session that preserves <code class="inline-code">cd</code>, exports, and virtualenvs. Pass <code class="inline-code">background: true</code> for dev servers or long builds.</td></tr>
                <tr><td><code class="inline-code">sandbox_file</code></td><td>Reads, writes, appends, edits via exact <code class="inline-code">old_str</code>/<code class="inline-code">new_str</code> replacement, or deletes sandbox files without shell-escaping pitfalls.</td></tr>
                <tr><td><code class="inline-code">sandbox_install</code></td><td>Installs registry <code class="inline-code">npm</code> or <code class="inline-code">pip</code> packages (with optional version pins) inside your workspace.</td></tr>
                <tr><td><code class="inline-code">sandbox_ps</code></td><td>Lists running background jobs, fetches their output, or terminates a job by PID (or <code class="inline-code">"all"</code>).</td></tr>
                <tr><td><code class="inline-code">sandbox_output</code></td><td>Pages through long command output that was truncated by <code class="inline-code">sandbox_exec</code>, <code class="inline-code">sandbox_run</code>, or <code class="inline-code">sandbox_install</code> using the returned <code class="inline-code">outputId</code>.</td></tr>
                <tr><td><code class="inline-code">sandbox_reset</code></td><td>Wipes scratch files, cloned repositories, persistent shell state, and background processes for a clean slate.</td></tr>
              </tbody>
            </table>
          </div>
        `,
      },
      {
        id: "sandbox-git-tools",
        title: "3. Local git synchronization (6 tools) & file store (1 tool)",
        render: () => `
          <div class="ant-table-wrap">
            <table class="ant-table">
              <thead>
                <tr><th>Tool</th><th>What it does</th></tr>
              </thead>
              <tbody>
                <tr><td><code class="inline-code">git_clone</code></td><td>Clones a GitHub repository into your sandbox so you can build, lint, and run full test suites locally.</td></tr>
                <tr><td><code class="inline-code">git_checkout</code></td><td>Switches to an existing branch or creates a new branch in the cloned repository.</td></tr>
                <tr><td><code class="inline-code">git_pull</code></td><td>Fast-forward pulls the latest commits on the active branch.</td></tr>
                <tr><td><code class="inline-code">git_status</code></td><td>Returns a compact summary of the active branch and modified files.</td></tr>
                <tr><td><code class="inline-code">git_diff</code></td><td>Shows unstaged or staged diffs, optionally scoped to a specific file path.</td></tr>
                <tr><td><code class="inline-code">git_commit_push</code></td><td>Stages, commits, and pushes verified local changes back to GitHub.</td></tr>
                <tr><td><code class="inline-code">sandbox_store</code></td><td>Moves files between your sandbox, cloud storage (<a class="ant-link" href="/store">/store</a>), and the web (<code class="inline-code">share</code>, <code class="inline-code">download</code>, <code class="inline-code">list</code>, <code class="inline-code">delete</code>).</td></tr>
              </tbody>
            </table>
          </div>
          ${editorialNote(
            "info",
            "Automatic workspace cleanup",
            `Idle cloned repositories are cleared automatically after 30 minutes of inactivity to preserve workspace storage. Push important changes to GitHub or save outputs to <a class="ant-link" href="/store">Files</a>.`,
          )}
        `,
      },
    ],
  },
  {
    slug: "render",
    num: "05",
    title: "Render cloud & Postgres",
    shortTitle: "Render",
    icon: "render",
    badge: "21 tools",
    summary:
      "Complete reference for all 21 Render tools: workspaces, web services, static sites, cron jobs, deploys, logs, metrics, env vars, and Postgres.",
    readTime: "5 min read",
    topics: [
      "Connecting your Render API key",
      "Workspaces & service lifecycle (10)",
      "Deploys, logs & metrics (7)",
      "Environment variables & Postgres (4)",
    ],
    keywords:
      "render workspace list_services create_web_service create_static_site create_cron_job trigger_deploy cancel_deploy list_logs get_metrics update_env_vars delete_env_var query_render_postgres",
    sections: [
      {
        id: "render-setup",
        title: "1. Enabling Render tools",
        render: () => `
          <p>Render tools start <strong>disabled by default</strong> until you connect a Render API key and switch them on:</p>
          <ol>
            <li>Generate an API key in your Render account settings.</li>
            <li>Save the key in Krix <a class="ant-link" href="/settings">Settings</a> (or on a specific key in <a class="ant-link" href="/api">API keys</a>).</li>
            <li>Toggle the <strong>Render</strong> tool group on in Settings.</li>
          </ol>
        `,
      },
      {
        id: "render-services",
        title: "2. Workspaces, services & deployments (14 tools)",
        render: () => `
          <div class="ant-table-wrap">
            <table class="ant-table">
              <thead>
                <tr><th>Group</th><th>Tools &amp; purpose</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Workspaces (3)</strong></td>
                  <td><code class="inline-code">list_workspaces</code>, <code class="inline-code">select_workspace</code>, and <code class="inline-code">get_selected_workspace</code> to scope operations to the right Render team.</td>
                </tr>
                <tr>
                  <td><strong>Services (7)</strong></td>
                  <td><code class="inline-code">list_services</code>, <code class="inline-code">get_service</code>, <code class="inline-code">create_web_service</code>, <code class="inline-code">create_static_site</code>, <code class="inline-code">create_cron_job</code>, <code class="inline-code">restart_service</code>, and <code class="inline-code">delete_service</code>.</td>
                </tr>
                <tr>
                  <td><strong>Deployments (4)</strong></td>
                  <td><code class="inline-code">list_deploys</code>, <code class="inline-code">get_deploy</code>, <code class="inline-code">trigger_deploy</code>, and <code class="inline-code">cancel_deploy</code>.</td>
                </tr>
              </tbody>
            </table>
          </div>
        `,
      },
      {
        id: "render-obs-data",
        title: "3. Logs, metrics, env vars & Postgres (7 tools)",
        render: () => `
          <div class="ant-table-wrap">
            <table class="ant-table">
              <thead>
                <tr><th>Tool</th><th>What it does</th></tr>
              </thead>
              <tbody>
                <tr><td><code class="inline-code">list_logs</code></td><td>Streams and filters runtime or build logs by service, time range, level, or text query.</td></tr>
                <tr><td><code class="inline-code">list_log_label_values</code></td><td>Lists available log filter labels and values for targeted log queries.</td></tr>
                <tr><td><code class="inline-code">get_metrics</code></td><td>Retrieves CPU, memory, HTTP request rate, and latency metrics for a service.</td></tr>
                <tr><td><code class="inline-code">list_env_vars</code></td><td>Inspects configured environment variable keys on a service.</td></tr>
                <tr><td><code class="inline-code">update_env_vars</code></td><td>Creates or updates environment variables on a service.</td></tr>
                <tr><td><code class="inline-code">delete_env_var</code></td><td>Removes a specific environment variable from a service.</td></tr>
                <tr><td><code class="inline-code">query_render_postgres</code></td><td>Executes SQL queries against a connected Render Postgres instance for inspection and debugging.</td></tr>
              </tbody>
            </table>
          </div>
          ${editorialNote(
            "warn",
            "Live production changes",
            `Service deletions, restarts, and environment updates take effect immediately on your Render account. If you want read-only monitoring on a key, disable write and delete tools on that key's settings page.`,
          )}
        `,
      },
    ],
  },
  {
    slug: "code-graph",
    num: "06",
    title: "Code graph & structural analysis",
    shortTitle: "Code graph",
    icon: "layers",
    badge: "30 tools",
    summary:
      "Index repositories into a structural symbol graph to trace callers, callees, class hierarchies, dead code, complexity hotspots, and web references.",
    readTime: "5 min read",
    topics: [
      "Indexing repositories & background jobs",
      "Call-chain & relationship tracing",
      "Dead code & complexity analysis",
      "Architecture reports & web search",
    ],
    keywords:
      "code graph add_code_to_graph find_code analyze_code_relationships find_dead_code calculate_cyclomatic_complexity find_most_complex_functions generate_report web_search",
    sections: [
      {
        id: "cg-indexing",
        title: "1. Indexing & watching repositories",
        render: () => `
          <p>The Code Graph tool group starts <strong>off by default</strong>. Enable it in <a class="ant-link" href="/settings">Settings</a> whenever you need structural impact analysis across multi-file codebases.</p>
          <div class="ant-table-wrap" style="margin-top:14px;">
            <table class="ant-table">
              <thead>
                <tr><th>Tool</th><th>What it does</th></tr>
              </thead>
              <tbody>
                <tr><td><code class="inline-code">add_code_to_graph</code></td><td>Parses a cloned repository directory into the structural symbol graph.</td></tr>
                <tr><td><code class="inline-code">add_package_to_graph</code></td><td>Indexes an installed library or package so cross-package calls can be inspected.</td></tr>
                <tr><td><code class="inline-code">list_jobs</code> &amp; <code class="inline-code">check_job_status</code></td><td>Tracks background indexing jobs and reports completion progress.</td></tr>
                <tr><td><code class="inline-code">watch_directory</code> / <code class="inline-code">unwatch_directory</code> / <code class="inline-code">list_watched_paths</code></td><td>Keeps the graph synchronized as files change during active development.</td></tr>
                <tr><td><code class="inline-code">delete_repository</code></td><td>Removes a previously indexed repository from the graph store.</td></tr>
              </tbody>
            </table>
          </div>
        `,
      },
      {
        id: "cg-analysis",
        title: "2. Relationships, quality audits & web search",
        render: () => `
          <div class="ant-table-wrap">
            <table class="ant-table">
              <thead>
                <tr><th>Tool</th><th>What it does</th></tr>
              </thead>
              <tbody>
                <tr><td><code class="inline-code">find_code</code></td><td>Locates functions, classes, methods, and symbols across indexed repositories.</td></tr>
                <tr><td><code class="inline-code">analyze_code_relationships</code></td><td>Traces callers, callees, class inheritance hierarchies, and import dependencies to measure refactor blast radius.</td></tr>
                <tr><td><code class="inline-code">execute_cypher_query</code> &amp; <code class="inline-code">visualize_graph_query</code></td><td>Runs custom read-only graph queries and outputs structured relationship views.</td></tr>
                <tr><td><code class="inline-code">find_dead_code</code></td><td>Identifies unreferenced functions, unused helpers, and orphaned modules.</td></tr>
                <tr><td><code class="inline-code">calculate_cyclomatic_complexity</code> &amp; <code class="inline-code">find_most_complex_functions</code></td><td>Scores function complexity and ranks the highest-risk hotspots for refactoring.</td></tr>
                <tr><td><code class="inline-code">generate_report</code></td><td>Produces a high-level architectural overview of modules, entry points, and dependency graphs.</td></tr>
                <tr><td><code class="inline-code">web_search</code></td><td>Searches public web documentation and references during technical research.</td></tr>
              </tbody>
            </table>
          </div>
        `,
      },
    ],
  },
  {
    slug: "files-and-store",
    num: "07",
    title: "Uploads & file storage",
    shortTitle: "Files & store",
    icon: "files",
    badge: "Storage",
    summary:
      "Upload local datasets into your sandbox via /upload, share outputs from the sandbox via sandbox_store, and manage retention in /store.",
    readTime: "4 min read",
    topics: [
      "Web upload sessions (/upload -> upload/)",
      "sandbox_file vs. sandbox_store",
      "Expiring vs. permanent files in /store",
      "Private and public download links",
    ],
    keywords:
      "files upload store share link ttl permanent private public download sandbox_store sandbox_file",
    sections: [
      {
        id: "upload-vs-store",
        title: "1. Web uploads vs. saved files",
        render: () => `
          <div class="ant-two-col">
            <div class="ant-col-block">
              <h4>${renderSvg("upload", 16)} Web uploads (<a class="ant-link" href="/upload">/upload</a>)</h4>
              <p>Start a short-lived upload session and drop local datasets, archives, or documents from your browser. Files land inside your sandbox under <code class="inline-code">upload/</code> so your assistant can inspect or process them immediately, then clear automatically after the retention window.</p>
            </div>
            <div class="ant-col-block">
              <h4>${renderSvg("files", 16)} Saved files (<a class="ant-link" href="/store">/store</a>)</h4>
              <p>Use <code class="inline-code">sandbox_store</code> (<code class="inline-code">share</code>) to persist generated outputs and receive a private expiring download link. In <a class="ant-link" href="/store">Files</a>, you can rename items, switch between <strong>Private</strong> and <strong>Public</strong> visibility, mark files <strong>Permanent</strong>, download them, or delete them anytime.</p>
            </div>
          </div>
        `,
      },
      {
        id: "store-actions",
        title: "2. sandbox_store actions",
        render: () => `
          <div class="ant-table-wrap">
            <table class="ant-table">
              <thead>
                <tr><th>Action</th><th>What it does</th></tr>
              </thead>
              <tbody>
                <tr><td><code class="inline-code">share</code></td><td>Uploads a file from your sandbox to cloud storage and returns a private expiring download URL.</td></tr>
                <tr><td><code class="inline-code">download</code></td><td>Fetches a public HTTP(S) file directly into your sandbox for processing.</td></tr>
                <tr><td><code class="inline-code">list</code></td><td>Lists files currently stored in your account's file store along with expiration and size metadata.</td></tr>
                <tr><td><code class="inline-code">delete</code></td><td>Permanently removes a stored file and frees up space against your 50 MB storage quota.</td></tr>
              </tbody>
            </table>
          </div>
          ${editorialNote(
            "tip",
            "sandbox_file vs. sandbox_store",
            `Use <code class="inline-code">sandbox_file</code> for reading and editing local workspace files during coding; use <code class="inline-code">sandbox_store</code> when moving files between the sandbox, the web, and your browser.`,
          )}
        `,
      },
    ],
  },
  {
    slug: "security-and-quotas",
    num: "08",
    title: "Security, limits & troubleshooting",
    shortTitle: "Security & limits",
    icon: "shield-check",
    badge: "Security",
    summary:
      "How Krix protects your credentials and workspace, what your account storage and compute limits include, and how to resolve common errors.",
    readTime: "4 min read",
    topics: [
      "Credential protection & workspace isolation",
      "Account storage & compute limits",
      "Security alerts & account deletion",
      "Troubleshooting common errors",
    ],
    keywords:
      "security protection isolation quotas 50mb storage limits rate limit email alerts deletion troubleshooting errors 401 429",
    sections: [
      {
        id: "security",
        title: "1. How your account is protected",
        render: () => `
          <div class="ant-two-col">
            <div class="ant-col-block">
              <h4>${renderSvg("lock", 16)} Encrypted credentials &amp; redaction</h4>
              <p>Provider tokens and API credentials are strongly encrypted at rest, never stored in usage analytics, and automatically filtered out of tool outputs before responses reach your assistant.</p>
            </div>
            <div class="ant-col-block">
              <h4>${renderSvg("shield-check", 16)} Isolated workspaces</h4>
              <p>Every account runs inside its own isolated execution environment and private directory. Sandbox processes cannot access other users' files, server secrets, or your stored provider credentials.</p>
            </div>
            <div class="ant-col-block">
              <h4>${renderSvg("sliders", 16)} Granular access &amp; instant revocation</h4>
              <p>Toggle individual tools on or off globally or per API key. Revoking a key or OAuth client on <a class="ant-link" href="/api">API keys</a> ends active access immediately.</p>
            </div>
            <div class="ant-col-block">
              <h4>${renderSvg("activity", 16)} Activity alerts &amp; monitoring</h4>
              <p>Automated email notifications alert you on account creation, new sign-ins, OAuth client approvals, and account deletion requests so unexpected activity is spotted early.</p>
            </div>
          </div>
        `,
      },
      {
        id: "quotas",
        title: "2. Account limits & data lifecycle",
        render: () => `
          <div class="ant-table-wrap">
            <table class="ant-table">
              <thead>
                <tr><th>Resource</th><th>What your account includes</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>File storage</strong></td>
                  <td><strong>50 MB</strong> of isolated storage across uploads and saved files. Monitor live usage on <a class="ant-link" href="/store">Files</a> or via <code class="inline-code">sandbox_status</code>.</td>
                </tr>
                <tr>
                  <td><strong>Compute &amp; sessions</strong></td>
                  <td>Dedicated sandbox memory, process limits, and per-minute rate limits designed to keep execution responsive and fair for every user.</td>
                </tr>
                <tr>
                  <td><strong>Temporary files &amp; repos</strong></td>
                  <td>Web uploads clear after 24 hours, shared links expire automatically unless marked <strong>Permanent</strong> in <a class="ant-link" href="/store">Files</a>, and idle cloned repositories clear after 30 minutes.</td>
                </tr>
                <tr>
                  <td><strong>Account deletion</strong></td>
                  <td>Requesting account deletion in <a class="ant-link" href="/settings">Settings</a> begins a <strong>30-day grace period</strong>. Signing back in cancels it; after 30 days, all keys, stored files, and workspace data are permanently removed.</td>
                </tr>
              </tbody>
            </table>
          </div>
        `,
      },
      {
        id: "troubleshooting",
        title: "3. Troubleshooting common errors",
        render: () => `
          <div class="ant-table-wrap">
            <table class="ant-table">
              <thead>
                <tr><th>Error</th><th>Likely cause &amp; fix</th></tr>
              </thead>
              <tbody>
                <tr><td><strong>401 Unauthorized</strong></td><td>The API key is missing, expired, or revoked, or was sent in the URL instead of a header. Send a valid key in <code class="inline-code">Authorization: Bearer &lt;key&gt;</code> or reconnect via OAuth 2.1.</td></tr>
                <tr><td><strong>Tool not listed in client</strong></td><td>Opt-in groups (Extended GitHub, Render, Code Graph) start off by default, or the required GitHub/Render token is missing. Check <a class="ant-link" href="/settings">Settings</a> and your key's overrides.</td></tr>
                <tr><td><strong>Storage quota reached</strong></td><td>Delete unused items in <a class="ant-link" href="/store">Files</a> or run <code class="inline-code">sandbox_reset</code> to clear scratch workspace files.</td></tr>
                <tr><td><strong>429 Too Many Requests</strong></td><td>Your key exceeded the per-minute request limit or active session cap. Close idle client sessions and retry shortly.</td></tr>
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

  const stats = [
    ["117", "MCP tools across four groups"],
    ["8", "Category setup guides"],
    ["11+", "Sandbox language runtimes"],
    ["50 MB", "Isolated account storage"],
  ];

  const guideCards = HELP_CATEGORIES.map((cat) => {
    const searchIndex = `${cat.title} ${cat.summary} ${cat.topics.join(" ")} ${cat.keywords}`;
    const topicItems = cat.topics
      .map((t) => `<li>${escapeHtml(t)}</li>`)
      .join("");
    return `
      <a href="/help/${escapeHtml(cat.slug)}" class="hlp-card" data-help-card data-search="${escapeHtml(searchIndex)}">
        <div class="hlp-card-top">
          <span class="feature-icon">${renderSvg(cat.icon, 18)}</span>
          <span class="badge">${escapeHtml(cat.badge)}</span>
        </div>
        <h3 class="hlp-card-title">${escapeHtml(cat.title)}</h3>
        <p class="hlp-card-desc">${escapeHtml(cat.summary)}</p>
        <ul class="hlp-card-topics">${topicItems}</ul>
        <div class="hlp-card-foot">
          <span>${escapeHtml(cat.readTime)}</span>
          <span class="hlp-card-go">Read guide ${renderSvg("chevron-right", 14)}</span>
        </div>
      </a>`;
  }).join("");

  const content = `
  <div class="hm">
    <section class="hm-hero">
      <div class="hm-hero-text">
        <h1 class="hm-title"><strong>Krix documentation.</strong> Setup, credentials, and tool reference.</h1>
        <p class="hm-lead">Connect any Streamable HTTP MCP client, configure API keys and provider tokens, and manage permissions across every tool group.</p>
        <div class="hlp-search-wrap">
          <span class="hlp-search-icon" aria-hidden="true">${renderSvg("search", 16)}</span>
          <label for="helpSearchInput" class="sr-only">Search guides</label>
          <input id="helpSearchInput" class="hlp-search-input" type="search" placeholder="Search guides" autocomplete="off">
        </div>
        <div class="hm-cta">
          <a href="/help/adding-keys" class="btn primary">${renderSvg("key", 15)}<span>Adding keys</span></a>
          <a href="/api" class="btn">${renderSvg("sliders", 15)}<span>API keys</span></a>
          <a href="/tools" class="btn ghost">${renderSvg("terminal", 15)}<span>Tools catalog</span></a>
        </div>
      </div>
      <div class="hm-art hlp-hero-art">
        ${renderHelpSpotIllustration()}
      </div>
    </section>

    <section class="hm-stats" aria-label="Documentation overview">
      ${stats.map((s) => `<div class="hm-stat"><div class="hm-stat-n">${s[0]}</div><div class="hm-stat-l">${escapeHtml(s[1])}</div></div>`).join("")}
    </section>

    <section class="hlp-transport" aria-label="Streamable HTTP Transport">
      <div class="hlp-transport-copy">
        <div class="hm-eyebrow">Streamable HTTP Transport</div>
        <h2 class="hlp-transport-title">Connect over one authenticated endpoint</h2>
        <p class="hlp-transport-sub">Point your MCP client at <code class="inline-code">/mcp</code> using a Bearer key from API keys or OAuth 2.1 discovery.</p>
        <div class="hlp-transport-actions">
          <a href="/help/adding-keys" class="ant-slate-btn primary">${renderSvg("key", 15)}<span>Adding keys</span></a>
          <a href="/api" class="ant-slate-btn">${renderSvg("plus", 15)}<span>API keys</span></a>
          <a href="/settings" class="ant-slate-btn">${renderSvg("settings", 15)}<span>Settings</span></a>
        </div>
      </div>
      <div class="hlp-transport-box">
        <div class="hlp-transport-meta">
          <span>POST / GET · Streamable HTTP</span>
          <span>TLS</span>
        </div>
        <div class="hlp-transport-url">
          <code>${escapeHtml(mcpUrl)}</code>
          <button type="button" class="ant-copy-dark doc-copy-btn" data-copy="${escapeHtml(mcpUrl)}" aria-label="Copy MCP endpoint URL">${renderSvg("copy", 13)}<span>Copy</span></button>
        </div>
        <div class="hlp-transport-headers">
          <div><span>Authorization:</span> Bearer &lt;api-key&gt;</div>
          <div><span>x-api-key:</span> &lt;api-key&gt;</div>
        </div>
      </div>
    </section>

    <section>
      <div class="hm-sec-head">
        <div class="hm-eyebrow">Keys &amp; credentials</div>
        <h2 class="hm-h2">Add your keys in three steps</h2>
        <p class="hm-sub">Create a Krix key for your client, then attach optional GitHub or Render tokens.</p>
      </div>
      <div class="hm-steps">
        <div class="hm-step">
          <div class="hm-step-n">01</div>
          <h3>Create a Krix API key</h3>
          <p>Sign in and open <a class="ant-link" href="/api">API keys</a> to generate a key. Send it in the <code class="inline-code">Authorization: Bearer</code> or <code class="inline-code">x-api-key</code> header.</p>
        </div>
        <div class="hm-step">
          <div class="hm-step-n">02</div>
          <h3>Save provider tokens</h3>
          <p>Add your GitHub PAT or Render API key in <a class="ant-link" href="/settings">Settings</a> (protected with strong encryption at rest), or override them per key.</p>
        </div>
        <div class="hm-step">
          <div class="hm-step-n">03</div>
          <h3>Enable tool groups</h3>
          <p>Sandbox (15) and core GitHub (17) tools start enabled. Switch extended GitHub, Render, or Code Graph on in Settings.</p>
        </div>
      </div>
    </section>

    <section aria-labelledby="help-categories-heading">
      <div class="hlp-sec-row">
        <div class="hm-sec-head" style="margin-bottom:0;">
          <div class="hm-eyebrow">Guides</div>
          <h2 id="help-categories-heading" class="hm-h2">Browse by topic</h2>
        </div>
        <span id="helpCategoryCount" class="ant-count-pill">${HELP_CATEGORIES.length} of ${HELP_CATEGORIES.length} guides</span>
      </div>

      <div class="hlp-grid">
        ${guideCards}
      </div>

      <div id="helpSearchEmpty" class="panel empty" hidden>
        No guides matched your search. Try <strong>keys</strong>, <strong>OAuth</strong>, <strong>GitHub</strong>, <strong>sandbox</strong>, <strong>Render</strong>, or <strong>limits</strong>.
      </div>
    </section>

    <section aria-labelledby="help-defaults-heading">
      <div class="hm-sec-head">
        <div class="hm-eyebrow">Defaults</div>
        <h2 id="help-defaults-heading" class="hm-h2">Tool availability by group</h2>
      </div>
      <div class="panel flush">
        <div class="ant-table-wrap" style="border:0;">
          <table class="ant-table">
            <thead>
              <tr>
                <th>Group</th>
                <th>Tools</th>
                <th>Default</th>
                <th>Requirement</th>
                <th>Guide</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Sandbox &amp; Local Git</strong></td>
                <td>15</td>
                <td><span class="badge success">Enabled</span></td>
                <td>Included with your workspace</td>
                <td><a class="ant-link" href="/help/sandbox">Sandbox</a></td>
              </tr>
              <tr>
                <td><strong>GitHub (Core)</strong></td>
                <td>17</td>
                <td><span class="badge success">Enabled</span></td>
                <td>GitHub PAT in Settings</td>
                <td><a class="ant-link" href="/help/github">GitHub</a></td>
              </tr>
              <tr>
                <td><strong>GitHub (Extended)</strong></td>
                <td>34</td>
                <td><span class="badge">Opt-in</span></td>
                <td>GitHub PAT + Settings toggle</td>
                <td><a class="ant-link" href="/help/github">GitHub</a></td>
              </tr>
              <tr>
                <td><strong>Render Cloud</strong></td>
                <td>21</td>
                <td><span class="badge">Opt-in</span></td>
                <td>Render API key + Settings toggle</td>
                <td><a class="ant-link" href="/help/render">Render</a></td>
              </tr>
              <tr>
                <td><strong>Code Graph + Web Search</strong></td>
                <td>30</td>
                <td><span class="badge">Opt-in</span></td>
                <td>Settings toggle ON</td>
                <td><a class="ant-link" href="/help/code-graph">Code graph</a></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section aria-labelledby="help-faq-heading">
      <div class="hm-sec-head">
        <div class="hm-eyebrow">FAQ</div>
        <h2 id="help-faq-heading" class="hm-h2">Common questions</h2>
      </div>
      <div class="hm-faq">
        <details class="hm-faq-item">
          <summary>Why do some tools not appear in my client?</summary>
          <p>Krix lists only tools that are enabled and have valid credentials. Extended GitHub, Render, and Code Graph start disabled—turn them on in Settings (or per key) and confirm your GitHub or Render token is saved.</p>
        </details>
        <details class="hm-faq-item">
          <summary>Can different API keys use different GitHub or Render tokens?</summary>
          <p>Yes. Open any key on API keys to set per-key credentials and tool overrides. Keys without overrides inherit your workspace settings.</p>
        </details>
        <details class="hm-faq-item">
          <summary>How are my credentials and workspace protected?</summary>
          <p>Provider tokens are strongly encrypted at rest, automatically filtered from tool outputs, and never exposed inside sandbox environments. Every account runs in an isolated workspace separate from other users.</p>
        </details>
        <details class="hm-faq-item">
          <summary>How long are uploaded and shared files retained?</summary>
          <p>Web uploads clear automatically after 24 hours, and shared links expire unless you mark a file Permanent in Files. Idle cloned repositories clear after 30 minutes.</p>
        </details>
      </div>
    </section>

    <section class="hm-final">
      <h2 class="hm-h2">Ready to configure your workspace?</h2>
      <p class="hm-sub">Generate an API key, review available tools, or read our security and legal policies.</p>
      <div class="hm-cta" style="justify-content:center;">
        <a href="/api" class="btn primary">${renderSvg("key", 15)}<span>API keys</span></a>
        <a href="/tools" class="btn">${renderSvg("terminal", 15)}<span>Tools catalog</span></a>
        <a href="/privacy" class="btn ghost">${renderSvg("shield", 15)}<span>Privacy</span></a>
        <a href="/terms" class="btn ghost">${renderSvg("files", 15)}<span>Terms</span></a>
      </div>
    </section>
  </div>

  ${renderHelpScripts(params.nonce)}
  `;

  return renderPageShell({
    title: "Help - Krix",
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
      <a href="/help/${escapeHtml(c.slug)}" class="ant-rail-link${c.slug === category.slug ? " active" : ""}">
        ${renderSvg(c.icon, 15)}
        <span>${escapeHtml(c.shortTitle)}</span>
      </a>`,
  ).join("");

  const tocLinks = category.sections
    .map(
      (s) =>
        `<a href="#${escapeHtml(s.id)}" class="ant-rail-link">${escapeHtml(s.title)}</a>`,
    )
    .join("");

  const jumpPills = category.sections
    .map(
      (s) =>
        `<a href="#${escapeHtml(s.id)}" class="hlp-jump-pill">${escapeHtml(s.title)}</a>`,
    )
    .join("");

  const sectionsHtml = category.sections
    .map(
      (s) => `
      <section id="${escapeHtml(s.id)}" class="ant-chapter prose">
        <h2>${escapeHtml(s.title)}</h2>
        ${s.render({ base, mcpUrl })}
      </section>`,
    )
    .join("");

  const content = `
    <nav class="ant-crumb" aria-label="Breadcrumb">
      <a href="/help">Help</a>
      <span aria-hidden="true">${renderSvg("chevron-right", 14)}</span>
      <span aria-current="page">${escapeHtml(category.shortTitle)}</span>
    </nav>

    <header class="ant-article-head">
      <div class="ant-article-head-main">
        <div class="ant-article-meta">
          <span class="feature-icon">${renderSvg(category.icon, 16)}</span>
          <span class="badge">${escapeHtml(category.badge)}</span>
          <span aria-hidden="true">·</span>
          <span>${escapeHtml(category.readTime)}</span>
        </div>
        <h1 class="ant-article-title">${escapeHtml(category.title)}</h1>
        <p class="ant-article-sub">${escapeHtml(category.summary)}</p>
        <nav class="hlp-jump-bar" aria-label="Jump to section">${jumpPills}</nav>
      </div>
    </header>

    <div class="ant-article-grid">
      <aside class="ant-rail" aria-label="Guide navigation">
        <div class="ant-rail-group">
          <div class="ant-rail-label">On this page</div>
          <nav class="ant-rail-list">${tocLinks}</nav>
        </div>
        <div class="ant-rail-group">
          <div class="ant-rail-label">All guides</div>
          <nav class="ant-rail-list">
            <a href="/help" class="ant-rail-link">${renderSvg("book", 15)}<span>Overview</span></a>
            ${sidebarCats}
          </nav>
        </div>
      </aside>

      <article class="ant-article-body">
        ${sectionsHtml}

        <nav class="ant-pager" aria-label="Adjacent guides">
          ${
            prevCat
              ? `<a href="/help/${escapeHtml(prevCat.slug)}" class="ant-pager-link">
                  <span class="ant-pager-dir">${renderSvg("chevron-left", 14)} Previous</span>
                  <span class="ant-pager-title">${escapeHtml(prevCat.title)}</span>
                </a>`
              : `<a href="/help" class="ant-pager-link">
                  <span class="ant-pager-dir">${renderSvg("chevron-left", 14)} Back</span>
                  <span class="ant-pager-title">Help overview</span>
                </a>`
          }
          ${
            nextCat
              ? `<a href="/help/${escapeHtml(nextCat.slug)}" class="ant-pager-link next">
                  <span class="ant-pager-dir">Next ${renderSvg("chevron-right", 14)}</span>
                  <span class="ant-pager-title">${escapeHtml(nextCat.title)}</span>
                </a>`
              : `<a href="/tools" class="ant-pager-link next">
                  <span class="ant-pager-dir">Browse ${renderSvg("chevron-right", 14)}</span>
                  <span class="ant-pager-title">Tools catalog</span>
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
    wide: true,
    content,
    owner: params.owner,
    nonce: params.nonce,
  });
}
