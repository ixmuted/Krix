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
        <button type="button" class="btn primary sm" onclick="window.copyToClipboard('${escapeHtml(mcpEndpointUrl)}', this)">
          ${renderSvg("copy", 14)}<span>Copy</span>
        </button>
      </div>
      <div class="composer-bar">
        <span class="text-muted" style="font-size:13px;">Streamable HTTP with OAuth 2.1 or an API key</span>
        <a href="/api" class="btn sm">${renderSvg("key", 14)}<span>Create an API key</span></a>
      </div>
    </div>

    <div class="chips" style="justify-content:center; margin-top:16px;">
      <a href="/tools" class="chip">${renderSvg("terminal", 14)}Browse tools</a>
      <a href="/upload" class="chip">${renderSvg("upload", 14)}Upload files</a>
      <a href="/store" class="chip">${renderSvg("folder", 14)}Your files</a>
      <a href="/stats" class="chip">${renderSvg("activity", 14)}Usage</a>
    </div>

    <h2 class="section-title">Add Krix to your client</h2>
    <div class="panel flush">
      <div class="panel-head">
        <div class="tabs" role="tablist">
          <button type="button" id="tabClaude" class="nav-pill active" role="tab" onclick="switchClientTab('claude')">Claude Desktop</button>
          <button type="button" id="tabCursor" class="nav-pill" role="tab" onclick="switchClientTab('cursor')">Cursor</button>
          <button type="button" id="tabVsCode" class="nav-pill" role="tab" onclick="switchClientTab('vscode')">VS Code</button>
          <button type="button" id="tabRaw" class="nav-pill" role="tab" onclick="switchClientTab('raw')">Endpoints</button>
        </div>
        <button type="button" class="btn ghost sm snippet-copy-button" aria-label="Copy snippet" onclick="window.copyToClipboard(document.getElementById('mcpSnippetCode').textContent, this)">
          ${renderSvg("copy", 14)}<span>Copy</span>
        </button>
      </div>
      <div class="codeblock" style="border:0; border-radius:0;">
        <div class="codeblock-head"><span id="snippetFilePath">claude_desktop_config.json</span></div>
        <pre id="mcpSnippetCode">${escapeHtml(claudeConfigJson)}</pre>
      </div>
    </div>

    <h2 class="section-title">Your workspace</h2>
    <div class="panel flush">
      <div class="list">
        <a href="/upload" class="list-item clickable">
          <div class="list-main">${renderSvg("upload", 18)}<div><div class="list-name">upload/</div><div class="list-meta">Drop files here for your agent. Kept for 24 hours.</div></div></div>
          ${renderSvg("chevron-right", 16)}
        </a>
        <a href="/store" class="list-item clickable">
          <div class="list-main">${renderSvg("folder", 18)}<div><div class="list-name">store/</div><div class="list-meta">Files you keep. Share them with a link.</div></div></div>
          ${renderSvg("chevron-right", 16)}
        </a>
        <div class="list-item">
          <div class="list-main">${renderSvg("terminal", 18)}<div><div class="list-name">workspace/</div><div class="list-meta">Scratch space for code your agent runs.</div></div></div>
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
