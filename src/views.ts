import type { OwnerProfile, GeneratedKeyEntry } from "./googleAuth.js";
import type { StatsSummary, KeyMetrics, ToolDetailMeta } from "./stats.js";
import type { ActiveOAuthInfo } from "./mcpOAuth.js";

export function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
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
    | "clipboard"
    | "eye"
    | "eye-off"
    | "check"
    | "trash"
    | "download"
    | "arrow-right"
    | "clock"
    | "shield"
    | "zap"
    | "edit"
    | "more-vertical"
    | "search",
  size = 14,
): string {
  switch (name) {
    case "eye":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    case "eye-off":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    case "clipboard":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    case "edit":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
    case "more-vertical":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>`;
    case "search":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
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
    case "shield":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
    case "zap":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;
    default:
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><circle cx="12" cy="12" r="10"></circle></svg>`;
  }
}

export function renderGoogleLogoSvg(size = 18): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.09C3.26 21.37 7.34 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.24C.45 8.16 0 9.93 0 12s.45 3.84 1.24 5.41l4.04-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.63 1.24 6.59l4.04 3.09c.95-2.83 3.6-4.93 6.72-4.93z"/></svg>`;
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

    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 99999;
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--card-bg);
      color: var(--fg);
      box-shadow: 0 4px 14px rgba(0,0,0,0.12);
      font-size: 13px;
      transform: translateY(12px);
      opacity: 0;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      max-width: 380px;
    }
    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }
    .toast.success { border-color: rgba(0,112,243,0.4); }
    .toast.error { border-color: rgba(238,0,0,0.4); }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(4px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 20px;
    }
    .modal-backdrop.open,
    .modal-backdrop.active {
      display: flex;
    }
    .modal-backdrop[hidden] {
      display: none !important;
    }
    .modal-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
    }

    .pill-btn {
      background: var(--card-sub);
      border: 1px solid var(--border);
      color: var(--accents-5);
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }
    .pill-btn:hover {
      color: var(--fg);
      border-color: var(--accents-4);
    }
    .pill-btn.active {
      background: var(--fg);
      color: var(--bg);
      border-color: var(--fg);
    }

    .tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
      gap: 14px;
    }
    .tool-box {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 140px;
      transition: border-color 0.15s ease, transform 0.15s ease;
    }
    .tool-box:hover {
      border-color: var(--accents-4);
      transform: translateY(-2px);
    }
    .tool-box-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 8px;
    }
    .tool-box-name {
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-size: 13px;
      font-weight: 700;
      color: var(--fg);
      word-break: break-all;
    }
    .tool-box-desc {
      font-size: 12px;
      color: var(--accents-5);
      line-height: 1.5;
      margin-bottom: 12px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .tool-box-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      border-top: 1px solid var(--border);
      padding-top: 10px;
      color: var(--accents-5);
    }

    .search-input-wrap {
      position: relative;
      width: 100%;
    }
    .search-input-wrap svg {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: var(--accents-4);
    }
    .search-input-wrap input {
      width: 100%;
      height: 38px;
      padding: 0 14px 0 36px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--code-bg);
      color: var(--fg);
      font-size: 13px;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .search-input-wrap input:focus {
      outline: none;
      border-color: var(--fg);
      box-shadow: 0 0 0 1px var(--fg);
    }
    .search-input-wrap input::placeholder {
      color: var(--accents-4);
    }

    .drop-zone {
      border: 1px dashed var(--border);
      border-radius: 12px;
      padding: 36px 20px;
      text-align: center;
      background: var(--card-bg);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .drop-zone:hover, .drop-zone.drag-over {
      border-color: var(--fg);
      background: var(--accents-1);
    }
    .drop-zone:focus-visible {
      outline: 2px solid var(--fg);
    }

    .switch-wrap {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 14px 16px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--card-bg);
      margin-bottom: 16px;
    }
    .switch {
      position: relative;
      display: inline-block;
      width: 42px;
      height: 24px;
      flex-shrink: 0;
    }
    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--accents-2);
      transition: .2s;
      border-radius: 24px;
      border: 1px solid var(--border);
    }
    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 2px;
      bottom: 2px;
      background-color: var(--fg);
      transition: .2s;
      border-radius: 50%;
    }
    input:checked + .slider {
      background-color: #0070f3;
      border-color: #0070f3;
    }
    input:checked + .slider:before {
      transform: translateX(18px);
      background-color: #ffffff;
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
    /* reCAPTCHA v3 floating badge hiding per Google Terms */
    .grecaptcha-badge {
      visibility: hidden !important;
    }

    /* Profile Dropdown & Overflow Prevention */
    .profile-dropdown-wrap {
      position: relative;
      display: inline-block;
    }
    .profile-trigger-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--accents-1);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 4px 10px 4px 6px;
      font-size: 13px;
      font-family: inherit;
      color: var(--fg);
      cursor: pointer;
      max-width: 220px;
      transition: all 0.15s ease;
    }
    .profile-trigger-btn:hover {
      border-color: var(--accents-4);
      background: var(--accents-2);
    }
    .profile-trigger-avatar {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }
    .profile-trigger-avatar-fallback {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--fg);
      color: var(--bg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 11px;
      flex-shrink: 0;
    }
    .profile-trigger-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 500;
      font-size: 12px;
      max-width: 120px;
    }
    .profile-dropdown-menu {
      position: absolute;
      right: 0;
      top: calc(100% + 8px);
      width: 240px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
      padding: 8px;
      display: none;
      z-index: 1000;
      text-align: left;
    }
    .profile-dropdown-menu.open {
      display: block;
    }
    .profile-menu-header {
      padding: 8px 10px 10px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 6px;
    }
    .profile-menu-name {
      font-weight: 600;
      font-size: 13px;
      color: var(--fg);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
      display: block;
    }
    .profile-menu-email {
      font-size: 11px;
      color: var(--accents-5);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
      display: block;
      margin-top: 2px;
    }
    .profile-menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 10px;
      border-radius: 6px;
      background: none;
      border: none;
      font-size: 13px;
      color: var(--fg);
      text-align: left;
      cursor: pointer;
      transition: background 0.15s ease;
      font-family: inherit;
    }
    .profile-menu-item:hover {
      background: var(--accents-1);
    }
    .profile-menu-item.danger {
      color: var(--error);
    }
    .profile-menu-item.danger:hover {
      background: rgba(235, 87, 87, 0.08);
    }

    /* Modal Backdrop and Box */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }
    .modal-backdrop.open {
      display: flex;
    }
    .modal-card, .modal-box {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      width: 90%;
      max-width: 440px;
      padding: 24px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.16);
    }

    /* Unified Kebab Menu */
    .kebab-wrap {
      position: relative;
      display: inline-block;
      text-align: right;
    }
    .kebab-btn {
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--card-bg);
      color: var(--accents-5);
      cursor: pointer;
      transition: all 0.15s ease;
      touch-action: manipulation;
    }
    .kebab-btn:hover, .kebab-btn:focus-visible {
      color: var(--fg);
      border-color: var(--accents-4);
      background: var(--accents-1);
    }
    .kebab-dropdown {
      position: absolute;
      right: 0;
      top: calc(100% + 4px);
      z-index: 1000;
      min-width: 170px;
      padding: 6px;
      border-radius: 8px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28);
      display: none;
      flex-direction: column;
      gap: 2px;
    }
    .kebab-dropdown.open {
      display: flex;
    }
    .kebab-dropdown.pop-up {
      top: auto;
      bottom: calc(100% + 4px);
    }
    .kebab-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 500;
      color: var(--fg);
      text-decoration: none;
      background: transparent;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      text-align: left;
      transition: background 0.12s ease;
      box-sizing: border-box;
      font-family: inherit;
    }
    .kebab-item:hover, .kebab-item:focus-visible {
      background: var(--accents-1);
      color: var(--fg);
      outline: none;
    }
    .kebab-item.danger {
      color: var(--error);
    }
    .kebab-item.danger:hover, .kebab-item.danger:focus-visible {
      background: rgba(238, 0, 0, 0.08);
      color: var(--error);
    }
    .kebab-divider {
      height: 1px;
      background: var(--border);
      margin: 4px 0;
    }

    /* Unified Pagination Controls */
    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
      font-size: 12px;
      color: var(--accents-5);
      flex-wrap: wrap;
      gap: 10px;
    }
    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .pagination-btn {
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--accents-1);
      color: var(--fg);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .pagination-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .pagination-btn:not(:disabled):hover {
      background: var(--accents-2);
      border-color: var(--accents-4);
    }

    /* Keyboard Shortcuts Modal Styles */
    .shortcut-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--border);
      font-size: 13px;
    }
    .shortcut-row:last-child {
      border-bottom: none;
    }
    .kbd-badge {
      display: inline-block;
      padding: 2px 7px;
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-size: 11px;
      font-weight: 600;
      color: var(--fg);
      background: var(--accents-1);
      border: 1px solid var(--border);
      border-radius: 4px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    .mobile-subnav {
      display: none;
    }
    .key-display-scroll {
      display: inline-block;
      max-width: 180px;
      overflow-x: auto;
      white-space: nowrap;
      scrollbar-width: thin;
      vertical-align: middle;
    }
    .icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 5px 8px;
      min-width: 32px;
      min-height: 28px;
    }

    @media (max-width: 680px) {
      .desktop-only-nav {
        display: none !important;
      }
      .mobile-subnav {
        display: block;
        background: var(--header-bg);
        border-bottom: 1px solid var(--border);
        position: sticky;
        top: 49px;
        z-index: 99;
      }
      .mobile-subnav-scroll {
        display: flex;
        align-items: center;
        gap: 6px;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        padding: 8px 12px;
        scrollbar-width: none;
      }
      .mobile-subnav-scroll::-webkit-scrollbar {
        display: none;
      }
      .mobile-subnav-pill {
        display: inline-flex;
        align-items: center;
        white-space: nowrap;
        font-size: 13px;
        font-weight: 500;
        color: var(--accents-5);
        padding: 5px 12px;
        border-radius: 20px;
        text-decoration: none;
        border: 1px solid transparent;
        transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        background: var(--accents-1);
        touch-action: manipulation;
        min-height: 32px;
      }
      .mobile-subnav-pill:hover {
        color: var(--fg);
        background: var(--accents-2);
      }
      .mobile-subnav-pill.active {
        color: var(--fg);
        background: var(--card-bg);
        border-color: var(--border);
        font-weight: 600;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      }
      .grid-4 { grid-template-columns: 1fr; }
      .nav-inner { padding: 0 12px; gap: 8px; }
      .key-display-scroll { max-width: 130px; }
      .endpoint-row { flex-direction: column; }
      footer { flex-direction: column; gap: 12px; text-align: center; }
    }
  `;
}

export function renderRecaptchaScript(nonce?: string): string {
  const siteKey =
    process.env.RECAPTCHA_SITE_KEY ||
    process.env.GOOGLE_RECAPTCHA_SITE_KEY ||
    "6Ld_sample_krix_recaptcha_key";
  return `
    <script src="https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}"${nonce ? ` nonce="${nonce}"` : ""}></script>
    <script${nonce ? ` nonce="${nonce}"` : ""}>
      if (typeof grecaptcha !== 'undefined') {
        grecaptcha.ready(function() {
          // Google reCAPTCHA v3 active
        });
      }
    </script>
  `;
}

export function renderHeader(
  activeNav: string,
  owner: OwnerProfile | null,
  nonce?: string,
): string {
  const isOwner = Boolean(owner);
  return `
    <header class="nav-header">
      <div class="nav-inner">
        <a href="/home" class="brand-wrap">
          <div class="brand-avatar">
            <img src="/icon-48.png?v=2" alt="Krix">
          </div>
          <span>Krix</span>
        </a>

        <nav class="nav-pills desktop-only-nav">
          <a href="/home" class="nav-pill ${activeNav === "home" ? "active" : ""}">Home</a>
          <a href="/upload" class="nav-pill ${activeNav === "upload" ? "active" : ""}">Upload</a>
          <a href="/store" class="nav-pill ${activeNav === "store" ? "active" : ""}">Store</a>
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
            <div class="profile-dropdown-wrap" id="headerProfileDropdownWrap">
              <button type="button" class="profile-trigger-btn" id="headerProfileTrigger" onclick="toggleProfileDropdown(event)" aria-expanded="false" aria-haspopup="true">
                ${owner?.picture ? `<img src="${escapeHtml(owner.picture)}" class="profile-trigger-avatar" alt="Avatar">` : `<span class="profile-trigger-avatar-fallback">${escapeHtml((owner?.name || owner?.email || "O").charAt(0).toUpperCase())}</span>`}
                <span class="profile-trigger-name" title="${escapeHtml(owner?.name || owner?.email || "Owner")}">${escapeHtml(owner?.name || owner?.email || "Owner")}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              <div class="profile-dropdown-menu" id="headerProfileMenu" role="menu">
                <div class="profile-menu-header">
                  <span class="profile-menu-name" title="${escapeHtml(owner?.name || "Server Owner")}">${escapeHtml(owner?.name || "Server Owner")}</span>
                  <span class="profile-menu-email" title="${escapeHtml(owner?.email || "")}">${escapeHtml(owner?.email || "")}</span>
                </div>
                <button type="button" class="profile-menu-item danger" onclick="openSignOutModal()" role="menuitem">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          `
              : `
            <a href="/auth/google?returnTo=/${activeNav || "home"}" class="btn primary" style="font-size:12px; padding:6px 14px; display:inline-flex; align-items:center; gap:8px;">
              ${renderGoogleLogoSvg(16)}
              <span>Sign in with Google</span>
            </a>
          `
          }
        </div>
      </div>

      <!-- Mobile-only Horizontally Scrollable Navigation Sub-bar -->
      <nav class="mobile-subnav" aria-label="Mobile Navigation">
        <div class="mobile-subnav-scroll">
          <a href="/home" class="mobile-subnav-pill ${activeNav === "home" ? "active" : ""}">Home</a>
          <a href="/upload" class="mobile-subnav-pill ${activeNav === "upload" ? "active" : ""}">Upload</a>
          <a href="/store" class="mobile-subnav-pill ${activeNav === "store" ? "active" : ""}">Store</a>
          <a href="/stats" class="mobile-subnav-pill ${activeNav === "stats" ? "active" : ""}">Stats</a>
          <a href="/tools" class="mobile-subnav-pill ${activeNav === "tools" ? "active" : ""}">Tools</a>
          <a href="/api" class="mobile-subnav-pill ${activeNav === "api" ? "active" : ""}">API Keys</a>
          <a href="https://quickwitty.onrender.com" target="_blank" rel="noopener" class="mobile-subnav-pill">Contact</a>
        </div>
      </nav>
    </header>

    <!-- Sign Out Confirmation Modal -->
    <div class="modal-backdrop" id="headerSignOutModal" onclick="handleSignOutModalBackdrop(event)">
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="signOutModalTitle">
        <h3 id="signOutModalTitle" style="font-size:16px; font-weight:600; margin-bottom:8px; color:var(--fg);">Sign Out</h3>
        <p style="font-size:13px; color:var(--accents-5); margin-bottom:20px; line-height:1.5;">Are you sure you want to sign out of your Krix owner session?</p>
        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button type="button" class="btn" onclick="closeSignOutModal()">Cancel</button>
          <a href="/auth/logout" class="btn primary" style="background:#e00; border-color:#e00; color:#fff;">Confirm Sign Out</a>
        </div>
      </div>
    </div>

    <script${nonce ? ` nonce="${nonce}"` : ""}>
      function toggleProfileDropdown(ev) {
        if (ev) ev.stopPropagation();
        const menu = document.getElementById('headerProfileMenu');
        const trigger = document.getElementById('headerProfileTrigger');
        if (!menu) return;
        const isOpen = menu.classList.contains('open');
        if (isOpen) {
          menu.classList.remove('open');
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        } else {
          menu.classList.add('open');
          if (trigger) trigger.setAttribute('aria-expanded', 'true');
        }
      }
      function openSignOutModal() {
        const menu = document.getElementById('headerProfileMenu');
        if (menu) menu.classList.remove('open');
        const modal = document.getElementById('headerSignOutModal');
        if (modal) modal.classList.add('open');
      }
      function closeSignOutModal() {
        const modal = document.getElementById('headerSignOutModal');
        if (modal) modal.classList.remove('open');
      }
      function handleSignOutModalBackdrop(ev) {
        if (ev.target && ev.target.id === 'headerSignOutModal') {
          closeSignOutModal();
        }
      }
      document.addEventListener('click', function(e) {
        const wrap = document.getElementById('headerProfileDropdownWrap');
        const menu = document.getElementById('headerProfileMenu');
        if (wrap && menu && !wrap.contains(e.target)) {
          menu.classList.remove('open');
          const trigger = document.getElementById('headerProfileTrigger');
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        }
      });
      window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          closeSignOutModal();
          const menu = document.getElementById('headerProfileMenu');
          if (menu) menu.classList.remove('open');
        }
      });
    </script>
  `;
}

