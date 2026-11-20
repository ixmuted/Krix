// Help Center & Category Documentation Pages for Krix MCP Gateway
// Modeled directly on the homepage visual system (.hm) with dedicated /help/:slug guides.

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
      "Configure any Streamable HTTP MCP client, desktop editor, or terminal agent against your Krix endpoint.",
    readTime: "4 min read",
    topics: [
      "Streamable HTTP endpoint (/mcp)",
      "JSON and CLI client configs",
      "Discovery and health checks",
      "Verifying the first tool call",
    ],
    keywords:
      "setup connect mcp streamable http client editor cli agent bearer x-api-key endpoint healthz discovery",
    sections: [
      {
        id: "endpoint",
        title: "1. Streamable HTTP endpoint",
        render: ({ mcpUrl }) => `
          <p>Krix exposes the Model Context Protocol over <strong>Streamable HTTP</strong> at <code class="inline-code">POST/GET /mcp</code>. Any MCP-compatible editor, desktop client, or command-line agent connects to this URL.</p>
          ${darkCodeBlock(
            "MCP Transport",
            `URL:     ${mcpUrl}
Header:  Authorization: Bearer YOUR_KRIX_API_KEY
   (or)  x-api-key: YOUR_KRIX_API_KEY`,
          )}
          ${editorialNote(
            "info",
            "Header authentication",
            `Pass your key in the <code class="inline-code">Authorization</code> or <code class="inline-code">x-api-key</code> header. Query-string keys (<code class="inline-code">?api_key=</code>) remain disabled unless the server sets <code class="inline-code">ALLOW_QUERY_API_KEY=true</code>.`,
          )}
        `,
      },
      {
        id: "client-configs",
        title: "2. Client configuration templates",
        render: ({ mcpUrl, base }) => `
          <p>If your client supports <strong>OAuth 2.1 discovery</strong>, enter only the <code class="inline-code">/mcp</code> URL and complete consent in the browser. Otherwise, attach an API key header using one of the formats below.</p>
          <div class="ant-two-col">
            <div class="ant-col-block">
              <h4>${renderSvg("command", 16)} Desktop &amp; IDE configuration</h4>
              <p>Standard <code class="inline-code">mcpServers</code> JSON block for desktop editors and IDE extensions:</p>
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
              <p>Streamable HTTP configuration using <code class="inline-code">x-api-key</code>:</p>
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
          <h3>Discovery and health endpoints</h3>
          ${darkCodeBlock(
            "Endpoints",
            `OAuth Metadata:  ${base}/.well-known/oauth-authorization-server
Resource Meta:   ${base}/.well-known/oauth-protected-resource
Health Check:    ${base}/healthz`,
          )}
        `,
      },
      {
        id: "first-call",
        title: "3. Verify your connection",
        render: () => `
          <p>After connecting, call <code class="inline-code">sandbox_status</code> to inspect available runtimes, memory, isolation status, and storage quota, or call <code class="inline-code">get_me</code> to confirm your GitHub token. You can also run any enabled tool directly from the <a class="ant-link" href="/tools">Tools catalog</a>.</p>
          ${editorialNote(
            "tip",
            "Set default repository context",
            `Call <code class="inline-code">set_active_context</code> once per session with your <code class="inline-code">owner</code>, <code class="inline-code">repo</code>, and <code class="inline-code">branch</code> so later GitHub calls do not need to repeat them.`,
          )}
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
      "Generate Krix API keys, store GitHub and Render credentials, set per-key overrides, and revoke OAuth clients.",
    readTime: "5 min read",
    topics: [
      "Creating a Krix API key",
      "Adding GitHub and Render tokens",
      "Per-key overrides vs workspace defaults",
      "OAuth 2.1 scopes and revocation",
    ],
    keywords:
      "add key create api key bearer x-api-key github pat render token credentials settings override oauth pkce revoke",
    sections: [
      {
        id: "create-krix-key",
        title: "1. Creating a Krix API key",
        render: () => `
          <p>Krix separates <strong>gateway API keys</strong> (used by your MCP client to authenticate with Krix) from <strong>provider credentials</strong> (your GitHub or Render tokens used by Krix to call upstream APIs).</p>
          <ol>
            <li><strong>Sign in:</strong> Open <a class="ant-link" href="/auth/google">Sign in</a> to initialize your isolated workspace and storage quota.</li>
            <li><strong>Open API Keys:</strong> Go to <a class="ant-link" href="/api">API keys</a> and create a new key.</li>
            <li><strong>Label the key:</strong> Use a clear name (such as <em>Workstation</em> or <em>Staging CI</em>) so it is easy to audit or revoke later.</li>
            <li><strong>Copy the key:</strong> Paste it into your MCP client's <code class="inline-code">Authorization: Bearer &lt;key&gt;</code> or <code class="inline-code">x-api-key</code> header.</li>
          </ol>
          ${editorialNote(
            "info",
            "Owner primary key",
            `The server's <code class="inline-code">MCP_API_KEY</code> environment variable serves as the primary owner key. Dynamic keys created in the dashboard support per-key tool toggles and provider overrides.`,
          )}
        `,
      },
      {
        id: "add-provider-tokens",
        title: "2. Adding GitHub and Render credentials",
        render: () => `
          <p>GitHub and Render tools remain disabled until a corresponding token is configured. You can add credentials at two levels:</p>
          <div class="ant-two-col">
            <div class="ant-col-block">
              <h4>${renderSvg("settings", 16)} Workspace-wide defaults</h4>
              <p>Open <a class="ant-link" href="/settings">Settings</a> and save your <strong>GitHub Personal Access Token</strong> and <strong>Render API Key</strong>. Every API key inherits these credentials unless overridden.</p>
            </div>
            <div class="ant-col-block">
              <h4>${renderSvg("sliders", 16)} Per-key overrides</h4>
              <p>Open any individual key on <a class="ant-link" href="/api">API keys</a> to attach a separate GitHub or Render token to that key alone—useful for isolating repositories, staging accounts, or read-only scopes.</p>
            </div>
          </div>
          ${editorialNote(
            "tip",
            "Encryption at rest and output redaction",
            `Provider tokens are encrypted at rest with <strong>AES-256-GCM</strong> (<code class="inline-code">KEY_ENCRYPTION_SECRET</code>) and scrubbed from tool outputs before responses return to the client.`,
          )}
        `,
      },
      {
        id: "precedence",
        title: "3. Tool permission precedence",
        render: () => `
          <p>A single resolver (<code class="inline-code">resolveToolState</code>) determines tool availability across <code class="inline-code">tools/list</code>, <code class="inline-code">tools/call</code>, OAuth scopes, and Settings in this order:</p>
          <ol>
            <li><strong>Server &amp; credential checks:</strong> Tools blocked by server configuration (such as <code class="inline-code">ENABLE_SANDBOX=false</code>) or missing required credentials stay disabled.</li>
            <li><strong>Per-key override:</strong> Toggles saved on a specific API key take priority for that key.</li>
            <li><strong>Workspace setting:</strong> Account-level toggles in <a class="ant-link" href="/settings">Settings</a>.</li>
            <li><strong>Defaults:</strong> All 15 Sandbox tools and 17 core GitHub tools start on. Extended GitHub (34), Render (21), and Code Graph (30) start off until enabled.</li>
          </ol>
        `,
      },
      {
        id: "oauth-and-revocation",
        title: "4. OAuth 2.1 clients and revocation",
        render: () => `
          <p>Clients that support OAuth 2.1 dynamic registration (<code class="inline-code">/oauth/register</code>) authenticate with PKCE S256 and RS256-signed tokens scoped to <code class="inline-code">mcp:tools</code>, <code class="inline-code">mcp:sandbox</code>, and <code class="inline-code">mcp:admin</code>.</p>
          <p style="margin-top:10px;">Revoking a key or OAuth client on <a class="ant-link" href="/api">API keys</a> immediately invalidates active sessions and clears cached key telemetry.</p>
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
      "Inspect file trees, search code, apply line-level edits, push multi-file commits, and manage pull requests, issues, and releases.",
    readTime: "4 min read",
    topics: [
      "Fine-grained PAT permissions",
      "17 core tools (default on)",
      "34 extended tools (opt-in)",
      "Line-level editing workflow",
    ],
    keywords:
      "github pat token octokit git_tree grep str_replace_editor patch_contents push_files pull request issues releases",
    sections: [
      {
        id: "github-setup",
        title: "1. Token permissions",
        render: () => `
          <p>Create a <strong>Fine-Grained Personal Access Token</strong> restricted to the repositories you intend to work on (with <em>Contents: Read &amp; Write</em> and <em>Pull Requests: Read &amp; Write</em>), or a Classic PAT with <code class="inline-code">repo</code> scope.</p>
          <p style="margin-top:10px;">Save the token in <a class="ant-link" href="/settings">Settings</a> or on a single key via <a class="ant-link" href="/api">API keys</a>.</p>
        `,
      },
      {
        id: "github-tiers",
        title: "2. Core vs. extended GitHub tools",
        render: () => `
          <div class="ant-table-wrap">
            <table class="ant-table">
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Default</th>
                  <th>Tools &amp; capabilities</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Core (17 tools)</strong></td>
                  <td><span class="badge success">Enabled</span></td>
                  <td><code class="inline-code">set_active_context</code>, <code class="inline-code">get_me</code>, <code class="inline-code">search_repositories</code>, <code class="inline-code">git_tree</code>, <code class="inline-code">view_file_outline</code>, <code class="inline-code">grep</code>, <code class="inline-code">search_code</code>, <code class="inline-code">get_file_contents</code>, <code class="inline-code">str_replace_editor</code>, <code class="inline-code">patch_contents</code>, <code class="inline-code">create_or_update_file</code>, <code class="inline-code">push_files</code>, <code class="inline-code">delete_file</code>, <code class="inline-code">list_branches</code>, <code class="inline-code">create_branch</code>, <code class="inline-code">delete_branch</code>, <code class="inline-code">create_pull_request</code>.</td>
                </tr>
                <tr>
                  <td><strong>Extended (34 tools)</strong></td>
                  <td><span class="badge">Opt-in</span></td>
                  <td>Issues and sub-issues, pull request reads/updates/merges, line-level reviews, commits, tags, releases, team membership, repository administration, and secret-scanning alerts.</td>
                </tr>
              </tbody>
            </table>
          </div>
        `,
      },
      {
        id: "github-workflow",
        title: "3. Recommended editing flow",
        render: () => `
          <ul>
            <li><strong>Inspect before reading full files:</strong> Use <code class="inline-code">git_tree</code>, <code class="inline-code">view_file_outline</code>, and <code class="inline-code">grep</code> with line windows.</li>
            <li><strong>Edit targeted ranges:</strong> Prefer <code class="inline-code">str_replace_editor</code> or <code class="inline-code">patch_contents</code> over full-file rewrites.</li>
            <li><strong>Batch commits:</strong> Use <code class="inline-code">push_files</code> to commit related edits atomically before opening a pull request.</li>
          </ul>
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
      "Execute code across 11+ runtimes, run tests, manage background jobs, and clone or push repositories inside an isolated Linux user.",
    readTime: "4 min read",
    topics: [
      "Pre-installed language runtimes",
      "Per-user Unix UID isolation",
      "Persistent shell and background jobs",
      "Command and network restrictions",
    ],
    keywords:
      "sandbox run exec install python node typescript go rust java cpp ruby php bash git_clone git_diff isolation uid",
    sections: [
      {
        id: "sandbox-runtimes",
        title: "1. Runtimes and tools",
        render: () => `
          <p>Sandbox commands run in child processes separate from the Krix server. The production container includes:</p>
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
          <div class="ant-table-wrap" style="margin-top:18px;">
            <table class="ant-table">
              <thead>
                <tr><th>Tool</th><th>Description</th></tr>
              </thead>
              <tbody>
                <tr><td><code class="inline-code">sandbox_run</code></td><td>Run inline code (Python by default, or pass <code class="inline-code">lang</code>) or execute an existing file.</td></tr>
                <tr><td><code class="inline-code">sandbox_exec</code></td><td>Run shell commands in your persistent workspace (supports <code class="inline-code">background: true</code>).</td></tr>
                <tr><td><code class="inline-code">sandbox_file</code></td><td>Read, write, append, replace (<code class="inline-code">old_str</code>/<code class="inline-code">new_str</code>), or delete files safely.</td></tr>
                <tr><td><code class="inline-code">sandbox_install</code></td><td>Install validated <code class="inline-code">npm</code> or <code class="inline-code">pip</code> packages.</td></tr>
                <tr><td><code class="inline-code">sandbox_ps</code> &amp; <code class="inline-code">sandbox_output</code></td><td>Manage background processes and page through truncated output via <code class="inline-code">outputId</code>.</td></tr>
                <tr><td><code class="inline-code">git_clone</code> / <code class="inline-code">git_checkout</code> / <code class="inline-code">git_diff</code> / <code class="inline-code">git_commit_push</code></td><td>Clone repos locally, run builds and tests, inspect diffs, and push commits.</td></tr>
                <tr><td><code class="inline-code">sandbox_status</code> &amp; <code class="inline-code">sandbox_reset</code></td><td>Check runtimes, memory, and storage quota, or clear the sandbox workspace.</td></tr>
              </tbody>
            </table>
          </div>
        `,
      },
      {
        id: "sandbox-isolation",
        title: "2. Isolation boundaries",
        render: () => `
          <div class="ant-two-col">
            <div class="ant-col-block">
              <h4>${renderSvg("check-circle", 16)} Supported workflows</h4>
              <ul>
                <li>Private <code class="inline-code">HOME</code>, <code class="inline-code">TMPDIR</code>, and working directory under an unprivileged Unix user.</li>
                <li>Persistent shell state, local git clones, test suites, and uploaded files under <code class="inline-code">upload/</code>.</li>
                <li>Idle cloned repositories clear automatically after <code class="inline-code">REPO_IDLE_MINUTES</code> (default 30 min).</li>
              </ul>
            </div>
            <div class="ant-col-block">
              <h4>${renderSvg("shield", 16)} Restrictions</h4>
              <ul>
                <li><strong>Scrubbed environment:</strong> Child processes cannot read <code class="inline-code">MCP_API_KEY</code>, GitHub/Render tokens, or <code class="inline-code">MONGODB_URI</code>.</li>
                <li><strong>Command &amp; network guards:</strong> <code class="inline-code">COMMAND_RESTRICTION_LEVEL</code> and <code class="inline-code">NETWORK_RESTRICTION_LEVEL</code> restrict dangerous commands and internal address probing.</li>
                <li><strong>Host requirement:</strong> Requires <code class="inline-code">ENABLE_SANDBOX=true</code> and OS isolation (Docker recommended).</li>
              </ul>
            </div>
          </div>
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
      "List services, trigger deployments, inspect runtime logs and metrics, update environment variables, and query Postgres.",
    readTime: "3 min read",
    topics: [
      "Connecting a Render API key",
      "Services and deployments",
      "Logs, metrics, and env vars",
      "Managed Postgres queries",
    ],
    keywords:
      "render deploy logs metrics env vars postgres database cloud web service static site",
    sections: [
      {
        id: "render-setup",
        title: "1. Setup",
        render: () => `
          <p>Render tools start <strong>off by default</strong>:</p>
          <ol>
            <li>Generate an API key in your Render account settings.</li>
            <li>Save the key in Krix <a class="ant-link" href="/settings">Settings</a> (or on a specific key in <a class="ant-link" href="/api">API keys</a>).</li>
            <li>Enable the <strong>Render</strong> tool group in Settings.</li>
          </ol>
        `,
      },
      {
        id: "render-tools",
        title: "2. Capabilities and controls",
        render: () => `
          <ul>
            <li><strong>Services &amp; deploys:</strong> <code class="inline-code">list_services</code>, <code class="inline-code">create_web_service</code>, and <code class="inline-code">trigger_deploy</code>.</li>
            <li><strong>Observability:</strong> <code class="inline-code">list_logs</code> and <code class="inline-code">get_metrics</code> for inspecting live behavior.</li>
            <li><strong>Configuration &amp; data:</strong> <code class="inline-code">update_env_vars</code> and <code class="inline-code">query_render_postgres</code>.</li>
          </ul>
          ${editorialNote(
            "warn",
            "Production impact",
            `Environment updates and service deletions apply immediately to your Render account. Disable write or delete tools per API key if you only need read access.`,
          )}
        `,
      },
    ],
  },
  {
    slug: "code-graph",
    num: "06",
    title: "Code graph & analysis",
    shortTitle: "Code graph",
    icon: "layers",
    badge: "30 tools",
    summary:
      "Index repositories into a structural symbol graph to trace callers, callees, inheritance hierarchies, dead code, and complexity.",
    readTime: "3 min read",
    topics: [
      "Enabling the cgc code graph",
      "Indexing and symbol lookups",
      "Dead code and complexity audits",
      "Integrated web_search tool",
    ],
    keywords:
      "code graph cgc callers callees hierarchy dead code complexity architecture report web_search ast",
    sections: [
      {
        id: "cg-overview",
        title: "1. Structural code analysis",
        render: () => `
          <p>The Code Graph group wraps the <code class="inline-code">cgc</code> CLI together with <code class="inline-code">web_search</code>. It starts <strong>off by default</strong>; enable it in <a class="ant-link" href="/settings">Settings</a> when you need cross-file call-chain or impact analysis.</p>
          <div class="ant-table-wrap" style="margin-top:16px;">
            <table class="ant-table">
              <thead>
                <tr><th>Task</th><th>Tool(s)</th></tr>
              </thead>
              <tbody>
                <tr><td>Index a cloned repository</td><td><code class="inline-code">add_code_to_graph</code></td></tr>
                <tr><td>Locate symbols and definitions</td><td><code class="inline-code">find_code</code></td></tr>
                <tr><td>Trace callers, callees, and hierarchy</td><td><code class="inline-code">analyze_code_relationships</code></td></tr>
                <tr><td>Find dead code or high complexity</td><td><code class="inline-code">find_dead_code</code>, <code class="inline-code">find_most_complex_functions</code></td></tr>
                <tr><td>Generate architecture summary</td><td><code class="inline-code">generate_report</code></td></tr>
                <tr><td>Query web documentation</td><td><code class="inline-code">web_search</code></td></tr>
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
      "Upload local files into your sandbox via /upload, share outputs through MongoDB GridFS, and manage retention in /store.",
    readTime: "3 min read",
    topics: [
      "Web upload sessions (/upload -> upload/)",
      "Sandbox Store (share, download, list, delete)",
      "Expiring vs. permanent files in /store",
      "Private IP download protection",
    ],
    keywords:
      "files upload store gridfs mongodb share link ttl permanent private public download ssrf",
    sections: [
      {
        id: "upload-and-store",
        title: "1. Moving files between your browser and sandbox",
        render: () => `
          <div class="ant-two-col">
            <div class="ant-col-block">
              <h4>${renderSvg("upload", 16)} Web uploads (<a class="ant-link" href="/upload">/upload</a>)</h4>
              <p>Open a short-lived upload session (<code class="inline-code">UPLOAD_SESSION_MINUTES</code>) and drop files from your machine. They appear inside your sandbox under <code class="inline-code">upload/</code> and expire after <code class="inline-code">UPLOAD_FILE_RETENTION_MINUTES</code>.</p>
            </div>
            <div class="ant-col-block">
              <h4>${renderSvg("files", 16)} Saved files (<a class="ant-link" href="/store">/store</a>)</h4>
              <p><code class="inline-code">sandbox_store</code> (<code class="inline-code">share</code>) saves sandbox files to MongoDB GridFS and returns an expiring private link (<code class="inline-code">FILE_TTL_HOURS</code>). In <a class="ant-link" href="/store">Files</a>, rename items, switch Private/Public visibility, or pin files as <strong>Permanent</strong>.</p>
            </div>
          </div>
          ${editorialNote(
            "info",
            "Remote download filtering",
            `<code class="inline-code">sandbox_store</code> (<code class="inline-code">download</code>) fetches public HTTP(S) URLs up to <code class="inline-code">DOWNLOAD_MAX_MB</code> and blocks private or internal network addresses unless <code class="inline-code">ALLOW_PRIVATE_DOWNLOADS=true</code>.`,
          )}
        `,
      },
    ],
  },
  {
    slug: "security-and-quotas",
    num: "08",
    title: "Security, quotas & troubleshooting",
    shortTitle: "Security & quotas",
    icon: "shield-check",
    badge: "Security",
    summary:
      "Credential encryption, output redaction, role-based resource quotas, email alerts, account deletion, and common error fixes.",
    readTime: "4 min read",
    topics: [
      "AES-256-GCM & HMAC-SHA256 audit logs",
      "Owner vs. standard user (50 MB) quotas",
      "30-day account deletion grace period",
      "Resolving 401, 429, and missing tools",
    ],
    keywords:
      "security encryption aes-256-gcm redaction audit hmac quotas 50mb rate limit email alerts deletion troubleshooting errors",
    sections: [
      {
        id: "security",
        title: "1. Encryption, redaction, and audit logs",
        render: () => `
          <ul>
            <li><strong>At rest:</strong> Provider credentials are encrypted with <strong>AES-256-GCM</strong> derived from <code class="inline-code">KEY_ENCRYPTION_SECRET</code>.</li>
            <li><strong>In transit &amp; output:</strong> Known secrets, request tokens, and connection-string passwords are redacted from tool outputs automatically.</li>
            <li><strong>Audit logs:</strong> Security events store IP addresses pseudonymized with <strong>HMAC-SHA256</strong> (<code class="inline-code">AUDIT_HASH_SECRET</code>).</li>
            <li><strong>Email notifications:</strong> When Gmail API or SMTP is configured, Krix sends notices on account creation, new-IP sign-ins, OAuth authorizations, and deletion requests.</li>
          </ul>
        `,
      },
      {
        id: "quotas",
        title: "2. Roles, quotas, and account deletion",
        render: () => `
          <div class="ant-table-wrap">
            <table class="ant-table">
              <thead>
                <tr><th>Role</th><th>Storage</th><th>Compute &amp; lifecycle</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Owner</strong> (<code class="inline-code">OWNER_EMAIL</code>)</td>
                  <td>Full server allocation</td>
                  <td>Full compute, memory, and process limits plus workspace administration.</td>
                </tr>
                <tr>
                  <td><strong>Standard user</strong></td>
                  <td><strong>50 MB</strong> isolated</td>
                  <td>Private workspace and Unix user with roughly one-tenth of owner compute, memory, and process limits.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style="margin-top:12px;">Scheduling account deletion in <a class="ant-link" href="/settings">Settings</a> starts a <strong>30-day grace period</strong>. Signing back in cancels it; after 30 days, keys, stored files, and the workspace are purged.</p>
        `,
      },
      {
        id: "troubleshooting",
        title: "3. Common errors",
        render: () => `
          <div class="ant-table-wrap">
            <table class="ant-table">
              <thead>
                <tr><th>Error</th><th>Cause &amp; fix</th></tr>
              </thead>
              <tbody>
                <tr><td><strong>401 Unauthorized</strong></td><td>Missing or revoked key, or key sent in <code class="inline-code">?api_key=</code> while <code class="inline-code">ALLOW_QUERY_API_KEY</code> is off. Send <code class="inline-code">Authorization: Bearer &lt;key&gt;</code>.</td></tr>
                <tr><td><strong>Tool missing</strong></td><td>The tool group is off by default or requires a GitHub/Render credential. Enable it in <a class="ant-link" href="/settings">Settings</a> or on the API key page.</td></tr>
                <tr><td><strong>Sandbox disabled</strong></td><td>Server has <code class="inline-code">ENABLE_SANDBOX=false</code> or lacks OS isolation. Deploy with the Docker image and <code class="inline-code">ENABLE_SANDBOX=true</code>.</td></tr>
                <tr><td><strong>429 Too Many Requests</strong></td><td>Exceeded <code class="inline-code">RATE_LIMIT_PER_MIN</code> or <code class="inline-code">MAX_SESSIONS</code>. Close idle sessions or retry after the rate-limit window resets.</td></tr>
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
    ["AES-256", "Encrypted provider credentials"],
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
          <p>Add your GitHub PAT or Render API key in <a class="ant-link" href="/settings">Settings</a> (encrypted with AES-256-GCM), or override them per key.</p>
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
        No guides matched your search. Try <strong>keys</strong>, <strong>OAuth</strong>, <strong>GitHub</strong>, <strong>sandbox</strong>, <strong>Render</strong>, or <strong>quotas</strong>.
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
                <td>Server <code class="inline-code">ENABLE_SANDBOX=true</code></td>
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
          <summary>How are credentials and sandbox processes isolated?</summary>
          <p>Provider tokens are encrypted at rest with AES-256-GCM, redacted from tool outputs, and excluded from sandbox child environments. Each user runs under an unprivileged Linux UID in a private workspace.</p>
        </details>
        <details class="hm-faq-item">
          <summary>How long are uploaded and shared files retained?</summary>
          <p>Files shared via sandbox_store expire after FILE_TTL_HOURS unless marked Permanent in Files. Web uploads from /upload clear automatically after the session retention window.</p>
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
          <span class="badge">${escapeHtml(category.badge)}</span>
          <span aria-hidden="true">·</span>
          <span>${escapeHtml(category.readTime)}</span>
        </div>
        <h1 class="ant-article-title">${escapeHtml(category.title)}</h1>
        <p class="ant-article-sub">${escapeHtml(category.summary)}</p>
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
