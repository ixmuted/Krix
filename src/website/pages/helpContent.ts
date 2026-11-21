import { escapeHtml } from "../components.js";
import { renderSvg } from "../icons.js";
import { callout, codeBlock } from "./docsKit.js";
import type { HelpCategory } from "./helpTypes.js";

export const HELP_CORE: HelpCategory[] = [
  {
    slug: "getting-started",
    title: "Connecting an MCP client",
    shortTitle: "Getting started",
    icon: "zap",
    badge: "Start here",
    summary:
      "Connect any Streamable HTTP MCP client, desktop editor, or CLI agent to Krix and verify your first tool call.",
    readTime: "4 min read",
    topics: [
      "Streamable HTTP endpoint",
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
        graphic: "transport-flow",
        render: ({ mcpUrl }) => `
          <p>Krix serves the Model Context Protocol over <strong>Streamable HTTP</strong> at <code class="inline-code">POST/GET /mcp</code>. Any MCP-compatible desktop editor, web assistant, or terminal agent connects using this single HTTPS endpoint.</p>
          <div class="doc-endpoint-card">
            <div class="doc-endpoint-meta">
              <span class="docs-pill">Streamable HTTP</span>
              <span class="doc-endpoint-note">Single authenticated HTTPS endpoint for all MCP clients</span>
            </div>
            <div class="endpoint-row">
              <code>${escapeHtml(mcpUrl)}</code>
              <button type="button" class="btn sm doc-copy-btn" data-copy="${escapeHtml(mcpUrl)}" aria-label="Copy MCP endpoint URL">${renderSvg("copy", 14)}<span>Copy</span></button>
            </div>
          </div>
          ${callout(
            "info",
            "Use header authentication",
            `Always send your API key in the <code class="inline-code">Authorization: Bearer &lt;key&gt;</code> or <code class="inline-code">x-api-key: &lt;key&gt;</code> HTTP header rather than placing secrets in query strings.`,
          )}
        `,
      },
      {
        id: "client-configs",
        title: "2. Client configuration templates",
        graphic: "oauth-handshake",
        render: ({ mcpUrl }) => `
          <p>If your client supports <strong>OAuth 2.1 discovery</strong>, paste only the <code class="inline-code">/mcp</code> URL and approve access in the browser consent dialog—no manual key header is needed. For static API key connections, use one of the standard templates below.</p>
          <div class="doc-grid-2">
            <div class="doc-subcard">
              <div class="doc-subcard-head">${renderSvg("command", 18)}<h4>Desktop &amp; IDE JSON config</h4></div>
              <p>Add Krix under <code class="inline-code">mcpServers</code> in your editor or desktop client configuration:</p>
              ${codeBlock(
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
            <div class="doc-subcard">
              <div class="doc-subcard-head">${renderSvg("terminal", 18)}<h4>CLI &amp; HTTP clients</h4></div>
              <p>For terminal agents or custom HTTP integrations using the <code class="inline-code">x-api-key</code> header:</p>
              ${codeBlock(
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
        graphic: "verify-call",
        render: () => `
          <p>Once connected, run a quick check through your assistant or test any enabled tool directly in the browser from the <a href="/tools">Tools catalog</a>:</p>
          <ul class="doc-list">
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
      "add key create api key bearer x-api-key github pat render token credentials settings override oauth revoke authentication",
    sections: [
      {
        id: "create-krix-key",
        title: "1. Creating a Krix API key",
        graphic: "keys-separation",
        render: () => `
          <p>Krix separates <strong>gateway API keys</strong> (used by your MCP client to authenticate with Krix) from <strong>provider tokens</strong> (your GitHub or Render credentials used when Krix calls external APIs on your behalf).</p>
          <div class="doc-steps">
            <div class="doc-step">
              <div class="doc-step-num">1</div>
              <div class="doc-step-body">
                <h4>Sign in with Google</h4>
                <p>Open <a href="/auth/google">Sign in</a> to initialize your isolated workspace and storage quota.</p>
              </div>
            </div>
            <div class="doc-step">
              <div class="doc-step-num">2</div>
              <div class="doc-step-body">
                <h4>Create and label a key</h4>
                <p>Navigate to <a href="/api">API keys</a>, click <strong>Create API Key</strong>, and label it by device or project so you can track activity in <a href="/stats">Usage</a>.</p>
              </div>
            </div>
            <div class="doc-step">
              <div class="doc-step-num">3</div>
              <div class="doc-step-body">
                <h4>Paste into your client</h4>
                <p>Copy the key once and add it to your client's <code class="inline-code">Authorization: Bearer</code> or <code class="inline-code">x-api-key</code> header.</p>
              </div>
            </div>
          </div>
        `,
      },
      {
        id: "add-provider-tokens",
        title: "2. Adding GitHub and Render tokens",
        render: () => `
          <p>GitHub and Render tools stay hidden until a valid token is saved, so your assistant never encounters broken authentication errors. Configure credentials at either level:</p>
          <div class="doc-grid-2">
            <div class="doc-subcard">
              <div class="doc-subcard-head">${renderSvg("settings", 18)}<h4>Workspace defaults</h4></div>
              <p>Open <a href="/settings">Settings</a> to save your default <strong>GitHub Personal Access Token</strong> and <strong>Render API Key</strong>. All API keys and OAuth sessions inherit these credentials automatically unless overridden.</p>
            </div>
            <div class="doc-subcard">
              <div class="doc-subcard-head">${renderSvg("sliders", 18)}<h4>Per-key overrides</h4></div>
              <p>Open any individual key on <a href="/api">API keys</a> to bind a dedicated GitHub or Render token exclusively to that key—ideal for separating personal repositories, client projects, or read-only access.</p>
            </div>
          </div>
          ${callout(
            "tip",
            "Strong credential protection",
            `All provider tokens are strongly encrypted at rest, never logged in analytics, and automatically filtered out of tool responses and sandbox environments.`,
          )}
        `,
      },
      {
        id: "precedence",
        title: "3. How tool permissions work",
        graphic: "permission-cascade",
        render: () => `
          <p>Tool availability is evaluated consistently across client discovery, tool execution, OAuth consent, and the Settings dashboard:</p>
          <ol class="doc-list">
            <li><strong>Credential requirements:</strong> GitHub and Render tools only activate when their respective token is present.</li>
            <li><strong>Per-key toggles:</strong> Custom enable/disable rules on an individual API key override your workspace defaults for that key alone.</li>
            <li><strong>Workspace settings:</strong> Your account-level toggles in <a href="/settings">Settings</a> apply to all keys that inherit workspace configuration.</li>
            <li><strong>Starting defaults:</strong> Sandbox and Core GitHub tools start enabled. Extended GitHub, Render, and Code Graph start off until you switch them on.</li>
          </ol>
        `,
      },
      {
        id: "oauth-and-revocation",
        title: "4. OAuth 2.1 scopes and revocation",
        render: () => `
          <p>Clients that support OAuth 2.1 connect through a standard browser consent screen showing the requesting application and scopes:</p>
          <div class="doc-grid-3">
            <div class="doc-mini-card">
              <div class="doc-mono-title">mcp:tools</div>
              <p>Access to enabled GitHub, Render, and Code Graph tools within your account policy.</p>
            </div>
            <div class="doc-mini-card">
              <div class="doc-mono-title">mcp:sandbox</div>
              <p>Access to isolated code execution, persistent shell, local git, and file sharing.</p>
            </div>
            <div class="doc-mini-card">
              <div class="doc-mono-title">mcp:admin</div>
              <p>Elevated repository or service operations when explicitly enabled in Settings.</p>
            </div>
          </div>
          <p>You can revoke any API key or connected OAuth client at any time from <a href="/api">API keys</a>. Revocation takes effect immediately and clears cached telemetry for that key.</p>
        `,
      },
    ],
  },
  {
    slug: "github",
    title: "GitHub repositories & workflows",
    shortTitle: "GitHub",
    icon: "github",
    badge: "51 tools",
    summary:
      "Complete reference for all 17 core and 34 extended GitHub tools—repository search, surgical edits, branches, PRs, reviews, issues, and releases.",
    readTime: "7 min read",
    topics: [
      "Token setup & recommended scopes",
      "Core browsing & editing tools",
      "Extended issues, PRs, releases & teams",
      "Surgical editing workflow",
    ],
    keywords:
      "github pat token git_tree grep view_file_outline str_replace_editor patch_contents push_files pull request issues reviews releases tags commits",
    sections: [
      {
        id: "github-setup",
        title: "1. Token setup",
        graphic: "github-explore",
        render: () => `
          <p>Create a <strong>Fine-Grained Personal Access Token</strong> in GitHub scoped only to the repositories you want to work on (with <em>Contents: Read &amp; Write</em> and <em>Pull Requests: Read &amp; Write</em>, plus <em>Issues</em> if using extended tools), or a Classic PAT with <code class="inline-code">repo</code> scope.</p>
          <p>Save the token in <a href="/settings">Settings</a> or on a dedicated key in <a href="/api">API keys</a>. All GitHub tools automatically fall back to the default <code class="inline-code">owner</code>, <code class="inline-code">repo</code>, and <code class="inline-code">branch</code> set via <code class="inline-code">set_active_context</code>.</p>
        `,
      },
      {
        id: "github-core-read",
        title: "2. Context, browsing & search",
        badge: "8 tools · Enabled",
        render: () => `
          <div class="doc-table-wrap">
            <table class="doc-table">
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
        title: "3. Editing, branches & pull requests",
        badge: "9 tools · Enabled",
        graphic: "github-pr-flow",
        render: () => `
          <div class="doc-table-wrap">
            <table class="doc-table">
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
          ${callout(
            "tip",
            "Recommended editing workflow",
            `Use <code class="inline-code">git_tree</code>, <code class="inline-code">view_file_outline</code>, and <code class="inline-code">grep</code> to locate target lines first, then apply focused changes with <code class="inline-code">str_replace_editor</code> or <code class="inline-code">patch_contents</code>—or batch multi-file updates atomically with <code class="inline-code">push_files</code>.`,
          )}
        `,
      },
      {
        id: "github-extended",
        title: "4. Extended GitHub tools",
        badge: "34 tools · Opt-in",
        graphic: "github-extended",
        render: () => `
          <p>Switch on Extended GitHub in <a href="/settings">Settings</a> (or per API key) to enable full issue tracking, PR review threads, releases, and repository administration:</p>
          <div class="doc-table-wrap">
            <table class="doc-table">
              <thead>
                <tr><th>Area</th><th>Tools</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Issues &amp; sub-issues</strong></td>
                  <td><code class="inline-code">list_issues</code>, <code class="inline-code">issue_read</code>, <code class="inline-code">issue_write</code>, <code class="inline-code">sub_issue_write</code>, <code class="inline-code">add_issue_comment</code>, <code class="inline-code">search_issues</code></td>
                </tr>
                <tr>
                  <td><strong>Pull requests &amp; reviews</strong></td>
                  <td><code class="inline-code">list_pull_requests</code>, <code class="inline-code">pull_request_read</code>, <code class="inline-code">update_pull_request</code>, <code class="inline-code">update_pull_request_branch</code>, <code class="inline-code">merge_pull_request</code>, <code class="inline-code">pull_request_review_write</code>, <code class="inline-code">add_comment_to_pending_review</code>, <code class="inline-code">add_reply_to_pull_request_comment</code>, <code class="inline-code">search_pull_requests</code></td>
                </tr>
                <tr>
                  <td><strong>Commits, releases, tags &amp; labels</strong></td>
                  <td><code class="inline-code">get_commit</code>, <code class="inline-code">search_commits</code>, <code class="inline-code">list_commits</code>, <code class="inline-code">get_label</code>, <code class="inline-code">list_issue_fields</code>, <code class="inline-code">list_issue_types</code>, <code class="inline-code">get_release</code>, <code class="inline-code">list_releases</code>, <code class="inline-code">get_tag</code>, <code class="inline-code">list_tags</code></td>
                </tr>
                <tr>
                  <td><strong>Teams &amp; collaborators</strong></td>
                  <td><code class="inline-code">get_teams</code>, <code class="inline-code">get_team_members</code>, <code class="inline-code">list_repository_collaborators</code>, <code class="inline-code">search_users</code></td>
                </tr>
                <tr>
                  <td><strong>Repository &amp; automation</strong></td>
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
    title: "Isolated sandbox & local git",
    shortTitle: "Sandbox",
    icon: "terminal",
    badge: "15 tools",
    summary:
      "Full reference for all 15 sandbox tools: multi-language execution, persistent shell, file editing, package installs, background jobs, and local git.",
    readTime: "6 min read",
    topics: [
      "Pre-installed language runtimes",
      "Execution, files & package tools",
      "Local git workflow tools",
      "Cloud file sharing & workspace lifecycle",
    ],
    keywords:
      "sandbox run exec install file ps output reset store python node typescript go rust java cpp ruby php bash git_clone git_checkout git_pull git_status git_diff git_commit_push",
    sections: [
      {
        id: "sandbox-runtimes",
        title: "1. Pre-installed language runtimes",
        graphic: "sandbox-runtime",
        render: () => `
          <p>Every account runs inside a dedicated, isolated Linux workspace with a persistent working directory and pre-installed developer toolchains:</p>
          <div class="doc-chip-row">
            <span class="docs-pill">Node.js</span>
            <span class="docs-pill">TypeScript (tsx / bun)</span>
            <span class="docs-pill">Python 3</span>
            <span class="docs-pill">Go</span>
            <span class="docs-pill">Rust</span>
            <span class="docs-pill">Java</span>
            <span class="docs-pill">C / C++</span>
            <span class="docs-pill">Ruby</span>
            <span class="docs-pill">PHP</span>
            <span class="docs-pill">Bash</span>
            <span class="docs-pill">Git CLI</span>
          </div>
        `,
      },
      {
        id: "sandbox-exec-tools",
        title: "2. Execution, files & process management",
        badge: "8 tools · Enabled",
        render: () => `
          <div class="doc-table-wrap">
            <table class="doc-table">
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
        title: "3. Local git & cloud file store",
        badge: "7 tools · Enabled",
        graphic: "sandbox-git",
        render: () => `
          <div class="doc-table-wrap">
            <table class="doc-table">
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
                <tr><td><code class="inline-code">sandbox_store</code></td><td>Moves files between your sandbox, cloud storage (<a href="/store">/store</a>), and the web (<code class="inline-code">share</code>, <code class="inline-code">download</code>, <code class="inline-code">list</code>, <code class="inline-code">delete</code>).</td></tr>
              </tbody>
            </table>
          </div>
          ${callout(
            "info",
            "Automatic workspace cleanup",
            `Idle cloned repositories clear automatically after 30 minutes of inactivity to preserve workspace storage. Push important changes to GitHub or save outputs to <a href="/store">Files</a>.`,
          )}
        `,
      },
    ],
  },
];
