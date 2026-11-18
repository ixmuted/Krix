// Homepage Overview, Client Configurator, and Sandbox Workspace Explorer
// Connect hub

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

  const content = `
    <section class="hero">
      <p id="homeGreeting" class="hero-greeting" aria-live="polite">Welcome back</p>
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
    <div class="panel flush">
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
        var h = new Date().getHours();
        var greeting = (h >= 5 && h < 12) ? 'Good Morning'
          : (h >= 12 && h < 17) ? 'Good Afternoon'
          : (h >= 17 && h < 21) ? 'Good Evening'
          : 'Good Night';
        var firstName = ${JSON.stringify(ownerFirstName)};
        var el = document.getElementById('homeGreeting');
        if (el) el.textContent = firstName ? (greeting + ', ' + firstName) : greeting;
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
