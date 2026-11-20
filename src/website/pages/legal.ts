// Privacy Policy & Terms of Service Pages for Krix MCP Gateway
// Anthropic-inspired editorial layout with sticky Table of Contents,
// plain-English summary containers, and accurate reflection of Krix's architecture.

import { renderPageShell } from "../components.js";
import { renderSvg } from "../icons.js";

const EFFECTIVE_DATE = "November 2026";
const REPO_URL = "https://github.com/ixmuted/Krix";

function renderLegalNav(active: "privacy" | "terms"): string {
  return `
    <div class="legal-switch" role="navigation" aria-label="Legal documents">
      <a href="/privacy" class="legal-switch-tab${active === "privacy" ? " active" : ""}">
        ${renderSvg("shield", 15)}<span>Privacy Policy</span>
      </a>
      <a href="/terms" class="legal-switch-tab${active === "terms" ? " active" : ""}">
        ${renderSvg("file-text", 15)}<span>Terms of Service</span>
      </a>
      <a href="/help/security-and-quotas" class="legal-switch-tab">
        ${renderSvg("shield-check", 15)}<span>Security &amp; Quotas</span>
      </a>
    </div>`;
}

export function renderPrivacyPage(params: {
  owner?: any;
  nonce?: string;
}): string {
  const toc = [
    ["overview", "1. Overview & Scope"],
    ["data-processed", "2. Information We Process"],
    ["cookies", "3. Cookies & Bot Protection"],
    ["usage", "4. How We Use Information"],
    ["security", "5. Security, Encryption & Isolation"],
    ["retention", "6. Data Retention & Deletion"],
    ["third-parties", "7. Third-Party Services"],
    ["rights", "8. Your Rights & Controls"],
    ["contact", "9. Updates & Contact"],
  ];

  const tocHtml = toc
    .map(([id, label]) => `<a href="#${id}" class="doc-toc-link">${label}</a>`)
    .join("");

  const content = `
    <div class="doc-article-header">
      <div class="doc-article-header-top">
        <span class="help-cat-icon lg" aria-hidden="true">${renderSvg("shield", 22)}</span>
        <span class="doc-pill">Legal</span>
        <span class="doc-meta-dot" aria-hidden="true">·</span>
        <span class="doc-meta-text">Effective ${EFFECTIVE_DATE}</span>
      </div>
      <h1 class="doc-article-title">Privacy Policy</h1>
      <p class="doc-article-sub">How Krix collects, encrypts, isolates, retains, and deletes data across the MCP gateway, web dashboard, sandbox runtime, and file store.</p>
      ${renderLegalNav("privacy")}
    </div>

    <div class="doc-callout doc-callout-info" style="margin-bottom:24px;">
      <div class="doc-callout-icon" aria-hidden="true">${renderSvg("info", 16)}</div>
      <div class="doc-callout-body">
        <div class="doc-callout-title">Plain-English summary</div>
        <div class="doc-callout-text">
          Krix processes only the minimum data required to authenticate your account, run your isolated sandbox, and proxy requests to GitHub or Render on your behalf. We never sell or monetize your data, encrypt your provider tokens with AES-256-GCM, redact secrets from tool outputs, pseudonymize audit-log IPs with HMAC-SHA256, and let you revoke keys or delete your entire account at any time.
        </div>
      </div>
    </div>

    <div class="doc-layout">
      <aside class="doc-sidebar" aria-label="Privacy Policy contents">
        <div class="doc-side-card">
          <div class="doc-side-label">Contents</div>
          <nav class="doc-toc">${tocHtml}</nav>
        </div>
        <div class="doc-side-card">
          <div class="doc-side-label">Quick controls</div>
          <nav class="doc-side-nav">
            <a href="/settings" class="doc-side-link">${renderSvg("settings", 15)}<span>Manage credentials &amp; deletion</span></a>
            <a href="/api/keys" class="doc-side-link">${renderSvg("key", 15)}<span>Revoke keys &amp; OAuth</span></a>
            <a href="/store" class="doc-side-link">${renderSvg("folder", 15)}<span>Manage stored files</span></a>
          </nav>
        </div>
      </aside>

      <article class="doc-main">
        <section id="overview" class="doc-article-card prose">
          <h2>1. Overview &amp; Scope</h2>
          <p>
            Krix is a multi-user Model Context Protocol (MCP) gateway providing authenticated access to GitHub tools, Render management tools, a code graph analyzer, an isolated Linux execution sandbox, and cloud file storage. This Privacy Policy explains how personal and technical data is handled when you use the Krix web dashboard, Streamable HTTP MCP endpoint (<code class="inline-code">/mcp</code>), OAuth 2.1 authorization server, or file sharing endpoints.
          </p>
          <p>
            If you connect to a self-hosted instance of Krix, the operator of that deployment acts as the data controller for that instance and configures its storage, retention, and email notification settings.
          </p>
        </section>

        <section id="data-processed" class="doc-article-card prose">
          <h2>2. Information We Process</h2>
          <div class="doc-table-wrap">
            <table class="doc-table">
              <thead>
                <tr>
                  <th>Data Category</th>
                  <th>Examples</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Account Identity</strong></td>
                  <td>Google email address, display name, profile avatar URL</td>
                  <td>Authentication via Google OAuth 2.0, owner vs. standard-user role assignment, and quota enforcement.</td>
                </tr>
                <tr>
                  <td><strong>API Keys &amp; OAuth 2.1 Records</strong></td>
                  <td>Key identifiers, hashed/managed tokens, OAuth client IDs, redirect URIs, granted scopes (<code class="inline-code">mcp:tools</code>, <code class="inline-code">mcp:sandbox</code>, <code class="inline-code">mcp:admin</code>)</td>
                  <td>Authenticating MCP clients, enforcing per-key tool overrides, and supporting instant revocation.</td>
                </tr>
                <tr>
                  <td><strong>Provider Credentials</strong></td>
                  <td>GitHub Personal Access Tokens, Render API Keys</td>
                  <td>Encrypted at rest with AES-256-GCM and used solely to execute GitHub or Render tool calls you authorize.</td>
                </tr>
                <tr>
                  <td><strong>Sandbox &amp; Stored Files</strong></td>
                  <td>Files uploaded via <code class="inline-code">/upload</code>, cloned repos, scratch files, MongoDB GridFS Sandbox Store items</td>
                  <td>Running code, executing tests, and generating private or public download links you request.</td>
                </tr>
                <tr>
                  <td><strong>Usage Telemetry</strong></td>
                  <td>Tool call counts, success/error rates, execution latencies per key</td>
                  <td>Powering the <a href="/stats">Usage Stats</a> dashboard and enforcing rate limits. Raw tool arguments and secrets are not persisted in analytics.</td>
                </tr>
                <tr>
                  <td><strong>Security Audit Logs</strong></td>
                  <td>Event timestamps, action types, HMAC-SHA256 pseudonymized IP digests</td>
                  <td>Detecting unauthorized access, sending new-IP sign-in alerts, and investigating abuse without storing plaintext IP addresses.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="cookies" class="doc-article-card prose">
          <h2>3. Strictly Necessary Cookies &amp; Bot Protection</h2>
          <p>Krix does not use third-party advertising trackers or cross-site marketing cookies. We use only strictly necessary browser storage:</p>
          <ul>
            <li><strong>Session &amp; OAuth state cookies:</strong> Signed HTTP-only cookies (<code class="inline-code">krix_oauth_state</code> and session tokens) required to keep you signed in and protect OAuth flows against CSRF.</li>
            <li><strong>Local UI preferences:</strong> <code class="inline-code">localStorage</code> entries for your light/dark theme (<code class="inline-code">qw-theme</code>) and sidebar state (<code class="inline-code">krix-sidebar</code>).</li>
            <li><strong>Google reCAPTCHA v3:</strong> Used on protected upload and authentication surfaces to prevent automated abuse, subject to the Google Privacy Policy and Terms of Service.</li>
          </ul>
        </section>

        <section id="usage" class="doc-article-card prose">
          <h2>4. How We Use Information</h2>
          <p>We process the data described above strictly to:</p>
          <ul>
            <li>Authenticate dashboard sessions, API keys, and OAuth 2.1 clients.</li>
            <li>Enforce per-user sandbox isolation, tool toggle policies, rate limits, and storage quotas.</li>
            <li>Execute GitHub, Render, Code Graph, and Sandbox operations initiated by you or your authorized AI assistant.</li>
            <li>Send transactional security emails (account creation, new-IP sign-in alerts, OAuth client approvals, and account deletion notices) when email transport is configured.</li>
          </ul>
          <p><strong>No selling or training:</strong> Krix does not sell, rent, broker, or use your source code, credentials, or uploaded files for advertising or AI model training.</p>
        </section>

        <section id="security" class="doc-article-card prose">
          <h2>5. Security, Encryption &amp; Isolation</h2>
          <ul>
            <li><strong>Encryption in transit &amp; at rest:</strong> Production deployments require HTTPS/TLS for all endpoints, and provider credentials are encrypted at rest with <strong>AES-256-GCM</strong> using <code class="inline-code">KEY_ENCRYPTION_SECRET</code>.</li>
            <li><strong>Automated secret redaction:</strong> Before any MCP tool result is returned, Krix scrubs known environment secrets, request tokens, and embedded credentials from the output.</li>
            <li><strong>Process &amp; filesystem isolation:</strong> Sandbox commands execute under unprivileged Unix UIDs in private per-user directories with scrubbed environment variables so child processes cannot read server secrets or other users' workspaces.</li>
            <li><strong>OAuth &amp; transport hardening:</strong> OAuth 2.1 uses PKCE S256 and RS256-signed tokens; MCP responses carry <code class="inline-code">Cache-Control: no-store</code> and strict origin/rate-limit checks.</li>
          </ul>
        </section>

        <section id="retention" class="doc-article-card prose">
          <h2>6. Data Retention &amp; Automatic Deletion</h2>
          <div class="doc-table-wrap">
            <table class="doc-table">
              <thead>
                <tr>
                  <th>Data Type</th>
                  <th>Retention Schedule</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Cloned sandbox repositories</strong></td>
                  <td>Automatically released after idle timeout (<code class="inline-code">REPO_IDLE_MINUTES</code>, default 30 minutes) or immediately on <code class="inline-code">sandbox_reset</code>.</td>
                </tr>
                <tr>
                  <td><strong>Web upload session files (<code class="inline-code">/upload</code>)</strong></td>
                  <td>Retained for <code class="inline-code">UPLOAD_FILE_RETENTION_MINUTES</code> after the upload session closes, then automatically deleted.</td>
                </tr>
                <tr>
                  <td><strong>Sandbox Store files (GridFS)</strong></td>
                  <td>Expiring files are deleted automatically after <code class="inline-code">FILE_TTL_HOURS</code> (typically 48 hours). Files pinned as <strong>Permanent</strong> remain until you delete them or delete your account.</td>
                </tr>
                <tr>
                  <td><strong>Revoked API keys &amp; OAuth tokens</strong></td>
                  <td>Access terminates immediately upon revocation and associated cached key telemetry is wiped.</td>
                </tr>
                <tr>
                  <td><strong>Account deletion</strong></td>
                  <td>Initiating deletion in <a href="/settings">Settings</a> starts a <strong>30-day grace period</strong>. Signing back in cancels deletion; after 30 days, a background purge permanently removes your account record, keys, encrypted credentials, stored files, and sandbox workspace.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="third-parties" class="doc-article-card prose">
          <h2>7. Third-Party Services &amp; External APIs</h2>
          <p>Depending on the features you enable, Krix transmits data only to the third-party services necessary for that operation:</p>
          <ul>
            <li><strong>Google (OAuth 2.0 &amp; reCAPTCHA v3):</strong> Identity verification and abuse prevention.</li>
            <li><strong>GitHub API (Octokit) &amp; Render REST API:</strong> Invoked strictly when you configure a token and trigger GitHub or Render tools.</li>
            <li><strong>MongoDB:</strong> Stores encrypted account settings, OAuth metadata, usage stats, and GridFS Sandbox Store files.</li>
            <li><strong>Gmail API / SMTP Provider:</strong> Used solely to deliver security and account lifecycle emails when configured by the host.</li>
          </ul>
        </section>

        <section id="rights" class="doc-article-card prose">
          <h2>8. Your Rights &amp; Controls</h2>
          <p>You can exercise direct control over your data at any time through the Krix dashboard:</p>
          <ul>
            <li><strong>Inspect &amp; download:</strong> View active keys, OAuth clients, tool stats, and download your stored files from <a href="/store">/store</a>.</li>
            <li><strong>Modify or restrict:</strong> Rotate or remove GitHub/Render credentials and toggle individual tools off in <a href="/settings">Settings</a>.</li>
            <li><strong>Revoke &amp; delete:</strong> Revoke any API key or OAuth authorization immediately on <a href="/api/keys">API Keys</a>, or request full account erasure via the Settings Danger Zone.</li>
          </ul>
        </section>

        <section id="contact" class="doc-article-card prose">
          <h2>9. Updates &amp; Contact</h2>
          <p>
            We may update this Privacy Policy to reflect architectural, security, or regulatory changes. Material updates will revise the Effective Date at the top of this page. For privacy questions, security disclosures, or data inquiries, please open an issue or contact the maintainers via the Krix repository at <a href="${REPO_URL}" target="_blank" rel="noopener noreferrer">${REPO_URL}</a>.
          </p>
        </section>
      </article>
    </div>
  `;

  return renderPageShell({
    title: "Privacy Policy - Krix",
    activeTab: "home",
    wide: true,
    content,
    owner: params.owner,
    nonce: params.nonce,
  });
}

