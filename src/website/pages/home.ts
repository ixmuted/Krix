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
  const sseEndpointUrl = `${base}/sse`;
  const discoveryUrl = `${base}/.well-known/oauth-protected-resource`;

  const aiAppsConfigJson = JSON.stringify(
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

  const ideClientsConfigJson = JSON.stringify(
    {
      servers: {
        krix: {
          type: "http",
          url: mcpEndpointUrl,
        },
      },
    },
    null,
    2,
  );

  const rawEndpointsText = [
    `Streamable HTTP: ${mcpEndpointUrl}`,
    `SSE Fallback: ${sseEndpointUrl}`,
    `OAuth Discovery: ${discoveryUrl}`,
  ].join("\n");

  const ownerFirstName = params.owner?.name
    ? String(params.owner.name).trim().split(/\s+/)[0]
    : "";

  const integrationCategories = [
    {
      id: "ai-apps",
      title: "AI Apps",
      subtitle: "Desktop & web assistants supporting Streamable HTTP MCP",
      icon: "sparkles",
      file: "mcp_config.json",
      code: aiAppsConfigJson,
      authNote: "Supports OAuth 2.1 PKCE automatic discovery or Bearer API key.",
    },
    {
      id: "ide-cli",
      title: "IDE & CLI Clients",
      subtitle: "Code editors, terminal agents, and workspace MCP runners",
      icon: "terminal",
      file: "mcp.json",
      code: ideClientsConfigJson,
      authNote: "Add to your project or user MCP configuration file.",
    },
    {
      id: "raw-endpoints",
      title: "Raw Endpoints",
      subtitle: "Direct transport URLs and OAuth metadata for custom clients",
      icon: "link",
      file: "endpoints.txt",
      code: rawEndpointsText,
      authNote: "Send Authorization: Bearer <API_KEY> or complete OAuth 2.1 flow.",
    },
  ];

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
      <div class="hero-greeting-row">
        <span class="hero-spark" aria-hidden="true">${renderSvg("krix-spark", 26)}</span>
        <p id="homeGreeting" class="hero-greeting-text" aria-live="polite">Welcome back.</p>
      </div>
      <h1 class="hero-title">Connect your AI tools to Krix</h1>
      <p class="hero-sub">One unified MCP gateway for GitHub, Render, code-graph analysis, and an isolated execution sandbox.</p>
    </section>

    <div class="composer">
      <div class="endpoint-row">
        <code id="mcpEndpointValue">${escapeHtml(mcpEndpointUrl)}</code>
      </div>
      <p class="composer-hint">Streamable HTTP with OAuth 2.1 PKCE or an API key</p>
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
      <span class="hero-kicker">
        <span class="live-pulse-wrap" aria-hidden="true"><span class="live-pulse-dot"></span><span class="live-pulse-ring"></span></span>
        <span>Production MCP Runtime</span>
      </span>
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

    <h2 class="section-title">Integration options</h2>
    <div class="ws-grid integration-grid">
      ${integrationCategories
        .map(
          (cat) => `
      <button type="button" class="ws-card integration-card" onclick="openIntegrationModal('${cat.id}')">
        <span class="ws-icon">${renderSvg(cat.icon, 20)}</span>
        <div class="ws-body" style="text-align:left;">
          <div class="ws-title">${escapeHtml(cat.title)}</div>
          <div class="ws-desc">${escapeHtml(cat.subtitle)}</div>
        </div>
        <span class="ws-go">${renderSvg("chevron-right", 16)}</span>
      </button>`,
        )
        .join("")}
    </div>

    <h2 class="section-title">Quick configuration</h2>
    <div class="panel flush quick-config-panel">
      <div class="panel-head">
        <div class="tabs tabs-fit" role="tablist">
          <button type="button" id="tabAiApps" class="nav-pill active" role="tab" onclick="switchClientTab('ai-apps')">AI Apps</button>
          <button type="button" id="tabIdeCli" class="nav-pill" role="tab" onclick="switchClientTab('ide-cli')">IDE &amp; CLI</button>
          <button type="button" id="tabRaw" class="nav-pill" role="tab" onclick="switchClientTab('raw-endpoints')">Raw Endpoints</button>
        </div>
      </div>
      <div class="codeblock" style="border:0; border-radius:0;">
        <div class="codeblock-head">
          <span id="snippetFilePath">mcp_config.json</span>
          <button type="button" class="btn ghost sm snippet-copy-button" aria-label="Copy snippet" onclick="window.copyToClipboard(document.getElementById('mcpSnippetCode').textContent, this)">
            ${renderSvg("copy", 14)}<span>Copy</span>
          </button>
        </div>
        <pre id="mcpSnippetCode">${escapeHtml(aiAppsConfigJson)}</pre>
      </div>
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

    <div id="integrationModal" class="modal-backdrop" hidden role="dialog" aria-modal="true" aria-labelledby="integrationModalTitle" onclick="if(event.target===this) closeIntegrationModal()">
      <div class="modal-card integration-modal-card">
        <div class="integration-modal-head">
          <div class="cluster" style="gap:10px;">
            <span id="integrationModalIcon" class="ws-icon" style="width:36px;height:36px;border-radius:10px;"></span>
            <div>
              <h3 class="modal-title" id="integrationModalTitle">Integration</h3>
              <p id="integrationModalSub" class="modal-text" style="margin-top:2px;"></p>
            </div>
          </div>
          <button type="button" class="icon-btn" onclick="closeIntegrationModal()" aria-label="Close modal">${renderSvg("x", 18)}</button>
        </div>

        <div class="modal-body" style="margin:16px 0 0; gap:14px;">
          <div class="field">
            <label>MCP Endpoint URL</label>
            <div class="endpoint-row">
              <code id="integrationModalEndpoint">${escapeHtml(mcpEndpointUrl)}</code>
              <button type="button" class="btn ghost sm" onclick="window.copyToClipboard('${escapeHtml(mcpEndpointUrl)}', this)" aria-label="Copy endpoint URL">${renderSvg("copy", 14)}<span>Copy</span></button>
            </div>
          </div>

          <div class="field">
            <label id="integrationModalFileLabel">Configuration</label>
            <div class="codeblock">
              <div class="codeblock-head">
                <span id="integrationModalFileName">mcp_config.json</span>
                <button type="button" class="btn ghost sm" onclick="window.copyToClipboard(document.getElementById('integrationModalCode').textContent, this)" aria-label="Copy configuration">${renderSvg("copy", 14)}<span>Copy</span></button>
              </div>
              <pre id="integrationModalCode"></pre>
            </div>
          </div>

          <div class="integration-modal-note">
            ${renderSvg("shield-check", 16)}
            <span id="integrationModalAuthNote"></span>
          </div>
        </div>

        <div class="modal-actions">
          <a href="/api" class="btn">${renderSvg("key", 14)}<span>Manage API keys</span></a>
          <button type="button" class="btn primary" onclick="closeIntegrationModal()">Done</button>
        </div>
      </div>
    </div>

    <script>
      (function() {
        var now = new Date();
        var h = now.getHours();
        var firstName = ${JSON.stringify(ownerFirstName)};
        var nameSuffix = firstName ? (', ' + firstName) : '';

        var morningGreetings = [
          'Good Morning' + nameSuffix + '.',
          'Fresh coffee, clean terminal.',
          'Early build, zero warnings.',
          'Ready for a morning sprint?',
          'New day, green CI ahead.',
          'Morning focus mode is on.',
          'Let’s ship something clean today.',
          'Sun’s up, sandbox is warm.',
          'First commit of the day awaits.',
          'Quiet morning, sharp mind.',
          'Booting up your workspace.',
          'Clean slate for today’s architecture.',
          'Morning momentum starts here.'
        ];

        var afternoonGreetings = [
          'Good Afternoon' + nameSuffix + '.',
          'Midday shipping sprint.',
          'Keep the momentum rolling.',
          'Deep work, steady progress.',
          'Afternoon build & deploy.',
          'All systems nominal this afternoon.',
          'Halfway through—time to ship.',
          'Turning ideas into pull requests.',
          'Fast feedback loops await.',
          'Stay in flow, keep building.',
          'Afternoon refactor session.',
          'Sandbox is primed and ready.',
          'Focused afternoon, clean diffs.'
        ];

        var eveningGreetings = [
          'Good Evening' + nameSuffix + '.',
          'Evening code & calm.',
          'Golden hour for shipping.',
          'Wrapping up today’s milestones.',
          'One last clean PR before dinner?',
          'Quiet evening, deep focus.',
          'Polishing the final details.',
          'Evening build session active.',
          'Smooth deploys into the evening.',
          'Relaxed pace, sharp execution.',
          'Closing out tickets cleanly.',
          'Sunset sprint in progress.',
          'Evening lab is open.'
        ];

        var nightGreetings = [
          'Good Night' + nameSuffix + '.',
          'It’s a late-night jam session.',
          'Midnight builders club.',
          'Night owl engineering mode.',
          'Burning the midnight oil cleanly.',
          'Quiet world, loud ideas.',
          'Late-night prototype lab.',
          'Zero distractions after midnight.',
          'Stars out, terminal glowing.',
          'Deep-night debugging session.',
          'Shipping while the world sleeps.',
          'Late-night creative flow.',
          'After-hours sandbox session.'
        ];

        var pool = (h >= 5 && h < 12) ? morningGreetings
          : (h >= 12 && h < 17) ? afternoonGreetings
          : (h >= 17 && h < 21) ? eveningGreetings
          : nightGreetings;

        var idx = (now.getMinutes() + now.getDate()) % pool.length;
        var el = document.getElementById('homeGreeting');
        if (el) el.textContent = pool[idx];

        // Animated live terminal preview
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

      var INTEGRATION_DATA = ${JSON.stringify(
        Object.fromEntries(
          integrationCategories.map((c) => [
            c.id,
            {
              title: c.title,
              subtitle: c.subtitle,
              file: c.file,
              code: c.code,
              authNote: c.authNote,
              iconSvg: renderSvg(c.icon, 18),
            },
          ]),
        ),
      )};

      function switchClientTab(type) {
        document.querySelectorAll('#tabAiApps, #tabIdeCli, #tabRaw').forEach(function(el) {
          el.classList.remove('active');
        });
        var codeEl = document.getElementById('mcpSnippetCode');
        var fileEl = document.getElementById('snippetFilePath');
        var item = INTEGRATION_DATA[type] || INTEGRATION_DATA['ai-apps'];
        if (type === 'ai-apps') document.getElementById('tabAiApps')?.classList.add('active');
        else if (type === 'ide-cli') document.getElementById('tabIdeCli')?.classList.add('active');
        else if (type === 'raw-endpoints') document.getElementById('tabRaw')?.classList.add('active');
        if (fileEl) fileEl.textContent = item.file;
        if (codeEl) codeEl.textContent = item.code;
      }

      function openIntegrationModal(type) {
        var item = INTEGRATION_DATA[type];
        if (!item) return;
        var modal = document.getElementById('integrationModal');
        if (!modal) return;
        if (modal.parentNode !== document.body) document.body.appendChild(modal);
        document.getElementById('integrationModalTitle').textContent = item.title;
        document.getElementById('integrationModalSub').textContent = item.subtitle;
        document.getElementById('integrationModalIcon').innerHTML = item.iconSvg;
        document.getElementById('integrationModalFileName').textContent = item.file;
        document.getElementById('integrationModalCode').textContent = item.code;
        document.getElementById('integrationModalAuthNote').textContent = item.authNote;
        modal.hidden = false;
        modal.style.display = 'flex';
      }

      function closeIntegrationModal() {
        var modal = document.getElementById('integrationModal');
        if (!modal) return;
        modal.hidden = true;
        modal.style.display = 'none';
      }

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeIntegrationModal();
      });
    </script>
  `;

  return renderPageShell({
    title: "Krix",
    activeTab: "home",
    content,
    owner: params.owner,
  });
}