export function renderFooter(): string {
  return `
    <footer>
      <div>Krix</div>
      <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:center;">
        <a href="/home">Home</a>
        <a href="/upload">Upload</a>
        <a href="/store">Store</a>
        <a href="/stats">Stats</a>
        <a href="/tools">Tools</a>
        <a href="/api">API Keys</a>
        <a href="https://quickwitty.onrender.com" target="_blank" rel="noopener">Contact</a>
        <button type="button" class="btn" onclick="openShortcutsModal()" style="padding:2px 8px; font-size:11px; height:24px; margin-left:4px;" title="View Keyboard Shortcuts (?)">
          Shortcuts <span class="kbd-badge" style="margin-left:2px; font-size:10px; padding:1px 4px;">?</span>
        </button>
      </div>
    </footer>
    <div class="recaptcha-notice" style="margin-top:14px; font-size:11px; color:var(--accents-5); text-align:center; line-height:1.5;">
      This site is protected by reCAPTCHA and the Google
      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and
      <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> apply.
    </div>

    <!-- Global Keyboard Shortcuts Modal -->
    <div class="modal-backdrop" id="shortcutsModal" onclick="handleShortcutsBackdrop(event)">
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="shortcutsModalTitle" style="max-width:400px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <h3 id="shortcutsModalTitle" style="font-size:16px; font-weight:700; color:var(--fg); margin:0;">Keyboard Shortcuts</h3>
          <button type="button" class="kebab-btn" onclick="closeShortcutsModal()" style="width:26px; height:26px;">&times;</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:18px;">
          <div class="shortcut-row"><span>Go to Home</span><span class="kbd-badge">H</span></div>
          <div class="shortcut-row"><span>Go to Upload</span><span class="kbd-badge">U</span></div>
          <div class="shortcut-row"><span>Go to Store</span><span class="kbd-badge">S</span></div>
          <div class="shortcut-row"><span>Go to Stats</span><span class="kbd-badge">Y</span></div>
          <div class="shortcut-row"><span>Go to Tools</span><span class="kbd-badge">T</span></div>
          <div class="shortcut-row"><span>Go to API Keys</span><span class="kbd-badge">A</span></div>
          <div class="shortcut-row"><span>Quick Search</span><span class="kbd-badge">/</span></div>
          <div class="shortcut-row"><span>Toggle Theme</span><span class="kbd-badge">Shift + D</span></div>
          <div class="shortcut-row"><span>Close Modal</span><span class="kbd-badge">Esc</span></div>
        </div>
        <div style="text-align:right;">
          <button type="button" class="btn primary" onclick="closeShortcutsModal()" style="font-size:12px; padding:6px 14px;">Got it</button>
        </div>
      </div>
    </div>

    <script>
      function openShortcutsModal() {
        const m = document.getElementById('shortcutsModal');
        if (m) {
          m.removeAttribute('hidden');
          m.classList.add('open');
        }
      }
      function closeShortcutsModal() {
        const m = document.getElementById('shortcutsModal');
        if (m) {
          m.classList.remove('open');
          m.setAttribute('hidden', '');
        }
      }
      function handleShortcutsBackdrop(e) {
        if (e.target.id === 'shortcutsModal') closeShortcutsModal();
      }

      window.addEventListener('keydown', (e) => {
        const activeTag = (document.activeElement?.tagName || '').toLowerCase();
        const isEditing = activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable;

        if (e.key === 'Escape') {
          closeShortcutsModal();
          return;
        }

        if (isEditing) return;

        if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
          e.preventDefault();
          openShortcutsModal();
          return;
        }

        if (e.key === '/') {
          const searchInput = document.getElementById('toolSearchInput') ||
                              document.getElementById('storeSearchInput') ||
                              document.getElementById('keySearchInput') ||
                              document.getElementById('fileFilter');
          if (searchInput) {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
          }
          return;
        }

        if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
          e.preventDefault();
          if (typeof toggleTheme === 'function') toggleTheme();
          return;
        }

        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          switch (e.key.toLowerCase()) {
            case 'h': window.location.href = '/home'; break;
            case 'u': window.location.href = '/upload'; break;
            case 's': window.location.href = '/store'; break;
            case 'y': window.location.href = '/stats'; break;
            case 't': window.location.href = '/tools'; break;
            case 'a': window.location.href = '/api'; break;
          }
        }
      });
    </script>
  `;
}

export function renderAuthRequiredCard(
  pageTitle: string,
  returnUrl: string,
): string {
  return `
    <div class="card" style="text-align:center; padding:48px 24px; max-width:540px; margin:40px auto;">
      <div style="width:48px; height:48px; border-radius:50%; background:var(--accents-1); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; color:var(--fg);">
        ${renderSvg("shield", 22)}
      </div>
      <h2 style="font-size:18px; font-weight:600; color:var(--fg); margin-bottom:8px;">Authentication Required</h2>
      <p style="font-size:13px; color:var(--accents-5); max-width:420px; margin:0 auto 24px; line-height:1.5;">
        You must sign in as the verified service owner to access the ${escapeHtml(pageTitle)} page.
      </p>
      <a href="/auth/google?returnTo=${encodeURIComponent(returnUrl)}" class="btn primary" style="padding:8px 18px; font-size:13px; display:inline-flex; align-items:center; gap:8px;">
        ${renderGoogleLogoSvg(18)}
        <span>Sign in with Google</span>
      </a>
    </div>
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
  <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2">
  <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png?v=2">
  <link rel="icon" type="image/png" sizes="128x128" href="/icon-128.png?v=2">
  <style>
    ${getBaseStyles()}
  </style>
  ${renderRecaptchaScript()}
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
          Isolated execution sandbox and tools.
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
          <button class="tab" onclick="showTab('gemini')">Gemini</button>
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
        gemini: "// Google Gemini MCP Connection\\n// 1. Settings -> Connected Apps -> Connect to an MCP server\\n// 2. Server URL: " + baseUrl + "/mcp\\n// 3. Click 'Next' and approve with your Google owner account\\n// Note: Redirect URI & Additional settings are handled automatically",
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
        oauth: "// Universal OAuth 2.1 Discovery (RFC 9728 & RFC 8414)\\n// Endpoint: " + baseUrl + "/mcp\\n// Authorize: " + baseUrl + "/oauth/authorize\\n// Token: " + baseUrl + "/oauth/token"
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

    // Initial API Keys and OAuth pagination render
    renderKeysPagination();
    renderOAuthPagination();
  </script>
</body>
</html>`;
}

