// Help Center & Category Documentation Pages for Krix MCP Gateway
// Anthropic-inspired editorial layout: warm paper canvas, serif authority,
// hairline index, slate-dark endpoint band, organic spot illustrations,
// vendor-neutral client guides, and dedicated key-setup documentation.

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
  return `<svg class="ant-spot-svg" viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="122" cy="100" r="78" fill="var(--bg-surface-2)" />
    <path d="M52 134 C68 102, 92 78, 124 72 C156 66, 178 86, 194 64" stroke="#d97757" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="4 5"/>
    <rect x="44" y="54" width="76" height="54" rx="10" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.5"/>
    <line x1="58" y1="72" x2="104" y2="72" stroke="var(--fg)" stroke-width="2" stroke-linecap="round"/>
    <line x1="58" y1="84" x2="94" y2="84" stroke="var(--fg-3)" stroke-width="1.6" stroke-linecap="round"/>
    <line x1="58" y1="94" x2="84" y2="94" stroke="var(--fg-3)" stroke-width="1.6" stroke-linecap="round"/>
    <rect x="118" y="96" width="84" height="58" rx="12" fill="#141413" stroke="rgba(250,249,245,0.16)" stroke-width="1.5"/>
    <circle cx="133" cy="111" r="3" fill="#d97757"/>
    <circle cx="143" cy="111" r="3" fill="#b0aea5"/>
    <circle cx="153" cy="111" r="3" fill="#788c5d"/>
    <path d="M132 128 L142 135 L132 142" stroke="#d97757" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="149" y1="142" x2="178" y2="142" stroke="#faf9f5" stroke-width="2" stroke-linecap="round"/>
    <circle cx="182" cy="48" r="14" fill="var(--accent-soft)" stroke="#d97757" stroke-width="1.5"/>
    <path d="M177 48 H187 M182 43 V53" stroke="#d97757" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    slug: "getting-started",
    num: "01",
    title: "Connecting Any MCP Client",
    shortTitle: "Getting Started",
    icon: "zap",
    badge: "Start here",
    summary:
      "Connect any Streamable HTTP MCP client, desktop AI editor, or CLI agent to Krix in under two minutes.",
    readTime: "4 min read",
    topics: [
      "Streamable HTTP endpoint (/mcp)",
      "Generic JSON & CLI client setup",
      "Discovery manifests & server cards",
      "Verifying your first tool call",
    ],
    keywords:
      "setup connect mcp streamable http client editor cli agent bearer x-api-key endpoint healthz discovery",
    sections: [
      {
        id: "endpoint",
        title: "1. Your Streamable HTTP MCP endpoint",
        render: ({ mcpUrl }) => `
          <p>Krix serves the Model Context Protocol over <strong>Streamable HTTP</strong> at <code class="inline-code">POST/GET /mcp</code>. Any modern MCP-compatible desktop editor, web assistant, or terminal agent connects to this single URL.</p>
          ${darkCodeBlock(
            "MCP Transport Endpoint",
            `URL:     ${mcpUrl}
Header:  Authorization: Bearer YOUR_KRIX_API_KEY
   (or)  x-api-key: YOUR_KRIX_API_KEY`,
          )}
          ${editorialNote(
            "info",
            "Headers over query strings",
            `Always send your API key in the <code class="inline-code">Authorization</code> or <code class="inline-code">x-api-key</code> header. Passing <code class="inline-code">?api_key=</code> in the URL is disabled by default unless the host explicitly sets <code class="inline-code">ALLOW_QUERY_API_KEY=true</code>.`,
          )}
        `,
      },
      {
        id: "client-configs",
        title: "2. Client configuration templates",
        render: ({ mcpUrl, base }) => `
          <p>Use the template matching your client type. If your client supports <strong>OAuth 2.1 auto-discovery</strong>, enter only the <code class="inline-code">/mcp</code> URL and complete the browser consent screen—no static key header required.</p>
          <div class="ant-two-col">
            <div class="ant-col-block">
              <h4>${renderSvg("command", 16)} Desktop &amp; IDE MCP Config</h4>
              <p>Standard <code class="inline-code">mcpServers</code> JSON configuration for desktop editors and IDE extensions:</p>
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
              <h4>${renderSvg("terminal", 16)} CLI &amp; Streamable HTTP Clients</h4>
              <p>For terminal-based agents or custom HTTP integrations using <code class="inline-code">x-api-key</code>:</p>
              ${darkCodeBlock(
                "Streamable HTTP Request",
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
          <h3>Discovery &amp; health endpoints</h3>
          ${darkCodeBlock(
            "Discovery Endpoints",
            `Server Card:     ${base}/.well-known/mcp/server-card.json
MCP Manifest:    ${base}/.well-known/mcp.json
OAuth Metadata:  ${base}/.well-known/oauth-authorization-server
Health Check:    ${base}/healthz`,
          )}
        `,
      },
      {
        id: "first-call",
        title: "3. Verify your connection",
        render: () => `
          <p>Once connected, ask your assistant to call <code class="inline-code">sandbox_status</code> (inspects runtimes, memory, isolation, and storage quota) or <code class="inline-code">get_me</code> (confirms your GitHub identity). You can also test any enabled tool interactively in the <a class="ant-link" href="/tools">Tools catalog</a>.</p>
          ${editorialNote(
            "tip",
            "Bind your active repository context once",
            `Ask your assistant to run <code class="inline-code">set_active_context</code> with your default <code class="inline-code">owner</code>, <code class="inline-code">repo</code>, and <code class="inline-code">branch</code> so subsequent tool calls stay concise.`,
          )}
        `,
      },
    ],
  },
  {
    slug: "adding-keys",
    num: "02",
    title: "Adding API Keys & Provider Credentials",
    shortTitle: "Adding Keys",
    icon: "key",
    badge: "Essential",
    summary:
      "Create Krix API keys, attach GitHub and Render tokens safely, configure per-key overrides, and manage OAuth 2.1 clients.",
    readTime: "5 min read",
    topics: [
      "Creating a Krix API key",
      "Adding GitHub & Render tokens",
      "Per-key overrides vs workspace defaults",
      "OAuth 2.1 scopes & instant revocation",
    ],
    keywords:
      "add key create api key bearer x-api-key github pat render token credentials settings override oauth pkce revoke",
    sections: [
      {
        id: "create-krix-key",
        title: "1. Creating your Krix API key",
        render: () => `
          <p>Krix separates <strong>gateway authentication keys</strong> (which let an AI client talk to Krix) from <strong>upstream provider tokens</strong> (which let Krix act on GitHub or Render on your behalf).</p>
          <ol>
            <li><strong>Sign in:</strong> Open <a class="ant-link" href="/auth/google">Sign in</a> to initialize your isolated workspace and quota.</li>
            <li><strong>Open API Keys:</strong> Navigate to <a class="ant-link" href="/api/keys">API Keys</a> in the menu and click <strong>Create API Key</strong>.</li>
            <li><strong>Name your key:</strong> Give it a descriptive label (for example, <em>Work Laptop Editor</em> or <em>CI Review Agent</em>) so you can audit or revoke it later.</li>
            <li><strong>Copy immediately:</strong> Save the generated token securely and paste it into your MCP client's <code class="inline-code">Authorization: Bearer &lt;key&gt;</code> or <code class="inline-code">x-api-key</code> header.</li>
          </ol>
          ${editorialNote(
            "info",
            "Owner primary key",
            `The server operator's <code class="inline-code">MCP_API_KEY</code> environment variable acts as the primary owner key. Additional keys created in the dashboard respect role quotas and individual tool overrides.`,
          )}
        `,
      },
      {
        id: "add-provider-tokens",
        title: "2. Adding GitHub & Render provider keys",
        render: () => `
          <p>Without upstream credentials, GitHub and Render tools stay disabled so your assistant never hits auth errors. You can add provider tokens in two places:</p>
          <div class="ant-two-col">
            <div class="ant-col-block">
              <h4>${renderSvg("settings", 16)} Workspace-Wide (Recommended)</h4>
              <p>Open <a class="ant-link" href="/settings">Settings → Provider Credentials</a> to save your default <strong>GitHub Personal Access Token</strong> and <strong>Render API Key</strong>. Every Krix API key you create inherits these automatically unless overridden.</p>
            </div>
            <div class="ant-col-block">
              <h4>${renderSvg("sliders", 16)} Per-Key Overrides</h4>
              <p>Click any individual key on <a class="ant-link" href="/api/keys">API Keys</a> to bind a separate GitHub or Render token exclusively to that key—ideal for isolating client work, staging environments, or read-only tokens.</p>
            </div>
          </div>
          ${editorialNote(
            "tip",
            "Encrypted at rest & redacted in flight",
            `All provider tokens are encrypted at rest using <strong>AES-256-GCM</strong> (<code class="inline-code">KEY_ENCRYPTION_SECRET</code>) and automatically scrubbed from every tool response before reaching your AI assistant.`,
          )}
        `,
      },
      {
        id: "precedence",
        title: "3. How tool permissions & overrides resolve",
        render: () => `
          <p>A single resolver (<code class="inline-code">resolveToolState</code>) controls <code class="inline-code">tools/list</code>, <code class="inline-code">tools/call</code>, OAuth scopes, and the Settings UI in strict priority order:</p>
          <ol>
            <li><strong>Hard server &amp; credential gates:</strong> If the host disables a category (e.g. <code class="inline-code">ENABLE_SANDBOX=false</code>) or a required GitHub/Render credential is missing, those tools stay off.</li>
            <li><strong>Key-specific override:</strong> Toggles configured on a single API key override workspace defaults for that key only.</li>
            <li><strong>Workspace setting:</strong> Your account-level toggles in <a class="ant-link" href="/settings">Settings</a>.</li>
            <li><strong>Built-in defaults:</strong> All 15 Sandbox tools and 17 core GitHub tools start ON; Extended GitHub (34), Render (21), and Code Graph (30) start OFF until enabled.</li>
          </ol>
        `,
      },
      {
        id: "oauth-and-revocation",
        title: "4. OAuth 2.1 clients & revoking keys",
        render: () => `
          <p>Clients supporting OAuth 2.1 dynamic registration (<code class="inline-code">/oauth/register</code>) use PKCE S256 and RS256-signed tokens scoped to <code class="inline-code">mcp:tools</code>, <code class="inline-code">mcp:sandbox</code>, and <code class="inline-code">mcp:admin</code>.</p>
          <p style="margin-top:10px;">If a key or connected client is no longer needed—or suspected compromised—revoke it immediately from <a class="ant-link" href="/api/keys">API Keys</a>. Revocation terminates active sessions and wipes cached key telemetry.</p>
        `,
      },
    ],
  },
  {
    slug: "github",
    num: "03",
    title: "GitHub Repositories & Workflows",
    shortTitle: "GitHub (51 Tools)",
    icon: "github",
    badge: "51 tools",
    summary:
      "Explore repositories, search code, perform surgical line edits, push atomic multi-file commits, and manage PRs, issues, and releases.",
    readTime: "4 min read",
    topics: [
      "Fine-Grained PAT setup",
      "17 core tools (default on)",
      "34 extended tools (opt-in)",
      "Surgical line-window editing",
    ],
    keywords:
      "github pat token octokit git_tree grep str_replace_editor patch_contents push_files pull request issues releases",
    sections: [
      {
        id: "github-setup",
        title: "1. Preparing your GitHub token",
        render: () => `
          <p>Generate a <strong>Fine-Grained Personal Access Token</strong> scoped only to the repositories you want AI assistants to access (granting <em>Contents: Read &amp; Write</em> and <em>Pull Requests: Read &amp; Write</em>), or a Classic PAT with <code class="inline-code">repo</code> scope.</p>
          <p style="margin-top:10px;">Save the token in <a class="ant-link" href="/settings">Settings</a> (or on a specific API key). See <a class="ant-link" href="/help/adding-keys">Adding Keys</a> for per-key isolation tips.</p>
        `,
      },
      {
        id: "github-tiers",
        title: "2. Core vs. Extended GitHub tools",
        render: () => `
          <div class="ant-table-wrap">
            <table class="ant-table">
              <thead>
                <tr>
                  <th>Tier</th>
                  <th>Default</th>
                  <th>Included Capabilities</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Core (17 tools)</strong></td>
                  <td><span class="badge success">On</span></td>
                  <td><code class="inline-code">set_active_context</code>, <code class="inline-code">get_me</code>, <code class="inline-code">search_repositories</code>, <code class="inline-code">git_tree</code>, <code class="inline-code">view_file_outline</code>, <code class="inline-code">grep</code>, <code class="inline-code">search_code</code>, <code class="inline-code">get_file_contents</code>, <code class="inline-code">str_replace_editor</code>, <code class="inline-code">patch_contents</code>, <code class="inline-code">create_or_update_file</code>, <code class="inline-code">push_files</code>, <code class="inline-code">delete_file</code>, <code class="inline-code">list_branches</code>, <code class="inline-code">create_branch</code>, <code class="inline-code">delete_branch</code>, <code class="inline-code">create_pull_request</code>.</td>
                </tr>
                <tr>
                  <td><strong>Extended (34 tools)</strong></td>
                  <td><span class="badge">Opt-in</span></td>
                  <td>Issues &amp; sub-issues, PR reads/updates/merges, line-level PR reviews, commit &amp; tag history, releases, team membership, repo admin, and secret-scanning alerts.</td>
                </tr>
              </tbody>
            </table>
          </div>
        `,
      },
      {
        id: "github-workflow",
        title: "3. Surgical editing best practices",
        render: () => `
          <ul>
            <li><strong>Read selectively:</strong> Use <code class="inline-code">git_tree</code>, <code class="inline-code">view_file_outline</code>, and <code class="inline-code">grep</code> with line windows instead of pulling entire large files.</li>
            <li><strong>Patch rather than rewrite:</strong> Use <code class="inline-code">str_replace_editor</code> or <code class="inline-code">patch_contents</code> to modify only changed lines.</li>
            <li><strong>Atomic commits:</strong> Use <code class="inline-code">push_files</code> to commit multi-file updates together in a single clean commit.</li>
          </ul>
        `,
      },
    ],
  },
  {
    slug: "sandbox",
    num: "04",
    title: "Isolated Sandbox & Local Git",
    shortTitle: "Sandbox (15 Tools)",
    icon: "terminal",
    badge: "15 tools",
    summary:
      "Run code across 11+ language runtimes, execute test suites, manage background processes, and work with local git safely.",
    readTime: "4 min read",
    topics: [
      "11+ pre-installed runtimes",
      "Unprivileged Unix UID isolation",
      "Persistent shell & background jobs",
      "Command & network guardrails",
    ],
    keywords:
      "sandbox run exec install python node typescript go rust java cpp ruby php bash git_clone git_diff isolation uid",
    sections: [
      {
        id: "sandbox-runtimes",
        title: "1. Pre-installed runtimes & tools",
        render: () => `
          <p>Sandbox tools execute inside isolated child processes—never inside the Krix server process. Supported runtimes include:</p>
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
                <tr><th>Tool</th><th>Purpose</th></tr>
              </thead>
              <tbody>
                <tr><td><code class="inline-code">sandbox_run</code></td><td>Execute inline code (default Python, or specify <code class="inline-code">lang</code>) or run a file path.</td></tr>
                <tr><td><code class="inline-code">sandbox_exec</code></td><td>Run shell commands in your persistent workspace (supports <code class="inline-code">background: true</code>).</td></tr>
                <tr><td><code class="inline-code">sandbox_file</code></td><td>Read, write, append, edit (<code class="inline-code">old_str</code>/<code class="inline-code">new_str</code>), or delete files without shell-escaping bugs.</td></tr>
                <tr><td><code class="inline-code">sandbox_install</code></td><td>Install validated <code class="inline-code">npm</code> or <code class="inline-code">pip</code> packages.</td></tr>
                <tr><td><code class="inline-code">sandbox_ps</code> &amp; <code class="inline-code">sandbox_output</code></td><td>Inspect/stop background processes and page through truncated output via <code class="inline-code">outputId</code>.</td></tr>
                <tr><td><code class="inline-code">git_clone</code> / <code class="inline-code">git_checkout</code> / <code class="inline-code">git_diff</code> / <code class="inline-code">git_commit_push</code></td><td>Clone repositories, run builds/tests locally, review diffs, and push changes.</td></tr>
                <tr><td><code class="inline-code">sandbox_status</code> &amp; <code class="inline-code">sandbox_reset</code></td><td>Check runtimes, memory, and storage quota, or wipe the sandbox clean.</td></tr>
              </tbody>
            </table>
          </div>
        `,
      },
      {
        id: "sandbox-isolation",
        title: "2. Isolation boundaries & guardrails",
        render: () => `
          <div class="ant-two-col">
            <div class="ant-col-block">
              <h4>${renderSvg("check-circle", 16)} What works</h4>
              <ul>
                <li>Private <code class="inline-code">HOME</code>, <code class="inline-code">TMPDIR</code>, and working directory under an unprivileged Unix UID.</li>
                <li>Persistent shell state, local git clones, test suites, and <code class="inline-code">upload/</code> user datasets.</li>
                <li>Automatic cleanup of idle cloned repos after <code class="inline-code">REPO_IDLE_MINUTES</code> (default 30 min).</li>
              </ul>
            </div>
            <div class="ant-col-block">
              <h4>${renderSvg("shield", 16)} Security limits</h4>
              <ul>
                <li><strong>Scrubbed environment:</strong> Child processes cannot access <code class="inline-code">MCP_API_KEY</code>, GitHub/Render tokens, or <code class="inline-code">MONGODB_URI</code>.</li>
                <li><strong>Command &amp; network guards:</strong> <code class="inline-code">COMMAND_RESTRICTION_LEVEL</code> and <code class="inline-code">NETWORK_RESTRICTION_LEVEL</code> block destructive commands and private/internal network probing.</li>
                <li><strong>Host requirement:</strong> Active only when <code class="inline-code">ENABLE_SANDBOX=true</code> and OS isolation is available.</li>
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
    title: "Cloud Services & Managed Postgres",
    shortTitle: "Render (21 Tools)",
    icon: "render",
    badge: "21 tools",
    summary:
      "Inspect web services, trigger deploys, stream runtime logs, check CPU/memory metrics, update env vars, and query Postgres.",
    readTime: "3 min read",
    topics: [
      "Adding your Render API key",
      "Services & deploy triggers",
      "Logs, metrics & env vars",
      "Managed Postgres queries",
    ],
    keywords:
      "render deploy logs metrics env vars postgres database cloud web service static site",
    sections: [
      {
        id: "render-setup",
        title: "1. Enabling Render management tools",
        render: () => `
          <p>Render tools start <strong>off by default</strong>. To enable them:</p>
          <ol>
            <li>Generate an API key in your Render Account Settings.</li>
            <li>Save the key in Krix <a class="ant-link" href="/settings">Settings → Provider Credentials</a> (or per-key on <a class="ant-link" href="/api/keys">API Keys</a>).</li>
            <li>Toggle the <strong>Render</strong> tool group ON in Settings.</li>
          </ol>
        `,
      },
      {
        id: "render-tools",
        title: "2. Capabilities & safety",
        render: () => `
          <ul>
            <li><strong>Services &amp; Deploys:</strong> <code class="inline-code">list_services</code>, <code class="inline-code">create_web_service</code>, and <code class="inline-code">trigger_deploy</code>.</li>
            <li><strong>Observability:</strong> <code class="inline-code">list_logs</code> and <code class="inline-code">get_metrics</code> for diagnosing live production issues.</li>
            <li><strong>Configuration &amp; Data:</strong> <code class="inline-code">update_env_vars</code> and <code class="inline-code">query_render_postgres</code>.</li>
          </ul>
          ${editorialNote(
            "warn",
            "Production changes take effect immediately",
            `Environment variable updates and service deletions apply directly to your Render account. Disable destructive tools per API key if you want read-only observability.`,
          )}
        `,
      },
    ],
  },
  {
    slug: "code-graph",
    num: "06",
    title: "Code Graph & Structural Analysis",
    shortTitle: "Code Graph (30 Tools)",
    icon: "layers",
    badge: "30 tools",
    summary:
      "Index repositories into a structural call graph to trace callers, callees, class hierarchies, dead code, and complexity.",
    readTime: "3 min read",
    topics: [
      "Enabling the cgc code graph",
      "Indexing & symbol relationships",
      "Dead code & complexity audits",
      "Integrated web_search tool",
    ],
    keywords:
      "code graph cgc callers callees hierarchy dead code complexity architecture report web_search ast",
    sections: [
      {
        id: "cg-overview",
        title: "1. Structural code intelligence",
        render: () => `
          <p>The Code Graph group wraps the <code class="inline-code">cgc</code> CLI alongside <code class="inline-code">web_search</code>. It starts <strong>off by default</strong>—enable it in <a class="ant-link" href="/settings">Settings</a> when working on large multi-module refactors.</p>
          <div class="ant-table-wrap" style="margin-top:16px;">
            <table class="ant-table">
              <thead>
                <tr><th>Workflow</th><th>Tool(s)</th></tr>
              </thead>
              <tbody>
                <tr><td>Index a cloned repository</td><td><code class="inline-code">add_code_to_graph</code></td></tr>
                <tr><td>Find definitions &amp; symbols</td><td><code class="inline-code">find_code</code></td></tr>
                <tr><td>Trace callers, callees &amp; inheritance</td><td><code class="inline-code">analyze_code_relationships</code></td></tr>
                <tr><td>Audit unused or complex functions</td><td><code class="inline-code">find_dead_code</code>, <code class="inline-code">find_most_complex_functions</code></td></tr>
                <tr><td>Generate architecture summary</td><td><code class="inline-code">generate_report</code></td></tr>
                <tr><td>Search external documentation</td><td><code class="inline-code">web_search</code></td></tr>
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
    title: "Web Uploads & Cloud File Store",
    shortTitle: "Files & Store",
    icon: "folder",
    badge: "Storage",
    summary:
      "Upload local datasets into your sandbox via /upload, share outputs via MongoDB GridFS, and manage retention in /store.",
    readTime: "3 min read",
    topics: [
      "Web Upload sessions (/upload -> upload/)",
      "Sandbox Store (share, download, list, delete)",
      "Expiring vs. Permanent files in /store",
      "Private IP download protection",
    ],
    keywords:
      "files upload store gridfs mongodb share link ttl permanent private public download ssrf",
    sections: [
      {
        id: "upload-and-store",
        title: "1. Moving files in and out of the sandbox",
        render: () => `
          <div class="ant-two-col">
            <div class="ant-col-block">
              <h4>${renderSvg("upload", 16)} Web Upload (<a class="ant-link" href="/upload">/upload</a>)</h4>
              <p>Start a time-limited upload session (<code class="inline-code">UPLOAD_SESSION_MINUTES</code>) and drop local files. They land inside your sandbox under <code class="inline-code">upload/</code> and auto-expire after <code class="inline-code">UPLOAD_FILE_RETENTION_MINUTES</code>.</p>
            </div>
            <div class="ant-col-block">
              <h4>${renderSvg("download", 16)} Sandbox Store (<a class="ant-link" href="/store">/store</a>)</h4>
              <p>Use <code class="inline-code">sandbox_store</code> (<code class="inline-code">share</code>) to save sandbox outputs to MongoDB GridFS with an expiring private link (<code class="inline-code">FILE_TTL_HOURS</code>). In <a class="ant-link" href="/store">Files</a>, you can rename, toggle Private/Public, or mark files <strong>Permanent</strong>.</p>
            </div>
          </div>
          ${editorialNote(
            "info",
            "SSRF protection on remote downloads",
            `<code class="inline-code">sandbox_store</code> (<code class="inline-code">download</code>) fetches public HTTP(S) URLs up to <code class="inline-code">DOWNLOAD_MAX_MB</code> and blocks private/internal addresses unless <code class="inline-code">ALLOW_PRIVATE_DOWNLOADS=true</code>.`,
          )}
        `,
      },
    ],
  },
  {
    slug: "security-and-quotas",
    num: "08",
    title: "Security, Quotas & Troubleshooting",
    shortTitle: "Security & Quotas",
    icon: "shield-check",
    badge: "Trust & limits",
    summary:
      "Encryption standards, secret redaction, owner vs. standard-user quotas, security alert emails, account deletion, and error fixes.",
    readTime: "4 min read",
    topics: [
      "AES-256-GCM & HMAC-SHA256 audit logs",
      "Owner vs. Standard User (50 MB) quotas",
      "30-day account deletion grace period",
      "Fixing 401, 429 & missing-tool errors",
    ],
    keywords:
      "security encryption aes-256-gcm redaction audit hmac quotas 50mb rate limit email alerts deletion troubleshooting errors",
    sections: [
      {
        id: "security",
        title: "1. Encryption, redaction & audit logging",
        render: () => `
          <ul>
            <li><strong>At rest:</strong> Provider credentials are encrypted with <strong>AES-256-GCM</strong> keyed from <code class="inline-code">KEY_ENCRYPTION_SECRET</code>.</li>
            <li><strong>In flight:</strong> Known secrets, request tokens, and connection-string passwords are automatically scrubbed from every tool output.</li>
            <li><strong>Audit logs:</strong> Security events pseudonymize IP addresses using <strong>HMAC-SHA256</strong> (<code class="inline-code">AUDIT_HASH_SECRET</code>).</li>
            <li><strong>Email alerts:</strong> When Gmail API or SMTP is configured, Krix emails you on account creation, new-IP sign-ins, OAuth client approvals, and deletion requests.</li>
          </ul>
        `,
      },
      {
        id: "quotas",
        title: "2. Multi-user roles, quotas & deletion",
        render: () => `
          <div class="ant-table-wrap">
            <table class="ant-table">
              <thead>
                <tr><th>Role</th><th>Storage</th><th>Compute &amp; Lifecycle</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Owner</strong> (<code class="inline-code">OWNER_EMAIL</code>)</td>
                  <td>Full host allocation</td>
                  <td>Full compute/memory/process limits and workspace administration.</td>
                </tr>
                <tr>
                  <td><strong>Standard User</strong></td>
                  <td><strong>50 MB</strong> isolated</td>
                  <td>Private workspace &amp; UID with ~1/10th of owner compute, memory, and process limits.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style="margin-top:12px;">Scheduling account deletion in <a class="ant-link" href="/settings">Settings</a> starts a <strong>30-day grace period</strong> (signing back in cancels it) before permanent purge of keys, files, and workspace data.</p>
        `,
      },
      {
        id: "troubleshooting",
        title: "3. Troubleshooting common errors",
        render: () => `
          <div class="ant-table-wrap">
            <table class="ant-table">
              <thead>
                <tr><th>Issue</th><th>Cause &amp; Resolution</th></tr>
              </thead>
              <tbody>
                <tr><td><strong>401 Unauthorized</strong></td><td>Missing, revoked, or query-string key when <code class="inline-code">ALLOW_QUERY_API_KEY</code> is off. Use <code class="inline-code">Authorization: Bearer &lt;key&gt;</code>.</td></tr>
                <tr><td><strong>Tool not visible</strong></td><td>Opt-in group is OFF or missing a GitHub/Render token. Enable it in <a class="ant-link" href="/settings">Settings</a> or on the key's settings page.</td></tr>
                <tr><td><strong>Sandbox disabled</strong></td><td>Server has <code class="inline-code">ENABLE_SANDBOX=false</code> or lacks OS isolation (use the Docker image with <code class="inline-code">ENABLE_SANDBOX=true</code>).</td></tr>
                <tr><td><strong>429 Too Many Requests</strong></td><td>Hit <code class="inline-code">RATE_LIMIT_PER_MIN</code> or <code class="inline-code">MAX_SESSIONS</code>. Close idle sessions or wait for the next minute window.</td></tr>
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

  const indexItems = HELP_CATEGORIES.map((cat) => {
    const searchIndex = `${cat.title} ${cat.summary} ${cat.topics.join(" ")} ${cat.keywords}`;
    const topicItems = cat.topics
      .map((t) => `<li>${escapeHtml(t)}</li>`)
      .join("");
    return `
      <a href="/help/${escapeHtml(cat.slug)}" class="ant-index-item" data-help-card data-search="${escapeHtml(searchIndex)}">
        <div class="ant-index-top">
          <span class="ant-index-num">
            <span>${escapeHtml(cat.num)}</span>
            <span class="ant-index-icon" aria-hidden="true">${renderSvg(cat.icon, 16)}</span>
          </span>
          <span class="ant-index-badge">${escapeHtml(cat.badge)}</span>
        </div>
        <h3 class="ant-index-title">${escapeHtml(cat.title)}</h3>
        <p class="ant-index-summary">${escapeHtml(cat.summary)}</p>
        <ul class="ant-index-topics">${topicItems}</ul>
        <div class="ant-index-foot">
          <span>${escapeHtml(cat.readTime)}</span>
          <span class="ant-index-arrow">Read guide ${renderSvg("chevron-right", 14)}</span>
        </div>
      </a>`;
  }).join("");

  const content = `
    <header class="ant-hero">
      <div class="ant-hero-copy">
        <span class="ant-eyebrow"><span class="ant-eyebrow-dot"></span><span>Krix Documentation &amp; Help Center</span></span>
        <h1 class="ant-display">Setup, keys, and every tool—clearly explained.</h1>
        <p class="ant-lead">Connect any Streamable HTTP MCP client, add encrypted API keys and provider tokens, and understand what runs out of the box.</p>
        <div class="ant-search-wrap">
          <span class="ant-search-icon" aria-hidden="true">${renderSvg("search", 17)}</span>
          <label for="helpSearchInput" class="sr-only">Search help guides</label>
          <input id="helpSearchInput" class="ant-search-input" type="search" placeholder="Search guides (e.g. adding keys, OAuth, GitHub, sandbox, quotas)..." autocomplete="off">
        </div>
      </div>
      <div class="ant-hero-art">
        ${renderHelpSpotIllustration()}
      </div>
    </header>

    <section class="ant-slate-band" aria-label="MCP Endpoint Quickstart">
      <div>
        <div class="ant-slate-eyebrow">Streamable HTTP Transport</div>
        <h2 class="ant-slate-title">One authenticated endpoint for every assistant</h2>
        <p class="ant-slate-desc">Point your MCP client at <code class="inline-code">/mcp</code> using a Bearer key from API Keys or OAuth 2.1 auto-discovery.</p>
        <div class="ant-slate-actions">
          <a href="/help/adding-keys" class="ant-slate-btn primary">${renderSvg("key", 15)}<span>How to add keys</span></a>
          <a href="/api/keys" class="ant-slate-btn">${renderSvg("plus", 15)}<span>Create API Key</span></a>
          <a href="/settings" class="ant-slate-btn">${renderSvg("settings", 15)}<span>Settings</span></a>
        </div>
      </div>
      <div class="ant-slate-box">
        <div class="ant-slate-box-label">
          <span>POST / GET Streamable HTTP</span>
          <span>TLS Required</span>
        </div>
        <div class="ant-slate-endpoint">
          <code>${escapeHtml(mcpUrl)}</code>
          <button type="button" class="ant-copy-dark doc-copy-btn" data-copy="${escapeHtml(mcpUrl)}" aria-label="Copy MCP endpoint URL">${renderSvg("copy", 13)}<span>Copy</span></button>
        </div>
        <div class="ant-slate-headers">
          <div><span>Authorization:</span> Bearer &lt;your-krix-api-key&gt;</div>
          <div><span>x-api-key:</span> &lt;your-krix-api-key&gt;</div>
        </div>
      </div>
    </section>

    <section class="ant-section" aria-labelledby="help-keys-heading">
      <div class="ant-section-head">
        <div>
          <span class="ant-eyebrow">Key Setup Playbook</span>
          <h2 id="help-keys-heading" class="ant-h2">Adding Krix keys &amp; provider tokens</h2>
        </div>
        <a href="/help/adding-keys" class="ant-link">Full key guide →</a>
      </div>
      <div class="ant-key-flow">
        <div class="ant-key-step">
          <div class="ant-key-step-num">01</div>
          <h3>Create a Krix API key</h3>
          <p>Sign in and open <a class="ant-link" href="/api/keys">API Keys</a> to generate a dedicated key for your editor, CLI agent, or automation script. Send it via <code class="inline-code">Authorization: Bearer</code> or <code class="inline-code">x-api-key</code>.</p>
        </div>
        <div class="ant-key-step">
          <div class="ant-key-step-num">02</div>
          <h3>Add GitHub &amp; Render tokens</h3>
          <p>Open <a class="ant-link" href="/settings">Settings</a> to save your GitHub PAT and Render API key (AES-256-GCM encrypted), or set per-key overrides directly on any individual key's page.</p>
        </div>
        <div class="ant-key-step">
          <div class="ant-key-step-num">03</div>
          <h3>Toggle tool groups &amp; verify</h3>
          <p>Core GitHub (17) and Sandbox (15) start ON. Enable Extended GitHub, Render, or Code Graph in Settings, then test live in the <a class="ant-link" href="/tools">Tools catalog</a>.</p>
        </div>
      </div>
    </section>

    <section class="ant-section" aria-labelledby="help-categories-heading">
      <div class="ant-section-head">
        <div>
          <span class="ant-eyebrow">Documentation Index</span>
          <h2 id="help-categories-heading" class="ant-h2">Guides by feature area</h2>
        </div>
        <span id="helpCategoryCount" class="ant-count-pill">${HELP_CATEGORIES.length} of ${HELP_CATEGORIES.length} guides</span>
      </div>

      <div class="ant-index-grid">
        ${indexItems}
      </div>

      <div id="helpSearchEmpty" class="panel empty" hidden>
        No guides matched your search. Try <strong>keys</strong>, <strong>OAuth</strong>, <strong>GitHub</strong>, <strong>sandbox</strong>, <strong>Render</strong>, or <strong>quotas</strong>.
      </div>
    </section>

    <section class="ant-section" aria-labelledby="help-matrix-heading">
      <div class="ant-section-head">
        <div>
          <span class="ant-eyebrow">Capabilities</span>
          <h2 id="help-matrix-heading" class="ant-h2">What works out of the box</h2>
        </div>
      </div>
      <div class="ant-table-wrap">
        <table class="ant-table">
          <thead>
            <tr>
              <th>Tool Group</th>
              <th>Count</th>
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
              <td>Host <code class="inline-code">ENABLE_SANDBOX=true</code></td>
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
              <td><a class="ant-link" href="/help/code-graph">Code Graph</a></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="ant-section" aria-labelledby="help-faq-heading">
      <div class="ant-section-head">
        <div>
          <span class="ant-eyebrow">Questions</span>
          <h2 id="help-faq-heading" class="ant-h2">Frequently asked questions</h2>
        </div>
      </div>
      <div class="ant-faq-list">
        <details class="ant-faq">
          <summary>Why do some tools not appear in my AI assistant?</summary>
          <div class="ant-faq-body">
            Krix advertises only tools that are enabled and have valid credentials. Extended GitHub, Render, and Code Graph start off by default—switch them on in <a href="/settings">Settings</a> (or per key) and ensure your GitHub or Render token is saved.
          </div>
        </details>
        <details class="ant-faq">
          <summary>Can I use separate GitHub or Render tokens on different API keys?</summary>
          <div class="ant-faq-body">
            Yes. Open any key on <a href="/api/keys">API Keys</a> to configure key-specific credentials and tool overrides. Keys without overrides automatically inherit your workspace settings.
          </div>
        </details>
        <details class="ant-faq">
          <summary>How are my tokens and sandbox processes isolated?</summary>
          <div class="ant-faq-body">
            Provider tokens are AES-256-GCM encrypted at rest, scrubbed from tool outputs before reaching your model, and omitted from sandbox child-process environments. Each user runs under an unprivileged Unix UID in a private directory. See <a href="/help/security-and-quotas">Security &amp; Quotas</a>.
          </div>
        </details>
        <details class="ant-faq">
          <summary>How long are uploaded and shared files kept?</summary>
          <div class="ant-faq-body">
            Files shared via <code class="inline-code">sandbox_store</code> expire after <code class="inline-code">FILE_TTL_HOURS</code> (typically 48 hours) unless pinned as <strong>Permanent</strong> in <a href="/store">Files</a>. Web uploads via <a href="/upload">/upload</a> are purged automatically after the session retention window.
          </div>
        </details>
      </div>
    </section>

    <div class="ant-policy-foot">
      <div>
        <h3>Policies &amp; Legal</h3>
        <p>Review data handling, retention schedules, sandbox rules, and terms of use.</p>
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
      <a href="/help">Help Center</a>
      <span aria-hidden="true">${renderSvg("chevron-right", 14)}</span>
      <span aria-current="page">${escapeHtml(category.shortTitle)}</span>
    </nav>

    <header class="ant-article-head">
      <div class="ant-article-head-main">
        <div class="ant-article-meta">
          <span class="ant-eyebrow"><span class="ant-eyebrow-dot"></span><span>Guide ${escapeHtml(category.num)}</span></span>
          <span aria-hidden="true">·</span>
          <span>${escapeHtml(category.badge)}</span>
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
                  <span class="ant-pager-title">Help Center Overview</span>
                </a>`
          }
          ${
            nextCat
              ? `<a href="/help/${escapeHtml(nextCat.slug)}" class="ant-pager-link next">
                  <span class="ant-pager-dir">Next ${renderSvg("chevron-right", 14)}</span>
                  <span class="ant-pager-title">${escapeHtml(nextCat.title)}</span>
                </a>`
              : `<a href="/tools" class="ant-pager-link next">
                  <span class="ant-pager-dir">Explore ${renderSvg("chevron-right", 14)}</span>
                  <span class="ant-pager-title">Live Tools Catalog</span>
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
