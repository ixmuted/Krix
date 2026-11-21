import { renderSvg } from "../icons.js";
import { callout } from "./docsKit.js";
import type { HelpCategory } from "./helpTypes.js";

export const HELP_MORE: HelpCategory[] = [
  {
    slug: "render",
    title: "Render cloud & Postgres",
    shortTitle: "Render",
    icon: "render",
    badge: "21 tools",
    summary:
      "Complete reference for all 21 Render tools: workspaces, web services, static sites, cron jobs, deploys, logs, metrics, env vars, and Postgres.",
    readTime: "5 min read",
    topics: [
      "Connecting your Render API key",
      "Workspaces & service lifecycle",
      "Deploys, logs & metrics",
      "Environment variables & Postgres",
    ],
    keywords:
      "render workspace list_services create_web_service create_static_site create_cron_job trigger_deploy cancel_deploy list_logs get_metrics update_env_vars delete_env_var query_render_postgres",
    sections: [
      {
        id: "render-setup",
        title: "1. Enabling Render tools",
        render: () => `
          <p>Render tools start <strong>disabled by default</strong> until you connect a Render API key and switch them on:</p>
          <ol class="doc-list">
            <li>Generate an API key in your Render account settings.</li>
            <li>Save the key in Krix <a href="/settings">Settings</a> (or on a specific key in <a href="/api">API keys</a>).</li>
            <li>Toggle the <strong>Render</strong> tool group on in Settings.</li>
          </ol>
        `,
      },
      {
        id: "render-services",
        title: "2. Workspaces, services & deployments",
        badge: "14 tools · Opt-in",
        graphic: "render-cloud",
        render: () => `
          <div class="doc-table-wrap">
            <table class="doc-table">
              <thead>
                <tr><th>Group</th><th>Tools &amp; purpose</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Workspaces</strong></td>
                  <td><code class="inline-code">list_workspaces</code>, <code class="inline-code">select_workspace</code>, and <code class="inline-code">get_selected_workspace</code> to scope operations to the right Render team.</td>
                </tr>
                <tr>
                  <td><strong>Services</strong></td>
                  <td><code class="inline-code">list_services</code>, <code class="inline-code">get_service</code>, <code class="inline-code">create_web_service</code>, <code class="inline-code">create_static_site</code>, <code class="inline-code">create_cron_job</code>, <code class="inline-code">restart_service</code>, and <code class="inline-code">delete_service</code>.</td>
                </tr>
                <tr>
                  <td><strong>Deployments</strong></td>
                  <td><code class="inline-code">list_deploys</code>, <code class="inline-code">get_deploy</code>, <code class="inline-code">trigger_deploy</code>, and <code class="inline-code">cancel_deploy</code>.</td>
                </tr>
              </tbody>
            </table>
          </div>
        `,
      },
      {
        id: "render-obs-data",
        title: "3. Logs, metrics, env vars & Postgres",
        badge: "7 tools · Opt-in",
        render: () => `
          <div class="doc-table-wrap">
            <table class="doc-table">
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
          ${callout(
            "warn",
            "Live production changes",
            `Service deletions, restarts, and environment updates take effect immediately on your Render account. For read-only monitoring on a key, disable write and delete tools on that key's settings page.`,
          )}
        `,
      },
    ],
  },
  {
    slug: "code-graph",
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
        badge: "Opt-in",
        graphic: "code-graph-net",
        render: () => `
          <p>The Code Graph tool group starts <strong>off by default</strong>. Enable it in <a href="/settings">Settings</a> whenever you need structural impact analysis across multi-file codebases.</p>
          <div class="doc-table-wrap">
            <table class="doc-table">
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
          <div class="doc-table-wrap">
            <table class="doc-table">
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
          ${callout(
            "tip",
            "Code Graph vs. grep",
            `Use <code class="inline-code">grep</code> and <code class="inline-code">view_file_outline</code> for fast single-file lookups; enable Code Graph when mapping multi-file blast radius, dead code, or cross-module dependencies.`,
          )}
        `,
      },
    ],
  },
  {
    slug: "files-and-store",
    title: "Uploads & file storage",
    shortTitle: "Files & store",
    icon: "files",
    badge: "Storage",
    summary:
      "Upload local datasets into your sandbox via /upload, share outputs from the sandbox via sandbox_store, and manage retention in /store.",
    readTime: "4 min read",
    topics: [
      "Web upload sessions",
      "sandbox_file vs. sandbox_store",
      "Expiring vs. permanent files",
      "Private and public download links",
    ],
    keywords:
      "files upload store share link ttl permanent private public download sandbox_store sandbox_file",
    sections: [
      {
        id: "upload-vs-store",
        title: "1. Web uploads vs. saved files",
        graphic: "files-lifecycle",
        render: () => `
          <div class="doc-grid-2">
            <div class="doc-subcard">
              <div class="doc-subcard-head">${renderSvg("upload", 18)}<h4>Web uploads (<a href="/upload">/upload</a>)</h4></div>
              <p>Start a short-lived upload session and drop local datasets, archives, or documents from your browser. Files land inside your sandbox under <code class="inline-code">upload/</code> so your assistant can inspect or process them immediately, then clear automatically after 24 hours.</p>
            </div>
            <div class="doc-subcard">
              <div class="doc-subcard-head">${renderSvg("files", 18)}<h4>Saved files (<a href="/store">/store</a>)</h4></div>
              <p>Use <code class="inline-code">sandbox_store</code> (<code class="inline-code">share</code>) to persist generated outputs and receive a private expiring download link. In <a href="/store">Files</a>, you can rename items, switch between <strong>Private</strong> and <strong>Public</strong> visibility, mark files <strong>Permanent</strong>, download them, or delete them anytime.</p>
            </div>
          </div>
        `,
      },
      {
        id: "store-actions",
        title: "2. sandbox_store actions",
        render: () => `
          <div class="doc-table-wrap">
            <table class="doc-table">
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
          ${callout(
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
    title: "Security, limits & troubleshooting",
    shortTitle: "Security & limits",
    icon: "shield-check",
    badge: "Trust & limits",
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
        graphic: "security-shield",
        render: () => `
          <div class="doc-grid-2">
            <div class="doc-subcard">
              <div class="doc-subcard-head">${renderSvg("lock", 18)}<h4>Encrypted credentials &amp; redaction</h4></div>
              <p>Provider tokens and API credentials are strongly encrypted at rest, never stored in usage analytics, and automatically filtered out of tool outputs before responses reach your assistant.</p>
            </div>
            <div class="doc-subcard">
              <div class="doc-subcard-head">${renderSvg("shield-check", 18)}<h4>Isolated workspaces</h4></div>
              <p>Every account runs inside its own isolated execution environment and private directory. Sandbox processes cannot access other users' files, server secrets, or your stored provider credentials.</p>
            </div>
            <div class="doc-subcard">
              <div class="doc-subcard-head">${renderSvg("sliders", 18)}<h4>Granular access &amp; instant revocation</h4></div>
              <p>Toggle individual tools on or off globally or per API key. Revoking a key or OAuth client on <a href="/api">API keys</a> ends active access immediately.</p>
            </div>
            <div class="doc-subcard">
              <div class="doc-subcard-head">${renderSvg("activity", 18)}<h4>Activity alerts &amp; monitoring</h4></div>
              <p>Automated email notifications alert you on account creation, new sign-ins, OAuth client approvals, and account deletion requests so unexpected activity is spotted early.</p>
            </div>
          </div>
        `,
      },
      {
        id: "quotas",
        title: "2. Account limits & data lifecycle",
        graphic: "limits-gauge",
        render: () => `
          <div class="doc-table-wrap">
            <table class="doc-table">
              <thead>
                <tr><th>Resource</th><th>What your account includes</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>File storage</strong></td>
                  <td><strong>50 MB</strong> of isolated storage across uploads and saved files. Monitor live usage on <a href="/store">Files</a> or via <code class="inline-code">sandbox_status</code>.</td>
                </tr>
                <tr>
                  <td><strong>Compute &amp; sessions</strong></td>
                  <td>Dedicated sandbox memory, process limits, and per-minute rate limits designed to keep execution responsive and fair for every user.</td>
                </tr>
                <tr>
                  <td><strong>Temporary files &amp; repos</strong></td>
                  <td>Web uploads clear after 24 hours, shared links expire automatically unless marked <strong>Permanent</strong> in <a href="/store">Files</a>, and idle cloned repositories clear after 30 minutes.</td>
                </tr>
                <tr>
                  <td><strong>Account deletion</strong></td>
                  <td>Requesting account deletion in <a href="/settings">Settings</a> begins a <strong>30-day grace period</strong>. Signing back in cancels it; after 30 days, all keys, stored files, and workspace data are permanently removed.</td>
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
          <div class="doc-table-wrap">
            <table class="doc-table">
              <thead>
                <tr><th>Error</th><th>Likely cause &amp; fix</th></tr>
              </thead>
              <tbody>
                <tr><td><strong>401 Unauthorized</strong></td><td>The API key is missing, expired, or revoked, or was sent in the URL instead of a header. Send a valid key in <code class="inline-code">Authorization: Bearer &lt;key&gt;</code> or reconnect via OAuth 2.1.</td></tr>
                <tr><td><strong>Tool not listed in client</strong></td><td>Opt-in groups (Extended GitHub, Render, Code Graph) start off by default, or the required GitHub/Render token is missing. Check <a href="/settings">Settings</a> and your key's overrides.</td></tr>
                <tr><td><strong>Storage quota reached</strong></td><td>Delete unused items in <a href="/store">Files</a> or run <code class="inline-code">sandbox_reset</code> to clear scratch workspace files.</td></tr>
                <tr><td><strong>429 Too Many Requests</strong></td><td>Your key exceeded the per-minute request limit or active session cap. Close idle client sessions and retry shortly.</td></tr>
              </tbody>
            </table>
          </div>
        `,
      },
    ],
  },
];