export function renderApiKeysPage(params: {
  base: string;
  isOwner: boolean;
  owner: OwnerProfile | null;
  keys?: Array<Omit<GeneratedKeyEntry, "key"> | GeneratedKeyEntry>;
  dynamicKeys?: Array<Omit<GeneratedKeyEntry, "key"> | GeneratedKeyEntry>;
  oauthAuthorizations?: ActiveOAuthInfo[];
}): string {
  const { base, isOwner, owner, oauthAuthorizations = [] } = params;
  const keys = params.keys || params.dynamicKeys || [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>API Keys - Krix</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2">
  <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png?v=2">
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
  ${renderRecaptchaScript()}
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
        ? renderAuthRequiredCard("API Keys", "/api")
        : `
      <!-- Create Key Card -->
      <div class="card" style="margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:8px;">
          <h2 style="font-size:15px; font-weight:600; color:var(--fg); margin:0;">Create New API Key</h2>
          <span class="badge ${keys.length >= 30 ? "error" : ""}" id="keysCapBadge">${keys.length}/30 keys</span>
        </div>
        <p style="font-size:13px; color:var(--accents-5); margin-bottom:16px;">
          Assign a recognizable label to isolate telemetry.
        </p>

        <form id="createKeyForm" onsubmit="event.preventDefault(); handleCreateKey(event); return false;" action="javascript:void(0);" method="post" style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
          <input type="text" id="keyLabelInput" placeholder="Key Name (e.g. Claude, min 4 characters)" minlength="4" required onkeydown="if (event.key === 'Enter') { event.preventDefault(); handleCreateKey(event); }" style="flex:1; min-width:240px; padding:9px 12px; border-radius:8px; border:1px solid var(--border); background:var(--code-bg); color:var(--fg); font-size:13px;">
          <button type="button" class="btn primary" id="createKeyBtn" onclick="handleCreateKey(event)">Generate Key</button>
        </form>

        <div id="newKeyBanner" style="display:none; margin-top:16px; padding:16px; background:rgba(0,112,243,0.06); border:1px solid rgba(0,112,243,0.3); border-radius:8px;">
          <div style="font-size:13px; font-weight:600; color:#0070f3; margin-bottom:4px;">New Key Generated Successfully</div>
          <div style="font-size:12px; color:var(--accents-5); margin-bottom:12px;">Copy your secret key and 12-character client ID now. Both are safely stored and always viewable below.</div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; gap:8px; align-items:center;">
              <span style="font-size:12px; color:var(--accents-5); width:75px; flex-shrink:0;">API Key:</span>
              <div style="flex:1; min-width:0; overflow-x:auto; white-space:nowrap;">
                <input type="text" id="newKeyField" readonly style="width:100%; padding:8px 10px; font-family:monospace; font-size:12px; border-radius:6px; border:1px solid var(--border); background:var(--code-bg); color:var(--fg);">
              </div>
              <button type="button" class="btn icon-btn" onclick="copyCreatedKey()" id="copyKeyBtn" title="Copy Key" aria-label="Copy Key" style="display:inline-flex; align-items:center; gap:6px;">
                ${renderSvg("copy", 14)} <span>Copy</span>
              </button>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
              <span style="font-size:12px; color:var(--accents-5); width:75px; flex-shrink:0;">Client ID:</span>
              <div style="flex:1; min-width:0; overflow-x:auto; white-space:nowrap;">
                <input type="text" id="newClientIdField" readonly style="width:100%; padding:8px 10px; font-family:monospace; font-size:12px; border-radius:6px; border:1px solid var(--border); background:var(--code-bg); color:var(--fg);">
              </div>
              <button type="button" class="btn icon-btn" onclick="copyCreatedClientId()" id="copyClientIdBtn" title="Copy Client ID" aria-label="Copy Client ID" style="display:inline-flex; align-items:center; gap:6px;">
                ${renderSvg("copy", 14)} <span>Copy</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Keys Table Card with Live Search & Kebab Actions -->
      <div class="card" style="margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <h2 style="font-size:15px; font-weight:600; color:var(--fg);">Active API Keys</h2>
            <span class="badge" id="keysCountBadge">${keys.length} active</span>
          </div>
          <div class="search-input-wrap" style="width:100%; max-width:320px;">
            ${renderSvg("search", 15)}
            <input type="text" id="keySearchInput" placeholder="Search keys by label, client ID, or prefix" oninput="filterKeys()">
          </div>
        </div>

        <div style="overflow-x:auto; -webkit-overflow-scrolling:touch; max-height:480px; overflow-y:auto; padding-bottom:80px; margin-bottom:-80px;">
          <table id="keysTable">
            <thead>
              <tr>
                <th>Label</th>
                <th>Client ID</th>
                <th>Key Secret</th>
                <th>Created</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody id="keysTableBody">
              ${
                keys.length > 0
                  ? keys
                      .map((k) => {
                        const label = k.label || "Personal Key";
                        const prefix =
                          k.prefix || (k as any).key?.slice(0, 16) || "";
                        const id = k.id || "";
                        const cId = (k as any).clientId || "";
                        const fullKey = (k as any).key || prefix || id;
                        return `
                <tr id="row-${escapeHtml(id)}" class="key-row" data-label="${escapeHtml(label.toLowerCase())}" data-client-id="${escapeHtml(cId.toLowerCase())}" data-prefix="${escapeHtml(prefix.toLowerCase())}" data-id="${escapeHtml(id.toLowerCase())}">
                  <td>
                    <div style="font-weight:600; color:var(--fg);" id="key-label-text-${escapeHtml(id)}">${escapeHtml(label)}</div>
                    <div style="font-family:monospace; font-size:11px; color:var(--accents-5);">${escapeHtml(id)}</div>
                  </td>
                  <td>
                    <div style="display:flex; align-items:center; gap:6px;">
                      <code style="font-family:ui-monospace, SFMono-Regular, monospace; font-size:12px; background:var(--code-bg); padding:3px 6px; border-radius:4px; border:1px solid var(--border); color:var(--fg);">${escapeHtml(cId || "N/A")}</code>
                      ${cId ? `<button type="button" class="btn icon-btn" onclick="copyKeyText('${escapeHtml(cId)}', 'Client ID')" style="padding:4px 7px;" title="Copy Client ID" aria-label="Copy Client ID">${renderSvg("copy", 13)}</button>` : ""}
                    </div>
                  </td>
                  <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <div class="key-display-scroll" style="max-width:180px; overflow-x:auto; white-space:nowrap; scrollbar-width:thin; padding:2px 0;">
                        <code id="key-val-${escapeHtml(id)}" data-full="${escapeHtml(fullKey)}" data-revealed="false" style="font-family:ui-monospace, SFMono-Regular, monospace; background:var(--code-bg); padding:4px 8px; border-radius:4px; font-size:12px; border:1px solid var(--border); color:var(--fg); display:inline-block;">••••••••••••••••</code>
                      </div>
                      <button type="button" class="btn icon-btn" id="reveal-btn-${escapeHtml(id)}" onclick="toggleKeyReveal('${escapeHtml(id)}')" title="Reveal API Key" aria-label="Reveal API Key" style="padding:4px 7px;">
                        ${renderSvg("eye", 14)}
                      </button>
                      <button type="button" class="btn icon-btn" onclick="copyKeyText('${escapeHtml(fullKey)}', 'API Key')" title="Copy API Key" aria-label="Copy API Key" style="padding:4px 7px;">
                        ${renderSvg("copy", 14)}
                      </button>
                    </div>
                  </td>
                  <td><span class="local-date" data-ts="${k.createdAt}">${new Date(k.createdAt).toLocaleDateString()}</span></td>
                  <td style="text-align:right;">
                    <div class="kebab-wrap">
                      <button type="button" class="kebab-btn" data-action="toggle-menu" data-target="kebab-key-${escapeHtml(id)}" aria-label="Key Actions">⋮</button>
                      <div class="kebab-dropdown" id="kebab-key-${escapeHtml(id)}">
                        <button type="button" class="kebab-item" onclick="copyKeyText('${escapeHtml(fullKey)}', 'API Key')">
                          ${renderSvg("copy", 14)} <span>Copy Key</span>
                        </button>
                        ${
                          cId
                            ? `
                        <button type="button" class="kebab-item" onclick="copyKeyText('${escapeHtml(cId)}', 'Client ID')">
                          ${renderSvg("copy", 14)} <span>Copy Client ID</span>
                        </button>
                        `
                            : ""
                        }
                        <button type="button" class="kebab-item" onclick="openRenameKeyModal('${escapeHtml(id)}', '${escapeHtml(label)}')">
                          ${renderSvg("edit", 14)} <span>Rename…</span>
                        </button>
                        <div class="kebab-divider"></div>
                        <button type="button" class="kebab-item danger" onclick="openDeleteKeyModal('${escapeHtml(id)}', '${escapeHtml(label)}')">
                          ${renderSvg("trash", 14)} <span>Delete Key</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              `;
                      })
                      .join("")
                  : `
                <tr id="emptyKeysRow">
                  <td colspan="5" style="text-align:center; padding:24px; color:var(--accents-5);">
                    No dynamic keys created yet. Generate one above.
                  </td>
                </tr>
              `
              }
            </tbody>
          </table>
          <div id="noKeysMatch" style="display:none; text-align:center; padding:24px; color:var(--accents-5);">
            No keys match your search query.
          </div>
        </div>

        <!-- Keys Pagination Bar -->
        <div class="pagination-bar" id="keysPaginationBar">
          <span id="keysPageIndicator">Showing keys</span>
          <div class="pagination-controls">
            <button type="button" class="pagination-btn" id="keysPrevBtn" onclick="changeKeysPage(-1)">Previous</button>
            <button type="button" class="pagination-btn" id="keysNextBtn" onclick="changeKeysPage(1)">Next</button>
          </div>
        </div>
      </div>

      <!-- Active OAuth Authorizations Card with Search & Kebab Actions -->
      <div class="card" style="margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <h2 style="font-size:15px; font-weight:600; color:var(--fg); margin:0;">Active OAuth Authorizations</h2>
            <span class="badge ${oauthAuthorizations.length > 0 ? "success" : ""}" id="oauthCountBadge">${oauthAuthorizations.length}/20 connected</span>
          </div>
          <div class="search-input-wrap" style="width:100%; max-width:320px;">
            ${renderSvg("search", 15)}
            <input type="text" id="oauthSearchInput" placeholder="Search OAuth clients" oninput="filterOAuth()" autocomplete="off" spellcheck="false">
          </div>
        </div>

        <div style="overflow-x:auto; -webkit-overflow-scrolling:touch; max-height:480px; overflow-y:auto; padding-bottom:80px; margin-bottom:-80px;">
          <table>
            <thead>
              <tr>
                <th>Application</th>
                <th>Client ID</th>
                <th>Permissions</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody id="oauthTableBody">
              ${
                oauthAuthorizations.length > 0
                  ? oauthAuthorizations
                      .map(
                        (a) => `
                <tr id="oauth-row-${escapeHtml(a.clientId)}" class="oauth-row" data-name="${escapeHtml(a.clientName.toLowerCase())}" data-id="${escapeHtml(a.clientId.toLowerCase())}" data-scope="${escapeHtml(a.scope.toLowerCase())}">
                  <td><strong id="oauth-name-text-${escapeHtml(a.clientId)}">${escapeHtml(a.clientName)}</strong></td>
                  <td style="font-family:ui-monospace, monospace; color:var(--accents-5); font-size:12px;">${escapeHtml(a.clientId)}</td>
                  <td style="font-size:12px; color:var(--accents-5);">${escapeHtml(a.scope)}</td>
                  <td style="text-align:right;">
                    <div class="kebab-wrap">
                      <button type="button" class="kebab-btn" data-action="toggle-menu" data-target="kebab-oauth-${escapeHtml(a.clientId)}" aria-label="OAuth Actions">⋮</button>
                      <div class="kebab-dropdown" id="kebab-oauth-${escapeHtml(a.clientId)}">
                        <button type="button" class="kebab-item" onclick="copyKeyText('${escapeHtml(a.clientId)}', 'Client ID')">
                          ${renderSvg("copy", 14)} <span>Copy Client ID</span>
                        </button>
                        <button type="button" class="kebab-item" onclick="openRenameOAuthModal('${escapeHtml(a.clientId)}', '${escapeHtml(a.clientName)}')">
                          ${renderSvg("edit", 14)} <span>Rename…</span>
                        </button>
                        <div class="kebab-divider"></div>
                        <button type="button" class="kebab-item danger" onclick="openDeleteOAuthModal('${escapeHtml(a.clientId)}', '${escapeHtml(a.clientName)}')">
                          ${renderSvg("trash", 14)} <span>Delete OAuth</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              `,
                      )
                      .join("")
                  : `
                <tr>
                  <td colspan="4" style="text-align:center; padding:24px; color:var(--accents-5);">
                    No active OAuth connections. Connect Google Gemini or any OAuth 2.1 client to view it here.
                  </td>
                </tr>
              `
              }
            </tbody>
          </table>
          <div id="noOAuthMatch" style="display:none; text-align:center; padding:24px; color:var(--accents-5);">
            No OAuth authorizations match your search query.
          </div>
        </div>

        <!-- OAuth Pagination Bar -->
        <div class="pagination-bar" id="oauthPaginationBar">
          <span id="oauthPageIndicator">Showing authorizations</span>
          <div class="pagination-controls">
            <button type="button" class="pagination-btn" id="oauthPrevBtn" onclick="changeOAuthPage(-1)">Previous</button>
            <button type="button" class="pagination-btn" id="oauthNextBtn" onclick="changeOAuthPage(1)">Next</button>
          </div>
        </div>
      </div>
    `
    }
  </div>

  <!-- Custom Geist Toast Container -->
  <div id="toastContainer" class="toast-container" aria-live="polite"></div>

  <!-- Unified Rename Modal -->
  <div id="renameModal" class="modal-backdrop" hidden role="dialog" aria-modal="true">
    <div class="modal-card">
      <h3 id="renameModalTitle" style="font-size:16px; font-weight:700; margin-bottom:8px; color:var(--fg);">Rename</h3>
      <p id="renameModalDesc" style="font-size:13px; color:var(--accents-5); margin-bottom:16px; line-height:1.5;">Enter a recognizable name:</p>
      <input type="text" id="renameModalInput" style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid var(--border); background:var(--code-bg); color:var(--fg); font-size:13px; margin-bottom:20px;">
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn" onclick="closeRenameModal()">Cancel</button>
        <button type="button" id="renameModalSaveBtn" class="btn primary">Save Changes</button>
      </div>
    </div>
  </div>

  <!-- Custom Geist Confirmation Modal -->
  <div id="confirmModal" class="modal-backdrop" hidden role="dialog" aria-modal="true">
    <div class="modal-card">
      <h3 id="modalTitle" style="font-size:16px; font-weight:700; margin-bottom:8px; color:var(--fg);">Confirm Deletion</h3>
      <p id="modalDesc" style="font-size:13px; color:var(--accents-5); margin-bottom:20px; line-height:1.5;"></p>
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn" onclick="closeConfirmModal()">Cancel</button>
        <button type="button" id="modalConfirmBtn" class="btn" style="background:#e00; color:#fff; border-color:#e00;">Delete</button>
      </div>
    </div>
  </div>

  ${renderFooter()}

  <script>
    function showToast(message, type = 'success') {
      const container = document.getElementById('toastContainer');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      const icon = type === 'error'
        ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
        : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0070f3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      toast.innerHTML = icon + '<span>' + message.replace(/</g, '&lt;') + '</span>';
      container.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add('show'));
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
      }, 3500);
    }

    // Pagination state
    let keysCurrentPage = 1;
    const KEYS_PER_PAGE = 10;
    let oauthCurrentPage = 1;
    const OAUTH_PER_PAGE = 10;

    function renderKeysPagination() {
      const rows = Array.from(document.querySelectorAll('#keysTableBody tr.key-row')).filter(r => r.getAttribute('data-filtered') !== 'true');
      const total = rows.length;
      const totalPages = Math.max(1, Math.ceil(total / KEYS_PER_PAGE));
      if (keysCurrentPage > totalPages) keysCurrentPage = totalPages;
      if (keysCurrentPage < 1) keysCurrentPage = 1;

      const start = (keysCurrentPage - 1) * KEYS_PER_PAGE;
      const end = start + KEYS_PER_PAGE;

      rows.forEach((r, idx) => {
        r.style.display = (idx >= start && idx < end) ? '' : 'none';
      });

      const indicator = document.getElementById('keysPageIndicator');
      if (indicator) {
        indicator.textContent = total > 0 ? ('Showing ' + (start + 1) + '–' + Math.min(end, total) + ' of ' + total + ' keys') : 'No keys';
      }
      const prevBtn = document.getElementById('keysPrevBtn');
      const nextBtn = document.getElementById('keysNextBtn');
      if (prevBtn) prevBtn.disabled = keysCurrentPage <= 1;
      if (nextBtn) nextBtn.disabled = keysCurrentPage >= totalPages;
      const bar = document.getElementById('keysPaginationBar');
      if (bar) bar.style.display = total > KEYS_PER_PAGE ? 'flex' : 'none';
    }

    function changeKeysPage(delta) {
      keysCurrentPage += delta;
      renderKeysPagination();
    }

    function renderOAuthPagination() {
      const rows = Array.from(document.querySelectorAll('#oauthTableBody tr.oauth-row')).filter(r => r.getAttribute('data-filtered') !== 'true');
      const total = rows.length;
      const totalPages = Math.max(1, Math.ceil(total / OAUTH_PER_PAGE));
      if (oauthCurrentPage > totalPages) oauthCurrentPage = totalPages;
      if (oauthCurrentPage < 1) oauthCurrentPage = 1;

      const start = (oauthCurrentPage - 1) * OAUTH_PER_PAGE;
      const end = start + OAUTH_PER_PAGE;

      rows.forEach((r, idx) => {
        r.style.display = (idx >= start && idx < end) ? '' : 'none';
      });

      const indicator = document.getElementById('oauthPageIndicator');
      if (indicator) {
        indicator.textContent = total > 0 ? ('Showing ' + (start + 1) + '–' + Math.min(end, total) + ' of ' + total + ' connected') : 'No connected clients';
      }
      const prevBtn = document.getElementById('oauthPrevBtn');
      const nextBtn = document.getElementById('oauthNextBtn');
      if (prevBtn) prevBtn.disabled = oauthCurrentPage <= 1;
      if (nextBtn) nextBtn.disabled = oauthCurrentPage >= totalPages;
      const bar = document.getElementById('oauthPaginationBar');
      if (bar) bar.style.display = total > OAUTH_PER_PAGE ? 'flex' : 'none';
    }

    function changeOAuthPage(delta) {
      oauthCurrentPage += delta;
      renderOAuthPagination();
    }

    function filterOAuth() {
      const q = (document.getElementById('oauthSearchInput')?.value || '').trim().toLowerCase();
      const rows = document.querySelectorAll('#oauthTableBody tr.oauth-row');
      let visible = 0;
      rows.forEach(r => {
        const name = r.getAttribute('data-name') || '';
        const id = r.getAttribute('data-id') || '';
        const scope = r.getAttribute('data-scope') || '';
        const match = !q || name.includes(q) || id.includes(q) || scope.includes(q);
        r.setAttribute('data-filtered', match ? 'false' : 'true');
        if (match) visible++;
      });
      oauthCurrentPage = 1;
      renderOAuthPagination();
      const noMatch = document.getElementById('noOAuthMatch');
      if (noMatch) noMatch.style.display = (visible === 0 && rows.length > 0) ? 'block' : 'none';
    }

    function filterKeys() {
      const q = (document.getElementById('keySearchInput').value || '').trim().toLowerCase();
      const rows = document.querySelectorAll('#keysTableBody tr.key-row');
      let visible = 0;
      rows.forEach(r => {
        const label = r.getAttribute('data-label') || '';
        const clientId = r.getAttribute('data-client-id') || '';
        const prefix = r.getAttribute('data-prefix') || '';
        const id = r.getAttribute('data-id') || '';
        const match = !q || label.includes(q) || clientId.includes(q) || prefix.includes(q) || id.includes(q);
        r.setAttribute('data-filtered', match ? 'false' : 'true');
        if (match) visible++;
      });
      keysCurrentPage = 1;
      renderKeysPagination();
      const noMatch = document.getElementById('noKeysMatch');
      if (noMatch) noMatch.style.display = (visible === 0 && rows.length > 0) ? 'block' : 'none';
    }

    function toggleKeyReveal(id) {
      const el = document.getElementById('key-val-' + id);
      const btn = document.getElementById('reveal-btn-' + id);
      if (!el) return;
      const isRevealed = el.getAttribute('data-revealed') === 'true';
      const full = el.getAttribute('data-full') || '';
      if (isRevealed) {
        el.textContent = '••••••••••••••••';
        el.setAttribute('data-revealed', 'false');
        if (btn) {
          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
          btn.title = 'Reveal API Key';
          btn.setAttribute('aria-label', 'Reveal API Key');
        }
      } else {
        el.textContent = full;
        el.setAttribute('data-revealed', 'true');
        if (btn) {
          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
          btn.title = 'Hide API Key';
          btn.setAttribute('aria-label', 'Hide API Key');
        }
      }
    }

    function copyKeyText(text, label) {
      if (!text) return;
      navigator.clipboard.writeText(text);
      showToast((label || 'API key') + ' copied to clipboard', 'success');
    }

    // Rename Modal Logic
    let activeRenameTarget = null;
    function openRenameKeyModal(id, currentLabel) {
      activeRenameTarget = { type: 'key', id };
      document.getElementById('renameModalTitle').textContent = 'Rename API Key';
      document.getElementById('renameModalDesc').textContent = 'Enter a new label for key "' + currentLabel + '":';
      const input = document.getElementById('renameModalInput');
      input.value = currentLabel;
      const saveBtn = document.getElementById('renameModalSaveBtn');
      saveBtn.onclick = executeRename;
      const modal = document.getElementById('renameModal');
      modal.removeAttribute('hidden');
      modal.classList.add('open');
      setTimeout(() => { input.focus(); input.select(); }, 50);
    }

    function openRenameOAuthModal(clientId, currentName) {
      activeRenameTarget = { type: 'oauth', id: clientId };
      document.getElementById('renameModalTitle').textContent = 'Rename OAuth Authorization';
      document.getElementById('renameModalDesc').textContent = 'Enter a recognizable application name for "' + currentName + '":';
      const input = document.getElementById('renameModalInput');
      input.value = currentName;
      const saveBtn = document.getElementById('renameModalSaveBtn');
      saveBtn.onclick = executeRename;
      const modal = document.getElementById('renameModal');
      modal.removeAttribute('hidden');
      modal.classList.add('open');
      setTimeout(() => { input.focus(); input.select(); }, 50);
    }

    function closeRenameModal() {
      const modal = document.getElementById('renameModal');
      if (modal) {
        modal.setAttribute('hidden', '');
        modal.classList.remove('open');
      }
      activeRenameTarget = null;
    }

    async function executeRename() {
      if (!activeRenameTarget) return;
      const input = document.getElementById('renameModalInput');
      const newName = (input.value || '').trim();
      if (newName.length < 2) {
        showToast('Name must be at least 2 characters long.', 'error');
        return;
      }
      const saveBtn = document.getElementById('renameModalSaveBtn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';

      try {
        if (activeRenameTarget.type === 'key') {
          const res = await fetch('/api/keys/' + encodeURIComponent(activeRenameTarget.id), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label: newName })
          });
          const data = await res.json();
          if (res.ok) {
            const row = document.getElementById('row-' + activeRenameTarget.id);
            if (row) {
              row.setAttribute('data-label', newName.toLowerCase());
              const nameEl = document.getElementById('key-name-text-' + activeRenameTarget.id);
              if (nameEl) nameEl.textContent = newName;
            }
            showToast('API key renamed successfully', 'success');
            closeRenameModal();
          } else {
            showToast(data.error || 'Failed to rename key', 'error');
          }
        } else if (activeRenameTarget.type === 'oauth') {
          const res = await fetch('/oauth/authorizations/' + encodeURIComponent(activeRenameTarget.id), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientName: newName })
          });
          const data = await res.json();
          if (res.ok) {
            const nameEl = document.getElementById('oauth-name-text-' + activeRenameTarget.id);
            if (nameEl) nameEl.textContent = newName;
            showToast('OAuth client renamed successfully', 'success');
            closeRenameModal();
          } else {
            showToast(data.error || 'Failed to rename OAuth client', 'error');
          }
        }
      } catch (err) {
        showToast('Network error: ' + err.message, 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
      }
    }

    // Confirmation Modal Logic (Delete)
    let activeConfirmAction = null;
    function openDeleteKeyModal(id, label) {
      document.getElementById('modalTitle').textContent = 'Delete API Key';
      document.getElementById('modalDesc').textContent = 'Are you sure you want to delete key "' + label + '"? Any agent using this key will immediately be disconnected.';
      activeConfirmAction = async () => {
        closeConfirmModal();
        try {
          const res = await fetch('/api/keys/' + encodeURIComponent(id), { method: 'DELETE' });
          if (res.ok) {
            const row = document.getElementById('row-' + id);
            if (row) row.remove();
            showToast('Key deleted successfully', 'success');
            
            const remaining = document.querySelectorAll('#keysTableBody tr.key-row').length;
            const badge = document.getElementById('keysCountBadge');
            if (badge) badge.textContent = remaining + '/30 keys';
            if (remaining === 0) {
              const tbody = document.getElementById('keysTableBody');
              if (tbody) {
                tbody.innerHTML = '<tr id="emptyKeysRow"><td colspan="5" style="text-align:center; padding:24px; color:var(--accents-5);">No dynamic keys created yet. Generate one above.</td></tr>';
              }
            }
            filterKeys();
          } else {
            showToast('Failed to delete key', 'error');
          }
        } catch (e) {
          showToast('Network error: ' + e.message, 'error');
        }
      };
      document.getElementById('modalConfirmBtn').onclick = activeConfirmAction;
      const m = document.getElementById('confirmModal');
      if (m) {
        m.removeAttribute('hidden');
        m.classList.add('open');
      }
    }

    function openRevokeKeyModal(id, label) {
      return openDeleteKeyModal(id, label);
    }
    window.openRevokeKeyModal = openDeleteKeyModal;

    function openDeleteOAuthModal(clientId, clientName) {
      document.getElementById('modalTitle').textContent = 'Delete OAuth Authorization';
      document.getElementById('modalDesc').textContent = 'Are you sure you want to delete OAuth authorization for "' + clientName + '"? The connected client will need to re-authenticate.';
      activeConfirmAction = async () => {
        closeConfirmModal();
        try {
          const res = await fetch('/oauth/authorizations/' + encodeURIComponent(clientId), { method: 'DELETE' });
          if (res.ok) {
            const row = document.getElementById('oauth-row-' + clientId);
            if (row) row.remove();
            showToast('OAuth connection deleted', 'success');

            const remainingOAuth = document.querySelectorAll('#oauthTableBody tr.oauth-row').length;
            const oBadge = document.getElementById('oauthCountBadge');
            if (oBadge) {
              oBadge.textContent = remainingOAuth + '/20 connected';
              if (remainingOAuth === 0) oBadge.classList.remove('success');
            }
            if (remainingOAuth === 0) {
              const tbody = document.getElementById('oauthTableBody');
              if (tbody) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:24px; color:var(--accents-5);">No active OAuth connections. Connect Google Gemini or any OAuth 2.1 client to view it here.</td></tr>';
              }
            }
            renderOAuthPagination();
          } else {
            showToast('Failed to delete OAuth authorization', 'error');
          }
        } catch (e) {
          showToast('Network error: ' + e.message, 'error');
        }
      };
      document.getElementById('modalConfirmBtn').onclick = activeConfirmAction;
      const m = document.getElementById('confirmModal');
      if (m) {
        m.removeAttribute('hidden');
        m.classList.add('open');
      }
    }

    function openRevokeOAuthModal(clientId, clientName) {
      return openDeleteOAuthModal(clientId, clientName);
    }
    window.openRevokeOAuthModal = openDeleteOAuthModal;

    function closeConfirmModal() {
      const modal = document.getElementById('confirmModal');
      if (modal) {
        modal.setAttribute('hidden', '');
        modal.classList.remove('open');
      }
      activeConfirmAction = null;
    }

    // Kebab Dropdown Delegation with Overflow Detection
    document.addEventListener('click', function(e) {
      const btn = e.target.closest('.kebab-btn');
      const allDropdowns = document.querySelectorAll('.kebab-dropdown.open');
      if (btn) {
        e.stopPropagation();
        const wrap = btn.closest('.kebab-wrap');
        const dropdown = wrap ? wrap.querySelector('.kebab-dropdown') : null;
        allDropdowns.forEach(d => { if (d !== dropdown) d.classList.remove('open'); });
        if (dropdown) {
          const isOpen = dropdown.classList.contains('open');
          if (!isOpen) {
            const rect = btn.getBoundingClientRect();
            if (window.innerHeight - rect.bottom < 180) {
              dropdown.classList.add('pop-up');
            } else {
              dropdown.classList.remove('pop-up');
            }
            dropdown.classList.add('open');
          } else {
            dropdown.classList.remove('open');
          }
        }
        return;
      }
      allDropdowns.forEach(d => d.classList.remove('open'));
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeConfirmModal();
        closeRenameModal();
        document.querySelectorAll('.kebab-dropdown.open').forEach(d => d.classList.remove('open'));
      }
    });

    async function handleCreateKey(ev) {
      if (ev) {
        ev.preventDefault();
        if (typeof ev.stopPropagation === 'function') ev.stopPropagation();
      }
      const btn = document.getElementById('createKeyBtn');
      const input = document.getElementById('keyLabelInput');
      const labelVal = (input ? input.value : '').trim();
      if (labelVal.length < 4) {
        showToast('Key name must be at least 4 characters long.', 'error');
        return false;
      }

      const currentCount = document.querySelectorAll('#keysTableBody tr.key-row').length;
      if (currentCount >= 30) {
        showToast('Hardcap reached: Maximum of 30 API keys allowed. Delete an existing key to create a new one.', 'error');
        return false;
      }

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Generating…';
      }

      try {
        const res = await fetch('/api/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: labelVal })
        });
        const data = await res.json();
        if (res.ok && data.key) {
          document.getElementById('newKeyBanner').style.display = 'block';
          document.getElementById('newKeyField').value = data.key;
          document.getElementById('newClientIdField').value = data.clientId || '';
          input.value = '';
          showToast('New API key generated successfully', 'success');

          // Dynamically prepend new row into table with kebab menu
          const emptyRow = document.getElementById('emptyKeysRow');
          if (emptyRow) emptyRow.remove();

          const tbody = document.getElementById('keysTableBody');
          if (tbody) {
            const tr = document.createElement('tr');
            tr.id = 'row-' + data.id;
            tr.className = 'key-row';
            tr.setAttribute('data-label', (data.label || '').toLowerCase());
            tr.setAttribute('data-client-id', (data.clientId || '').toLowerCase());
            tr.setAttribute('data-prefix', (data.prefix || '').toLowerCase());
            tr.setAttribute('data-id', (data.id || '').toLowerCase());

            const safeLabel = (data.label || '').replace(/</g, '&lt;');
            const safeId = (data.id || '').replace(/</g, '&lt;');
            const safeCId = (data.clientId || '').replace(/</g, '&lt;');
            const fullKey = data.key || '';

            tr.innerHTML = '<td>' +
              '<div style="font-weight:600; color:var(--fg);" id="key-name-text-' + safeId + '">' + safeLabel + '</div>' +
              '<div style="font-family:monospace; font-size:11px; color:var(--accents-5);">' + safeId + '</div>' +
              '</td>' +
              '<td>' +
              '<div style="display:flex; align-items:center; gap:6px;">' +
              '<code style="font-family:ui-monospace, SFMono-Regular, monospace; font-size:12px; background:var(--code-bg); padding:3px 6px; border-radius:4px; border:1px solid var(--border); color:var(--fg);">' + (safeCId || 'N/A') + '</code>' +
              (safeCId ? '<button type="button" class="btn icon-btn copy-cid-btn" title="Copy Client ID" aria-label="Copy Client ID" style="padding:4px 7px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>' : '') +
              '</div>' +
              '</td>' +
              '<td>' +
              '<div style="display:flex; align-items:center; gap:8px;">' +
              '<div class="key-display-scroll" style="max-width:180px; overflow-x:auto; white-space:nowrap; scrollbar-width:thin; padding:2px 0;">' +
              '<code id="key-val-' + safeId + '" data-revealed="false" style="font-family:ui-monospace, SFMono-Regular, monospace; background:var(--code-bg); padding:4px 8px; border-radius:4px; font-size:12px; border:1px solid var(--border); color:var(--fg); display:inline-block;">••••••••••••••••</code>' +
              '</div>' +
              '<button type="button" class="btn icon-btn reveal-key-btn" id="reveal-btn-' + safeId + '" title="Reveal API Key" aria-label="Reveal API Key" style="padding:4px 7px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>' +
              '<button type="button" class="btn icon-btn copy-key-btn" title="Copy API Key" aria-label="Copy API Key" style="padding:4px 7px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>' +
              '</div>' +
              '</td>' +
              '<td><span class="local-date">' + new Date().toLocaleDateString() + '</span></td>' +
              '<td style="text-align:right;">' +
              '<div class="kebab-wrap">' +
              '<button type="button" class="kebab-btn" aria-label="Key Actions">⋮</button>' +
              '<div class="kebab-dropdown">' +
              '<button type="button" class="kebab-item kebab-copy-key">Copy Key</button>' +
              (safeCId ? '<button type="button" class="kebab-item kebab-copy-cid">Copy Client ID</button>' : '') +
              '<button type="button" class="kebab-item kebab-rename-key">Rename…</button>' +
              '<div class="kebab-divider"></div>' +
              '<button type="button" class="kebab-item danger kebab-delete-key">Delete Key</button>' +
              '</div>' +
              '</div>' +
              '</td>';

            const copyCidBtn = tr.querySelector('.copy-cid-btn');
            if (copyCidBtn) copyCidBtn.onclick = function() { copyKeyText(data.clientId, 'Client ID'); };
            const codeEl = tr.querySelector('#key-val-' + safeId);
            if (codeEl) codeEl.setAttribute('data-full', fullKey);
            const revealBtn = tr.querySelector('.reveal-key-btn');
            if (revealBtn) revealBtn.onclick = function() { toggleKeyReveal(data.id); };
            const copyKeyBtn = tr.querySelector('.copy-key-btn');
            if (copyKeyBtn) copyKeyBtn.onclick = function() { copyKeyText(fullKey, 'API Key'); };
            
            const kebabCopyKey = tr.querySelector('.kebab-copy-key');
            if (kebabCopyKey) kebabCopyKey.onclick = function() { copyKeyText(fullKey, 'API Key'); };
            const kebabCopyCid = tr.querySelector('.kebab-copy-cid');
            if (kebabCopyCid) kebabCopyCid.onclick = function() { copyKeyText(data.clientId, 'Client ID'); };
            const kebabRename = tr.querySelector('.kebab-rename-key');
            if (kebabRename) kebabRename.onclick = function() { openRenameKeyModal(data.id, data.label); };
            const kebabDelete = tr.querySelector('.kebab-delete-key');
            if (kebabDelete) kebabDelete.onclick = function() { openDeleteKeyModal(data.id, data.label); };

            tbody.insertBefore(tr, tbody.firstChild);
          }

          const remaining = document.querySelectorAll('#keysTableBody tr.key-row').length;
          const badge = document.getElementById('keysCountBadge');
          if (badge) badge.textContent = remaining + '/30 keys';
          filterKeys();
        } else {
          showToast('Could not generate key: ' + (data.error || 'Unknown error'), 'error');
        }
      } catch (e) {
        showToast('Network error: ' + e.message, 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Generate Key';
        }
      }
    }

    function copyCreatedKey() {
      const f = document.getElementById('newKeyField');
      f.select();
      navigator.clipboard.writeText(f.value);
      showToast('New key copied to clipboard', 'success');
      const b = document.getElementById('copyKeyBtn');
      b.textContent = 'Copied';
      setTimeout(() => { b.textContent = 'Copy Key'; }, 1500);
    }

    function copyCreatedClientId() {
      const f = document.getElementById('newClientIdField');
      f.select();
      navigator.clipboard.writeText(f.value);
      showToast('Client ID copied to clipboard', 'success');
      const b = document.getElementById('copyClientIdBtn');
      b.textContent = 'Copied';
      setTimeout(() => { b.textContent = 'Copy Client ID'; }, 1500);
    }

    // Format timestamps to user local timezone
    document.querySelectorAll('.local-date').forEach(el => {
      const ts = Number(el.getAttribute('data-ts'));
      if (ts) {
        el.textContent = new Date(ts).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
    });

    const createForm = document.getElementById('createKeyForm');
    if (createForm) {
      createForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleCreateKey(e);
      });
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

    // Initial API Keys and OAuth pagination render
    renderKeysPagination();
    renderOAuthPagination();
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
  const { base, isOwner, owner, tools, summary } = params;

  if (!isOwner) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Tools Directory - Krix</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2">
  <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png?v=2">
  <style>
    ${getBaseStyles()}
  </style>
  ${renderRecaptchaScript()}
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
    ${renderAuthRequiredCard("Tools Directory", "/tools")}
  </div>
  ${renderFooter()}
