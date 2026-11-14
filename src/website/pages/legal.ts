// Privacy Policy & Terms of Service Pages for Krix MCP Gateway
// Professional Geist Minimalist Layout adhering to WCAG AAA Contrast Standards

import { renderPageShell } from "../components.js";
import { renderSvg } from "../icons.js";

export function renderPrivacyPage(params: { owner?: any }): string {
  const content = `
    <div style="max-width:780px; margin:0 auto; padding:24px 0 64px;">
      <div style="margin-bottom:32px;">
        <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:var(--geist-gray-50);">LEGAL &amp; COMPLIANCE</div>
        <h1 style="font-size:32px; font-weight:800; letter-spacing:-0.03em; color:var(--fg); margin-top:6px;">Privacy Policy</h1>
        <p style="font-size:13px; color:var(--geist-gray-50); margin-top:4px; font-family:var(--font-mono);">
          Effective Date: November 2026
        </p>
      </div>

      <div class="card spotlight-card" style="padding:32px; display:flex; flex-direction:column; gap:24px; line-height:1.7; font-size:14px; color:var(--geist-gray-70);">
        <section>
          <h2 style="font-size:18px; font-weight:700; color:var(--fg); margin-bottom:8px;">1. Overview</h2>
          <p>
            Krix is a developer-focused Model Context Protocol (MCP) gateway, coding execution sandbox, and dataset workbench. We believe in minimal data retention and strict single-user or role-isolated data boundaries. This Privacy Policy details what information is collected, how it is stored, and your rights regarding your data.
          </p>
        </section>

        <section>
          <h2 style="font-size:18px; font-weight:700; color:var(--fg); margin-bottom:8px;">2. Information We Process</h2>
          <ul style="padding-left:20px; display:flex; flex-direction:column; gap:8px;">
            <li><strong style="color:var(--fg);">Authentication Identifiers:</strong> When signing in with Google OAuth 2.0, we store your email address and profile name solely to enforce single-user owner gating and multi-user quota allocations.</li>
            <li><strong style="color:var(--fg);">MCP Tool Telemetry:</strong> Request counts, execution latencies, and tool call distributions are aggregated to provide dashboard performance analytics. Raw tool inputs and secrets are never logged in persistent analytics.</li>
            <li><strong style="color:var(--fg);">Provider Tokens:</strong> GitHub Personal Access Tokens and Render API Keys configured by you are AES-256-GCM encrypted at rest and used strictly on your behalf to execute MCP tools.</li>
            <li><strong style="color:var(--fg);">Uploaded Files &amp; Datasets:</strong> Workspace artifacts uploaded to the sandbox or FileStore are retained in accordance with retention schedules (24-hour ephemeral or permanent storage).</li>
          </ul>
        </section>

        <section>
          <h2 style="font-size:18px; font-weight:700; color:var(--fg); margin-bottom:8px;">3. Data Security &amp; Storage</h2>
          <p>
            All network communication requires TLS 1.3 encryption. Dynamic keys and tokens are stored encrypted using salted cryptographic HMAC signatures. Uploaded artifacts are stored in isolated workspace root paths segregated per user session.
          </p>
        </section>

        <section>
          <h2 style="font-size:18px; font-weight:700; color:var(--fg); margin-bottom:8px;">4. User Rights &amp; Deletion</h2>
          <p>
            You have the right to inspect, export, and permanently delete your data at any time. Revoking an API key or OAuth authorization immediately terminates access and wipes cached key telemetry. You may purge all account data via the Settings Danger Zone.
          </p>
        </section>

        <section>
          <h2 style="font-size:18px; font-weight:700; color:var(--fg); margin-bottom:8px;">5. Third-Party Integrations</h2>
          <p>
            When utilizing GitHub or Render MCP tools, requests are transmitted directly to the respective third-party APIs using your configured credentials. We do not sell, rent, or monetize developer telemetry.
          </p>
        </section>

        <section>
          <h2 style="font-size:18px; font-weight:700; color:var(--fg); margin-bottom:8px;">6. Contact &amp; Governance</h2>
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

export function renderTermsPage(params: { owner?: any }): string {
  const content = `
    <div style="max-width:780px; margin:0 auto; padding:24px 0 64px;">
      <div style="margin-bottom:32px;">
        <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:var(--geist-gray-50);">LEGAL &amp; COMPLIANCE</div>
        <h1 style="font-size:32px; font-weight:800; letter-spacing:-0.03em; color:var(--fg); margin-top:6px;">Terms of Service</h1>
        <p style="font-size:13px; color:var(--geist-gray-50); margin-top:4px; font-family:var(--font-mono);">
          Effective Date: November 2026
        </p>
      </div>

      <div class="card spotlight-card" style="padding:32px; display:flex; flex-direction:column; gap:24px; line-height:1.7; font-size:14px; color:var(--geist-gray-70);">
        <section>
          <h2 style="font-size:18px; font-weight:700; color:var(--fg); margin-bottom:8px;">1. Acceptance of Terms</h2>
          <p>
            By accessing or connecting to Krix via web interface, MCP SSE endpoint, or OAuth 2.1 protocol, you agree to comply with and be bound by these Terms of Service.
          </p>
        </section>

        <section>
          <h2 style="font-size:18px; font-weight:700; color:var(--fg); margin-bottom:8px;">2. Authorized Use &amp; Sandboxing</h2>
          <p>
            Krix provides containerized sandbox environments for running code, testing packages, and managing cloud deployments. Users agree not to:
          </p>
          <ul style="padding-left:20px; margin-top:8px; display:flex; flex-direction:column; gap:6px;">
            <li>Execute denial-of-service, abusive scraping, or network intrusion against external systems.</li>
            <li>Circumvent multi-user memory, storage, or CPU process constraints.</li>
            <li>Store or transmit unlawful, malicious, or abusive software payloads.</li>
          </ul>
        </section>

        <section>
          <h2 style="font-size:18px; font-weight:700; color:var(--fg); margin-bottom:8px;">3. API Key &amp; OAuth Security</h2>
          <p>
            Users are solely responsible for maintaining the confidentiality of issued API keys and OAuth tokens. Any operations performed with your tokens are attributed to your account scope. If a key is compromised, revoke it immediately via the API Keys dashboard.
          </p>
        </section>

        <section>
          <h2 style="font-size:18px; font-weight:700; color:var(--fg); margin-bottom:8px;">4. Service Availability &amp; Rate Limits</h2>
          <p>
            Krix is provided on an "as is" and "as available" basis. While we strive for 99.9% uptime, we do not warrant that operation will be uninterrupted. Resource quotas are enforced dynamically per user role.
          </p>
        </section>

        <section>
          <h2 style="font-size:18px; font-weight:700; color:var(--fg); margin-bottom:8px;">5. Limitation of Liability</h2>
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
