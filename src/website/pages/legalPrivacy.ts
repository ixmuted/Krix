import { REPO_URL } from "./docsKit.js";
import type { LegalFact, LegalSection } from "./legal.js";

export const PRIVACY_FACTS: LegalFact[] = [
  { icon: "lock", tint: "clay", title: "Never sold, never used for training", text: "Your code, credentials and files are not sold, rented or used for ads or AI model training." },
  { icon: "key", tint: "fig", title: "Credentials stay encrypted", text: "GitHub and Render tokens are encrypted at rest with AES-256-GCM and redacted from tool output." },
  { icon: "eye-off", tint: "olive", title: "No plain-text IP addresses", text: "Audit logs keep HMAC-SHA256 digests of IP addresses, not the addresses themselves." },
  { icon: "trash", tint: "kraft", title: "Delete whenever you want", text: "Revoke keys instantly. Account deletion has a 30-day grace period, then everything is purged." },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: "overview",
    title: "Overview and scope",
    html: `
      <p>Krix is a multi-user Model Context Protocol (MCP) gateway. It gives authenticated assistants access to GitHub tools, Render management tools, a code graph analyzer, an isolated Linux execution sandbox and cloud file storage. This policy explains how personal and technical data is handled when you use the web dashboard, the Streamable HTTP endpoint (<code class="inline-code">/mcp</code>), the OAuth 2.1 authorization server or the file sharing endpoints.</p>
      <p>If you connect to a self-hosted Krix instance, the operator of that deployment is the data controller for it and decides its storage, retention and email settings.</p>`,
  },
  {
    id: "data-processed",
    title: "Information we process",
    html: `
      <div class="doc-table-wrap">
        <table class="doc-table">
          <thead><tr><th>Data</th><th>Examples</th><th>Why we process it</th></tr></thead>
          <tbody>
            <tr><td><strong>Account identity</strong></td><td>Google email address, display name, profile picture URL</td><td>Signing you in with Google OAuth 2.0, assigning owner or standard-user roles, and enforcing quotas.</td></tr>
            <tr><td><strong>API keys and OAuth 2.1 records</strong></td><td>Key identifiers, hashed or managed tokens, OAuth client IDs, redirect URIs, granted scopes (<code class="inline-code">mcp:tools</code>, <code class="inline-code">mcp:sandbox</code>, <code class="inline-code">mcp:admin</code>)</td><td>Authenticating MCP clients, applying per-key tool overrides and supporting instant revocation.</td></tr>
            <tr><td><strong>Provider credentials</strong></td><td>GitHub Personal Access Tokens, Render API keys</td><td>Encrypted at rest with AES-256-GCM and used only to run the GitHub or Render tool calls you authorize.</td></tr>
            <tr><td><strong>Sandbox and stored files</strong></td><td>Files uploaded at <code class="inline-code">/upload</code>, cloned repositories, scratch files, MongoDB GridFS Sandbox Store items</td><td>Running code and tests, and creating the private or public download links you ask for.</td></tr>
            <tr><td><strong>Usage telemetry</strong></td><td>Tool call counts, success and error rates, latencies per key</td><td>Powering the <a href="/stats">Usage</a> dashboard and enforcing rate limits. Raw tool arguments and secrets are not stored in analytics.</td></tr>
            <tr><td><strong>Security audit logs</strong></td><td>Event timestamps, action types, HMAC-SHA256 pseudonymized IP digests</td><td>Detecting unauthorized access, sending new-IP sign-in alerts and investigating abuse without keeping plain-text IP addresses.</td></tr>
          </tbody>
        </table>
      </div>`,
  },
  {
    id: "cookies",
    title: "Cookies and bot protection",
    html: `
      <p>Krix uses no third-party advertising trackers or cross-site marketing cookies. It uses only strictly necessary browser storage:</p>
      <ul>
        <li><strong>Session and OAuth state cookies.</strong> Signed, HTTP-only cookies (<code class="inline-code">krix_oauth_state</code> and session tokens) keep you signed in and protect OAuth flows against CSRF.</li>
        <li><strong>Interface preferences.</strong> <code class="inline-code">localStorage</code> remembers your light or dark theme (<code class="inline-code">qw-theme</code>) and sidebar state (<code class="inline-code">krix-sidebar</code>).</li>
        <li><strong>Google reCAPTCHA v3.</strong> Protects upload and sign-in surfaces from automated abuse, and is subject to the Google Privacy Policy and Terms of Service.</li>
      </ul>`,
  },
  {
    id: "usage",
    title: "How we use information",
    html: `
      <p>We process the data above only to:</p>
      <ul>
        <li>Authenticate dashboard sessions, API keys and OAuth 2.1 clients.</li>
        <li>Enforce per-user sandbox isolation, tool toggles, rate limits and storage quotas.</li>
        <li>Run GitHub, Render, Code Graph and Sandbox operations that you or your authorized assistant start.</li>
        <li>Send transactional security emails (account creation, new-IP sign-in alerts, OAuth client approvals and account deletion notices) when email transport is configured.</li>
      </ul>
      <p><strong>No selling or training.</strong> Krix does not sell, rent or broker your source code, credentials or uploaded files, and does not use them for advertising or AI model training.</p>`,
  },
  {
    id: "security",
    title: "Security, encryption and isolation",
    html: `
      <ul>
        <li><strong>Encryption in transit and at rest.</strong> Production deployments require HTTPS/TLS on every endpoint. Provider credentials are encrypted at rest with <strong>AES-256-GCM</strong> using <code class="inline-code">KEY_ENCRYPTION_SECRET</code>.</li>
        <li><strong>Automatic secret redaction.</strong> Before any MCP tool result is returned, Krix removes known environment secrets, request tokens and embedded credentials from the output.</li>
        <li><strong>Process and filesystem isolation.</strong> Sandbox commands run under unprivileged Unix UIDs in private per-user directories with scrubbed environment variables, so child processes cannot read server secrets or other users' workspaces.</li>
        <li><strong>OAuth and transport hardening.</strong> OAuth 2.1 uses PKCE S256 and RS256-signed tokens. MCP responses carry <code class="inline-code">Cache-Control: no-store</code> and pass strict origin and rate-limit checks.</li>
      </ul>`,
  },
  {
    id: "retention",
    title: "Retention and automatic deletion",
    html: `
      <div class="doc-table-wrap">
        <table class="doc-table">
          <thead><tr><th>Data</th><th>How long it is kept</th></tr></thead>
          <tbody>
            <tr><td><strong>Cloned sandbox repositories</strong></td><td>Released after the idle timeout (<code class="inline-code">REPO_IDLE_MINUTES</code>, 30 minutes by default) or immediately on <code class="inline-code">sandbox_reset</code>.</td></tr>
            <tr><td><strong>Web upload session files</strong> (<code class="inline-code">/upload</code>)</td><td>Kept for <code class="inline-code">UPLOAD_FILE_RETENTION_MINUTES</code> after the session closes, then deleted automatically.</td></tr>
            <tr><td><strong>Sandbox Store files</strong> (GridFS)</td><td>Expiring files are deleted after <code class="inline-code">FILE_TTL_HOURS</code> (typically 48 hours). Files pinned as <strong>Permanent</strong> stay until you delete them or delete your account.</td></tr>
            <tr><td><strong>Revoked API keys and OAuth tokens</strong></td><td>Access ends immediately on revocation, and cached key telemetry is wiped.</td></tr>
            <tr><td><strong>Account deletion</strong></td><td>Starting deletion in <a href="/settings">Settings</a> begins a <strong>30-day grace period</strong>. Signing back in cancels it. After 30 days a background purge permanently removes your account record, keys, encrypted credentials, stored files and sandbox workspace.</td></tr>
          </tbody>
        </table>
      </div>`,
  },
  {
    id: "third-parties",
    title: "Third-party services",
    html: `
      <p>Depending on the features you enable, Krix sends data only to the services that operation needs:</p>
      <ul>
        <li><strong>Google (OAuth 2.0 and reCAPTCHA v3).</strong> Identity verification and abuse prevention.</li>
        <li><strong>GitHub API (Octokit) and Render REST API.</strong> Called only after you configure a token and trigger a GitHub or Render tool.</li>
        <li><strong>MongoDB.</strong> Stores encrypted account settings, OAuth metadata, usage stats and GridFS Sandbox Store files.</li>
        <li><strong>Gmail API or SMTP provider.</strong> Delivers security and account lifecycle emails when the host configures one.</li>
      </ul>`,
  },
  {
    id: "rights",
    title: "Your rights and controls",
    html: `
      <p>You can control your data from the dashboard at any time:</p>
      <ul>
        <li><strong>Inspect and download.</strong> See active keys, OAuth clients and tool stats, and download stored files from <a href="/store">Files</a>.</li>
        <li><strong>Change or restrict.</strong> Rotate or remove GitHub and Render credentials, and switch individual tools off in <a href="/settings">Settings</a>.</li>
        <li><strong>Revoke and delete.</strong> Revoke any API key or OAuth authorization on <a href="/api/keys">API keys</a>, or request full account deletion from the Danger Zone in Settings.</li>
      </ul>`,
  },
  {
    id: "contact",
    title: "Updates and contact",
    html: `
      <p>We may update this policy when the architecture, security model or regulations change. Material updates revise the effective date at the top of the page. For privacy questions, security disclosures or data requests, open an issue or contact the maintainers through the Krix repository at <a href="${REPO_URL}" target="_blank" rel="noopener noreferrer">${REPO_URL}</a>.</p>
      <p>Using Krix also means accepting the <a href="/terms">Terms of Service</a>.</p>`,
  },
];
