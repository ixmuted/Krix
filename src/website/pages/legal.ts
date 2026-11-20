// Privacy Policy & Terms of Service Pages for Krix MCP Gateway
// Professional Geist Minimalist Layout adhering to WCAG AAA Contrast Standards

import { renderPageShell } from "../components.js";
import { renderSvg } from "../icons.js";

export function renderPrivacyPage(params: { owner?: any; nonce?: string }): string {
  const content = `
    <div>
      <div class="page-head"><div><h1 class="page-title">Privacy Policy</h1><p class="page-sub">Effective Date: November 2026</p></div></div>

      <div class="prose">
        <section>
          <h2>1. Overview</h2>
          <p>
            Krix is a developer-focused Model Context Protocol (MCP) gateway, coding execution sandbox, and dataset workbench. We believe in minimal data retention and strict single-user or role-isolated data boundaries. This Privacy Policy details what information is collected, how it is stored, and your rights regarding your data.
          </p>
        </section>

        <section>
          <h2>2. Information We Process</h2>
          <ul>
            <li><strong>Authentication Identifiers:</strong> When signing in with Google OAuth 2.0, we store your email address and profile name solely to enforce single-user owner gating and multi-user quota allocations.</li>
            <li><strong>MCP Tool Telemetry:</strong> Request counts, execution latencies, and tool call distributions are aggregated to provide dashboard performance analytics. Raw tool inputs and secrets are never logged in persistent analytics.</li>
            <li><strong>Provider Tokens:</strong> GitHub Personal Access Tokens and Render API Keys configured by you are AES-256-GCM encrypted at rest and used strictly on your behalf to execute MCP tools.</li>
            <li><strong>Uploaded Files &amp; Datasets:</strong> Workspace artifacts uploaded to the sandbox or Files storage are retained in accordance with retention schedules (24-hour ephemeral or permanent storage).</li>
          </ul>
        </section>

        <section>
          <h2>3. Data Security &amp; Storage</h2>
          <p>
            All network communication requires TLS 1.3 encryption. Dynamic keys and tokens are stored encrypted using salted cryptographic HMAC signatures. Uploaded artifacts are stored in isolated workspace root paths segregated per user session.
          </p>
        </section>

        <section>
          <h2>4. User Rights &amp; Deletion</h2>
          <p>
            You have the right to inspect, export, and permanently delete your data at any time. Revoking an API key or OAuth authorization immediately terminates access and wipes cached key telemetry. You may purge all account data via the Settings Danger Zone.
          </p>
        </section>

        <section>
          <h2>5. Third-Party Integrations</h2>
          <p>
            When utilizing GitHub or Render MCP tools, requests are transmitted directly to the respective third-party APIs using your configured credentials. We do not sell, rent, or monetize developer telemetry.
          </p>
        </section>

        <section>
          <h2>6. Contact &amp; Governance</h2>
          <p>
            For questions regarding this policy or data inquiries, reach out through the Krix open-source repository on GitHub.
          </p>
        </section>
      </div>
    </div>
  `;

  return renderPageShell({
    title: "Privacy Policy - Krix",
    activeTab: "home",
    content,
    owner: params.owner,
  });
}

export function renderTermsPage(params: { owner?: any; nonce?: string }): string {
  const content = `
    <div>
      <div class="page-head"><div><h1 class="page-title">Terms of Service</h1><p class="page-sub">Effective Date: November 2026</p></div></div>

      <div class="prose">
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or connecting to Krix via web interface, MCP SSE endpoint, or OAuth 2.1 protocol, you agree to comply with and be bound by these Terms of Service.
          </p>
        </section>

        <section>
          <h2>2. Authorized Use &amp; Sandboxing</h2>
          <p>
            Krix provides containerized sandbox environments for running code, testing packages, and managing cloud deployments. Users agree not to:
          </p>
          <ul>
            <li>Execute denial-of-service, abusive scraping, or network intrusion against external systems.</li>
            <li>Circumvent multi-user memory, storage, or CPU process constraints.</li>
            <li>Store or transmit unlawful, malicious, or abusive software payloads.</li>
          </ul>
        </section>

        <section>
          <h2>3. API Key &amp; OAuth Security</h2>
          <p>
            Users are solely responsible for maintaining the confidentiality of issued API keys and OAuth tokens. Any operations performed with your tokens are attributed to your account scope. If a key is compromised, revoke it immediately via the API Keys dashboard.
          </p>
        </section>

        <section>
          <h2>4. Service Availability &amp; Rate Limits</h2>
          <p>
            Krix is provided on an "as is" and "as available" basis. While we strive for 99.9% uptime, we do not warrant that operation will be uninterrupted. Resource quotas are enforced dynamically per user role.
          </p>
        </section>

        <section>
          <h2>5. Limitation of Liability</h2>
          <p>
            In no event shall the authors or maintainers of Krix be liable for any direct, indirect, incidental, or consequential damages resulting from the execution of code within the sandbox or interaction with third-party APIs.
          </p>
        </section>
      </div>
    </div>
  `;

  return renderPageShell({
    title: "Terms of Service - Krix",
    activeTab: "home",
    content,
    owner: params.owner,
  });
}
