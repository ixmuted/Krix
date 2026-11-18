// Homepage Overview, Client Configurator, Animated Showcase, 12+ Features, and Sandbox Workspace Explorer

import { renderPageShell, escapeHtml } from "../components.js";
import { renderSvg } from "../icons.js";

export function renderHomePage(params: {
  base: string;
  isOwner?: boolean;
  owner?: any;
  uploads?: any;
  dynamicKeys?: any[];
}): string {
  const base = params.base ? params.base.replace(/\/+$/, "") : "";
  const mcpEndpointUrl = `${base}/mcp`;

  const mcpConfigJson = JSON.stringify(
    {
      mcpServers: {
        krix: {
          url: mcpEndpointUrl,
        },
      },
    },
    null,
    2,
  );

  const featuresList = [
    {
      icon: "terminal",
      title: "Persistent Bash Shell",
      desc: "Keeps your working directory, exports, and environment alive across every tool call.",
    },
    {
      icon: "cpu",
      title: "Multi-Language Runner",
      desc: "Execute Python, Node.js, TypeScript, Go, C++, Rust, Java, and Ruby in one call.",
    },
    {
      icon: "shield-check",
      title: "Per-User Linux Isolation",
      desc: "Every key and OAuth client runs under its own unprivileged OS user and home directory.",
    },
    {
      icon: "github",
      title: "GitHub Automation",
      desc: "Read files, inspect commits, open pull requests, and manage issues directly from your agent.",
    },
    {
      icon: "layers",
      title: "Code Graph Intelligence",
      desc: "Build AST symbol graphs for fast call-chain tracing and blast-radius impact analysis.",
    },
    {
      icon: "server",
      title: "Render Cloud Control",
      desc: "Trigger deploys, stream service logs, and inspect environment configs in real time.",
    },
    {
      icon: "lock",
      title: "OAuth 2.1 PKCE Discovery",
      desc: "Zero-config authorization handshake with automatic protected-resource metadata.",
    },
    {
      icon: "sliders",
      title: "Granular Tool Permissions",
      desc: "Toggle individual tools on or off globally or per API key with instant propagation.",
    },
    {
      icon: "key",
      title: "Per-Key Credential Overrides",
      desc: "Bind custom GitHub or Render tokens to specific keys without exposing workspace secrets.",
    },
    {
      icon: "files",
      title: "Ephemeral & Permanent Store",
      desc: "Upload datasets for 24-hour scratch work or persist artifacts with shareable links.",
    },
    {
      icon: "activity",
      title: "Real-Time Telemetry & Logs",
      desc: "Track daily request timelines, P95 latency, tool breakdowns, and per-key error rates.",
    },
    {
      icon: "refresh",
      title: "Idle Workspace Auto-Clear",
      desc: "Inactive cloned repositories automatically clear after timeout to keep storage clean.",
    },
  ];

  const capabilityCards = [
    {
      tag: "Runtime",
      meta: "Isolated Per-User Execution",
      title: "Sandboxed Shell & Multi-Language Runner",
      desc: "Each authenticated key and OAuth session runs inside an isolated unprivileged Linux user with a persistent bash shell, private workspace, and automatic idle cleanup.",
      specs: [
        { k: "Transport", v: "Streamable HTTP + SSE" },
        { k: "Languages", v: "Python · Node · TS · Go · C++ · Rust" },
        { k: "Shell State", v: "Persistent cwd & env per session" },
      ],
      ctaLabel: "Explore Sandbox Tools",
      ctaHref: "/tools",
    },
    {
      tag: "Engineering",
      meta: "Repository & AST Analysis",
      title: "GitHub Operations & Code Graph Intelligence",
      desc: "Inspect repositories, manage branches, commits, and pull requests, or build a structured symbol graph for fast dependency and impact tracing across large codebases.",
      specs: [
        { k: "Integrations", v: "GitHub REST + Code Graph" },
        { k: "Credential Scope", v: "Workspace or Per-Key Override" },
        { k: "Access Control", v: "Per-Tool Granular Permissions" },
      ],
      ctaLabel: "Configure Credentials & Keys",
      ctaHref: "/api",
    },
    {
      tag: "Infrastructure",
      meta: "Cloud Deployments & Artifacts",
      title: "Render Cloud Control & Managed File Storage",
      desc: "Trigger deployments, inspect service logs, manage environment variables, and exchange datasets or build outputs seamlessly between your browser and AI agent.",
      specs: [
        { k: "Storage Modes", v: "24h Ephemeral · Permanent Store" },
        { k: "Sharing", v: "Signed & Public Download Links" },
        { k: "Telemetry", v: "Real-Time Usage & Latency Logs" },
      ],
      ctaLabel: "Open Files & Usage",
      ctaHref: "/store",
    },
  ];

  const content = `
    <section class="hero">
      <h1 class="hero-title">Connect your AI tools to Krix</h1>
      <p class="hero-sub">One MCP endpoint for GitHub, Render and an isolated sandbox. Add it to your client and start working.</p>
    </section>

    <div class="composer">
      <div class="endpoint-row">
        <code id="mcpEndpointValue">${escapeHtml(mcpEndpointUrl)}</code>
      </div>
      <p class="composer-hint">Streamable HTTP with OAuth 2.1 or an API key</p>
      <div class="composer-bar">
        <a href="/api" class="btn sm">${renderSvg("key", 14)}<span>Create an API key</span></a>
        <button type="button" class="btn primary sm" onclick="window.copyToClipboard('${escapeHtml(mcpEndpointUrl)}', this)">
          ${renderSvg("copy", 14)}<span>Copy</span>
        </button>
      </div>
    </div>

    <div class="chips" style="justify-content:center; margin-top:16px;">
      <a href="/tools" class="chip">${renderSvg("terminal", 14)}Browse tools</a>
      <a href="/upload" class="chip">${renderSvg("upload", 14)}Upload files</a>
      <a href="/store" class="chip">${renderSvg("files", 14)}Your files</a>
      <a href="/stats" class="chip">${renderSvg("activity", 14)}Usage</a>
    </div>

    <div class="home-showcase">
      <h2 class="home-showcase-title">Built for safe, autonomous engineering workflows</h2>
      <p class="home-showcase-sub">Connect any MCP-compatible assistant in seconds with per-key tool permissions, encrypted credential overrides, and isolated compute.</p>

      <div class="animated-terminal" aria-label="Live runtime preview">
        <div class="animated-terminal-head">
          <span class="term-dots"><span></span><span></span><span></span></span>
          <span>krix-sandbox · bash</span>
        </div>
        <div class="animated-terminal-body">
          <div class="term-line"><span class="term-prompt">$</span><span id="termCmdText">sandbox_exec "npm run typecheck && npm test"</span><span class="term-cursor" aria-hidden="true"></span></div>
          <div id="termOutText" class="text-muted" style="margin-top:6px;">✓ 0 type errors · 24/24 suites passed in 1.4s</div>
        </div>
      </div>

      <div class="home-showcase-actions">
        <a href="/tools" class="btn primary sm">${renderSvg("terminal", 14)}<span>Inspect Tools</span></a>
        <a href="/stats" class="btn sm">${renderSvg("activity", 14)}<span>View Telemetry</span></a>
      </div>
    </div>

    <h2 class="section-title">Quick configuration</h2>
    <div class="panel flush quick-config-panel">
      <div class="codeblock" style="border:0; border-radius:0;">
        <div class="codeblock-head">
          <span id="snippetFilePath">mcp_config.json</span>
          <button type="button" class="btn ghost sm snippet-copy-button" aria-label="Copy snippet" onclick="window.copyToClipboard(document.getElementById('mcpSnippetCode').textContent, this)">
            ${renderSvg("copy", 14)}<span>Copy</span>
          </button>
        </div>
        <pre id="mcpSnippetCode">${escapeHtml(mcpConfigJson)}</pre>
      </div>
    </div>

    <h2 class="section-title">Everything included</h2>
    <div class="features-grid">
      ${featuresList
        .map(
          (f) => `
      <div class="feature-card">
        <span class="feature-icon">${renderSvg(f.icon, 18)}</span>
        <div class="feature-title">${escapeHtml(f.title)}</div>
        <div class="feature-desc">${escapeHtml(f.desc)}</div>
      </div>`,
        )
        .join("")}
    </div>

    <h2 class="section-title">Platform capabilities</h2>
    <div class="editorial-stack">
      ${capabilityCards
        .map(
          (card) => `
      <article class="editorial-card">
        <div class="editorial-card-meta">
          <span class="badge">${escapeHtml(card.tag)}</span>
          <span>${escapeHtml(card.meta)}</span>
        </div>
        <h3 class="editorial-card-title">${escapeHtml(card.title)}</h3>
        <p class="editorial-card-desc">${escapeHtml(card.desc)}</p>
        <div class="editorial-specs">
          ${card.specs
            .map(
              (s) => `
          <div class="editorial-spec-row">
            <span class="editorial-spec-k">${escapeHtml(s.k)}</span>
            <span class="editorial-spec-v">${escapeHtml(s.v)}</span>
          </div>`,
            )
            .join("")}
        </div>
        <a href="${card.ctaHref}" class="btn editorial-cta">${escapeHtml(card.ctaLabel)} ${renderSvg("chevron-right", 14)}</a>
      </article>`,
        )
        .join("")}
    </div>

    <h2 class="section-title">Your workspace</h2>
    <div class="ws-grid">
      <a href="/upload" class="ws-card">
        <span class="ws-icon">${renderSvg("upload", 20)}</span>
        <div class="ws-body">
          <div class="ws-title">Uploads <code class="inline-code">upload/</code></div>
          <div class="ws-desc">Drop files here for your agent. Kept for 24 hours.</div>
        </div>
        <span class="ws-go">${renderSvg("chevron-right", 16)}</span>
      </a>
      <a href="/store" class="ws-card">
        <span class="ws-icon">${renderSvg("files", 20)}</span>
        <div class="ws-body">
          <div class="ws-title">Saved files <code class="inline-code">store/</code></div>
          <div class="ws-desc">Files you keep. Share them with a link.</div>
        </div>
        <span class="ws-go">${renderSvg("chevron-right", 16)}</span>
      </a>
      <div class="ws-card">
        <span class="ws-icon">${renderSvg("terminal", 20)}</span>
        <div class="ws-body">
          <div class="ws-title">Sandbox <code class="inline-code">workspace/</code></div>
          <div class="ws-desc">Scratch space for code your agent runs.</div>
        </div>
      </div>
    </div>

    <script>
      (function() {
        var demos = [
          { cmd: 'sandbox_exec "npm run typecheck && npm test"', out: '✓ 0 type errors · 24/24 suites passed in 1.4s' },
          { cmd: 'code_graph_impact --symbol "verifyAccessToken"', out: '✓ Indexed 142 files · 3 callers traced in 18ms' },
          { cmd: 'github_create_pr --base main --head feat/oauth', out: '✓ Pull request #84 opened · checks pending' },
          { cmd: 'render_deploy --service krix-prod --wait', out: '✓ Live at https://krix.onrender.com · 200 OK' }
        ];
        var dIdx = 0;
        setInterval(function() {
          dIdx = (dIdx + 1) % demos.length;
          var cEl = document.getElementById('termCmdText');
          var oEl = document.getElementById('termOutText');
          if (cEl) cEl.textContent = demos[dIdx].cmd;
          if (oEl) oEl.textContent = demos[dIdx].out;
        }, 3800);
      })();
    </script>
  `;

  return renderPageShell({
    title: "Krix",
    activeTab: "home",
    wide: true,
    content,
    owner: params.owner,
  });
}