</body>
</html>`;
  }

  const counts = {
    All: tools.length,
    Sandbox: tools.filter((t) => t.category === "Sandbox").length,
    Render: tools.filter((t) => t.category === "Render").length,
    GitHub: tools.filter((t) => t.category === "GitHub").length,
    Files: tools.filter((t) => t.category === "Files").length,
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Tools Directory - Krix</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2">
  <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png?v=2">
  <style>
    ${getBaseStyles()}

    .filter-bar {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }
    @media (min-width: 640px) {
      .filter-bar {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
    }
    .pill-group {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
  </style>
  ${renderRecaptchaScript()}
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
    <div style="margin: 20px 0 24px 0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px;">
          <h1 style="font-size:24px; font-weight:700; letter-spacing:-0.5px; color:var(--fg);">
            Tools Directory
          </h1>
          <span class="badge">${tools.length} tools</span>
        </div>
        <p style="font-size:13px; color:var(--accents-5); margin-top:2px;">
          Individual specifications and invocation telemetry for all ${tools.length} MCP tools.
        </p>
      </div>

      <div style="display:flex; gap:8px;">
        <a href="/api" class="btn">API Keys</a>
        <a href="/stats" class="btn">View Stats</a>
        <a href="/home" class="btn primary">Back to Home</a>
      </div>
    </div>

    <!-- Search & Category Filters -->
    <div class="filter-bar">
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; flex:1;">
        <div class="search-input-wrap" style="max-width:360px; flex:1;">
          ${renderSvg("search", 15)}
          <input
            type="text"
            id="toolSearchInput"
            placeholder=""
            value=""
            autocomplete="off"
            spellcheck="false"
            oninput="filterTools()"
          />
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <label for="keySelector" style="font-size:12px; color:var(--accents-5); font-weight:500; white-space:nowrap;">Key:</label>
          <select id="keySelector" onchange="onKeyFilterChange(this)" style="padding:7px 10px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--fg); font-size:12px; max-width:180px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">
            <option value="" ${!summary.selectedKeyId ? "selected" : ""}>All Keys &amp; OAuth</option>
            ${
              summary.keys && summary.keys.length > 0
                ? `
              <optgroup label="API Keys">
                ${summary.keys
                  .filter(
                    (k: KeyMetrics) =>
                      k.type === "api_key" || k.type === "master",
                  )
                  .map(
                    (k: KeyMetrics) => `
                  <option value="${escapeHtml(k.keyId)}" ${summary.selectedKeyId === k.keyId ? "selected" : ""}>
                    ${escapeHtml(k.label)}
                  </option>
                `,
                  )
                  .join("")}
              </optgroup>
              <optgroup label="OAuth Authorizations">
                ${summary.keys
                  .filter((k: KeyMetrics) => k.type === "oauth")
                  .map(
                    (k: KeyMetrics) => `
                  <option value="${escapeHtml(k.keyId)}" ${summary.selectedKeyId === k.keyId ? "selected" : ""}>
                    ${escapeHtml(k.label)}
                  </option>
                `,
                  )
                  .join("")}
              </optgroup>
            `
                : ""
            }
          </select>
        </div>
      </div>

      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
        <div class="pill-group">
          <button type="button" class="pill-btn active" data-cat="All" onclick="setCategoryFilter('All', this)">
            All (${counts.All})
          </button>
          <button type="button" class="pill-btn" data-cat="Sandbox" onclick="setCategoryFilter('Sandbox', this)">
            Sandbox (${counts.Sandbox})
          </button>
          <button type="button" class="pill-btn" data-cat="Render" onclick="setCategoryFilter('Render', this)">
            Render (${counts.Render})
          </button>
          <button type="button" class="pill-btn" data-cat="GitHub" onclick="setCategoryFilter('GitHub', this)">
            GitHub (${counts.GitHub})
          </button>
          <button type="button" class="pill-btn" data-cat="Files" onclick="setCategoryFilter('Files', this)">
            Files (${counts.Files})
          </button>
        </div>
        <span id="toolMatchCount" style="font-size:12px; color:var(--accents-5); font-weight:500;">
          Showing ${tools.length} of ${tools.length} tools
        </span>
      </div>
    </div>

    <!-- Modular Compact Boxes Grid -->
    <div class="tools-grid" id="toolsGrid">
      ${tools
        .map((t) => {
          const calls = summary.toolDistribution[t.name] || 0;
          return `
        <div
          class="tool-box"
          data-name="${escapeHtml(t.name.toLowerCase())}"
          data-category="${escapeHtml(t.category)}"
          data-desc="${escapeHtml(t.description.toLowerCase())}"
        >
          <div>
            <div class="tool-box-header">
              <span class="tool-box-name">${escapeHtml(t.name)}</span>
              <span class="badge ${calls > 0 ? "success" : ""}">${escapeHtml(t.category)}</span>
            </div>
            <div class="tool-box-desc" title="${escapeHtml(t.description)}">
              ${escapeHtml(t.description)}
            </div>
          </div>
          <div class="tool-box-footer">
            <span>Calls: <strong>${calls.toLocaleString()}</strong></span>
            <span>Rate: <strong>${calls > 0 ? "100%" : "N/A"}</strong></span>
            <span>Avg: <strong>${calls > 0 ? summary.avgDurationMs + "ms" : "N/A"}</strong></span>
          </div>
        </div>
      `;
        })
        .join("")}
      <div id="noToolsMatch" style="display:none; text-align:center; padding:48px 20px; color:var(--accents-5); grid-column:1/-1;">
        No tools match the query or category filter.
      </div>
    </div>

    <!-- Tools Pagination Bar -->
    <div class="pagination-bar" id="toolsPaginationBar" style="margin-top:24px;">
      <span id="toolsPageIndicator">Showing tools</span>
      <div class="pagination-controls">
        <button type="button" class="pagination-btn" id="toolsPrevBtn" onclick="changeToolsPage(-1)">Previous</button>
        <button type="button" class="pagination-btn" id="toolsNextBtn" onclick="changeToolsPage(1)">Next</button>
      </div>
    </div>
  </div>

  ${renderFooter()}

  <script>
    function onKeyFilterChange(selectEl) {
      const val = selectEl.value;
      const url = new URL(window.location.href);
      if (val) url.searchParams.set('key', val);
      else url.searchParams.delete('key');
      window.location.href = url.toString();
    }

    let currentCategory = 'All';
    let toolsCurrentPage = 1;
    const TOOLS_PER_PAGE = 18;

    function setCategoryFilter(category, btn) {
      currentCategory = category;
      document.querySelectorAll('.pill-group .pill-btn').forEach(el => el.classList.remove('active'));
      if (btn) btn.classList.add('active');
      filterTools();
    }

    function renderToolsPagination() {
      const boxes = Array.from(document.querySelectorAll('#toolsGrid .tool-box')).filter(b => b.getAttribute('data-matched') === 'true');
      const total = boxes.length;
      const totalPages = Math.max(1, Math.ceil(total / TOOLS_PER_PAGE));
      if (toolsCurrentPage > totalPages) toolsCurrentPage = totalPages;
      if (toolsCurrentPage < 1) toolsCurrentPage = 1;

      const start = (toolsCurrentPage - 1) * TOOLS_PER_PAGE;
      const end = start + TOOLS_PER_PAGE;

      boxes.forEach((b, idx) => {
        b.style.display = (idx >= start && idx < end) ? 'flex' : 'none';
      });

      const indicator = document.getElementById('toolsPageIndicator');
      if (indicator) {
        indicator.textContent = total > 0 ? ('Showing ' + (start + 1) + '–' + Math.min(end, total) + ' of ' + total + ' tools') : 'No tools';
      }
      const prevBtn = document.getElementById('toolsPrevBtn');
      const nextBtn = document.getElementById('toolsNextBtn');
      if (prevBtn) prevBtn.disabled = toolsCurrentPage <= 1;
      if (nextBtn) nextBtn.disabled = toolsCurrentPage >= totalPages;
      const bar = document.getElementById('toolsPaginationBar');
      if (bar) bar.style.display = total > TOOLS_PER_PAGE ? 'flex' : 'none';
    }

    function changeToolsPage(delta) {
      toolsCurrentPage += delta;
      renderToolsPagination();
    }

    function filterTools() {
      const query = (document.getElementById('toolSearchInput')?.value || '').toLowerCase().trim();
      const boxes = document.querySelectorAll('#toolsGrid .tool-box');
      let matchCount = 0;

      boxes.forEach(box => {
        const name = box.getAttribute('data-name') || '';
        const cat = box.getAttribute('data-category') || '';
        const desc = box.getAttribute('data-desc') || '';

        const matchesCat = (currentCategory === 'All' || cat.toLowerCase() === currentCategory.toLowerCase());
        const matchesQuery = !query || name.includes(query) || desc.includes(query) || cat.toLowerCase().includes(query);

        if (matchesCat && matchesQuery) {
          box.setAttribute('data-matched', 'true');
          matchCount++;
        } else {
          box.setAttribute('data-matched', 'false');
          box.style.display = 'none';
        }
      });

      const noMatch = document.getElementById('noToolsMatch');
      if (noMatch) {
        noMatch.style.display = matchCount === 0 ? 'block' : 'none';
      }
      const countLabel = document.getElementById('toolMatchCount');
      if (countLabel) {
        countLabel.textContent = 'Showing ' + matchCount + ' of ' + boxes.length + ' tools';
      }

      toolsCurrentPage = 1;
      renderToolsPagination();
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

    // Initial tools filter & pagination render
    filterTools();
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
  const { base, isOwner, owner, summary } = params;

  if (!isOwner) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Krix Analytics</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2">
  <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png?v=2">
  <style>
    ${getBaseStyles()}
  </style>
  ${renderRecaptchaScript()}
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
    ${renderAuthRequiredCard("Usage & Analytics", "/stats")}
  </div>
  ${renderFooter()}
</body>
</html>`;
  }

  const hasPeakTraffic =
    summary.peakTraffic.peakHourUtc !== null && summary.totalRequests > 0;
  const clientValues = Object.values(summary.clientEcosystems);
  const totalClientTraffic = clientValues.reduce((a, b) => a + b, 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Krix Analytics</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2">
  <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png?v=2">
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
  ${renderRecaptchaScript()}
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

      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:8px;">
          <label for="keySelector" style="font-size:12px; color:var(--accents-5); font-weight:500; white-space:nowrap;">Key:</label>
          <select id="keySelector" onchange="onKeyFilterChange(this)" style="padding:6px 10px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--fg); font-size:12px; max-width:180px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">
            <option value="" ${!summary.selectedKeyId ? "selected" : ""}>All Keys &amp; OAuth</option>
            ${
              summary.keys && summary.keys.length > 0
                ? `
              <optgroup label="API Keys">
                ${summary.keys
                  .filter(
                    (k: KeyMetrics) =>
                      k.type === "api_key" || k.type === "master",
                  )
                  .map(
                    (k: KeyMetrics) => `
                  <option value="${escapeHtml(k.keyId)}" ${summary.selectedKeyId === k.keyId ? "selected" : ""}>
                    ${escapeHtml(k.label)}
                  </option>
                `,
                  )
                  .join("")}
              </optgroup>
              <optgroup label="OAuth Authorizations">
                ${summary.keys
                  .filter((k: KeyMetrics) => k.type === "oauth")
                  .map(
                    (k: KeyMetrics) => `
                  <option value="${escapeHtml(k.keyId)}" ${summary.selectedKeyId === k.keyId ? "selected" : ""}>
                    ${escapeHtml(k.label)}
                  </option>
                `,
                  )
                  .join("")}
              </optgroup>
            `
                : ""
            }
          </select>
        </div>
        <div class="live-indicator" id="liveIndicator">
          <span class="live-dot" id="liveDot"></span>
          <span>Live</span>
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
          Peak window: <strong id="valPeakTime" data-utc-hour="${hasPeakTraffic ? summary.peakTraffic.peakHourUtc : ""}" data-utc-day="${hasPeakTraffic ? summary.peakTraffic.peakDay : ""}">${
            hasPeakTraffic
              ? `${summary.peakTraffic.peakHourUtc}:00 UTC (${summary.peakTraffic.peakDay})`
              : "N/A"
          }</strong>
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

      <div style="overflow-x:auto; -webkit-overflow-scrolling:touch; width:100%;">
        <div id="timelineChart" class="chart-container" style="min-width:640px;">
          <!-- Responsive SVG rendered below -->
        </div>
      </div>
    </div>

    <!-- Extended Performance & Health Grid -->
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
        <div style="display:flex; flex-direction:column; gap:10px; font-size:13px;" id="clientEcosystemList">
          ${
            totalClientTraffic > 0
              ? Object.entries(summary.clientEcosystems)
                  .map(
                    ([client, count]) => `
              <div style="display:flex; justify-content:space-between;">
                <span style="color:var(--accents-5);">${escapeHtml(client)}:</span>
                <strong>${count}</strong>
              </div>
            `,
                  )
                  .join("")
              : `<div style="font-size:13px; color:var(--accents-5); text-align:center; padding:12px 0;">No client traffic recorded yet (N/A)</div>`
          }
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
              : `<div style="font-size:13px; color:var(--accents-5); padding:16px 0; text-align:center;">No tool calls recorded yet (N/A)</div>`
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
                  <td class="local-timestamp" data-ts="${err.timestamp}">${new Date(err.timestamp).toLocaleTimeString()}</td>
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

      <div style="overflow-x:auto; -webkit-overflow-scrolling:touch; max-height:480px; overflow-y:auto;">
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
          <tbody id="statsKeysTableBody">
            ${
              summary.keys.length > 0
                ? summary.keys
                    .map((k) => {
                      const displayLabel =
                        k.label === "Master Key" || k.keyId === "primary-key"
                          ? "Primary Key"
                          : k.label;
                      const displayKeyId =
                        k.keyId === "master-env-key" ? "primary-key" : k.keyId;
                      const displayType =
                        k.type === "master" ? "primary" : k.type;

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
                <tr class="stats-key-row">
                  <td>
                    <div style="font-weight:600;">${escapeHtml(displayLabel)}</div>
                    <div style="font-family:monospace; font-size:11px; color:var(--accents-5);">${escapeHtml(displayKeyId)}</div>
                  </td>
                  <td>
                    <span class="badge ${displayType === "oauth" ? "success" : ""}">${displayType}</span>
                  </td>
                  <td><strong>${k.totalRequests}</strong></td>
                  <td>${rate}%</td>
                  <td>${k.avgDurationMs}ms</td>
                  <td>${formatBytes(k.bytesIn)} / ${formatBytes(k.bytesOut)}</td>
                  <td>
                    <span class="local-timestamp" data-ts="${k.lastActiveAt}">${timeAgo(k.lastActiveAt)}</span>
                  </td>
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

      <!-- Per-Key Pagination Bar -->
      <div class="pagination-bar" id="statsPaginationBar">
        <span id="statsPageIndicator">Showing keys</span>
        <div class="pagination-controls">
          <button type="button" class="pagination-btn" id="statsPrevBtn" onclick="changeStatsPage(-1)">Previous</button>
          <button type="button" class="pagination-btn" id="statsNextBtn" onclick="changeStatsPage(1)">Next</button>
        </div>
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
      const step = Math.max(38, Math.floor(800 / Math.max(1, data.length)));
      const width = Math.max(800, data.length * step);
      const height = 170;
      const chartHeight = 120;
      const padTop = 15;
      const barWidth = Math.max(12, Math.min(26, step * 0.6));

      let svgHtml = '<svg width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '" style="height:170px; min-width:' + width + 'px;" preserveAspectRatio="xMinYMin meet">';
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

    function formatPeakWindow() {
      const el = document.getElementById('valPeakTime');
      if (!el) return;
      const hourAttr = el.getAttribute('data-utc-hour');
      const dayAttr = el.getAttribute('data-utc-day');
      if (!hourAttr || hourAttr === 'null' || hourAttr === '') {
        el.textContent = 'N/A';
        return;
      }
      const utcHour = parseInt(hourAttr, 10);
      if (isNaN(utcHour)) {
        el.textContent = 'N/A';
        return;
      }
      const d = new Date();
      d.setUTCHours(utcHour, 0, 0, 0);
      const localTimeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      let tzName = '';
      try {
        tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {}
      el.textContent = localTimeStr + (dayAttr ? ' (' + dayAttr + (tzName ? ', ' + tzName : '') + ')' : '');
    }

    function convertLocalTimestamps() {
      document.querySelectorAll('.local-timestamp').forEach(el => {
        const tsAttr = el.getAttribute('data-ts');
        if (!tsAttr) return;
        const ts = parseInt(tsAttr, 10);
        if (ts && !isNaN(ts)) {
          el.textContent = new Date(ts).toLocaleString();
        }
      });
    }

    formatPeakWindow();
    convertLocalTimestamps();

    function onKeyFilterChange(selectEl) {
      const val = selectEl.value;
      const url = new URL(window.location.href);
      if (val) url.searchParams.set('key', val);
      else url.searchParams.delete('key');
      window.location.href = url.toString();
    }

    // Live 3s Polling
    async function pollLiveStats() {
      try {
        const currentKey = new URLSearchParams(window.location.search).get('key');
        const res = await fetch('/stats/api' + (currentKey ? '?key=' + encodeURIComponent(currentKey) : ''));
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
        if (s.sharedSandbox) {
          const bytesEl = document.getElementById('valDiskBytes');
          if (bytesEl) {
            const b = s.sharedSandbox.totalDiskBytes;
            const fmt = b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
            bytesEl.textContent = fmt + ' used';
          }
        }

        // Update peak window
        const peakEl = document.getElementById('valPeakTime');
        if (peakEl) {
          if (s.peakTraffic && s.peakTraffic.peakHourUtc !== null && s.totalRequests > 0) {
            peakEl.setAttribute('data-utc-hour', s.peakTraffic.peakHourUtc);
            peakEl.setAttribute('data-utc-day', s.peakTraffic.peakDay || '');
          } else {
            peakEl.setAttribute('data-utc-hour', '');
            peakEl.setAttribute('data-utc-day', '');
          }
          formatPeakWindow();
        }

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

    let statsCurrentPage = 1;
    const STATS_PER_PAGE = 10;

    function renderStatsPagination() {
      const rows = Array.from(document.querySelectorAll('#statsKeysTableBody tr.stats-key-row'));
      const total = rows.length;
      const totalPages = Math.max(1, Math.ceil(total / STATS_PER_PAGE));
      if (statsCurrentPage > totalPages) statsCurrentPage = totalPages;
      if (statsCurrentPage < 1) statsCurrentPage = 1;

      const start = (statsCurrentPage - 1) * STATS_PER_PAGE;
      const end = start + STATS_PER_PAGE;

      rows.forEach((r, idx) => {
        r.style.display = (idx >= start && idx < end) ? '' : 'none';
      });

      const indicator = document.getElementById('statsPageIndicator');
      if (indicator) {
        indicator.textContent = total > 0 ? ('Showing ' + (start + 1) + '–' + Math.min(end, total) + ' of ' + total + ' keys') : 'No keys';
      }
      const prevBtn = document.getElementById('statsPrevBtn');
      const nextBtn = document.getElementById('statsNextBtn');
      if (prevBtn) prevBtn.disabled = statsCurrentPage <= 1;
      if (nextBtn) nextBtn.disabled = statsCurrentPage >= totalPages;
      const bar = document.getElementById('statsPaginationBar');
      if (bar) bar.style.display = total > STATS_PER_PAGE ? 'flex' : 'none';
    }

    function changeStatsPage(delta) {
      statsCurrentPage += delta;
      renderStatsPagination();
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

    // Initial stats pagination render
    renderStatsPagination();
  </script>
</body>
</html>`;
}

export interface StoredFileInfo {
  id: string;
  name: string;
  size: number;
  contentType: string;
  createdAt: Date | string | number;
  expiresAt: Date | string | null;
  source: "store" | "sandbox";
  downloadUrl: string;
  permanent: boolean;
}

export function renderStorePage(params: {
  base: string;
  isOwner: boolean;
  owner: OwnerProfile | null;
  files: StoredFileInfo[];
  usage?: {
    count: number;
    bytes: number;
    permanentCount: number;
    expiredCount: number;
  };
}): string {
  const { base, isOwner, owner, files, usage } = params;

  if (!isOwner) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Sandbox Store - Krix</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2">
  <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png?v=2">
  <style>
    ${getBaseStyles()}
  </style>
  ${renderRecaptchaScript()}
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
  ${renderHeader("store", owner)}
  <div class="wrapper">
    ${renderAuthRequiredCard("Store", "/store")}
  </div>
  ${renderFooter()}
</body>
</html>`;
  }

  const totalFiles = files.length;
  const totalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const permanentFiles = files.filter(
    (f) => f.permanent || !f.expiresAt,
  ).length;
  const expiringFiles = totalFiles - permanentFiles;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Sandbox &amp; Cloud Store - Krix</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2">
  <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png?v=2">
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

    .file-source-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 12px;
    }
    .file-source-badge.store {
      background: rgba(0, 112, 243, 0.08);
      color: #0070f3;
      border: 1px solid rgba(0, 112, 243, 0.2);
    }
    .file-source-badge.sandbox {
      background: var(--accents-1);
      color: var(--accents-6);
      border: 1px solid var(--border);
    }

    .kebab-wrap {
      position: relative;
      display: inline-block;
      text-align: right;
    }
    .kebab-btn {
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--card-bg);
      color: var(--accents-5);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .kebab-btn:hover, .kebab-btn:focus-visible {
      color: var(--fg);
      border-color: var(--accents-4);
      background: var(--accents-1);
    }
    .kebab-dropdown {
      position: absolute;
      right: 0;
      top: calc(100% + 4px);
      z-index: 100;
      min-width: 210px;
      padding: 6px;
      border-radius: 8px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      display: none;
      flex-direction: column;
      gap: 2px;
    }
    .kebab-dropdown.open {
      display: flex;
    }
    .kebab-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 500;
      color: var(--fg);
      text-decoration: none;
      background: transparent;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      text-align: left;
      transition: background 0.12s ease;
      box-sizing: border-box;
    }
    .kebab-item:hover, .kebab-item:focus-visible {
      background: var(--accents-1);
      color: var(--fg);
      outline: none;
    }
    .kebab-item.danger {
      color: var(--error);
    }
    .kebab-item.danger:hover, .kebab-item.danger:focus-visible {
      background: rgba(238, 0, 0, 0.08);
      color: var(--error);
    }
    .kebab-divider {
      height: 1px;
      background: var(--border);
      margin: 4px 0;
    }
    @media (max-width: 640px) {
      .hide-mobile {
        display: none !important;
      }
      .grid-4 {
        grid-template-columns: 1fr 1fr !important;
      }
    }
  </style>
  ${renderRecaptchaScript()}
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
  ${renderHeader("store", owner)}

  <div class="wrapper">
    <!-- Header -->
    <div style="margin: 20px 0 28px 0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
      <div>
        <h1 style="font-size:24px; font-weight:700; letter-spacing:-0.5px; color:var(--fg); font-family:inherit;">
          Sandbox &amp; Cloud Store
        </h1>
        <p style="font-size:13px; color:var(--accents-5); margin-top:4px; line-height:1.5; font-family:inherit;">
          View, download, and manage persistent and temporary files stored in Krix.
        </p>
      </div>

      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
        <a href="/upload" class="btn primary">Upload New File</a>
        <a href="/home" class="btn">Back to Home</a>
      </div>
    </div>

    <!-- Summary Metrics Cards -->
    <div class="grid-4">
      <div class="card">
        <div style="font-size:12px; font-weight:600; color:var(--accents-5); text-transform:uppercase;">Total Stored Files</div>
        <div style="font-size:28px; font-weight:700; font-variant-numeric:tabular-nums; margin:4px 0; color:var(--fg);" id="valTotalFiles">${totalFiles}</div>
        <div style="font-size:12px; color:var(--accents-5);">Across cloud store &amp; sandbox</div>
      </div>

      <div class="card">
        <div style="font-size:12px; font-weight:600; color:var(--accents-5); text-transform:uppercase;">Storage Used</div>
        <div style="font-size:28px; font-weight:700; font-variant-numeric:tabular-nums; margin:4px 0; color:var(--fg);" id="valTotalBytes">${formatBytes(totalBytes)}</div>
        <div style="font-size:12px; color:var(--accents-5);">${usage ? (usage.bytes / 1024 / 1024).toFixed(1) + " MB in Cloud Store" : "Direct access"}</div>
      </div>

      <div class="card">
        <div style="font-size:12px; font-weight:600; color:var(--accents-5); text-transform:uppercase;">Permanent Files</div>
        <div style="font-size:28px; font-weight:700; font-variant-numeric:tabular-nums; margin:4px 0; color:var(--fg);" id="valPermanentFiles">${permanentFiles}</div>
        <div style="font-size:12px; color:var(--accents-5);">Never automatically deleted</div>
      </div>

      <div class="card">
        <div style="font-size:12px; font-weight:600; color:var(--accents-5); text-transform:uppercase;">Auto-Expiring Files</div>
        <div style="font-size:28px; font-weight:700; font-variant-numeric:tabular-nums; margin:4px 0; color:var(--fg);" id="valExpiringFiles">${expiringFiles}</div>
        <div style="font-size:12px; color:var(--accents-5);">Scheduled for cleanup</div>
      </div>
    </div>

    <!-- Files Table Card -->
    <div class="card" style="margin-top:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <h2 style="font-size:15px; font-weight:600; color:var(--fg);">Stored Files</h2>
          <span class="badge" id="storeCountBadge">${files.length} files</span>
        </div>
        <div class="search-input-wrap" style="width:100%; max-width:320px;">
          ${renderSvg("search", 15)}
          <input type="text" id="storeSearchInput" placeholder="Search files by name or type" oninput="filterStoreFiles()">
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table id="storeTable">
          <thead>
            <tr>
              <th>File</th>
              <th>Size</th>
              <th class="hide-mobile">Created</th>
              <th style="width:48px; text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody id="storeTableBody">
            ${
              files.length > 0
                ? files
                    .map((f) => {
                      const isPerm = f.permanent || !f.expiresAt;
                      const dateStr = f.createdAt
                        ? new Date(f.createdAt).toLocaleDateString()
                        : "N/A";
                      const expiresStr = isPerm
                        ? "Permanent"
                        : f.expiresAt
                          ? new Date(f.expiresAt).toLocaleDateString()
                          : "60m TTL";
                      const dlUrl =
                        f.downloadUrl ||
                        (f.id ? `${base}/store/download/${f.id}` : "#");
                      return `
              <tr class="store-file-row" id="file-row-${escapeHtml(f.id)}" data-id="${escapeHtml(f.id)}" data-name="${escapeHtml(f.name)}" data-perm="${isPerm ? "true" : "false"}" data-size="${f.size || 0}" data-source="${escapeHtml(f.source)}" data-url="${escapeHtml(dlUrl)}">
                <td>
                  <div style="font-weight:600; font-family:ui-monospace, monospace; color:var(--fg); font-size:13px; word-break:break-all;" id="file-name-text-${escapeHtml(f.id)}">
                    ${escapeHtml(f.name)}
                  </div>
                  <div style="display:flex; align-items:center; gap:6px; margin-top:3px;">
                    <span style="font-size:11px; color:var(--accents-5);">${escapeHtml(f.contentType)}</span>
                  </div>
                </td>
                <td><span style="font-variant-numeric:tabular-nums; font-size:12px;">${formatBytes(f.size)}</span></td>
                <td class="hide-mobile"><span style="font-size:12px; color:var(--accents-5);">${dateStr}</span></td>
                <td style="text-align:right;">
                  <div class="kebab-wrap">
                    <button type="button" class="kebab-btn" aria-label="Actions for ${escapeHtml(f.name)}" data-action="toggle-menu" data-file-id="${escapeHtml(f.id)}">
                      ${renderSvg("more-vertical", 16)}
                    </button>
                    <div class="kebab-dropdown" id="kebab-menu-${escapeHtml(f.id)}" role="menu">
                      <button type="button" class="kebab-item" data-action="copy" data-url="${escapeHtml(dlUrl)}" role="menuitem">
                        ${renderSvg("copy", 14)} Copy URL
                      </button>
                      <a href="${escapeHtml(dlUrl)}" download class="kebab-item" role="menuitem">
                        ${renderSvg("download", 14)} Download File
                      </a>
                      ${
                        f.source !== "sandbox"
                          ? `
                      <button type="button" class="kebab-item" id="perm-btn-${escapeHtml(f.id)}" data-action="toggle-perm" data-file-id="${escapeHtml(f.id)}" data-perm="${isPerm ? "true" : "false"}" title="${isPerm ? "Revert Permanent (72h TTL)" : "Keep Permanent"}" aria-label="${isPerm ? "Revert Permanent" : "Keep Permanent"}" data-perm-label="${isPerm ? "Revert Permanent" : "Keep Permanent"}" role="menuitem">
                        <span id="perm-icon-${escapeHtml(f.id)}">${isPerm ? renderSvg("clock", 14) : renderSvg("shield", 14)}</span>
                        <span id="perm-text-${escapeHtml(f.id)}">${isPerm ? "Revert Keep" : "Keep"}</span>
                      </button>
                      `
                          : ""
                      }
                      <button type="button" class="kebab-item" data-action="rename" data-file-id="${escapeHtml(f.id)}" data-file-name="${escapeHtml(f.name)}" data-source="${escapeHtml(f.source)}" role="menuitem">
                        ${renderSvg("edit", 14)} Rename…
                      </button>
                      <div class="kebab-divider"></div>
                      <button type="button" class="kebab-item danger" data-action="delete" data-file-id="${escapeHtml(f.id)}" data-file-name="${escapeHtml(f.name)}" data-source="${escapeHtml(f.source)}" role="menuitem">
                        ${renderSvg("trash", 14)} Delete File
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            `;
                    })
                    .join("")
                : `
              <tr id="emptyStoreRow">
                <td colspan="4" style="text-align:center; padding:32px 16px; color:var(--accents-5);">
                  No stored files found. Upload files via the <a href="/upload" style="color:var(--accent);">Upload page</a> or use the <code>sandbox_store</code> tool.
                </td>
              </tr>
            `
            }
          </tbody>
        </table>
        <div id="noStoreMatch" style="display:none; text-align:center; padding:32px; color:var(--accents-5);">
          No files match your search query.
        </div>
      </div>

      <!-- Store Pagination Bar -->
      <div class="pagination-bar" id="storePaginationBar">
        <span id="storePageIndicator">Showing files</span>
        <div class="pagination-controls">
          <button type="button" class="pagination-btn" id="storePrevBtn" onclick="changeStorePage(-1)">Previous</button>
          <button type="button" class="pagination-btn" id="storeNextBtn" onclick="changeStorePage(1)">Next</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Unified Store File Rename Modal -->
  <div id="storeRenameModal" class="modal-backdrop" hidden role="dialog" aria-modal="true">
    <div class="modal-card">
      <h3 style="font-size:16px; font-weight:700; margin-bottom:8px; color:var(--fg);">Rename File</h3>
      <p style="font-size:13px; color:var(--accents-5); margin-bottom:16px; line-height:1.5;">Enter a new filename:</p>
      <input type="text" id="storeRenameInput" style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid var(--border); background:var(--code-bg); color:var(--fg); font-size:13px; margin-bottom:20px;">
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn" onclick="closeStoreRenameModal()">Cancel</button>
        <button type="button" id="storeRenameSaveBtn" class="btn primary">Save Changes</button>
      </div>
    </div>
  </div>

  <!-- Confirmation Modal -->
  <div id="storeModal" class="modal-backdrop" hidden role="dialog" aria-modal="true">
    <div class="modal-card">
      <h3 id="storeModalTitle" style="font-size:16px; font-weight:700; margin-bottom:8px; color:var(--fg);">Confirm Delete</h3>
      <p id="storeModalDesc" style="font-size:13px; color:var(--accents-5); margin-bottom:20px; line-height:1.5;"></p>
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn" onclick="closeStoreModal()">Cancel</button>
        <button type="button" id="storeModalConfirmBtn" class="btn" style="background:#e00; color:#fff; border-color:#e00;">Delete</button>
      </div>
    </div>
  </div>

  <!-- Custom Geist Toast Container -->
  <div id="toastContainer" class="toast-container" aria-live="polite"></div>

  ${renderFooter()}

  <script>
    function showToast(message, type = 'success') {
      const container = document.getElementById('toastContainer');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      const icon = type === 'error'
        ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e00" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
        : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0070f3" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      toast.innerHTML = icon + '<span>' + message.replace(/</g, '&lt;') + '</span>';
      container.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add('show'));
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
      }, 3500);
    }

    function copyFileUrl(url) {
      if (!url) return;
      const full = url.startsWith('http') ? url : window.location.origin + url;
      navigator.clipboard.writeText(full);
      showToast('File URL copied to clipboard', 'success');
    }

    let storeCurrentPage = 1;
    const STORE_PER_PAGE = 10;

    function renderStorePagination() {
      const rows = Array.from(document.querySelectorAll('#storeTableBody tr.store-file-row')).filter(r => r.getAttribute('data-filtered') !== 'true');
      const total = rows.length;
      const totalPages = Math.max(1, Math.ceil(total / STORE_PER_PAGE));
      if (storeCurrentPage > totalPages) storeCurrentPage = totalPages;
      if (storeCurrentPage < 1) storeCurrentPage = 1;

      const start = (storeCurrentPage - 1) * STORE_PER_PAGE;
      const end = start + STORE_PER_PAGE;

      rows.forEach((r, idx) => {
        r.style.display = (idx >= start && idx < end) ? '' : 'none';
      });

      const indicator = document.getElementById('storePageIndicator');
      if (indicator) {
        indicator.textContent = total > 0 ? ('Showing ' + (start + 1) + '–' + Math.min(end, total) + ' of ' + total + ' files') : 'No files';
      }
      const prevBtn = document.getElementById('storePrevBtn');
      const nextBtn = document.getElementById('storeNextBtn');
      if (prevBtn) prevBtn.disabled = storeCurrentPage <= 1;
      if (nextBtn) nextBtn.disabled = storeCurrentPage >= totalPages;
      const bar = document.getElementById('storePaginationBar');
      if (bar) bar.style.display = total > STORE_PER_PAGE ? 'flex' : 'none';
    }

    function changeStorePage(delta) {
      storeCurrentPage += delta;
      renderStorePagination();
    }

    function filterStoreFiles() {
      const q = (document.getElementById('storeSearchInput').value || '').trim().toLowerCase();
      const rows = document.querySelectorAll('#storeTableBody tr.store-file-row');
      let visible = 0;
      rows.forEach(r => {
        const name = (r.getAttribute('data-name') || '').toLowerCase();
        const type = (r.getAttribute('data-type') || '').toLowerCase();
        const match = !q || name.includes(q) || type.includes(q);
        r.setAttribute('data-filtered', match ? 'false' : 'true');
        if (match) visible++;
      });
      storeCurrentPage = 1;
      renderStorePagination();
      const noMatch = document.getElementById('noStoreMatch');
      if (noMatch) noMatch.style.display = (visible === 0 && rows.length > 0) ? 'block' : 'none';
    }

    function closeAllKebabMenus() {
      document.querySelectorAll('.kebab-dropdown.open').forEach(d => d.classList.remove('open'));
    }

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.kebab-wrap')) {
        closeAllKebabMenus();
      }
    });

    // Rename File Modal Logic
    let activeRenameFileTarget = null;
    function openStoreRenameModal(id, currentName, source) {
      activeRenameFileTarget = { id, currentName, source };
      const input = document.getElementById('storeRenameInput');
      input.value = currentName;
      const saveBtn = document.getElementById('storeRenameSaveBtn');
      saveBtn.onclick = executeStoreRename;
      const modal = document.getElementById('storeRenameModal');
      modal.removeAttribute('hidden');
      modal.classList.add('open');
      setTimeout(() => { input.focus(); input.select(); }, 50);
    }

    function closeStoreRenameModal() {
      const modal = document.getElementById('storeRenameModal');
      if (modal) {
        modal.setAttribute('hidden', '');
        modal.classList.remove('open');
      }
      activeRenameFileTarget = null;
    }

    async function executeStoreRename() {
      if (!activeRenameFileTarget) return;
      const input = document.getElementById('storeRenameInput');
      const newName = (input.value || '').trim();
      if (!newName || newName === activeRenameFileTarget.currentName) {
        closeStoreRenameModal();
        return;
      }

      const saveBtn = document.getElementById('storeRenameSaveBtn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';

      try {
        let res;
        if (activeRenameFileTarget.source === 'store') {
          res = await fetch('/store/files/' + encodeURIComponent(activeRenameFileTarget.id) + '/rename', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
          });
        } else {
          res = await fetch('/upload/rename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldName: activeRenameFileTarget.currentName, newName })
          });
        }

        const data = await res.json();
        if (res.ok) {
          const row = document.getElementById('file-row-' + activeRenameFileTarget.id);
          if (row) {
            row.setAttribute('data-name', newName);
            const nameEl = document.getElementById('file-name-text-' + activeRenameFileTarget.id);
            if (nameEl) nameEl.textContent = newName;
          }
          showToast('File renamed to "' + newName + '"', 'success');
          closeStoreRenameModal();
        } else {
          showToast(data.error || 'Failed to rename file', 'error');
        }
      } catch (err) {
        showToast('Network error: ' + err.message, 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
      }
    }

    const storeTbody = document.getElementById('storeTableBody');
    if (storeTbody) {
      storeTbody.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('[data-action="toggle-menu"]');
        if (toggleBtn) {
          e.stopPropagation();
          const fileId = toggleBtn.getAttribute('data-file-id');
          const menu = document.getElementById('kebab-menu-' + fileId);
          if (menu) {
            const wasOpen = menu.classList.contains('open');
            closeAllKebabMenus();
            if (!wasOpen) {
              const rect = toggleBtn.getBoundingClientRect();
              if (window.innerHeight - rect.bottom < 180) {
                menu.classList.add('pop-up');
              } else {
                menu.classList.remove('pop-up');
              }
              menu.classList.add('open');
            }
          }
          return;
        }

        const copyBtn = e.target.closest('[data-action="copy"]');
        if (copyBtn) {
          e.stopPropagation();
          closeAllKebabMenus();
          const url = copyBtn.getAttribute('data-url');
          copyFileUrl(url);
          return;
        }

        const permBtn = e.target.closest('[data-action="toggle-perm"]');
        if (permBtn) {
          e.stopPropagation();
          closeAllKebabMenus();
          const fileId = permBtn.getAttribute('data-file-id');
          const isPerm = permBtn.getAttribute('data-perm') === 'true';
          togglePermanent(fileId, !isPerm);
          return;
        }

        const renameBtn = e.target.closest('[data-action="rename"]');
        if (renameBtn) {
          e.stopPropagation();
          closeAllKebabMenus();
          const fileId = renameBtn.getAttribute('data-file-id');
          const fileName = renameBtn.getAttribute('data-file-name');
          const source = renameBtn.getAttribute('data-source');
          openStoreRenameModal(fileId, fileName, source);
          return;
        }

        const deleteBtn = e.target.closest('[data-action="delete"]');
        if (deleteBtn) {
          e.stopPropagation();
          closeAllKebabMenus();
          const fileId = deleteBtn.getAttribute('data-file-id');
          const fileName = deleteBtn.getAttribute('data-file-name');
          const source = deleteBtn.getAttribute('data-source');
          openDeleteFileModal(fileId, fileName, source);
          return;
        }
      });
    }

    async function togglePermanent(id, makePerm) {
      const btn = document.getElementById('perm-btn-' + id);
      if (btn) btn.disabled = true;
      try {
        const endpoint = makePerm
          ? '/store/permanent/' + encodeURIComponent(id)
          : '/store/revert-permanent/' + encodeURIComponent(id);
        const res = await fetch(endpoint, { method: 'POST' });
        if (res.ok) {
          const row = document.getElementById('file-row-' + id);
          if (row) {
            row.setAttribute('data-perm', makePerm ? 'true' : 'false');
          }
          if (btn) {
            btn.setAttribute('data-perm', makePerm ? 'true' : 'false');
            const txt = document.getElementById('perm-text-' + id);
            if (txt) txt.textContent = makePerm ? 'Revert Keep' : 'Keep';
            const icon = document.getElementById('perm-icon-' + id);
            if (icon) {
              icon.innerHTML = makePerm
                ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>'
                : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>';
            }
          }

          // Update metric counters dynamically
          const permCounter = document.getElementById('valPermanentFiles');
          const expCounter = document.getElementById('valExpiringFiles');
          if (permCounter && expCounter) {
            let p = parseInt(permCounter.textContent, 10) || 0;
            let e = parseInt(expCounter.textContent, 10) || 0;
            if (makePerm) {
              p++;
              e = Math.max(0, e - 1);
            } else {
              p = Math.max(0, p - 1);
              e++;
            }
            permCounter.textContent = p;
            expCounter.textContent = e;
          }

          showToast(makePerm ? 'File marked as permanent' : 'Permanent retention reverted', 'success');
        } else {
          showToast('Failed to update retention', 'error');
        }
      } catch (e) {
        showToast('Error: ' + e.message, 'error');
      } finally {
        if (btn) btn.disabled = false;
      }
    }

    let activeModalAction = null;
    function openDeleteFileModal(id, name, source) {
      document.getElementById('storeModalTitle').textContent = 'Delete File';
      document.getElementById('storeModalDesc').textContent = 'Are you sure you want to delete "' + name + '"? This will permanently remove it from storage.';
      activeModalAction = async () => {
        closeStoreModal();
        try {
          const endpoint = source === 'store'
            ? '/store/files/' + encodeURIComponent(id)
            : '/store/sandbox-file?name=' + encodeURIComponent(name);
          const res = await fetch(endpoint, { method: 'DELETE' });
          if (res.ok) {
            const row = document.getElementById('file-row-' + id);
            const wasPerm = row && row.getAttribute('data-perm') === 'true';
            if (row) row.remove();
            showToast('File deleted successfully', 'success');

            const remaining = document.querySelectorAll('#storeTableBody tr.store-file-row').length;
            const badge = document.getElementById('storeCountBadge');
            if (badge) badge.textContent = remaining + ' files';

            const totalEl = document.getElementById('valTotalFiles');
            if (totalEl) totalEl.textContent = remaining;

            const permCounter = document.getElementById('valPermanentFiles');
            const expCounter = document.getElementById('valExpiringFiles');
            if (wasPerm && permCounter) {
              const p = parseInt(permCounter.textContent, 10) || 0;
              permCounter.textContent = Math.max(0, p - 1);
            } else if (!wasPerm && expCounter) {
              const e = parseInt(expCounter.textContent, 10) || 0;
              expCounter.textContent = Math.max(0, e - 1);
            }

            if (remaining === 0) {
              const tbody = document.getElementById('storeTableBody');
              if (tbody) {
                tbody.innerHTML = '<tr id="emptyStoreRow"><td colspan="4" style="text-align:center; padding:32px 16px; color:var(--accents-5);">No stored files found.</td></tr>';
              }
            }
            filterStoreFiles();
          } else {
            showToast('Failed to delete file', 'error');
          }
        } catch (e) {
          showToast('Network error: ' + e.message, 'error');
        }
      };
      document.getElementById('storeModalConfirmBtn').onclick = activeModalAction;
      const m = document.getElementById('storeModal');
      if (m) {
        m.removeAttribute('hidden');
        m.classList.add('open');
      }
    }

    function closeStoreModal() {
      const modal = document.getElementById('storeModal');
      if (modal) {
        modal.setAttribute('hidden', '');
        modal.classList.remove('open');
      }
      activeModalAction = null;
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllKebabMenus();
        closeStoreModal();
        closeStoreRenameModal();
      }
    });

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

    // Initial store pagination render
    renderStorePagination();
  </script>
