import { REPO_URL } from "./docsKit.js";
import type { LegalFact, LegalSection } from "./legal.js";

export const TERMS_FACTS: LegalFact[] = [
  { icon: "file-code", tint: "kraft", title: "Your code stays yours", text: "You keep every right in the repositories, datasets and files you process through Krix." },
  { icon: "key", tint: "fig", title: "You own your keys", text: "Actions taken with your API keys or OAuth tokens, including by connected assistants, are attributed to you." },
  { icon: "terminal", tint: "olive", title: "Use the sandbox responsibly", text: "No intrusion, abuse, malware or quota evasion, and nothing in the sandbox is backed up." },
  { icon: "github", tint: "slate", title: "Open source, as is", text: "Krix is released under the MIT License and provided without warranty or uptime guarantee." },
];

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of terms",
    html: `<p>By using the Krix web interface, connecting an MCP client to <code class="inline-code">/mcp</code>, authorizing an application with OAuth 2.1, or uploading files to the sandbox or store, you agree to these Terms of Service and the <a href="/privacy">Privacy Policy</a>. If you do not agree, do not use the service.</p>`,
  },
  {
    id: "service",
    title: "Description of the service",
    html: `<p>Krix is a developer-oriented Model Context Protocol (MCP) gateway. It lets authorized AI assistants work with GitHub repositories, Render cloud resources, a code graph analyzer, an isolated multi-runtime execution sandbox and MongoDB GridFS file storage. What your account can use depends on server configuration (such as <code class="inline-code">ENABLE_SANDBOX</code> and <code class="inline-code">ENABLE_FILE_SHARING</code>), your role and the tool toggles you set in <a href="/settings">Settings</a>.</p>`,
  },
  {
    id: "accounts",
    title: "Accounts, API keys and OAuth 2.1",
    html: `
      <ul>
        <li><strong>Account access.</strong> You need an authorized Google account, subject to the host's <code class="inline-code">MULTI_USER</code> and <code class="inline-code">ALLOWED_EMAILS</code> policy.</li>
        <li><strong>Credential confidentiality.</strong> You are responsible for protecting your Krix API keys, OAuth tokens and configured GitHub and Render credentials.</li>
        <li><strong>Assistant actions.</strong> Any tool call made with your API key or OAuth token, including code edits, git pushes, pull requests, Render deploys, environment variable changes and database queries, is authorized by and attributed to your account.</li>
        <li><strong>Prompt revocation.</strong> If you suspect a key or connected client is compromised, revoke it right away on <a href="/api/keys">API keys</a> and rotate any affected GitHub or Render tokens.</li>
      </ul>`,
  },
  {
    id: "acceptable-use",
    title: "Acceptable use and sandbox rules",
    html: `
      <p>Use Krix lawfully and responsibly. You must not, and must not instruct an AI assistant to:</p>
      <ul>
        <li>Launch denial-of-service attacks, port scans, brute-force attempts, unauthorized scraping or network intrusion against internal or external systems.</li>
        <li>Bypass Unix UID isolation, escape the sandbox directory, probe private or internal metadata endpoints, or get around command and network guardrails.</li>
        <li>Run cryptocurrency miners, botnets or command-and-control infrastructure, or host or distribute malware, phishing pages or unlawful content through the sandbox or public Sandbox Store links.</li>
        <li>Exceed per-user memory, CPU, process, storage or rate limits, or share accounts to avoid them.</li>
      </ul>`,
  },
  {
    id: "quotas",
    title: "Quotas, storage and temporary data",
    html: `
      <p>To keep a multi-user deployment stable, Krix enforces role-based quotas. For example, standard users get an isolated 50 MB storage quota and roughly one-tenth of the owner's compute, memory and process limits. Per-minute rate limits, active session caps and request body limits also apply.</p>
      <p><strong>No backup guarantee.</strong> Sandbox workspaces, idle cloned repositories (released after 30 minutes by default), web uploads and non-permanent Sandbox Store files are temporary and are cleaned up automatically. Commit important work to an external Git repository or keep your own backups.</p>`,
  },
  {
    id: "third-party",
    title: "Third-party services and credentials",
    html: `<p>When you connect GitHub, Render or Google, Krix acts only as an authenticated proxy that makes calls on your behalf. Those platforms stay governed by their own terms and acceptable use policies. Krix is not responsible for outages, charges, rate limits or data changes on third-party platforms that result from tool calls made through your account.</p>`,
  },
  {
    id: "ip",
    title: "Ownership and open-source license",
    html: `
      <p><strong>Your content.</strong> You keep all ownership and intellectual property rights in the source code, repositories, datasets and files you process through Krix. You give Krix only the limited technical right to process, store and transmit that content as needed to provide the features you request.</p>
      <p><strong>Krix software.</strong> The Krix source code is licensed under the <strong>MIT License</strong> published in the project repository at <a href="${REPO_URL}" target="_blank" rel="noopener noreferrer">${REPO_URL}</a>.</p>`,
  },
  {
    id: "availability",
    title: "Availability, suspension and termination",
    html: `
      <p>Krix is provided "as is" and "as available", with no guaranteed uptime or service level agreement. Operators may change features, adjust quotas, enforce rate limits, or suspend or end accounts that break these terms or threaten the host's security.</p>
      <p>You can stop using Krix and schedule permanent account deletion at any time in <a href="/settings">Settings</a>. The 30-day grace period described in the <a href="/privacy#retention">Privacy Policy</a> applies.</p>`,
  },
  {
    id: "liability",
    title: "Disclaimers and limitation of liability",
    html: `
      <p class="legal-caps">TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, KRIX IS PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT.</p>
      <p class="legal-caps">IN NO EVENT SHALL THE AUTHORS, MAINTAINERS OR HOST OPERATORS OF KRIX BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF DATA, CODE, REVENUE OR CLOUD RESOURCES, ARISING FROM SANDBOX CODE EXECUTION, AI-INITIATED TOOL CALLS, THIRD-PARTY API ACTIONS OR SERVICE INTERRUPTIONS.</p>`,
  },
  {
    id: "changes",
    title: "Changes and contact",
    html: `<p>We may revise these terms as Krix evolves. Continuing to use the service after the effective date changes means you accept the revised terms. Send questions or reports about these terms through the Krix repository at <a href="${REPO_URL}" target="_blank" rel="noopener noreferrer">${REPO_URL}</a>.</p>`,
  },
];
