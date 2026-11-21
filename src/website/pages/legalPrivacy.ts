import { REPO_URL } from "./docsKit.js";
import type { LegalFact, LegalSection } from "./legal.js";

export const PRIVACY_FACTS: LegalFact[] = [
  {
    icon: "lock",
    tint: "clay",
    title: "Never sold or used for training",
    text: "Your code, credentials, and files are never sold, rented, or used for advertising or AI model training.",
  },
  {
    icon: "key",
    tint: "fig",
    title: "Credentials stay encrypted",
    text: "GitHub and Render tokens are strongly encrypted at rest and automatically filtered out of tool responses.",
  },
  {
    icon: "eye-off",
    tint: "olive",
    title: "Privacy-first security logs",
    text: "Security logs use pseudonymized network digests rather than storing plain-text IP addresses.",
  },
  {
    icon: "trash",
    tint: "kraft",
    title: "Delete whenever you want",
    text: "Revoke keys immediately. Account deletion has a 30-day grace period, after which all data is permanently removed.",
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: "overview",
    title: "Overview and scope",
    html: `
      <p>Krix is a multi-user Model Context Protocol (MCP) gateway that gives authenticated assistants access to GitHub workflows, Render cloud management, structural code graph analysis, an isolated Linux execution sandbox, and cloud file storage. This policy explains how personal and technical data is handled when you use the web dashboard, the Streamable HTTP endpoint (<code class="inline-code">/mcp</code>), OAuth 2.1 authorization, or file sharing.</p>
      <p>If you connect to a self-hosted Krix deployment, the operator of that deployment acts as the data controller for its storage, retention, and notification settings.</p>`,
  },
  {
    id: "data-processed",
    title: "Information we process",
    html: `
      <div class="doc-table-wrap">
        <table class="doc-table">
          <thead><tr><th>Data</th><th>Examples</th><th>Why we process it</th></tr></thead>
          <tbody>
            <tr><td><strong>Account identity</strong></td><td>Google email address, display name, profile picture URL</td><td>Signing you in with Google OAuth 2.0, isolating your workspace, and enforcing account quotas.</td></tr>
            <tr><td><strong>API keys and OAuth 2.1 records</strong></td><td>Key labels, managed token identifiers, OAuth client IDs, redirect URIs, granted scopes (<code class="inline-code">mcp:tools</code>, <code class="inline-code">mcp:sandbox</code>, <code class="inline-code">mcp:admin</code>)</td><td>Authenticating MCP clients, applying per-key tool toggles, and supporting instant revocation.</td></tr>
            <tr><td><strong>Provider credentials</strong></td><td>GitHub Personal Access Tokens, Render API keys</td><td>Strongly encrypted at rest and used strictly to execute the GitHub or Render tool calls you authorize.</td></tr>
            <tr><td><strong>Sandbox and stored files</strong></td><td>Files uploaded at <code class="inline-code">/upload</code>, cloned repositories, scratch files, and saved items in <code class="inline-code">/store</code></td><td>Running code and tests, and generating the private or public download links you request.</td></tr>
            <tr><td><strong>Usage telemetry</strong></td><td>Tool call counts, success and error rates, and latencies per key</td><td>Powering the <a href="/stats">Usage</a> dashboard and enforcing fair rate limits. Raw tool arguments and secrets are never logged in analytics.</td></tr>
            <tr><td><strong>Security activity records</strong></td><td>Event timestamps, action types, and pseudonymized network digests</td><td>Detecting unauthorized access, sending new sign-in alerts, and investigating abuse without storing plain-text IP addresses.</td></tr>
          </tbody>
        </table>
      </div>`,
  },
  {
    id: "cookies",
    title: "Cookies and bot protection",
    html: `
      <p>Krix uses no third-party advertising trackers or cross-site marketing cookies. It relies only on strictly necessary browser storage:</p>
      <ul>
        <li><strong>Session and OAuth state cookies.</strong> Signed, HTTP-only cookies keep you signed in and protect sign-in and OAuth flows against cross-site request forgery.</li>
        <li><strong>Interface preferences.</strong> Local browser storage remembers your light or dark theme choice and sidebar collapse state.</li>
        <li><strong>Google reCAPTCHA v3.</strong> Protects sign-in and upload surfaces from automated abuse, subject to the Google Privacy Policy and Terms of Service.</li>
      </ul>`,
  },
  {
    id: "usage",
    title: "How we use information",
    html: `
      <p>We process the data above solely to:</p>
      <ul>
        <li>Authenticate dashboard sessions, API keys, and OAuth 2.1 clients.</li>
        <li>Enforce per-user workspace isolation, tool permissions, rate limits, and storage quotas.</li>
        <li>Execute GitHub, Render, Code Graph, and Sandbox operations that you or your authorized assistant initiate.</li>
        <li>Send transactional security emails (account creation, new sign-in alerts, OAuth client approvals, and account deletion notices).</li>
      </ul>
      <p><strong>No selling or training.</strong> Krix does not sell, rent, or broker your source code, credentials, or uploaded files, and never uses them for advertising or AI model training.</p>`,
  },
  {
    id: "security",
    title: "Security, encryption and isolation",
    html: `
      <ul>
        <li><strong>Strong protection in transit and at rest.</strong> Production connections require HTTPS/TLS on every endpoint, and saved provider credentials are protected with strong encryption at rest.</li>
        <li><strong>Automatic secret redaction.</strong> Before any tool result returns to your assistant, Krix automatically filters out credentials and sensitive tokens from the response.</li>
        <li><strong>Isolated workspaces.</strong> Every account executes inside its own isolated Linux environment and private directory so sandbox processes cannot read server secrets or other users' files.</li>
        <li><strong>Hardened access control.</strong> OAuth 2.1 connections require explicit consent with scoped permissions, and MCP responses prevent browser caching and enforce rate limits.</li>
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
            <tr><td><strong>Cloned sandbox repositories</strong></td><td>Cleared automatically after 30 minutes of inactivity or immediately when you run <code class="inline-code">sandbox_reset</code>.</td></tr>
            <tr><td><strong>Web upload session files</strong> (<code class="inline-code">/upload</code>)</td><td>Cleared automatically after 24 hours once the upload session ends.</td></tr>
            <tr><td><strong>Saved files</strong> (<code class="inline-code">/store</code>)</td><td>Shared links expire automatically unless you mark a file <strong>Permanent</strong> in <a href="/store">Files</a>, in which case it remains until you delete it or delete your account.</td></tr>
            <tr><td><strong>Revoked API keys and OAuth tokens</strong></td><td>Access ends immediately on revocation, and cached key telemetry is cleared.</td></tr>
            <tr><td><strong>Account deletion</strong></td><td>Requesting deletion in <a href="/settings">Settings</a> starts a <strong>30-day grace period</strong>. Signing back in cancels it. After 30 days, your account record, keys, encrypted credentials, stored files, and workspace are permanently purged.</td></tr>
          </tbody>
        </table>
      </div>`,
  },
  {
    id: "third-parties",
    title: "Third-party services",
    html: `
      <p>Depending on the integrations you enable, Krix communicates only with the services required for that action:</p>
      <ul>
        <li><strong>Google (OAuth 2.0 and reCAPTCHA v3).</strong> Account sign-in and automated abuse protection.</li>
        <li><strong>GitHub API and Render API.</strong> Called only when you save a token and invoke a GitHub or Render tool.</li>
        <li><strong>Managed cloud database and email delivery.</strong> Stores encrypted account settings, OAuth records, usage stats, stored files, and delivers security alerts.</li>
      </ul>`,
  },
  {
    id: "rights",
    title: "Your rights and controls",
    html: `
      <p>You can inspect, update, or remove your data from the dashboard at any time:</p>
      <ul>
        <li><strong>Inspect and download.</strong> Review active keys, connected OAuth clients, and usage statistics, or download saved files from <a href="/store">Files</a>.</li>
        <li><strong>Rotate or restrict.</strong> Update or remove GitHub and Render tokens and disable individual tools in <a href="/settings">Settings</a>.</li>
        <li><strong>Revoke and delete.</strong> Revoke any API key or OAuth authorization on <a href="/api">API keys</a>, or schedule full account deletion in Settings.</li>
      </ul>`,
  },
  {
    id: "contact",
    title: "Updates and contact",
    html: `
      <p>We may update this policy as Krix evolves. Material changes update the effective date at the top of this page. For privacy questions, security disclosures, or data requests, open an issue through the Krix repository at <a href="${REPO_URL}" target="_blank" rel="noopener noreferrer">${REPO_URL}</a>.</p>
      <p>Using Krix also means accepting the <a href="/terms">Terms of Service</a>.</p>`,
  },
];
