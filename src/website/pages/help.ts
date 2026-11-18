// Help & Documentation Page for Krix MCP Gateway
// Step-by-Step Client Integration Guides, FAQ, and Protocol Overview

import { renderPageShell } from "../components.js";
import { renderSvg } from "../icons.js";

export function renderHelpPage(params: { owner?: any; base?: string }): string {
  const base = params.base || "https://krix.onrender.com";
  const mcpUrl = `${base}/sse`;

  const content = `
    <div class="page-head">
      <div>
        <h1 class="page-title">Help</h1>
        <p class="page-sub">Connect your AI assistant, choose which tools it can use, and manage the sandbox.</p>
      </div>
    </div>

    <div class="panel">
      <div class="panel-title">Your MCP endpoint</div>
      <p class="panel-sub" style="margin-bottom:12px;">Krix serves a streamable HTTP endpoint that works with current AI editors and assistants.</p>
      <div class="endpoint-row">
        <code>${mcpUrl}</code>
        <button type="button" class="btn sm" onclick="window.copyToClipboard('${mcpUrl}', this)">${renderSvg("copy", 14)}<span>Copy</span></button>
      </div>
    </div>

    <h2 class="section-title">Connect a client</h2>
    <div class="stack">
      <div class="panel">
        <div class="cluster" style="margin-bottom:8px;">${renderSvg("cursor", 18)}<div class="panel-title">Cursor</div></div>
        <p class="panel-sub" style="margin-bottom:12px;">Open Cursor Settings, then Features, then MCP. Add a server of type <code class="inline-code">sse</code>.</p>
        <div class="codeblock"><pre>{
  "name": "krix",
  "type": "sse",
  "url": "${mcpUrl}?key=YOUR_API_KEY"
}</pre></div>
      </div>
      <div class="panel">
        <div class="cluster" style="margin-bottom:8px;">${renderSvg("claude", 18)}<div class="panel-title">Claude Desktop and Windsurf</div></div>
        <p class="panel-sub" style="margin-bottom:12px;">Add this to <code class="inline-code">claude_desktop_config.json</code> under <code class="inline-code">mcpServers</code>.</p>
        <div class="codeblock"><pre>{
  "mcpServers": {
    "krix": {
      "url": "${mcpUrl}?key=YOUR_API_KEY"
    }
  }
}</pre></div>
      </div>
    </div>

    <h2 class="section-title">Common questions</h2>
    <div class="panel prose">
      <h3 style="font-size:15px;">How does sandbox isolation work?</h3>
      <p>Each API key or OAuth session runs in its own workspace. Commands run with <code class="inline-code">sandbox_exec</code> cannot reach system directories or other users’ data.</p>
      <h3 style="font-size:15px; margin-top:20px;">How do I set up GitHub and Render access?</h3>
      <p>Add your GitHub token or Render API key in <a href="/settings">Settings</a>. You can override them for a single key on that key’s page.</p>
      <h3 style="font-size:15px; margin-top:20px;">Can I turn off specific tools?</h3>
      <p>Yes. Switch any tool on or off in Settings, or open an API key to set permissions for that key only.</p>
    </div>
  `;

  return renderPageShell({
    title: "Help - Krix",
    activeTab: "home",
    content,
    owner: params.owner,
  });
}
