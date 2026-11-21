import { escapeHtml } from "../components.js";
import { renderSvg } from "../icons.js";
import { callout, codeBlock } from "./docsKit.js";
import type { HelpCategory } from "./helpTypes.js";

export const HELP_MORE: HelpCategory[] = [
  {
    slug: "render",
    title: "Render cloud and Postgres",
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
    title: "Code graph and web search",
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
        title: "Key workflows and tools",
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
    title: "Files, web uploads and sandbox store",
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
        title: "Sharing and managing files with Sandbox Store (/store)",
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
          <p>In the <a href="/store">Files dashboard</a>, you can rename files, switch between <strong>Private</strong> and <strong>Public</strong> links, pin important files as <strong>Permanent</strong> (disabling TTL expiry), download them, or delete them immediately.</p>
        `,
      },
    ],
  },
  {
    slug: "security-and-quotas",
    title: "Security, quotas and troubleshooting",
    shortTitle: "Security & Quotas",
    icon: "shield-check",
    badge: "Trust and limits",
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
        title: "Multi-user roles and resource quotas",
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
          <p>You can inspect live request metrics on <a href="/stats">Usage Stats</a> and schedule or cancel account deletion in <a href="/settings">Settings</a> (deletion has a <strong>30-day grace period</strong>; signing back in cancels it before permanent purge).</p>
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