export function renderTermsPage(params: {
  owner?: any;
  nonce?: string;
}): string {
  const toc = [
    ["acceptance", "1. Acceptance of Terms"],
    ["service", "2. Description of Service"],
    ["accounts", "3. Accounts, Keys & OAuth 2.1"],
    ["acceptable-use", "4. Acceptable Use & Sandbox Rules"],
    ["quotas", "5. Quotas, Storage & Ephemeral Data"],
    ["third-party", "6. Third-Party Integrations"],
    ["ip", "7. Ownership & Open-Source License"],
    ["availability", "8. Availability & Termination"],
    ["liability", "9. Disclaimers & Liability"],
    ["changes", "10. Changes & Contact"],
  ];

  const tocHtml = toc
    .map(([id, label]) => `<a href="#${id}" class="doc-toc-link">${label}</a>`)
    .join("");

  const content = `
    <div class="doc-article-header">
      <div class="doc-article-header-top">
        <span class="help-cat-icon lg" aria-hidden="true">${renderSvg("file-text", 22)}</span>
        <span class="doc-pill">Legal</span>
        <span class="doc-meta-dot" aria-hidden="true">·</span>
        <span class="doc-meta-text">Effective ${EFFECTIVE_DATE}</span>
      </div>
      <h1 class="doc-article-title">Terms of Service</h1>
      <p class="doc-article-sub">Rules governing access to the Krix web dashboard, MCP Streamable HTTP gateway, OAuth 2.1 endpoints, isolated sandbox, and file store.</p>
      ${renderLegalNav("terms")}
    </div>

    <div class="doc-callout doc-callout-info" style="margin-bottom:24px;">
      <div class="doc-callout-icon" aria-hidden="true">${renderSvg("info", 16)}</div>
      <div class="doc-callout-body">
        <div class="doc-callout-title">Key terms at a glance</div>
        <div class="doc-callout-text">
          You keep full ownership of your code, repositories, and files. You are responsible for safeguarding your API keys, OAuth authorizations, and third-party tokens, and for actions taken by AI assistants you connect to Krix. Do not use the sandbox for abuse, intrusion, or quota circumvention. Krix is open-source software (MIT License) provided "as is."
        </div>
      </div>
    </div>

    <div class="doc-layout">
      <aside class="doc-sidebar" aria-label="Terms of Service contents">
        <div class="doc-side-card">
          <div class="doc-side-label">Contents</div>
          <nav class="doc-toc">${tocHtml}</nav>
        </div>
        <div class="doc-side-card">
          <div class="doc-side-label">Related guides</div>
          <nav class="doc-side-nav">
            <a href="/privacy" class="doc-side-link">${renderSvg("shield", 15)}<span>Privacy Policy</span></a>
            <a href="/help/security-and-quotas" class="doc-side-link">${renderSvg("shield-check", 15)}<span>Security &amp; Quotas</span></a>
            <a href="/help" class="doc-side-link">${renderSvg("help-circle", 15)}<span>Help Center</span></a>
          </nav>
        </div>
      </aside>

      <article class="doc-main">
        <section id="acceptance" class="doc-article-card prose">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing the Krix web interface, connecting an MCP client to <code class="inline-code">/mcp</code>, authorizing an application via OAuth 2.1, or uploading files to the sandbox or store, you agree to be bound by these Terms of Service and our <a href="/privacy">Privacy Policy</a>. If you do not agree, do not use the service.
          </p>
        </section>

        <section id="service" class="doc-article-card prose">
          <h2>2. Description of Service</h2>
          <p>
            Krix is a developer-oriented Model Context Protocol (MCP) gateway that enables authorized AI assistants to interact with GitHub repositories, Render cloud resources, a code graph analyzer, an isolated multi-runtime execution sandbox, and MongoDB GridFS file storage. Features available to your account depend on server configuration (such as <code class="inline-code">ENABLE_SANDBOX</code> and <code class="inline-code">ENABLE_FILE_SHARING</code>), your user role, and the tool toggles you enable in <a href="/settings">Settings</a>.
          </p>
        </section>

        <section id="accounts" class="doc-article-card prose">
          <h2>3. Accounts, API Keys &amp; OAuth 2.1 Responsibilities</h2>
          <ul>
            <li><strong>Account accuracy:</strong> Access requires an authorized Google account (subject to the host's <code class="inline-code">MULTI_USER</code> and <code class="inline-code">ALLOWED_EMAILS</code> policy).</li>
            <li><strong>Credential confidentiality:</strong> You are solely responsible for protecting your Krix API keys, OAuth tokens, and configured GitHub/Render credentials.</li>
            <li><strong>AI assistant actions:</strong> Any tool invocation—including code edits, git pushes, pull requests, Render deploys, environment variable changes, or database queries—performed with your API key or OAuth token is authorized under and attributed to your account.</li>
            <li><strong>Prompt revocation:</strong> If you suspect a key or connected client is compromised, you must revoke it immediately via <a href="/api/keys">API Keys</a> and rotate any affected upstream GitHub or Render tokens.</li>
          </ul>
        </section>

        <section id="acceptable-use" class="doc-article-card prose">
          <h2>4. Acceptable Use &amp; Sandbox Restrictions</h2>
          <p>You agree to use Krix lawfully and responsibly. You must not, and must not instruct any AI assistant to:</p>
          <ul>
            <li>Launch denial-of-service attacks, port scans, brute-force attempts, unauthorized scraping, or network intrusion against internal or external systems.</li>
            <li>Attempt to bypass Unix UID isolation, escape the sandbox directory, probe private/internal host metadata endpoints, or circumvent command and network restriction guardrails.</li>
            <li>Run cryptocurrency miners, botnets, command-and-control infrastructure, or host/distribute malware, phishing pages, or unlawful content via the sandbox or public Sandbox Store links.</li>
            <li>Circumvent per-user memory, CPU, process, storage, or rate-limit quotas, or share accounts to evade limits.</li>
          </ul>
        </section>

        <section id="quotas" class="doc-article-card prose">
          <h2>5. Resource Quotas, Storage &amp; Ephemeral Data</h2>
          <p>
            To protect multi-user stability, Krix enforces role-based quotas (for example, standard users receive an isolated 50 MB storage quota and approximately one-tenth of owner compute, memory, and process limits), per-minute rate limits, active session caps, and request body limits.
          </p>
          <p>
            <strong>No backup guarantee:</strong> Sandbox workspaces, idle cloned repositories (released after 30 minutes by default), web uploads, and non-permanent Sandbox Store files are ephemeral and subject to automatic cleanup. Always commit important work to an external Git repository or maintain your own backups.
          </p>
        </section>

        <section id="third-party" class="doc-article-card prose">
          <h2>6. Third-Party Services &amp; Credentials</h2>
          <p>
            When you connect GitHub, Render, or Google services, Krix acts solely as an authenticated proxy executing calls on your behalf. Your use of those platforms remains governed by their respective terms of service and acceptable use policies. Krix is not responsible for outages, billing charges, rate limits, or data changes occurring on third-party platforms as a result of tool calls initiated through your account.
          </p>
        </section>

        <section id="ip" class="doc-article-card prose">
          <h2>7. Intellectual Property &amp; Open-Source License</h2>
          <p>
            <strong>Your content:</strong> You retain all ownership and intellectual property rights in the source code, repositories, datasets, and files you process through Krix. You grant Krix only the limited technical right to process, store, and transmit that content as necessary to provide the requested functionality.
          </p>
          <p>
            <strong>Krix software:</strong> The Krix source code is licensed under the <strong>MIT License</strong> as published in the project repository (<a href="${REPO_URL}" target="_blank" rel="noopener noreferrer">${REPO_URL}</a>).
          </p>
        </section>

        <section id="availability" class="doc-article-card prose">
          <h2>8. Service Availability, Suspension &amp; Termination</h2>
          <p>
            Krix is provided on an "as is" and "as available" basis without guaranteed uptime or SLA. Operators may modify features, adjust quotas, enforce rate limits, or suspend/terminate accounts that violate these Terms or threaten host security.
          </p>
          <p>
            You may stop using Krix and schedule permanent account deletion at any time in <a href="/settings">Settings</a> (subject to the 30-day grace period described in our <a href="/privacy">Privacy Policy</a>).
          </p>
        </section>

        <section id="liability" class="doc-article-card prose">
          <h2>9. Disclaimer of Warranties &amp; Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, KRIX IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p>
            IN NO EVENT SHALL THE AUTHORS, MAINTAINERS, OR HOST OPERATORS OF KRIX BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES—OR ANY LOSS OF DATA, CODE, REVENUE, OR CLOUD RESOURCES—ARISING FROM SANDBOX CODE EXECUTION, AI-INITIATED TOOL CALLS, THIRD-PARTY API ACTIONS, OR SERVICE INTERRUPTIONS.
          </p>
        </section>

        <section id="changes" class="doc-article-card prose">
          <h2>10. Changes to Terms &amp; Contact</h2>
          <p>
            We may revise these Terms of Service as Krix evolves. Continued use of the service after an updated Effective Date constitutes acceptance of the revised Terms. Questions or reports regarding these Terms may be submitted through the Krix repository at <a href="${REPO_URL}" target="_blank" rel="noopener noreferrer">${REPO_URL}</a>.
          </p>
        </section>
      </article>
    </div>
  `;

  return renderPageShell({
    title: "Terms of Service - Krix",
    activeTab: "home",
    wide: true,
    content,
    owner: params.owner,
    nonce: params.nonce,
  });
}
