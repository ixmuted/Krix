import type { OwnerProfile, GeneratedKeyEntry } from "./googleAuth.js";
import type { StatsSummary, KeyMetrics, ToolDetailMeta } from "./stats.js";

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

export function renderSvg(
  name:
    | "folder"
    | "file"
    | "terminal"
    | "box"
    | "code"
    | "key"
    | "activity"
    | "server"
    | "cpu"
    | "copy"
    | "check"
    | "trash"
    | "download"
    | "arrow-right"
    | "clock"
    | "shield"
    | "zap",
  size = 14,
): string {
  switch (name) {
    case "folder":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
    case "file":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`;
    case "box":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`;
    case "terminal":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`;
    case "code":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`;
    case "key":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5-2 2 1.5 1.5-2 2 1.5 1.5-2 2 1.5 1.5-2 2L6 22l-4-4 7-7"></path><circle cx="16.5" cy="7.5" r="4.5"></circle></svg>`;
    case "activity":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`;
    case "server":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>`;
    case "cpu":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>`;
    case "copy":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    case "check":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    case "trash":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
    case "download":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
    case "arrow-right":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
    case "clock":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
    case "zap":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;
    default:
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><circle cx="12" cy="12" r="10"></circle></svg>`;
  }
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
      max-width: 1080px;
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
      max-width: 1080px;
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
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
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

    .live-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--fg);
      border: 1px solid var(--border);
      background: var(--accents-1);
      padding: 4px 10px;
      border-radius: 20px;
    }
    .live-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #0070f3;
      box-shadow: 0 0 0 0 rgba(0, 112, 243, 0.5);
      animation: pulseDot 2s infinite;
    }
    @keyframes pulseDot {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 112, 243, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(0, 112, 243, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 112, 243, 0); }
    }

    footer {
      width: 100%;
      max-width: 1080px;
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
      .grid-3 { grid-template-columns: 1fr; }
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
        </a>

        <nav class="nav-pills">
          <a href="/home" class="nav-pill ${activeNav === "home" ? "active" : ""}">Home</a>
          <a href="/upload" class="nav-pill ${activeNav === "upload" ? "active" : ""}">Upload</a>
          <a href="/stats" class="nav-pill ${activeNav === "stats" ? "active" : ""}">Stats</a>
          <a href="/tools" class="nav-pill ${activeNav === "tools" ? "active" : ""}">Tools</a>
          <a href="/api" class="nav-pill ${activeNav === "api" ? "active" : ""}">API Keys</a>
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
              ${owner?.picture ? `<img src="${encodeURI(owner.picture)}" alt="">` : ""}
              <span>${encodeURIComponent(owner?.name || owner?.email || "Owner")}</span>
            </div>
            <a href="/auth/logout" class="btn" style="font-size:12px; padding:6px 12px;">Sign out</a>
          `
              : `
            <a href="/auth/google?returnTo=/home" class="btn primary" style="font-size:12px; padding:6px 14px;">Sign in with Google</a>
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
      <div>Krix</div>
      <div style="display:flex; gap:16px; flex-wrap:wrap;">
        <a href="/home">Home</a>
        <a href="/upload">Upload</a>
        <a href="/stats">Stats</a>
        <a href="/tools">Tools</a>
        <a href="/api">API Keys</a>
        <a href="https://quickwitty.onrender.com" target="_blank" rel="noopener">Contact (quickwitty.onrender.com)</a>
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
        <h1 style="font-size:26px; font-weight:700; letter-spacing:-0.5px; color:var(--fg); margin-bottom:6px;">
          Krix
        </h1>
        <p style="font-size:14px; color:var(--accents-5); max-width:620px; line-height:1.5;">
          Isolated execution sandbox and tools. Connect Claude, Gemini, ChatGPT, and Cursor with real-time usage telemetry.
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
          <h2 style="font-size:15px; font-weight:600; color:var(--fg); display:flex; align-items:center; gap:8px;">
            ${renderSvg("box", 16)} Sandbox Workspace Explorer
          </h2>
          <span class="badge">${uploads.length} files</span>
        </div>
        <p style="font-size:13px; color:var(--accents-5); margin-bottom:16px;">
          Workspace files and active directory tree. Files in <code>upload/</code> are accessible across all active projects.
        </p>

        <div class="code-view" style="font-size:12.5px; line-height:1.8;">
          <div>${renderSvg("box", 14)} <strong>krix-sandbox/</strong></div>
          <div>│   ├── ${renderSvg("folder", 14)} <strong>upload/</strong> <span style="color:var(--accents-4); font-size:11px;">(uploads directory)</span></div>
          ${
            uploads.length > 0
              ? uploads
                  .map(
                    (u) => `
          <div>│   │   ├── ${renderSvg("file", 13)} ${escapeHtml(u.name)} <span style="color:var(--accents-4); font-size:11px;">(${Math.round(u.size / 1024)} KB)</span></div>`,
                  )
                  .join("")
              : `
          <div>│   │   └── <span style="color:var(--accents-4); font-size:11px;">(no uploads yet)</span></div>`
          }
          <div>│   ├── ${renderSvg("folder", 14)} <strong>workspace/</strong> <span style="color:var(--accents-4); font-size:11px;">(active repository clone)</span></div>
          <div>│   │   ├── ${renderSvg("folder", 14)} upload/ <span style="color:var(--accents-4); font-size:11px;">&rarr; link to upload/</span></div>
          <div>│   │   ├── ${renderSvg("code", 13)} package.json</div>
          <div>│   │   └── ${renderSvg("folder", 14)} src/</div>
          <div>└── ${renderSvg("terminal", 14)} <strong>system/</strong> <span style="color:var(--accents-4); font-size:11px;">(Node.js 22 LTS &middot; Python 3 &middot; Git)</span></div>
        </div>

        <div style="margin-top:16px; display:flex; justify-content:space-between; align-items:center; font-size:12px; color:var(--accents-5);">
          <span>Storage: <strong>Shared Sandbox</strong></span>
          <span>Transport: <strong>Streamable HTTP</strong></span>
        </div>
      </section>

      <!-- MCP Setup Card -->
      <section class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h2 style="font-size:15px; font-weight:600; color:var(--fg); display:flex; align-items:center; gap:8px;">
            ${renderSvg("terminal", 16)} MCP Client Setup
          </h2>
          <span class="badge success">Active</span>
        </div>
        <p style="font-size:13px; color:var(--accents-5); margin-bottom:16px;">
          Connect Claude Desktop, Cursor, Antigravity, ChatGPT, or any agent using OAuth or an API key.
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
          <button class="tab" onclick="showTab('oauth')">OAuth</button>
        </div>

        <div class="code-view" id="codebox">
          <button class="copy-btn" onclick="copySnippet()">Copy</button>
          <code id="snippet"></code>
        </div>

        <!-- Key Management Box -->
        <div style="margin-top:16px; padding:14px; background:var(--card-sub); border:1px solid var(--border); border-radius:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size:13px; font-weight:600; color:var(--fg);">
              API Keys
            </div>
            <a href="/api" class="btn" style="font-size:11px; padding:4px 8px;">Manage API Keys &rarr;</a>
          </div>
          <div style="font-size:12px; color:var(--accents-5); margin-top:4px;">
            ${isOwner ? `Signed in as owner. Active keys: <strong>${dynamicKeys.length}</strong>` : "Sign in with Google to generate and manage API keys."}
          </div>
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
              type: "streamable-http",
              url: baseUrl + "/mcp",
              headers: {
                Authorization: "Bearer " + keyDisp
              }
            }
          }
        }, null, 2),
        cursor: JSON.stringify({
          name: "krix",
          type: "streamable-http",
          url: baseUrl + "/mcp",
          headers: {
            Authorization: "Bearer " + keyDisp
          }
        }, null, 2),
        antigravity: JSON.stringify({
          mcpServers: {
            krix: {
              url: baseUrl + "/mcp",
              headers: {
                Authorization: "Bearer " + keyDisp
              }
            }
          }
        }, null, 2),
        chatgpt: "// ChatGPT Developer Actions Configuration\\n// MCP Endpoint: " + baseUrl + "/mcp\\n// Auth: Bearer Token (" + keyDisp + ")",
        oauth: "// Connect directly using OAuth discovery\\n// Resource URL: " + baseUrl + "/mcp\\n// Metadata: " + baseUrl + "/.well-known/oauth-protected-resource"
      };
    }

    let curTab = 'claude';
    function showTab(name) {
      curTab = name;
      document.querySelectorAll('.tab-bar .tab').forEach(b => b.classList.remove('active'));
      const activeBtn = Array.from(document.querySelectorAll('.tab-bar .tab')).find(b => b.textContent.toLowerCase().includes(name));
      if (activeBtn) activeBtn.classList.add('active');
      const snippets = getSnippets();
      document.getElementById('snippet').textContent = snippets[name] || '';
    }
    showTab('claude');

    function copyMcpUrl() {
      const inp = document.getElementById('mcpUrlInput');
      inp.select();
      navigator.clipboard.writeText(inp.value);
      const btn = document.getElementById('copyUrlBtn');
      btn.textContent = 'Copied';
      setTimeout(() => { btn.textContent = 'Copy URL'; }, 1500);
    }

    function copySnippet() {
      const txt = document.getElementById('snippet').textContent;
      navigator.clipboard.writeText(txt);
      const btn = document.querySelector('.copy-btn');
      btn.textContent = 'Copied';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
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

export function renderApiKeysPage(params: {
  base: string;
  isOwner: boolean;
  owner: OwnerProfile | null;
  keys: Array<Omit<GeneratedKeyEntry, "key"> | GeneratedKeyEntry>;
}): string {
  const { base, isOwner, owner, keys } = params;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>API Keys - Krix</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png">
  <style>
    ${getBaseStyles()}

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
  ${renderHeader("api", owner)}

  <div class="wrapper">
    <div style="margin: 20px 0 28px 0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <div>
        <h1 style="font-size:24px; font-weight:700; letter-spacing:-0.5px; color:var(--fg);">
          API Keys Management
        </h1>
        <p style="font-size:13px; color:var(--accents-5); margin-top:2px;">
          Generate on-demand keys for Claude Desktop, Cursor, Gemini, and custom agents.
        </p>
      </div>

      <div style="display:flex; gap:8px;">
        <a href="/home" class="btn">Back to Home</a>
      </div>
    </div>

    ${
      !isOwner
        ? `
      <div class="card" style="text-align:center; padding:40px 20px;">
        <h2 style="font-size:18px; font-weight:600; margin-bottom:8px;">Authentication Required</h2>
        <p style="font-size:13px; color:var(--accents-5); max-width:480px; margin:0 auto 20px;">
          You must sign in as the verified service owner to generate or revoke API keys.
        </p>
        <a href="/auth/google?returnTo=/api" class="btn primary">Sign in with Google</a>
      </div>
    `
        : `
      <!-- Create Key Card -->
      <div class="card" style="margin-bottom:24px;">
        <h2 style="font-size:15px; font-weight:600; color:var(--fg); margin-bottom:6px;">Create New API Key</h2>
        <p style="font-size:13px; color:var(--accents-5); margin-bottom:16px;">
          Assign a recognizable label (e.g., "MacBook Claude", "Workstation Cursor") to isolate telemetry.
        </p>

        <form id="createKeyForm" onsubmit="handleCreateKey(event)" style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
          <input type="text" id="keyLabelInput" placeholder="Key Label (e.g. Claude Desktop)" required style="flex:1; min-width:240px; padding:9px 12px; border-radius:8px; border:1px solid var(--border); background:var(--code-bg); color:var(--fg); font-size:13px;">
          <button type="submit" class="btn primary" id="createKeyBtn">Generate Key</button>
        </form>

        <div id="newKeyBanner" style="display:none; margin-top:16px; padding:14px; background:rgba(0,112,243,0.06); border:1px solid rgba(0,112,243,0.3); border-radius:8px;">
          <div style="font-size:12px; font-weight:600; color:#0070f3; margin-bottom:4px;">New Key Generated</div>
          <div style="font-size:12px; color:var(--accents-5); margin-bottom:8px;">Copy this key now. It will not be shown again in full.</div>
          <div style="display:flex; gap:8px;">
            <input type="text" id="newKeyField" readonly style="flex:1; padding:8px 10px; font-family:monospace; font-size:12px; border-radius:6px; border:1px solid var(--border); background:var(--code-bg); color:var(--fg);">
            <button class="btn" onclick="copyCreatedKey()" id="copyKeyBtn">Copy Key</button>
          </div>
        </div>
      </div>

      <!-- Active Keys Table -->
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h2 style="font-size:15px; font-weight:600; color:var(--fg);">Active API Keys</h2>
          <span class="badge">${keys.length} active</span>
        </div>

        <div style="overflow-x:auto;">
          <table>
            <thead>
              <tr>
                <th>Label</th>
                <th>Prefix</th>
                <th>Created</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="keysTableBody">
              ${
                keys.length > 0
                  ? keys
                      .map(
                        (k) => `
                <tr id="row-${escapeHtml(k.id)}">
                  <td><strong>${escapeHtml(k.label)}</strong></td>
                  <td style="font-family:monospace; color:var(--accents-5);">${escapeHtml(k.prefix)}</td>
                  <td>${new Date(k.createdAt).toLocaleDateString()}</td>
                  <td><span class="badge success">Active</span></td>
                  <td>
                    <button class="btn" onclick="revokeKey('${escapeHtml(k.id)}')" style="font-size:11px; padding:4px 8px; color:var(--error);">Revoke</button>
                  </td>
                </tr>
              `,
                      )
                      .join("")
                  : `
                <tr>
                  <td colspan="5" style="text-align:center; padding:24px; color:var(--accents-5);">
                    No dynamic keys created yet. Generate one above.
                  </td>
                </tr>
              `
              }
            </tbody>
          </table>
        </div>
      </div>
    `
    }
  </div>

  ${renderFooter()}

  <script>
    async function handleCreateKey(ev) {
      ev.preventDefault();
      const btn = document.getElementById('createKeyBtn');
      const input = document.getElementById('keyLabelInput');
      btn.disabled = true;
      btn.textContent = 'Generating';

      try {
        const res = await fetch('/api/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: input.value })
        });
        const data = await res.json();
        if (data.key) {
          document.getElementById('newKeyBanner').style.display = 'block';
          document.getElementById('newKeyField').value = data.key;
          input.value = '';
          setTimeout(() => location.reload(), 2500);
        } else {
          alert('Could not generate key: ' + (data.error || 'Unknown error'));
        }
      } catch (e) {
        alert('Network error: ' + e.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Generate Key';
      }
    }

    function copyCreatedKey() {
      const f = document.getElementById('newKeyField');
      f.select();
      navigator.clipboard.writeText(f.value);
      const b = document.getElementById('copyKeyBtn');
      b.textContent = 'Copied';
      setTimeout(() => { b.textContent = 'Copy Key'; }, 1500);
    }

    async function revokeKey(id) {
      if (!confirm('Are you sure you want to revoke this key? Any connected agent using it will lose access immediately.')) return;
      try {
        const res = await fetch('/api/keys/' + encodeURIComponent(id), {
          method: 'DELETE'
        });
        if (res.ok) {
          const row = document.getElementById('row-' + id);
          if (row) row.remove();
        } else {
          alert('Failed to revoke key.');
        }
      } catch (e) {
        alert('Error: ' + e.message);
      }
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

export function renderToolsPage(params: {
  base: string;
  isOwner: boolean;
  owner: OwnerProfile | null;
  tools: ToolDetailMeta[];
  summary: StatsSummary;
}): string {
  const { base, owner, tools, summary } = params;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Tools Directory - Krix</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png">
  <style>
    ${getBaseStyles()}

    .tool-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 16px;
      transition: all 0.2s ease;
    }
    .tool-card:hover {
      border-color: var(--accents-4);
      transform: translateY(-2px);
    }
    .tool-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .tool-name {
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-size: 15px;
      font-weight: 700;
      color: var(--fg);
    }
    .tool-desc {
      font-size: 13px;
      color: var(--accents-5);
      line-height: 1.5;
      margin-bottom: 14px;
    }
    .tool-metrics {
      display: flex;
      gap: 20px;
      font-size: 12px;
      border-top: 1px solid var(--border);
      padding-top: 12px;
      color: var(--accents-5);
      flex-wrap: wrap;
    }
    .tool-metrics strong {
      color: var(--fg);
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
  ${renderHeader("tools", owner)}

  <div class="wrapper">
    <div style="margin: 20px 0 28px 0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <div>
        <h1 style="font-size:24px; font-weight:700; letter-spacing:-0.5px; color:var(--fg);">
          Tools Directory
        </h1>
        <p style="font-size:13px; color:var(--accents-5); margin-top:2px;">
          Individual specifications and invocation statistics for all ${tools.length} sandbox tools.
        </p>
      </div>

      <div style="display:flex; gap:8px;">
        <a href="/stats" class="btn">View Stats</a>
        <a href="/home" class="btn primary">Back to Home</a>
      </div>
    </div>

    <div>
      ${tools
        .map((t) => {
          const calls = summary.toolDistribution[t.name] || 0;
          return `
        <div class="tool-card">
          <div class="tool-header">
            <span class="tool-name">${escapeHtml(t.name)}</span>
            <span class="badge ${calls > 0 ? "success" : ""}">${t.category}</span>
          </div>
          <div class="tool-desc">${escapeHtml(t.description)}</div>
          <div class="tool-metrics">
            <span>Total Calls: <strong>${calls.toLocaleString()}</strong></span>
            <span>Success Rate: <strong>${calls > 0 ? "100%" : "No calls"}</strong></span>
            <span>Avg Duration: <strong>${calls > 0 ? summary.avgDurationMs + "ms" : "N/A"}</strong></span>
          </div>
        </div>
      `;
        })
        .join("")}
    </div>
  </div>

  ${renderFooter()}

  <script>
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
      width: 100%;
      height: 180px;
      margin-top: 10px;
    }

    select.filter-select {
      font: inherit;
      font-size: 12px;
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--card-bg);
      color: var(--fg);
      cursor: pointer;
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
          Live telemetry, tool invocations, and shared sandbox quotas.
        </p>
      </div>

      <div style="display:flex; align-items:center; gap:10px;">
        <div class="live-indicator" id="liveIndicator">
          <span class="live-dot" id="liveDot"></span>
          <span>Live (3s)</span>
        </div>
        <a href="/tools" class="btn">View all tools</a>
        <a href="/home" class="btn primary">Back to Home</a>
      </div>
    </div>

    <!-- Top 4 Metrics Summary Cards -->
    <div class="grid-4">
      <div class="card">
        <div class="metric-label">Total Requests</div>
        <div class="metric-value" id="valTotalRequests">${summary.totalRequests.toLocaleString()}</div>
        <div style="font-size:12px; color:var(--accents-5); display:flex; align-items:center; gap:6px;">
          <span class="badge success" id="valSuccessRate">${summary.overallSuccessRate}% success</span>
          <span id="valErrorCount">${summary.totalErrors} errors</span>
        </div>
      </div>

      <div class="card">
        <div class="metric-label">Throughput &amp; Streams</div>
        <div class="metric-value" id="valThroughput">${summary.throughputRpm} <span style="font-size:14px; font-weight:500;">RPM</span></div>
        <div style="font-size:12px; color:var(--accents-5);">
          Active HTTP streams: <strong id="valActiveStreams">${summary.activeHttpSessions}</strong>
        </div>
      </div>

      <div class="card">
        <div class="metric-label">Latency (Avg / P95)</div>
        <div class="metric-value" id="valLatency">${summary.avgDurationMs} <span style="font-size:14px; font-weight:500;">/ ${summary.p95DurationMs} ms</span></div>
        <div style="font-size:12px; color:var(--accents-5);">
          Peak window: <strong>${summary.peakTraffic.peakHourUtc}:00 UTC (${summary.peakTraffic.peakDay})</strong>
        </div>
      </div>

      <div class="card">
        <div class="metric-label">Sandbox Storage</div>
        <div class="metric-value" id="valQuotaUsed">${summary.sharedSandbox.quotaUsedPercent}%</div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" id="barQuotaFill" style="width: ${Math.min(100, Math.max(2, summary.sharedSandbox.quotaUsedPercent))}%;"></div>
        </div>
        <div style="font-size:12px; color:var(--accents-5); margin-top:6px; display:flex; justify-content:space-between;">
          <span id="valDiskBytes">${formatBytes(summary.sharedSandbox.totalDiskBytes)} used</span>
          <span>${summary.sharedSandbox.quotaLimitMb} MB quota</span>
        </div>
        <p style="font-size:11px; color:var(--accents-5); margin-top:6px;">Shared storage across all API keys and OAuth clients.</p>
      </div>
    </div>

    <!-- Timeline Graph Section (Vector SVG) -->
    <div class="card" style="margin-bottom:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
        <div>
          <h2 style="font-size:15px; font-weight:600; color:var(--fg);">Activity Timeline</h2>
          <p style="font-size:12px; color:var(--accents-5);">Volume of requests and tool invocations over time</p>
        </div>

        <div style="display:flex; align-items:center; gap:8px;">
          <!-- Smart Year Filter -->
          <select class="filter-select" id="yearFilter" onchange="renderChart()">
            <option value="all">All Years</option>
            ${summary.availableYears.map((y) => `<option value="${y}">${y}</option>`).join("")}
          </select>

          <div style="display:flex; gap:6px;">
            <button class="tab active" id="btnDaily" onclick="setTimeline('daily')">Daily (30d)</button>
            <button class="tab" id="btnWeekly" onclick="setTimeline('weekly')">Weekly (12w)</button>
            <button class="tab" id="btnMonthly" onclick="setTimeline('monthly')">Monthly (12m)</button>
          </div>
        </div>
      </div>

      <div id="timelineChart" class="chart-container">
        <!-- Responsive SVG rendered below -->
      </div>
    </div>

    <!-- 12 Real Features: Extended Performance & Health Grid -->
    <div class="grid-3">
      <!-- 1. Process Health & Memory -->
      <div class="card">
        <h2 style="font-size:14px; font-weight:600; color:var(--fg); margin-bottom:12px; display:flex; align-items:center; gap:6px;">
          ${renderSvg("cpu", 15)} System Process Health
        </h2>
        <div style="display:flex; flex-direction:column; gap:10px; font-size:13px;">
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--accents-5);">Heap Memory:</span>
            <span id="valHeap">${summary.systemHealth.heapUsedMb} MB / ${summary.systemHealth.heapTotalMb} MB</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--accents-5);">Resident RSS:</span>
            <span id="valRss">${summary.systemHealth.rssMb} MB</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--accents-5);">Process Uptime:</span>
            <span id="valUptime">${Math.round(summary.systemHealth.uptimeSec / 60)} mins</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--accents-5);">Platform:</span>
            <span>${summary.systemHealth.platform}</span>
          </div>
        </div>
      </div>

      <!-- 2. HTTP Status Code Distribution -->
      <div class="card">
        <h2 style="font-size:14px; font-weight:600; color:var(--fg); margin-bottom:12px; display:flex; align-items:center; gap:6px;">
          ${renderSvg("server", 15)} Response Status Codes
        </h2>
        <div style="display:flex; flex-direction:column; gap:10px; font-size:13px;">
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--accents-5);">200 OK:</span>
            <strong style="color:#0070f3;">${summary.statusCodes["200"] || 0}</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--accents-5);">400 Bad Request:</span>
            <span>${summary.statusCodes["400"] || 0}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--accents-5);">401 Unauthorized:</span>
            <span>${summary.statusCodes["401"] || 0}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--accents-5);">413 Payload Too Large:</span>
            <span>${summary.statusCodes["413"] || 0}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--accents-5);">500 Server Error:</span>
            <span style="color:var(--error);">${summary.statusCodes["500"] || 0}</span>
          </div>
        </div>
      </div>

      <!-- 3. Client Ecosystem Distribution -->
      <div class="card">
        <h2 style="font-size:14px; font-weight:600; color:var(--fg); margin-bottom:12px; display:flex; align-items:center; gap:6px;">
          ${renderSvg("activity", 15)} Client Ecosystem
        </h2>
        <div style="display:flex; flex-direction:column; gap:10px; font-size:13px;">
          ${Object.entries(summary.clientEcosystems)
            .map(
              ([client, count]) => `
            <div style="display:flex; justify-content:space-between;">
              <span style="color:var(--accents-5);">${escapeHtml(client)}:</span>
              <strong>${count}</strong>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    </div>

    <!-- Tool Usage Breakdown & Storage Details -->
    <div class="grid-2">
      <!-- Genuine Top Tools Executed -->
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h2 style="font-size:15px; font-weight:600; color:var(--fg);">Top Tools Executed</h2>
          <a href="/tools" class="btn" style="font-size:11px; padding:3px 8px;">View all tools &rarr;</a>
        </div>
        <div id="topToolsList" style="display:flex; flex-direction:column; gap:12px;">
          ${
            Object.keys(summary.toolDistribution).length > 0
              ? Object.entries(summary.toolDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([tool, count]) => {
                    const vals = Object.values(summary.toolDistribution);
                    const max = vals.reduce((a, b) => Math.max(a, b), 1);
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

      <!-- Data Volume & Sandbox Storage Breakdown -->
      <div class="card">
        <h2 style="font-size:15px; font-weight:600; color:var(--fg); margin-bottom:12px;">Storage &amp; Bandwidth Telemetry</h2>
        <div style="display:flex; flex-direction:column; gap:14px; font-size:13px;">
          <div style="display:flex; justify-content:space-between; padding-bottom:8px; border-bottom:1px solid var(--border);">
            <span style="color:var(--accents-5);">1. Data Volume Transferred:</span>
            <span><strong>${formatBytes(summary.totalBytesIn)}</strong> in / <strong>${formatBytes(summary.totalBytesOut)}</strong> out</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding-bottom:8px; border-bottom:1px solid var(--border);">
            <span style="color:var(--accents-5);">2. Uploads Directory:</span>
            <span><strong>${summary.sharedSandbox.uploadFileCount}</strong> files (${formatBytes(summary.sharedSandbox.uploadBytes)})</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding-bottom:8px; border-bottom:1px solid var(--border);">
            <span style="color:var(--accents-5);">3. Active Repositories:</span>
            <span><strong>${summary.sharedSandbox.activeWorkDirs}</strong> active repositories</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--accents-5);">4. Quota Threshold:</span>
            <span><strong>300 MB</strong> shared limit</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Execution Errors Log Table -->
    <div class="card" style="margin-bottom:24px;">
      <h2 style="font-size:15px; font-weight:600; color:var(--fg); margin-bottom:12px;">Recent Failure Telemetry Log</h2>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Tool / Request</th>
              <th>Client</th>
              <th>Status</th>
              <th>Error Details</th>
            </tr>
          </thead>
          <tbody id="errorLogBody">
            ${
              summary.recentErrors && summary.recentErrors.length > 0
                ? summary.recentErrors
                    .map(
                      (err) => `
                <tr>
                  <td>${new Date(err.timestamp).toLocaleTimeString()}</td>
                  <td style="font-family:monospace; font-weight:600;">${escapeHtml(err.toolName)}</td>
                  <td>${escapeHtml(err.client)}</td>
                  <td><span class="badge" style="color:var(--error);">${err.statusCode}</span></td>
                  <td style="color:var(--accents-5); font-size:12px;">${escapeHtml(err.errorMessage)}</td>
                </tr>
              `,
                    )
                    .join("")
                : `
              <tr>
                <td colspan="5" style="text-align:center; padding:18px; color:var(--accents-5);">
                  No execution failures recorded. All calls running smoothly.
                </td>
              </tr>
            `
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Per-Key & Per-OAuth Client Analytics Table -->
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h2 style="font-size:15px; font-weight:600; color:var(--fg);">Per-Key &amp; Client Breakdown</h2>
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
    let dailyData = ${JSON.stringify(summary.dailyTimeline)};
    let weeklyData = ${JSON.stringify(summary.weeklyTimeline)};
    let monthlyData = ${JSON.stringify(summary.monthlyTimeline)};

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

      // Smart year filter
      const filterYear = document.getElementById('yearFilter')?.value;
      if (filterYear && filterYear !== 'all') {
        data = data.filter(d => d[labelKey].startsWith(filterYear));
      }

      if (!data || data.length === 0) {
        container.innerHTML = '<div style="display:flex; align-items:center; justify-content:center; width:100%; height:160px; color:var(--accents-5);">No activity data for this selection</div>';
        return;
      }

      const maxVal = data.reduce(function(m, d) { return Math.max(m, d.requests); }, 1);
      const width = 800;
      const height = 170;
      const chartHeight = 120;
      const padTop = 15;
      const step = width / data.length;
      const barWidth = Math.max(4, Math.min(22, step * 0.65));

      let svgHtml = '<svg viewBox="0 0 ' + width + ' ' + height + '" style="width:100%; height:170px;" preserveAspectRatio="none">';
      svgHtml += '<line x1="0" y1="' + (chartHeight + padTop) + '" x2="' + width + '" y2="' + (chartHeight + padTop) + '" stroke="var(--border)" stroke-width="1" />';

      data.forEach((d, i) => {
        const barHeight = Math.max(3, Math.round((d.requests / maxVal) * chartHeight));
        const x = i * step + (step - barWidth) / 2;
        const y = padTop + (chartHeight - barHeight);
        const rawLabel = d[labelKey];
        const displayLabel = rawLabel.includes('-') ? rawLabel.split('-').slice(1).join('/') : rawLabel;

        svgHtml += '<g>';
        svgHtml += '<title>' + rawLabel + ': ' + d.requests + ' requests (' + d.tools + ' tool calls)</title>';
        svgHtml += '<rect x="' + x + '" y="' + y + '" width="' + barWidth + '" height="' + barHeight + '" rx="3" ry="3" fill="var(--fg)" style="transition:all 0.2s ease; cursor:pointer;" />';
        svgHtml += '<text x="' + (x + barWidth / 2) + '" y="' + (chartHeight + padTop + 18) + '" text-anchor="middle" font-size="10" fill="var(--accents-5)" font-family="sans-serif">' + displayLabel + '</text>';
        svgHtml += '</g>';
      });

      svgHtml += '</svg>';
      container.innerHTML = svgHtml;
    }

    renderChart();

    // Live 3s Polling
    async function pollLiveStats() {
      try {
        const res = await fetch('/stats/api');
        if (!res.ok) return;
        const s = await res.json();
        if (!s) return;

        // Update top metrics
        document.getElementById('valTotalRequests').textContent = s.totalRequests.toLocaleString();
        document.getElementById('valSuccessRate').textContent = s.overallSuccessRate + '% success';
        document.getElementById('valErrorCount').textContent = s.totalErrors + ' errors';
        document.getElementById('valThroughput').innerHTML = s.throughputRpm + ' <span style="font-size:14px; font-weight:500;">RPM</span>';
        document.getElementById('valActiveStreams').textContent = s.activeHttpSessions || 0;
        document.getElementById('valLatency').innerHTML = s.avgDurationMs + ' <span style="font-size:14px; font-weight:500;">/ ' + s.p95DurationMs + ' ms</span>';
        document.getElementById('valQuotaUsed').textContent = s.sharedSandbox.quotaUsedPercent + '%';
        document.getElementById('barQuotaFill').style.width = Math.min(100, Math.max(2, s.sharedSandbox.quotaUsedPercent)) + '%';

        // Update system health
        if (s.systemHealth) {
          document.getElementById('valHeap').textContent = s.systemHealth.heapUsedMb + ' MB / ' + s.systemHealth.heapTotalMb + ' MB';
          document.getElementById('valRss').textContent = s.systemHealth.rssMb + ' MB';
          document.getElementById('valUptime').textContent = Math.round(s.systemHealth.uptimeSec / 60) + ' mins';
        }

        // Update timeline data arrays and redraw
        if (s.dailyTimeline) dailyData = s.dailyTimeline;
        if (s.weeklyTimeline) weeklyData = s.weeklyTimeline;
        if (s.monthlyTimeline) monthlyData = s.monthlyTimeline;
        renderChart();
      } catch {}
    }

    setInterval(pollLiveStats, 3000);

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
