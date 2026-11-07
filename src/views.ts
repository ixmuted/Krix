import type { OwnerProfile, GeneratedKeyEntry } from "./googleAuth.js";
import type { StatsSummary, KeyMetrics } from "./stats.js";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function timeAgo(ms: number): string {
  if (!ms) return "Never";
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

export function getBaseStyles(): string {
  return `
    :root {
      color-scheme: light dark;
      --bg: #ffffff;
      --fg: #000000;
      --accents-1: #fafafa;
      --accents-2: #eaeaea;
      --accents-3: #999999;
      --accents-4: #888888;
      --accents-5: #666666;
      --accents-6: #444444;
      --accents-7: #333333;
      --accents-8: #111111;
      --border: var(--accents-2);
      --card-bg: #ffffff;
      --card-sub: var(--accents-1);
      --code-bg: var(--accents-1);
      --accent: #0070f3;
      --success: #0070f3;
      --error: #e00;
    }

    .dark {
      --bg: #000000;
      --fg: #ffffff;
      --accents-1: #111111;
      --accents-2: #222222;
      --accents-3: #333333;
      --accents-4: #555555;
      --accents-5: #777777;
      --accents-6: #999999;
      --accents-7: #eaeaea;
      --accents-8: #fafafa;
      --border: var(--accents-2);
      --card-bg: #0a0a0a;
      --card-sub: #111111;
      --code-bg: #050505;
      --accent: #0070f3;
      --success: #0070f3;
      --error: #f85149;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      min-height: 100vh;
      background-color: var(--bg);
      color: var(--fg);
      background-image: radial-gradient(var(--accents-2) 1px, transparent 1px);
      background-size: 24px 24px;
      background-attachment: fixed;
      font: 14px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      transition: background-color 0.25s cubic-bezier(0.16, 1, 0.3, 1), color 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-bottom: 40px;
    }

    .nav-header {
      position: sticky;
      top: 0;
      z-index: 50;
      width: 100%;
      border-bottom: 1px solid var(--border);
      background: var(--bg);
      opacity: 0.96;
      backdrop-filter: blur(12px);
      transition: border-color 0.2s ease;
    }
    .nav-inner {
      max-width: 1020px;
      margin: 0 auto;
      height: 58px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
    }

    .brand-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: var(--fg);
      font-weight: 700;
      font-size: 15px;
      letter-spacing: -0.2px;
    }
    .brand-avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--accents-1);
    }
    .brand-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .nav-pills {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .nav-pill {
      position: relative;
      padding: 6px 12px;
      font-size: 13px;
      border-radius: 6px;
      color: var(--accents-5);
      text-decoration: none;
      font-weight: 500;
      transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .nav-pill:hover {
      color: var(--fg);
      background: var(--accents-1);
    }
    .nav-pill.active {
      color: var(--fg);
      background: var(--accents-1);
      border: 1px solid var(--border);
      font-weight: 600;
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .theme-toggle-btn {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--accents-1);
      color: var(--fg);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .theme-toggle-btn:hover {
      border-color: var(--accents-4);
      background: var(--accents-2);
    }

    .user-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--accents-1);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 500;
    }
    .user-pill img {
      width: 20px;
      height: 20px;
      border-radius: 50%;
    }

    .btn {
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      padding: 7px 14px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--accents-1);
      color: var(--fg);
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .btn:hover {
      border-color: var(--accents-4);
      background: var(--accents-2);
    }
    .btn.primary {
      background: var(--fg);
      color: var(--bg);
      border-color: var(--fg);
    }
    .btn.primary:hover {
      opacity: 0.9;
    }

    .wrapper {
      width: 100%;
      max-width: 1020px;
      padding: 24px 20px;
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02);
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .card:hover {
      transform: translateY(-2px);
      border-color: var(--accents-4);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      border: 1px solid var(--border);
      background: var(--accents-1);
      color: var(--accents-6);
    }
    .badge.success {
      color: #0070f3;
      border-color: rgba(0, 112, 243, 0.3);
      background: rgba(0, 112, 243, 0.08);
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .endpoint-box {
      background: var(--card-sub);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
    }
    .endpoint-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--accents-5);
      margin-bottom: 6px;
    }
    .endpoint-row {
      display: flex;
      gap: 8px;
    }
    .endpoint-row input {
      flex: 1;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--code-bg);
      color: var(--fg);
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-size: 13px;
    }

    .tab-bar {
      display: flex;
      gap: 6px;
      margin-bottom: 12px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 4px;
    }
    .tab {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--accents-5);
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }
    .tab:hover {
      color: var(--fg);
      border-color: var(--accents-4);
    }
    .tab.active {
      background: var(--fg);
      color: var(--bg);
      border-color: var(--fg);
    }

    .code-view {
      position: relative;
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      color: var(--fg);
      white-space: pre;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .copy-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 5px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      color: var(--accents-5);
      cursor: pointer;
    }
    .copy-btn:hover {
      color: var(--fg);
      border-color: var(--accents-4);
    }

    footer {
      width: 100%;
      max-width: 1020px;
      margin-top: 40px;
      padding: 24px 20px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      color: var(--accents-5);
      font-size: 13px;
    }
    footer a { color: var(--accents-5); text-decoration: none; }
    footer a:hover { color: var(--fg); }

    @media (max-width: 768px) {
      .grid-4 { grid-template-columns: repeat(2, 1fr); }
      .grid-2 { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .grid-4 { grid-template-columns: 1fr; }
      .nav-inner { padding: 0 14px; }
      .nav-pills { display: none; }
      .endpoint-row { flex-direction: column; }
      footer { flex-direction: column; gap: 12px; text-align: center; }
    }
  `;
}

export function renderHeader(
  activeNav: string,
  owner: OwnerProfile | null,
): string {
  const isOwner = Boolean(owner);
  return `
    <header class="nav-header">
      <div class="nav-inner">
        <a href="/home" class="brand-wrap">
          <div class="brand-avatar">
            <img src="/icon-48.png" alt="Krix">
          </div>
          <span>Krix</span>
          <span class="badge">v1.1.0</span>
        </a>

        <nav class="nav-pills">
          <a href="/home" class="nav-pill ${activeNav === "home" ? "active" : ""}">Home</a>
          <a href="/upload" class="nav-pill ${activeNav === "upload" ? "active" : ""}">Upload</a>
          <a href="/stats" class="nav-pill ${activeNav === "stats" ? "active" : ""}">Stats</a>
          <a href="https://quickwitty.onrender.com" target="_blank" rel="noopener" class="nav-pill">Contact</a>
        </nav>

        <div class="nav-right">
          <button class="theme-toggle-btn" onclick="toggleTheme()" title="Toggle Theme" aria-label="Toggle Theme">
            <svg id="themeIconSun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            <svg id="themeIconMoon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </button>

          ${
            isOwner
              ? `
            <div class="user-pill">
              ${owner?.picture ? `<img src="${escapeHtml(owner.picture)}" alt="">` : ""}
              <span>${escapeHtml(owner?.name || owner?.email || "Owner")}</span>
            </div>
            <a href="/auth/logout" class="btn" style="padding:6px 10px; font-size:12px;">Sign out</a>
          `
              : `
            <a href="/auth/google" class="btn">Sign in with Google</a>
          `
          }
        </div>
      </div>
    </header>
  `;
}

export function renderFooter(): string {
  return `
    <footer>
      <div>Krix &bull; Single-User Architecture</div>
      <div style="display:flex; gap:16px;">
        <a href="/home">Home</a>
        <a href="/upload">Upload</a>
        <a href="/stats">Stats</a>
        <a href="https://quickwitty.onrender.com" target="_blank" rel="noopener">Contact (quickwitty.onrender.com)</a>
        <a href="/.well-known/jwks.json">JWKS</a>
      </div>
    </footer>
  `;
}

export function renderHomePage(params: {
  base: string;
  isOwner: boolean;
  owner: OwnerProfile | null;
  uploads: Array<{ name: string; size: number }>;
  dynamicKeys: Array<Omit<GeneratedKeyEntry, "key"> | GeneratedKeyEntry>;
}): string {
  const { base, isOwner, owner, uploads, dynamicKeys } = params;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Krix</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png">
  <link rel="icon" type="image/png" sizes="128x128" href="/icon-128.png">
  <style>
    ${getBaseStyles()}
  </style>
  <script>
    (function() {
      const saved = localStorage.getItem('qw-theme');
      if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
    })();
  </script>
</head>
<body>
  ${renderHeader("home", owner)}

  <div class="wrapper">
    <!-- Hero Banner -->
    <div style="margin: 20px 0 32px 0; display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
          <span class="badge success">RS256 OAuth 2.1 Ready</span>
          <span class="badge">RFC 9728 & RFC 8414</span>
        </div>
        <h1 style="font-size:26px; font-weight:700; letter-spacing:-0.5px; color:var(--fg); margin-bottom:6px;">
          Krix
        </h1>
        <p style="font-size:14px; color:var(--accents-5); max-width:620px; line-height:1.5;">
          Isolated execution sandbox and tools. Connect Claude, Gemini, ChatGPT, and Cursor with asymmetric RS256 authentication and usage metrics.
        </p>
      </div>

      <div style="display:flex; gap:10px;">
        <a href="/upload" class="btn primary">Upload Files</a>
        <a href="/stats" class="btn">View Stats</a>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid-2">
      <!-- Sandbox Explorer Card -->
      <section class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h2 style="font-size:15px; font-weight:600; color:var(--fg);">Sandbox Workspace Explorer</h2>
          <span class="badge">${uploads.length} files</span>
        </div>
        <p style="font-size:13px; color:var(--accents-5); margin-bottom:16px;">
          Workspace files and active directory tree. Files in <code>upload/</code> are accessible across all active projects.
        </p>

        <div class="code-view" style="font-size:12.5px; line-height:1.7;">
          <div><span style="color:#e5c07b; font-weight:600;">📦 krix-sandbox/</span></div>
          <div>│   ├── <span style="color:#e5c07b; font-weight:600;">📁 upload/</span> <span style="color:var(--accents-4); font-size:11px;">(uploads directory)</span></div>
          ${
            uploads.length > 0
              ? uploads
                  .map(
                    (u) => `
          <div>│   │   ├── <span style="color:#d19a66;">📄 ${escapeHtml(u.name)}</span> <span style="color:var(--accents-4); font-size:11px;">(${Math.round(u.size / 1024)} KB)</span></div>`,
                  )
                  .join("")
              : `
          <div>│   │   └── <span style="color:var(--accents-4); font-size:11px;">(no uploads yet)</span></div>`
          }
          <div>│   ├── <span style="color:#e5c07b; font-weight:600;">📁 workspace/</span> <span style="color:var(--accents-4); font-size:11px;">(active repository clone)</span></div>
          <div>│   │   ├── <span style="color:#e5c07b; font-weight:600;">📁 upload/</span> <span style="color:var(--accents-4); font-size:11px;">&rarr; link to upload/</span></div>
          <div>│   │   ├── 📄 package.json</div>
          <div>│   │   └── 📁 src/</div>
          <div>└── ⚙️ system/ <span style="color:var(--accents-4); font-size:11px;">(Node.js 22 LTS &middot; Python 3 &middot; Git)</span></div>
        </div>

        <div style="margin-top:16px; display:flex; justify-content:space-between; align-items:center; font-size:12px; color:var(--accents-5);">
          <span>Storage: <strong>Shared Sandbox</strong></span>
          <span>Transport: <strong>Streamable HTTP</strong></span>
        </div>
      </section>

      <!-- MCP Setup Card -->
      <section class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h2 style="font-size:15px; font-weight:600; color:var(--fg);">MCP Client Setup</h2>
          <span class="badge success">RS256</span>
        </div>
        <p style="font-size:13px; color:var(--accents-5); margin-bottom:16px;">
          Connect Claude Desktop, Cursor, Antigravity, ChatGPT, or any agent using RS256 OAuth 2.1 or an API key.
        </p>

        <div class="endpoint-box">
          <div class="endpoint-label">Streamable HTTP MCP Endpoint URL</div>
          <div class="endpoint-row">
            <input type="text" id="mcpUrlInput" value="${base}/mcp" readonly>
            <button class="btn" onclick="copyMcpUrl()" id="copyUrlBtn">Copy URL</button>
          </div>
        </div>

        <div class="tab-bar">
          <button class="tab active" onclick="showTab('claude')">Claude Desktop</button>
          <button class="tab" onclick="showTab('cursor')">Cursor</button>
          <button class="tab" onclick="showTab('antigravity')">Antigravity</button>
          <button class="tab" onclick="showTab('chatgpt')">ChatGPT</button>
          <button class="tab" onclick="showTab('oauth')">OAuth 2.1</button>
        </div>

        <div class="code-view" id="codebox">
          <button class="copy-btn" onclick="copySnippet()">Copy</button>
          <code id="snippet"></code>
        </div>

        <!-- Key Management Box -->
        <div style="margin-top:16px; padding:14px; background:var(--card-sub); border:1px solid var(--border); border-radius:8px;">
          <div style="font-size:13px; font-weight:600; color:var(--fg); margin-bottom:4px;">
            ${isOwner ? "API Key Management" : "API Keys"}
          </div>
          <div style="font-size:12px; color:var(--accents-5);">
            ${isOwner ? "Generate on-demand API keys directly from your authenticated account." : "Sign in with Google to generate and manage API keys."}
          </div>

          ${
            isOwner
              ? `
            <div style="margin-top:10px;">
              <button class="btn" onclick="generateKey()" id="genBtn" style="font-size:12px; padding:6px 12px;">Generate key</button>
            </div>
            <div id="keyDisp" style="display:none; margin-top:8px; display:flex; gap:8px;">
              <input type="text" id="newKeyVal" readonly style="flex:1; padding:8px 10px; border-radius:6px; border:1px solid var(--border); background:var(--code-bg); color:var(--fg); font-family:monospace; font-size:12px;">
              <button class="btn" onclick="copyNewKey()" style="padding:6px 12px; font-size:12px;">Copy key</button>
            </div>
            ${
              dynamicKeys.length > 0
                ? `
              <div style="margin-top:10px; font-size:12px; color:var(--accents-5);">
                Active Keys: <strong>${dynamicKeys.length}</strong>
              </div>`
                : ""
            }
          `
              : ""
          }
        </div>
      </section>
    </div>
  </div>

  ${renderFooter()}

  <script>
    const baseUrl = '${base}';
    let activeKey = '${dynamicKeys.length > 0 ? dynamicKeys[0].id : "$MCP_API_KEY"}';

    function getSnippets() {
      const keyDisp = activeKey || '$MCP_API_KEY';
      return {
        claude: JSON.stringify({
          mcpServers: {
            krix: {
              url: baseUrl + "/mcp",
              headers: {
                "Authorization": "Bearer " + keyDisp
              }
            }
          }
        }, null, 2),
        cursor: JSON.stringify({
          mcpServers: {
            krix: {
              url: baseUrl + "/mcp",
              headers: {
                "Authorization": "Bearer " + keyDisp
              }
            }
          }
        }, null, 2),
        antigravity: JSON.stringify({
          mcpServers: {
            krix: {
              url: baseUrl + "/mcp",
              headers: {
                "Authorization": "Bearer " + keyDisp
              }
            }
          }
        }, null, 2),
        chatgpt: "// ChatGPT Custom GPT -> Configure -> Add Actions -> Authentication:\\n" +
          "// 1. Auth Type: Bearer\\n" +
          "//    Token:     " + keyDisp + "\\n" +
          "// OR select OAuth:\\n" +
          "//    Auth URL:  " + baseUrl + "/oauth/authorize\\n" +
          "//    Token URL: " + baseUrl + "/oauth/token\\n" +
          "//    Scope:     mcp:tools",
        oauth: "// Modern MCP Clients auto-discover RS256 OAuth 2.1 via RFC 9728 & RFC 8414:\\n" +
          "// Endpoint:            " + baseUrl + "/mcp\\n" +
          "// JWKS URI:            " + baseUrl + "/.well-known/jwks.json\\n" +
          "// Protected Resource:   " + baseUrl + "/.well-known/oauth-protected-resource\\n" +
          "// Authorization Server: " + baseUrl + "/oauth/authorize\\n" +
          "// Token Endpoint:       " + baseUrl + "/oauth/token\\n" +
          "// Dynamic Client Reg:   " + baseUrl + "/oauth/register"
      };
    }

    let curTab = 'claude';
    function showTab(name) {
      curTab = name;
      document.querySelectorAll('.tab').forEach(b => {
        b.classList.toggle('active', b.getAttribute('onclick').includes("'" + name + "'"));
      });
      document.getElementById('snippet').textContent = getSnippets()[name];
    }
    showTab('claude');

    function copySnippet() {
      navigator.clipboard.writeText(getSnippets()[curTab]);
      const btn = document.querySelector('.copy-btn');
      btn.textContent = 'Copied';
      setTimeout(() => btn.textContent = 'Copy', 1500);
    }

    function copyMcpUrl() {
      const el = document.getElementById('mcpUrlInput');
      el.select();
      navigator.clipboard.writeText(el.value);
      const btn = document.getElementById('copyUrlBtn');
      btn.textContent = 'Copied';
      setTimeout(() => btn.textContent = 'Copy URL', 1500);
    }

    async function generateKey() {
      const btn = document.getElementById('genBtn');
      btn.disabled = true;
      btn.textContent = 'Generating';
      try {
        const res = await fetch('/auth/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: 'Client Key ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) })
        });
        const data = await res.json();
        if (data.key) {
          activeKey = data.key;
          document.getElementById('keyDisp').style.display = 'flex';
          document.getElementById('newKeyVal').value = data.key;
          showTab(curTab);
        }
      } catch (e) {
        alert('Failed to generate key: ' + e.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Generate key';
      }
    }

    function copyNewKey() {
      const el = document.getElementById('newKeyVal');
      el.select();
      navigator.clipboard.writeText(el.value);
      alert('API key copied to clipboard.');
    }

    function toggleTheme() {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('qw-theme', isDark ? 'dark' : 'light');
      updateThemeIcon(isDark);
    }

    function updateThemeIcon(isDark) {
      document.getElementById('themeIconSun').style.display = isDark ? 'block' : 'none';
      document.getElementById('themeIconMoon').style.display = isDark ? 'none' : 'block';
    }

    const initialDark = document.documentElement.classList.contains('dark');
    updateThemeIcon(initialDark);
  </script>
