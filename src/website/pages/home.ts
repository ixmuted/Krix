// Homepage Overview, Client Configurator, and Sandbox Workspace Explorer
// Minimalist Layout with Maximalist Effects (Spotlight cards, live KPI telemetry, zero operation slop)

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
    <!-- Hero Section -->
    <section style="display:flex; flex-direction:column; align-items:center; text-align:center; padding:48px 0 32px; gap:16px;">
      <!-- Protocol Readiness Badge -->
      <div style="display:inline-flex; align-items:center; gap:8px; padding:5px 14px; border-radius:var(--radius-full); background:var(--bg-surface-1); border:1px solid var(--border-subtle); font-size:12px; font-weight:500; color:var(--fg);">
        <span class="status-dot-available"></span>
        <span>Unified Model Context Protocol &amp; Agent Execution Engine</span>
      </div>

      <!-- Headline with Metallic Gradient -->
      <h1 style="font-size: clamp(32px, 5vw, 48px); font-weight:800; letter-spacing:-0.03em; line-height:1.1; max-width:760px; color:var(--fg);">
        High-Efficiency Model Context Protocol Hub
      </h1>

      <p style="font-size:15px; color:var(--geist-gray-50); max-width:620px; line-height:1.6;">
        Combines GitHub repository inspection, token-efficient cloud deployments, and isolated execution sandboxes into a single streaming port.
      </p>

      <!-- Primary Action Row -->
      <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:12px; margin-top:8px;">
        <button type="button" class="btn primary deploy-btn" onclick="window.copyToClipboard('${escapeHtml(mcpEndpointUrl)}', this)" style="padding:10px 20px; border-radius:var(--radius-full); gap:8px;">
          ${renderSvg("copy", 15)}
          <span>Copy MCP Endpoint</span>
        </button>

        <a href="/tools" class="btn" style="padding:10px 20px; border-radius:var(--radius-full); gap:8px;">
          ${renderSvg("sliders", 15)}
          <span>Browse 117 Tools</span>
        </a>

        <a href="/api" class="btn ghost" style="padding:10px 16px; border-radius:var(--radius-full); gap:6px;">
          ${renderSvg("lock", 14)}
          <span>API Keys</span>
        </a>
      </div>
    </section>

    <!-- Bento Grid Architecture -->
    <div style="display:grid; grid-template-columns:repeat(12, 1fr); gap:20px; margin-top:16px;">
      <!-- Card 1: Interactive Client Configurator (8 Columns) -->
      <div class="card spotlight-card card-top-border" style="grid-column:span 8; padding:24px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px;">
          <div>
            <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:var(--geist-gray-50);">01 // CLIENT CONFIGURATION</div>
            <h2 style="font-size:17px; font-weight:700; color:var(--fg); margin-top:4px;">Connect Your AI Workspace</h2>
          </div>
          <button type="button" class="btn" onclick="window.copyToClipboard(document.getElementById('mcpSnippetCode').textContent, this)" style="padding:6px 12px; font-size:12px; border-radius:var(--radius-full);">
            ${renderSvg("copy", 14)}
            <span>Copy Snippet</span>
          </button>
        </div>

        <!-- Segmented Tab Pills -->
        <div style="display:flex; gap:6px; margin-bottom:14px; border-bottom:1px solid var(--border-subtle); padding-bottom:10px; overflow-x:auto;">
          <button type="button" id="tabClaude" class="nav-pill active" onclick="switchClientTab('claude')">Claude Desktop</button>
          <button type="button" id="tabCursor" class="nav-pill" onclick="switchClientTab('cursor')">Cursor</button>
          <button type="button" id="tabVsCode" class="nav-pill" onclick="switchClientTab('vscode')">VS Code</button>
          <button type="button" id="tabRaw" class="nav-pill" onclick="switchClientTab('raw')">Raw Endpoints</button>
        </div>

        <!-- Syntax Code Snippet -->
        <div style="position:relative; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:16px; overflow:hidden;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--geist-gray-50); font-family:var(--font-mono); margin-bottom:10px; border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">
            <span id="snippetFilePath">claude_desktop_config.json</span>
            <span>JSON</span>
          </div>
          <pre id="mcpSnippetCode" style="font-family:var(--font-mono); font-size:12px; line-height:1.6; color:var(--fg); overflow-x:auto;">${escapeHtml(claudeConfigJson)}</pre>
        </div>
      </div>

      <!-- Card 2: Live Protocol Telemetry (4 Columns) -->
      <div class="card spotlight-card card-top-border" style="grid-column:span 4; padding:24px; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:var(--geist-gray-50);">02 // TELEMETRY SUMMARY</div>
          <h2 style="font-size:17px; font-weight:700; color:var(--fg); margin-top:4px;">Platform Metrics</h2>
        </div>

        <div style="display:flex; flex-direction:column; gap:14px; margin:20px 0;">
          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border-radius:var(--radius-md); background:var(--bg-surface-1); border:1px solid var(--border-subtle);">
            <div style="display:flex; align-items:center; gap:8px;">
              ${renderSvg("sliders", 16)}
              <span style="font-size:13px; color:var(--geist-gray-50);">Catalog Tools</span>
            </div>
            <span style="font-size:15px; font-weight:700; font-family:var(--font-mono);">117</span>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border-radius:var(--radius-md); background:var(--bg-surface-1); border:1px solid var(--border-subtle);">
            <div style="display:flex; align-items:center; gap:8px;">
              ${renderSvg("terminal", 16)}
              <span style="font-size:13px; color:var(--geist-gray-50);">Transport Layer</span>
            </div>
            <span style="font-size:12px; font-weight:600; color:var(--success); font-family:var(--font-mono);">Streamable HTTP</span>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border-radius:var(--radius-md); background:var(--bg-surface-1); border:1px solid var(--border-subtle);">
            <div style="display:flex; align-items:center; gap:8px;">
              ${renderSvg("shield", 16)}
              <span style="font-size:13px; color:var(--geist-gray-50);">Auth Protocol</span>
            </div>
            <span style="font-size:12px; font-weight:600; font-family:var(--font-mono);">OAuth 2.1 PKCE</span>
          </div>
        </div>

        <a href="/stats" class="btn" style="width:100%; border-radius:var(--radius-full); justify-content:center;">
          ${renderSvg("cpu", 14)}
          <span>Open Full Telemetry</span>
        </a>
      </div>

      <!-- Card 3: Interactive Sandbox Workspace Explorer (12 Columns) -->
      <div class="card spotlight-card card-top-border" style="grid-column:span 12; padding:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:12px;">
          <div>
            <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:var(--geist-gray-50);">03 // AGENT WORKSPACE</div>
            <h2 style="font-size:17px; font-weight:700; color:var(--fg); margin-top:4px;">Sandbox Directory Structure</h2>
          </div>
          <div style="display:flex; gap:10px;">
            <a href="/upload" class="btn" style="border-radius:var(--radius-full);">
              ${renderSvg("upload", 14)}
              <span>Ingestion Workbench</span>
            </a>
            <a href="/store" class="btn" style="border-radius:var(--radius-full);">
              ${renderSvg("folder", 14)}
              <span>View FileStore</span>
            </a>
          </div>
        </div>

        <!-- Interactive File Tree UI (Replacing static ASCII tree) -->
        <div style="background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md); overflow:hidden;">
          <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 16px; background:var(--bg-surface-2); border-bottom:1px solid var(--border-subtle); font-size:12px; font-family:var(--font-mono); color:var(--geist-gray-50);">
            <div style="display:flex; align-items:center; gap:8px;">
              ${renderSvg("folder", 15)}
              <span style="color:var(--fg); font-weight:600;">krix-sandbox/</span>
            </div>
            <span>Ephemeral & Persistent Mounts</span>
          </div>

          <div style="padding:12px 16px; display:flex; flex-direction:column; gap:6px; font-family:var(--font-mono); font-size:13px;">
            <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 8px; border-radius:4px; hover:background:var(--bg-surface-2);">
              <div style="display:flex; align-items:center; gap:8px;">
                ${renderSvg("folder", 15, "text-muted")}
                <span style="color:var(--fg);">upload/</span>
                <span style="font-size:11px; color:var(--geist-gray-50); font-family:var(--font-sans);">(Web Ingestion Dropzone • 24h retention)</span>
              </div>
              <a href="/upload" style="font-size:11px; color:var(--accent);">Upload Files &rarr;</a>
            </div>

            <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 8px; border-radius:4px;">
              <div style="display:flex; align-items:center; gap:8px;">
                ${renderSvg("folder", 15, "text-muted")}
                <span style="color:var(--fg);">store/</span>
                <span style="font-size:11px; color:var(--geist-gray-50); font-family:var(--font-sans);">(Persistent Cloud FileStore datasets)</span>
              </div>
              <a href="/store" style="font-size:11px; color:var(--accent);">Inspect Store &rarr;</a>
            </div>

            <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 8px; border-radius:4px;">
              <div style="display:flex; align-items:center; gap:8px;">
                ${renderSvg("folder", 15, "text-muted")}
                <span style="color:var(--fg);">workspace/</span>
                <span style="font-size:11px; color:var(--geist-gray-50); font-family:var(--font-sans);">(Isolated execution scratch directory)</span>
              </div>
              <span style="font-size:11px; color:var(--geist-gray-50);">Agent Scratch</span>
            </div>
          </div>
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
    title: "Overview - Krix",
    activeTab: "home",
    content,
    owner: params.owner,
  });
}
