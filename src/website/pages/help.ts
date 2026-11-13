// Help & Documentation Page for Krix MCP Gateway
// Step-by-Step Client Integration Guides, FAQ, and Protocol Overview

import { renderPageShell } from "../components.js";
import { renderSvg } from "../icons.js";

export function renderHelpPage(params: { owner?: any; base?: string }): string {
  const base = params.base || "https://krix.onrender.com";
  const mcpUrl = `${base}/sse`;

  const content = `
    <div style="max-width:840px; margin:0 auto; padding:24px 0 64px;">
      <div style="margin-bottom:32px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
          <a href="/home" style="font-size:12px; color:var(--geist-gray-50); display:flex; align-items:center; gap:4px;">
            &larr; <span>Back to Home</span>
          </a>
        </div>
        <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:var(--geist-gray-50);">DOCUMENTATION &amp; GUIDES</div>
        <h1 style="font-size:32px; font-weight:800; letter-spacing:-0.03em; color:var(--fg); margin-top:6px;">Help &amp; Documentation</h1>
        <p style="font-size:14px; color:var(--geist-gray-50); margin-top:4px;">
          Learn how to connect your AI assistant, configure MCP tools, and manage isolated sandboxes.
        </p>
      </div>

      <!-- Quick Start Deck -->
      <div class="card spotlight-card card-top-border" style="padding:28px; margin-bottom:24px;">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
          <div style="width:32px; height:32px; border-radius:8px; background:var(--bg-surface-2); display:flex; align-items:center; justify-content:center; color:var(--fg);">
            ${renderSvg("zap", 16)}
          </div>
          <h2 style="font-size:18px; font-weight:700; color:var(--fg);">1. Quick Connect MCP Endpoint</h2>
        </div>
        <p style="font-size:13px; color:var(--geist-gray-50); line-height:1.6; margin-bottom:16px;">
          Krix exposes a streamable HTTP Server-Sent Events (SSE) Model Context Protocol endpoint ready for modern AI coding editors:
        </p>
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 14px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md); font-family:var(--font-mono); font-size:12px; color:var(--fg);">
          <code>${mcpUrl}</code>
          <button type="button" class="btn ghost" onclick="window.copyToClipboard('${mcpUrl}', this)" style="padding:4px 8px; font-size:11px;">
            ${renderSvg("copy", 14)}
            <span>Copy</span>
          </button>
        </div>
      </div>

      <!-- IDE & Client Integration Guides -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(360px, 1fr)); gap:20px; margin-bottom:28px;">
        <!-- Cursor IDE -->
        <div class="card spotlight-card" style="padding:24px;">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
            <div style="width:28px; height:28px; border-radius:6px; background:var(--bg-surface-2); display:flex; align-items:center; justify-content:center; color:var(--fg);">
              ${renderSvg("cursor", 15)}
            </div>
            <h3 style="font-size:15px; font-weight:700; color:var(--fg);">Cursor IDE</h3>
          </div>
          <p style="font-size:12px; color:var(--geist-gray-50); line-height:1.5; margin-bottom:12px;">
            Navigate to <strong>Cursor Settings &gt; Features &gt; MCP</strong> and add a new server with type <code>sse</code>:
          </p>
          <pre style="background:var(--bg-surface-1); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); font-family:var(--font-mono); font-size:11px; color:var(--fg); overflow-x:auto;">{
  "name": "krix",
  "type": "sse",
  "url": "${mcpUrl}?key=YOUR_API_KEY"
}</pre>
        </div>

        <!-- Claude Desktop / Windsurf -->
        <div class="card spotlight-card" style="padding:24px;">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
            <div style="width:28px; height:28px; border-radius:6px; background:var(--bg-surface-2); display:flex; align-items:center; justify-content:center; color:var(--fg);">
              ${renderSvg("claude", 15)}
            </div>
            <h3 style="font-size:15px; font-weight:700; color:var(--fg);">Claude Desktop / Windsurf</h3>
          </div>
          <p style="font-size:12px; color:var(--geist-gray-50); line-height:1.5; margin-bottom:12px;">
            Add to your <code>claude_desktop_config.json</code> under <code>mcpServers</code>:
          </p>
          <pre style="background:var(--bg-surface-1); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); font-family:var(--font-mono); font-size:11px; color:var(--fg); overflow-x:auto;">{
  "mcpServers": {
    "krix": {
      "url": "${mcpUrl}?key=YOUR_API_KEY"
    }
  }
}</pre>
        </div>
      </div>

      <!-- FAQ Section -->
      <div class="card spotlight-card" style="padding:28px;">
        <h2 style="font-size:18px; font-weight:700; color:var(--fg); margin-bottom:16px;">Frequently Asked Questions</h2>

        <div style="display:flex; flex-direction:column; gap:16px;">
          <div>
            <h4 style="font-size:14px; font-weight:600; color:var(--fg); margin-bottom:4px;">How does sandbox isolation work?</h4>
            <p style="font-size:12px; color:var(--geist-gray-50); line-height:1.5;">
              Every authenticated API key or OAuth session runs within its own segregated workspace root. Commands executed via <code>sandbox_exec</code> are restricted from accessing system-level directories or cross-tenant datasets.
            </p>
          </div>

          <div>
            <h4 style="font-size:14px; font-weight:600; color:var(--fg); margin-bottom:4px;">How do I configure GitHub and Render access?</h4>
            <p style="font-size:12px; color:var(--geist-gray-50); line-height:1.5;">
              Go to <a href="/settings" style="color:var(--accent); text-decoration:underline;">Settings</a> to provide your GitHub Personal Access Token or Render API key. You can also override tokens for specific keys via the Key Edit page.
            </p>
          </div>

          <div>
            <h4 style="font-size:14px; font-weight:600; color:var(--fg); margin-bottom:4px;">Can I disable specific MCP tools?</h4>
            <p style="font-size:12px; color:var(--geist-gray-50); line-height:1.5;">
              Yes! Visit Settings to toggle any of the 117 tools, or go to <code>/api/settings?key=&lt;id&gt;</code> to manage granular tool permissions on a per-key level.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  return renderPageShell({
    title: "Help & Documentation - Krix",
    activeTab: "home",
    content,
    owner: params.owner,
  });
}
