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

  const claudeConfigJson = JSON.stringify(
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

  const cursorConfigJson = JSON.stringify(
    {
      name: "krix",
      url: mcpEndpointUrl,
      type: "sse",
    },
    null,
    2,
  );

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

    <h2 class="section-title">Add Krix to your client</h2>
    <div class="panel flush">
      <div class="panel-head">
        <div class="tabs tabs-fit" role="tablist">
          <button type="button" id="tabClaude" class="nav-pill active" role="tab" onclick="switchClientTab('claude')">Claude Desktop</button>
          <button type="button" id="tabCursor" class="nav-pill" role="tab" onclick="switchClientTab('cursor')">Cursor</button>
          <button type="button" id="tabVsCode" class="nav-pill" role="tab" onclick="switchClientTab('vscode')">VS Code</button>
          <button type="button" id="tabRaw" class="nav-pill" role="tab" onclick="switchClientTab('raw')">Endpoints</button>
        </div>
      </div>
      <div class="codeblock" style="border:0; border-radius:0;">
        <div class="codeblock-head">
          <span id="snippetFilePath">claude_desktop_config.json</span>
          <button type="button" class="btn ghost sm snippet-copy-button" aria-label="Copy snippet" onclick="window.copyToClipboard(document.getElementById('mcpSnippetCode').textContent, this)">
            ${renderSvg("copy", 14)}<span>Copy</span>
          </button>
        </div>
        <pre id="mcpSnippetCode">${escapeHtml(claudeConfigJson)}</pre>
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

    <script>
      function switchClientTab(type) {
        document.querySelectorAll('#tabClaude, #tabCursor, #tabVsCode, #tabRaw').forEach(el => el.classList.remove('active'));
        const codeEl = document.getElementById('mcpSnippetCode');
        const fileEl = document.getElementById('snippetFilePath');

        if (type === 'claude') {
          document.getElementById('tabClaude').classList.add('active');
          fileEl.textContent = 'claude_desktop_config.json';
          codeEl.textContent = ${JSON.stringify(claudeConfigJson)};
        } else if (type === 'cursor') {
          document.getElementById('tabCursor').classList.add('active');
          fileEl.textContent = 'cursor_settings.json';
          codeEl.textContent = ${JSON.stringify(cursorConfigJson)};
        } else if (type === 'vscode') {
          document.getElementById('tabVsCode').classList.add('active');
          fileEl.textContent = '.vscode/settings.json';
          codeEl.textContent = JSON.stringify({ "mcp.servers": { "krix": { "url": "${mcpEndpointUrl}" } } }, null, 2);
        } else if (type === 'raw') {
          document.getElementById('tabRaw').classList.add('active');
          fileEl.textContent = 'endpoints.txt';
          codeEl.textContent = "MCP Streamable HTTP Endpoint: ${mcpEndpointUrl}\\nMCP SSE Fallback Endpoint: ${sseEndpointUrl}\\nDiscovery Metadata: ${base}/.well-known/oauth-protected-resource";
        }
      }
    </script>
  `;

  return renderPageShell({
    title: "Krix",
    activeTab: "home",
    content,
    owner: params.owner,
  });
}
