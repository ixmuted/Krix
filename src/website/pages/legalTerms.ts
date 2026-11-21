import { REPO_URL } from "./docsKit.js";
import type { LegalFact, LegalSection } from "./legal.js";

export const TERMS_FACTS: LegalFact[] = [
  {
    icon: "file-code",
    tint: "kraft",
    title: "Your code stays yours",
    text: "You retain all ownership and rights in the repositories, datasets, and files you process through Krix.",
  },
  {
    icon: "key",
    tint: "fig",
    title: "You own your keys",
    text: "Actions taken with your API keys or OAuth tokens, including by connected assistants, are attributed to your account.",
  },
  {
    icon: "terminal",
    tint: "olive",
    title: "Use the sandbox responsibly",
    text: "No intrusion, abuse, malware, or quota evasion, and temporary sandbox files are not backed up.",
  },
  {
    icon: "github",
    tint: "slate",
    title: "Open source, as is",
    text: "Krix is released under the MIT License and provided without warranty or uptime guarantee.",
  },
];

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of terms",
    html: `<p>By using the Krix web dashboard, connecting an MCP client to <code class="inline-code">/mcp</code>, authorizing an application with OAuth 2.1, or uploading files to the sandbox or file store, you agree to these Terms of Service and the <a href="/privacy">Privacy Policy</a>. If you do not agree, do not use the service.</p>`,
  },
  {
    id: "service",
    title: "Description of the service",
    html: `<p>Krix is a developer-oriented Model Context Protocol (MCP) gateway that enables authorized assistants to work with GitHub repositories, Render cloud services, a structural code graph analyzer, an isolated multi-language execution sandbox, and cloud file storage. Available tools depend on the credentials you configure and the tool toggles you enable in <a href="/settings">Settings</a>.</p>`,
  },
  {
    id: "accounts",
    title: "Accounts, API keys and OAuth 2.1",
    html: `
      <ul>
        <li><strong>Account access.</strong> Access requires signing in with a valid Google account.</li>
        <li><strong>Credential confidentiality.</strong> You are responsible for keeping your Krix API keys, OAuth authorizations, and saved GitHub or Render tokens secure.</li>
        <li><strong>Assistant actions.</strong> Any tool call made with your API key or OAuth token—including code edits, git pushes, pull requests, Render deployments, environment variable updates, and database queries—is authorized by and attributed to your account.</li>
        <li><strong>Prompt revocation.</strong> If you suspect a key or connected client is compromised, revoke it immediately on <a href="/api">API keys</a> and rotate any affected GitHub or Render tokens.</li>
      </ul>`,
  },
  {
    id: "acceptable-use",
    title: "Acceptable use and sandbox rules",
    html: `
      <p>Use Krix lawfully and responsibly. You must not, and must not instruct an assistant to:</p>
      <ul>
        <li>Launch denial-of-service attacks, port scans, brute-force attempts, unauthorized scraping, or network intrusion against internal or external systems.</li>
        <li>Attempt to bypass workspace isolation, escape your sandbox directory, probe internal metadata endpoints, or circumvent command and network safeguards.</li>
        <li>Run cryptocurrency miners, botnets, or command-and-control infrastructure, or host or distribute malware, phishing pages, or unlawful content through the sandbox or shared links.</li>
        <li>Abuse compute, memory, process, storage, or rate limits, or create multiple accounts to evade quotas.</li>
      </ul>`,
  },
  {
    id: "quotas",
    title: "Quotas, storage and temporary data",
    html: `
      <p>To keep the platform fast and reliable for all users, each account includes <strong>50 MB</strong> of isolated file storage alongside fair compute, memory, session, and per-minute rate limits.</p>
      <p><strong>No backup guarantee.</strong> Sandbox workspaces, idle cloned repositories (cleared after 30 minutes of inactivity), web uploads (cleared after 24 hours), and non-permanent shared files are temporary and cleaned up automatically. Commit important work to an external Git repository or keep your own backups.</p>`,
  },
  {
    id: "third-party",
    title: "Third-party services and credentials",
    html: `<p>When you connect GitHub, Render, or Google, Krix acts solely as an authenticated gateway executing requests on your behalf. Those platforms remain governed by their own terms and policies. Krix is not responsible for outages, billing charges, rate limits, or data changes on third-party platforms resulting from tool calls made through your account.</p>`,
  },
  {
    id: "ip",
    title: "Ownership and open-source license",
    html: `
      <p><strong>Your content.</strong> You retain all ownership and intellectual property rights in the source code, repositories, datasets, and files you process through Krix. You grant Krix only the limited technical right to process, store, and transmit that content as needed to deliver the features you request.</p>
      <p><strong>Krix software.</strong> The Krix source code is licensed under the <strong>MIT License</strong> published in the project repository at <a href="${REPO_URL}" target="_blank" rel="noopener noreferrer">${REPO_URL}</a>.</p>`,
  },
  {
    id: "availability",
    title: "Availability, suspension and termination",
    html: `
      <p>Krix is provided "as is" and "as available", with no guaranteed uptime or service level agreement. Operators may modify features, adjust quotas, enforce rate limits, or suspend or terminate accounts that violate these terms or threaten platform security.</p>
      <p>You may stop using Krix and request permanent account deletion at any time in <a href="/settings">Settings</a>. The 30-day grace period described in the <a href="/privacy#retention">Privacy Policy</a> applies.</p>`,
  },
  {
    id: "liability",
    title: "Disclaimers and limitation of liability",
    html: `
      <p class="legal-caps">TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, KRIX IS PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
      <p class="legal-caps">IN NO EVENT SHALL THE AUTHORS, MAINTAINERS, OR HOST OPERATORS OF KRIX BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF DATA, CODE, REVENUE, OR CLOUD RESOURCES, ARISING FROM SANDBOX CODE EXECUTION, ASSISTANT-INITIATED TOOL CALLS, THIRD-PARTY API ACTIONS, OR SERVICE INTERRUPTIONS.</p>`,
  },
  {
    id: "changes",
    title: "Changes and contact",
    html: `<p>We may revise these terms as Krix evolves. Continuing to use the service after the effective date changes means you accept the revised terms. Send questions or reports about these terms through the Krix repository at <a href="${REPO_URL}" target="_blank" rel="noopener noreferrer">${REPO_URL}</a>.</p>`,
  },
];