</body>
</html>`;
}

export function renderStatsPage(params: {
  base: string;
  isOwner: boolean;
  owner: OwnerProfile | null;
  summary: StatsSummary;
}): string {
  const { base, owner, summary } = params;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Krix Analytics</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png">
  <style>
    ${getBaseStyles()}

    .metric-value {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
      font-variant-numeric: tabular-nums;
      color: var(--fg);
      margin: 4px 0;
    }
    .metric-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--accents-5);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .progress-bar-bg {
      height: 8px;
      background: var(--accents-2);
      border-radius: 4px;
      overflow: hidden;
      margin-top: 6px;
    }
    .progress-bar-fill {
      height: 100%;
      background: var(--fg);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      text-align: left;
      padding: 10px 12px;
      color: var(--accents-5);
      font-weight: 600;
      font-size: 12px;
      border-bottom: 1px solid var(--border);
    }
    td {
      padding: 12px;
      border-bottom: 1px solid var(--border);
      color: var(--fg);
    }
    tr:last-child td { border-bottom: none; }

    .chart-container {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      height: 140px;
      padding-top: 20px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .chart-bar-wrap {
      flex: 1;
      min-width: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      height: 100%;
      justify-content: flex-end;
    }
    .chart-bar {
      width: 100%;
      max-width: 28px;
      background: var(--fg);
      border-radius: 4px 4px 0 0;
      transition: height 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .chart-label {
      font-size: 10px;
      color: var(--accents-4);
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      max-height: 40px;
      white-space: nowrap;
    }
  </style>
  <script>
    (function() {
      const saved = localStorage.getItem('qw-theme');
      if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
    })();
  </script>
</head>
<body>
  ${renderHeader("stats", owner)}

  <div class="wrapper">
    <!-- Header -->
    <div style="margin: 20px 0 28px 0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <div>
        <h1 style="font-size:24px; font-weight:700; letter-spacing:-0.5px; color:var(--fg);">
          Usage &amp; Analytics
        </h1>
        <p style="font-size:13px; color:var(--accents-5); margin-top:2px;">
          Per-key activity, tool execution, and storage quotas.
        </p>
      </div>

      <div style="display:flex; gap:8px;">
        <button class="btn" onclick="location.reload()">Refresh stats</button>
        <a href="/home" class="btn primary">Back to Home</a>
      </div>
    </div>

    <!-- Top 4 Metrics Summary Cards -->
    <div class="grid-4">
      <div class="card">
        <div class="metric-label">Total Requests</div>
        <div class="metric-value">${summary.totalRequests.toLocaleString()}</div>
        <div style="font-size:12px; color:var(--accents-5); display:flex; align-items:center; gap:6px;">
          <span class="badge success">${summary.overallSuccessRate}% success</span>
          <span>${summary.totalErrors} errors</span>
        </div>
      </div>

      <div class="card">
        <div class="metric-label">Active Keys &amp; OAuth</div>
        <div class="metric-value">${summary.uniqueKeysCount}</div>
        <div style="font-size:12px; color:var(--accents-5);">
          Tracked separately per client
        </div>
      </div>

      <div class="card">
        <div class="metric-label">Average Latency</div>
        <div class="metric-value">${summary.avgDurationMs} <span style="font-size:16px; font-weight:500;">ms</span></div>
        <div style="font-size:12px; color:var(--accents-5);">
          Total time: ${(summary.keys.reduce((acc, k) => acc + k.totalDurationMs, 0) / 1000).toFixed(1)}s
        </div>
      </div>

      <div class="card">
        <div class="metric-label">Sandbox Storage</div>
        <div class="metric-value">${summary.sharedSandbox.quotaUsedPercent}%</div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${Math.min(100, Math.max(2, summary.sharedSandbox.quotaUsedPercent))}%;"></div>
        </div>
        <div style="font-size:12px; color:var(--accents-5); margin-top:6px; display:flex; justify-content:space-between;">
          <span>${formatBytes(summary.sharedSandbox.totalDiskBytes)} used</span>
          <span>${summary.sharedSandbox.quotaLimitMb} MB quota</span>
        </div>
        <p style="font-size:11px; color:var(--accents-5); margin-top:6px;">Shared storage across all API keys and OAuth clients.</p>
      </div>
    </div>

    <!-- Timeline Graph Section -->
    <div class="card" style="margin-bottom:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
        <div>
          <h2 style="font-size:15px; font-weight:600; color:var(--fg);">Activity Timeline</h2>
          <p style="font-size:12px; color:var(--accents-5);">Volume of requests and tool invocations over time</p>
        </div>

        <div style="display:flex; gap:6px;">
          <button class="tab active" id="btnDaily" onclick="setTimeline('daily')">Daily (30d)</button>
          <button class="tab" id="btnWeekly" onclick="setTimeline('weekly')">Weekly (12w)</button>
          <button class="tab" id="btnMonthly" onclick="setTimeline('monthly')">Monthly (12m)</button>
        </div>
      </div>

      <div id="timelineChart" class="chart-container">
        <!-- Rendered by JS below -->
      </div>
    </div>

    <!-- Tool Distribution & 4 Details Grid -->
    <div class="grid-2">
      <!-- Tool Usage Breakdown -->
      <div class="card">
        <h2 style="font-size:15px; font-weight:600; color:var(--fg); margin-bottom:12px;">Top Tools Executed</h2>
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${
            Object.keys(summary.toolDistribution).length > 0
              ? Object.entries(summary.toolDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([tool, count]) => {
                    const max = Math.max(
                      ...Object.values(summary.toolDistribution),
                    );
                    const pct = Math.round((count / max) * 100);
                    return `
              <div>
                <div style="display:flex; justify-content:space-between; font-size:13px;">
                  <span style="font-family:monospace; font-weight:600;">${escapeHtml(tool)}</span>
                  <span style="color:var(--accents-5);">${count.toLocaleString()} calls</span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: ${pct}%;"></div>
                </div>
              </div>
            `;
                  })
                  .join("")
              : `<div style="font-size:13px; color:var(--accents-5); padding:12px 0;">No tool calls recorded yet</div>`
          }
        </div>
      </div>

      <!-- 4 Details: Success, Latency, Bandwidth, Last Active -->
      <div class="card">
        <h2 style="font-size:15px; font-weight:600; color:var(--fg); margin-bottom:12px;">System Performance Details</h2>
        <div style="display:flex; flex-direction:column; gap:14px; font-size:13px;">
          <div style="display:flex; justify-content:space-between; padding-bottom:8px; border-bottom:1px solid var(--border);">
            <span style="color:var(--accents-5);">1. Success vs Error Rate:</span>
            <span><strong>${summary.totalSuccess}</strong> OK / <strong>${summary.totalErrors}</strong> Errors (${summary.overallSuccessRate}%)</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding-bottom:8px; border-bottom:1px solid var(--border);">
            <span style="color:var(--accents-5);">2. Request Latency:</span>
            <span><strong>${summary.avgDurationMs}ms</strong> avg response duration</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding-bottom:8px; border-bottom:1px solid var(--border);">
            <span style="color:var(--accents-5);">3. Data Volume Transferred:</span>
            <span><strong>${formatBytes(summary.totalBytesIn)}</strong> in / <strong>${formatBytes(summary.totalBytesOut)}</strong> out</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding-bottom:8px; border-bottom:1px solid var(--border);">
            <span style="color:var(--accents-5);">4. Sandbox Storage:</span>
            <span><strong>${summary.sharedSandbox.uploadFileCount}</strong> files, <strong>${summary.sharedSandbox.activeWorkDirs}</strong> active repositories</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--accents-5);">OAuth 2.1 Cryptography:</span>
            <span class="badge success">RS256 Asymmetric JWKS Active</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Per-Key & Per-OAuth Client Analytics Table -->
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h2 style="font-size:15px; font-weight:600; color:var(--fg);">Per-Key &amp; OAuth Client Breakdown</h2>
        <span class="badge">${summary.keys.length} keys</span>
      </div>

      <div style="overflow-x:auto; -webkit-overflow-scrolling:touch;">
        <table>
          <thead>
            <tr>
              <th>Client / Key ID</th>
              <th>Type</th>
              <th>Total Calls</th>
              <th>Success Rate</th>
              <th>Avg Latency</th>
              <th>Data (In / Out)</th>
              <th>Last Seen</th>
              <th>Top Tools</th>
            </tr>
          </thead>
          <tbody>
            ${
              summary.keys.length > 0
                ? summary.keys
                    .map((k) => {
                      const topTools = Object.entries(k.toolCalls)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 2)
                        .map(([t, c]) => `${t} (${c})`)
                        .join(", ");
                      const rate =
                        k.totalRequests > 0
                          ? Math.round(
                              (k.successCount / k.totalRequests) * 1000,
                            ) / 10
                          : 100;
                      return `
                <tr>
                  <td>
                    <div style="font-weight:600;">${escapeHtml(k.label)}</div>
                    <div style="font-family:monospace; font-size:11px; color:var(--accents-5);">${escapeHtml(k.keyId)}</div>
                  </td>
                  <td>
                    <span class="badge ${k.type === "oauth" ? "success" : ""}">${k.type}</span>
                  </td>
                  <td><strong>${k.totalRequests}</strong></td>
                  <td>${rate}%</td>
                  <td>${k.avgDurationMs}ms</td>
                  <td>${formatBytes(k.bytesIn)} / ${formatBytes(k.bytesOut)}</td>
                  <td>${timeAgo(k.lastActiveAt)}</td>
                  <td style="font-size:12px; color:var(--accents-5);">${topTools || "none"}</td>
                </tr>
              `;
                    })
                    .join("")
                : `
              <tr>
                <td colspan="8" style="text-align:center; padding:24px; color:var(--accents-5);">
                  No client activity recorded yet. Connect an MCP client above to start tracking.
                </td>
              </tr>
            `
            }
          </tbody>
        </table>
      </div>
    </div>
  </div>

  ${renderFooter()}

  <script>
    const dailyData = ${JSON.stringify(summary.dailyTimeline)};
    const weeklyData = ${JSON.stringify(summary.weeklyTimeline)};
    const monthlyData = ${JSON.stringify(summary.monthlyTimeline)};

    let currentTimeline = 'daily';

    function setTimeline(mode) {
      currentTimeline = mode;
      document.getElementById('btnDaily').classList.toggle('active', mode === 'daily');
      document.getElementById('btnWeekly').classList.toggle('active', mode === 'weekly');
      document.getElementById('btnMonthly').classList.toggle('active', mode === 'monthly');
      renderChart();
    }

    function renderChart() {
      const container = document.getElementById('timelineChart');
      let data = [];
      let labelKey = 'date';

      if (currentTimeline === 'daily') {
        data = dailyData;
        labelKey = 'date';
      } else if (currentTimeline === 'weekly') {
        data = weeklyData;
        labelKey = 'week';
      } else {
        data = monthlyData;
        labelKey = 'month';
      }

      if (!data || data.length === 0) {
        container.innerHTML = '<div style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; color:var(--accents-5);">No activity data recorded yet</div>';
        return;
      }

      const maxVal = data.reduce(function(m, d) { return Math.max(m, d.requests); }, 1);
      container.innerHTML = data.map(d => {
        const heightPct = Math.max(4, Math.round((d.requests / maxVal) * 100));
        const lbl = d[labelKey].slice(5);
        return \`
          <div class="chart-bar-wrap" title="\${d[labelKey]}: \${d.requests} requests (\${d.tools} tool calls)">
            <div class="chart-bar" style="height: \${heightPct}%;"></div>
            <span class="chart-label">\${lbl}</span>
          </div>
        \`;
      }).join('');
    }

    renderChart();

    function toggleTheme() {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('qw-theme', isDark ? 'dark' : 'light');
      updateThemeIcon(isDark);
    }

    function updateThemeIcon(isDark) {
      document.getElementById('themeIconSun').style.display = isDark ? 'block' : 'none';
      document.getElementById('themeIconMoon').style.display = isDark ? 'none' : 'block';
    }

    const initialDark = document.documentElement.classList.contains('dark');
    updateThemeIcon(initialDark);
  </script>
</body>
</html>`;
}