</body>
</html>`;
}

export function renderNotFoundPage(params: {
  base: string;
  isOwner: boolean;
  owner: OwnerProfile | null;
  pathname?: string;
  nonce?: string;
}): string {
  const { base, isOwner, owner, pathname = "", nonce } = params;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>404 - Page Not Found · Krix</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2">
  <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png?v=2">
  <style>
    ${getBaseStyles()}
    .notfound-card {
      max-width: 520px;
      margin: 80px auto;
      text-align: center;
      padding: 40px 24px;
    }
    .notfound-badge {
      display: inline-flex;
      align-items: center;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 20px;
      background: var(--accents-1);
      border: 1px solid var(--border);
      color: var(--accents-5);
      margin-bottom: 16px;
    }
    .notfound-code {
      font-size: 64px;
      font-weight: 800;
      letter-spacing: -2px;
      line-height: 1;
      color: var(--fg);
      margin-bottom: 8px;
    }
  </style>
  ${renderRecaptchaScript(nonce)}
  <script${nonce ? ` nonce="${nonce}"` : ""}>
    (function() {
      const saved = localStorage.getItem('qw-theme');
      if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
    })();
  </script>
</head>
<body>
  ${renderHeader("home", owner, nonce)}

  <div class="wrapper">
    <div class="card notfound-card">
      <div class="notfound-badge">404 Error</div>
      <div class="notfound-code">404</div>
      <h1 style="font-size:22px; font-weight:700; letter-spacing:-0.4px; color:var(--fg); margin-bottom:8px;">
        Page Not Found
      </h1>
      <p style="font-size:14px; color:var(--accents-5); line-height:1.6; margin-bottom:24px;">
        The requested URL <code style="font-family:ui-monospace, monospace; background:var(--code-bg); padding:2px 6px; border-radius:4px; font-size:13px; color:var(--fg); word-break:break-all;">${escapeHtml(pathname)}</code> does not exist or has been moved.
      </p>

      <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
        <a href="/home" class="btn primary">Back to Home</a>
        <a href="/tools" class="btn">Browse Tools</a>
        <a href="/upload" class="btn">Sandbox Upload</a>
        <a href="/store" class="btn">View Store</a>
      </div>
    </div>
  </div>

  ${renderFooter()}
</body>
</html>`;
}
