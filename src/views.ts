import type { OwnerProfile, GeneratedKeyEntry } from "./googleAuth.js";
import type { StatsSummary, KeyMetrics, ToolDetailMeta } from "./stats.js";
import type { ActiveOAuthInfo } from "./mcpOAuth.js";
import type { KeySettings, UserQuotaConfig } from "./userSettings.js";
import { maskSecret, getDefaultToolRiskLevel } from "./userSettings.js";
import { getKrixDesignCss, renderKrixGraphic } from "./uiEnhancements.js";

export function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0 || isNaN(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(1)} GB`;
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
    | "search"
    | "lock"
    | "globe"
    | "monitor",
  size = 14,
): string {
  switch (name) {
    case "lock":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
    case "globe":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`;
    case "monitor":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`;
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
      font: 14px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, Cantarell, "Noto Sans", sans-serif;
      transition: background-color 0.25s cubic-bezier(0.16, 1, 0.3, 1), color 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-bottom: 40px;
    }

    button, input, select, textarea {
      font-family: inherit;
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

    .search-input-wrap,
    .search-input-wrapper {
      position: relative;
      display: block;
      width: 100%;
      min-width: 0;
    }
    .search-input-wrap svg,
    .search-input-wrapper svg {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: var(--accents-5);
      z-index: 1;
    }
    .search-input-wrap input,
    .search-input-wrapper input,
    .search-input {
      display: block;
      width: 100%;
      min-width: 0;
      height: 42px;
      padding: 0 14px 0 42px;
      border-radius: 11px;
      border: 1px solid var(--border);
      background: linear-gradient(135deg, var(--card-sub), var(--code-bg));
      color: var(--fg);
      font-size: 13px;
      line-height: 1.4;
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.035), 0 1px 2px rgba(0, 0, 0, 0.025);
      transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
      appearance: none;
      -webkit-appearance: none;
    }
    .search-input-wrap input:focus,
    .search-input-wrapper input:focus,
    .search-input:focus {
      outline: none;
      border-color: var(--accents-5);
      box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.12), inset 0 1px 2px rgba(0, 0, 0, 0.025);
    }
    .search-input-wrap input::placeholder,
    .search-input-wrapper input::placeholder,
    .search-input::placeholder {
      color: var(--accents-5);
      opacity: 0.82;
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
    .kebab-wrap.is-open {
      z-index: 9999;
    }
    tr:has(.kebab-dropdown.open), tr.has-open-kebab {
      position: relative;
      z-index: 1000;
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
      z-index: 99999;
      min-width: 170px;
      padding: 6px;
      border-radius: 8px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      box-shadow: 0 10px 32px rgba(0, 0, 0, 0.32);
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

    /* Custom Select Dropdown Component */
    .custom-select-wrap {
      position: relative;
      display: inline-block;
    }
    .custom-select-btn {
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--card-bg);
      color: var(--fg);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      max-width: 220px;
      transition: all 0.15s ease;
      text-align: left;
    }
    .custom-select-btn:hover {
      border-color: var(--accents-4);
      background: var(--accents-1);
    }
    .custom-select-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .custom-select-menu {
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      z-index: 9999;
      min-width: 200px;
      max-height: 280px;
      overflow-y: auto;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 4px;
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28);
      display: none;
      flex-direction: column;
      gap: 2px;
    }
    .custom-select-menu.open {
      display: flex;
    }
    .custom-select-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 5px;
      font-size: 12px;
      color: var(--fg);
      cursor: pointer;
      border: none;
      background: transparent;
      width: 100%;
      text-align: left;
      font-family: inherit;
      transition: background 0.12s ease;
    }
    .custom-select-item:hover, .custom-select-item.selected {
      background: var(--accents-1);
    }
    .custom-select-item.selected {
      font-weight: 600;
      color: #0070f3;
    }

    /* Footer Buttons with Crisp Borders */
    .footer-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--card-bg);
      color: var(--accents-5);
      font-size: 12px;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.15s ease;
      line-height: 1.3;
      cursor: pointer;
    }
    .footer-btn:hover {
      color: var(--fg);
      border-color: var(--accents-4);
      background: var(--accents-1);
    }
    .footer-btn .kbd-badge {
      font-family: ui-monospace, monospace;
      font-size: 10px;
      background: var(--accents-2);
      color: var(--fg);
      padding: 1px 4px;
      border-radius: 4px;
      border: 1px solid var(--border);
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
        font-size: 12px;
        font-weight: 500;
        color: var(--accents-5);
        padding: 5px 10px;
        border-radius: 6px;
        text-decoration: none;
        border: 1px solid var(--border);
        transition: all 0.15s ease;
        background: var(--card-bg);
        touch-action: manipulation;
        min-height: 28px;
      }
      .mobile-subnav-pill:hover {
        color: var(--fg);
        background: var(--accents-1);
        border-color: var(--accents-4);
      }
      .mobile-subnav-pill.active {
        color: var(--fg);
        background: var(--accents-1);
        border-color: var(--fg);
        font-weight: 600;
      }
      .grid-2 { grid-template-columns: 1fr !important; }
      .grid-3 { grid-template-columns: 1fr !important; }
      .grid-4 { grid-template-columns: 1fr !important; }
      .card { max-width: 100%; }
      .code-view { overflow-x: auto; -webkit-overflow-scrolling: touch; max-width: 100%; }
      .tab-bar { overflow-x: auto; -webkit-overflow-scrolling: touch; flex-wrap: nowrap; scrollbar-width: none; }
      .tab-bar::-webkit-scrollbar { display: none; }
      .nav-inner { padding: 0 12px; gap: 8px; }
      .key-display-scroll { max-width: 130px; }
      .endpoint-row { flex-direction: column; width: 100%; }
      .endpoint-row input { width: 100% !important; min-width: 0 !important; }
      footer { flex-direction: column; gap: 12px; text-align: center; }
    }
  ` + getKrixDesignCss();
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
        </nav>

        <div class="nav-right">
          <button type="button" class="krix-command-trigger" id="krixCommandTrigger" onclick="openKrixCommandPalette()" aria-label="Open command search" title="Search Krix · Ctrl+K">
            ${renderKrixGraphic("search", 15)}<span>Search</span><kbd>Ctrl K</kbd>
          </button>
          <button class="theme-toggle-btn" id="themeToggleBtn" onclick="toggleTheme()" title="Theme: System (Auto) · Click to switch" aria-label="Toggle Theme">
            <svg id="themeIconSystem" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
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
            <svg id="themeIconMoon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;">
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
                ${renderKrixGraphic("chevronDown", 14)}
              </button>
              <div class="profile-dropdown-menu" id="headerProfileMenu" role="menu">
                <div class="profile-menu-header">
                  <span class="profile-menu-name" title="${escapeHtml(owner?.name || "Server Owner")}">${escapeHtml(owner?.name || "Server Owner")}</span>
                  <span class="profile-menu-email" title="${escapeHtml(owner?.email || "")}">${escapeHtml(owner?.email || "")}</span>
                </div>
                <a href="/api" class="profile-menu-item" role="menuitem">${renderKrixGraphic("key", 15)}<span>API Keys</span></a>
                <a href="/settings" class="profile-menu-item" role="menuitem">${renderKrixGraphic("settings", 15)}<span>Settings</span></a>
                <a href="https://quickwitty.onrender.com/contacts" target="_blank" rel="noopener noreferrer" class="profile-menu-item" role="menuitem">${renderKrixGraphic("mail", 15)}<span>Contact</span></a>
                <div class="profile-menu-divider"></div>
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

      <nav class="mobile-icon-nav" aria-label="Primary navigation">
        <div class="mobile-icon-nav-inner">
          <a href="/home" class="mobile-icon-link ${activeNav === "home" ? "active" : ""}" aria-label="Home" title="Home">${renderKrixGraphic("home", 19)}</a>
          <a href="/upload" class="mobile-icon-link ${activeNav === "upload" ? "active" : ""}" aria-label="Upload" title="Upload">${renderKrixGraphic("upload", 19)}</a>
          <a href="/store" class="mobile-icon-link ${activeNav === "store" ? "active" : ""}" aria-label="Store" title="Store">${renderKrixGraphic("database", 19)}</a>
          <a href="/stats" class="mobile-icon-link ${activeNav === "stats" ? "active" : ""}" aria-label="Stats" title="Stats">${renderKrixGraphic("chart", 19)}</a>
          <a href="/tools" class="mobile-icon-link ${activeNav === "tools" ? "active" : ""}" aria-label="Tools" title="Tools">${renderKrixGraphic("terminal", 19)}</a>
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

      function applyTheme(theme) {
        const isSys = theme === 'system';
        const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldBeDark = isSys ? sysDark : theme === 'dark';
        document.documentElement.classList.toggle('dark', shouldBeDark);
        updateThemeIcons(theme);
      }
      function updateThemeIcons(theme) {
        const iconSys = document.getElementById('themeIconSystem');
        const iconMoon = document.getElementById('themeIconMoon');
        const iconSun = document.getElementById('themeIconSun');
        const btn = document.getElementById('themeToggleBtn');
        if (iconSys) iconSys.style.display = theme === 'system' ? 'inline-block' : 'none';
        if (iconMoon) iconMoon.style.display = theme === 'dark' ? 'inline-block' : 'none';
        if (iconSun) iconSun.style.display = theme === 'light' ? 'inline-block' : 'none';
        if (btn) {
          const titles = {
            system: 'Theme: System (Auto) · Click for Dark',
            dark: 'Theme: Dark · Click for Light',
            light: 'Theme: Light · Click for System'
          };
          btn.title = titles[theme] || 'Toggle Theme';
          btn.setAttribute('aria-label', titles[theme] || 'Toggle Theme');
        }
      }
      function toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        const current = localStorage.getItem('qw-theme') || 'system';
        const next = current === 'system' ? 'dark' : current === 'dark' ? 'light' : 'system';
        localStorage.setItem('qw-theme', next);
        applyTheme(next);
      }
      window.toggleTheme = toggleTheme;
      window.applyTheme = applyTheme;
      if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
          const current = localStorage.getItem('qw-theme') || 'system';
          if (current === 'system') applyTheme('system');
        });
      }
      (function() {
        const saved = localStorage.getItem('qw-theme') || 'system';
        applyTheme(saved);
      })();
    </script>
  `;
}

export function renderFooter(): string {
  return `
    <div class="krix-progress-line" id="krixScrollProgress" aria-hidden="true"></div>
    <footer class="krix-footer">
      <div class="krix-footer-bottom"><div class="krix-footer-bottom-inner">
        <a href="/home" class="brand-wrap" aria-label="Krix home" style="display:inline-flex;gap:8px;text-decoration:none;color:var(--fg);">
          <span class="brand-avatar"><img src="/icon-48.png?v=2" alt=""></span><strong>Krix</strong>
        </a>
        <nav class="krix-footer-icon-nav" aria-label="Footer navigation">
          <a href="/home" title="Home" aria-label="Home">${renderKrixGraphic("home", 17)}</a>
          <a href="/upload" title="Upload" aria-label="Upload">${renderKrixGraphic("upload", 17)}</a>
          <a href="/store" title="Store" aria-label="Store">${renderKrixGraphic("database", 17)}</a>
          <a href="/stats" title="Usage & analytics" aria-label="Usage and analytics">${renderKrixGraphic("chart", 17)}</a>
          <a href="/tools" title="Tools" aria-label="Tools">${renderKrixGraphic("terminal", 17)}</a>
          <a href="/api" title="API keys" aria-label="API keys">${renderKrixGraphic("key", 17)}</a>
          <a href="/settings" title="Settings" aria-label="Settings">${renderKrixGraphic("settings", 17)}</a>
        </nav>
        <div class="krix-footer-controls">
          <div class="footer-theme-switch" role="group" aria-label="Appearance">
            <button type="button" onclick="setKrixTheme('system')" title="System theme" aria-label="System theme">${renderKrixGraphic("monitor", 15)}</button>
            <button type="button" onclick="setKrixTheme('light')" title="Light theme" aria-label="Light theme">${renderKrixGraphic("sun", 15)}</button>
            <button type="button" onclick="setKrixTheme('dark')" title="Dark theme" aria-label="Dark theme">${renderKrixGraphic("moon", 15)}</button>
          </div>
          <button type="button" class="footer-to-top" onclick="window.scrollTo({top:0,behavior:'smooth'})" title="Back to top" aria-label="Back to top">${renderKrixGraphic("arrowUp", 15)}</button>
        </div>
      </div></div>
      <div class="krix-footer-copyright">© ${new Date().getFullYear()} Krix</div>
    </footer>
    <div class="recaptcha-notice" style="font-size:11px; color:var(--accents-5); text-align:center; line-height:1.5;">
      This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> apply.
    </div>
    <div class="krix-command-backdrop" id="krixCommandPalette" hidden onclick="handleKrixCommandBackdrop(event)" aria-hidden="true">
      <section class="krix-command-panel" role="dialog" aria-modal="true" aria-labelledby="krixCommandTitle">
        <div class="krix-command-head"><span class="krix-command-mark">${renderKrixGraphic("command", 16)}</span><div><h2 id="krixCommandTitle">Command search</h2><p>Navigate and open workspace sections</p></div><kbd>ESC</kbd></div>
        <div class="krix-command-input-wrap">${renderKrixGraphic("search", 17)}<input id="krixCommandInput" type="search" placeholder="Search pages and actions…" autocomplete="off" spellcheck="false" aria-label="Search Krix commands"><span class="kbd-badge">↵</span></div>
        <div class="krix-command-label">NAVIGATION</div>
        <div class="krix-command-results" id="krixCommandResults" role="listbox" aria-label="Krix commands"></div>
        <div class="krix-command-foot"><span>Use ↑ ↓ to move</span><span>Enter to open</span><span>Ctrl K to close</span></div>
      </section>
    </div>
    <div class="modal-backdrop" id="shortcutsModal" onclick="handleShortcutsBackdrop(event)">
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="shortcutsModalTitle" style="max-width:400px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;"><h3 id="shortcutsModalTitle" style="font-size:16px;font-weight:700;color:var(--fg);margin:0;">Keyboard Shortcuts</h3><button type="button" class="kebab-btn" onclick="closeShortcutsModal()" style="width:30px;height:30px;">&times;</button></div>
        <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:18px;">
          <div class="shortcut-row"><span>Go to Home</span><span class="kbd-badge">H</span></div><div class="shortcut-row"><span>Go to Upload</span><span class="kbd-badge">U</span></div><div class="shortcut-row"><span>Go to Store</span><span class="kbd-badge">S</span></div><div class="shortcut-row"><span>Go to Stats</span><span class="kbd-badge">Y</span></div><div class="shortcut-row"><span>Go to Tools</span><span class="kbd-badge">T</span></div><div class="shortcut-row"><span>Go to API Keys</span><span class="kbd-badge">A</span></div><div class="shortcut-row"><span>Quick Search</span><span class="kbd-badge">/</span></div><div class="shortcut-row"><span>Toggle Theme</span><span class="kbd-badge">Shift + D</span></div><div class="shortcut-row"><span>Close Modal</span><span class="kbd-badge">Esc</span></div>
        </div><div style="text-align:right;"><button type="button" class="btn primary" onclick="closeShortcutsModal()" style="font-size:12px;padding:7px 14px;">Got it</button></div>
      </div>
    </div>
    <script>
      const krixCommands = [
        { label:'Home', detail:'Workspace overview', href:'/home', icon:'home', terms:'dashboard overview' },
        { label:'Upload', detail:'Add files to your workspace', href:'/upload', icon:'upload', terms:'files datasets' },
        { label:'Store', detail:'Manage stored files', href:'/store', icon:'database', terms:'cloud storage files' },
        { label:'Statistics', detail:'Usage and activity', href:'/stats', icon:'chart', terms:'metrics analytics' },
        { label:'Tools', detail:'Browse available tools', href:'/tools', icon:'terminal', terms:'mcp integrations' },
        { label:'API Keys', detail:'Manage your API keys', href:'/api', icon:'key', terms:'tokens credentials' },
        { label:'Settings', detail:'Integrations and permissions', href:'/settings', icon:'settings', terms:'configuration security' },
        { label:'Contact', detail:'Contact and support', href:'https://quickwitty.onrender.com/contacts', icon:'mail', terms:'help support', external:true },
        { label:'Keyboard shortcuts', detail:'View available shortcuts', action:'shortcuts', icon:'command', terms:'keys hotkeys' }
      ];
      let krixCommandIndex = 0;
      function renderKrixCommands(query) {
        const host = document.getElementById('krixCommandResults'); if (!host) return;
        const q = String(query || '').trim().toLowerCase();
        const filtered = krixCommands.filter(c => !q || (c.label+' '+c.detail+' '+c.terms).toLowerCase().includes(q));
        krixCommandIndex = Math.min(krixCommandIndex, Math.max(0, filtered.length - 1));
        host.replaceChildren();
        filtered.forEach((item, index) => {
          const button = document.createElement('button'); button.type='button'; button.className='krix-command-option'+(index===krixCommandIndex?' active':''); button.setAttribute('role','option'); button.setAttribute('aria-selected',index===krixCommandIndex?'true':'false');
          const icon = document.createElement('span'); icon.className='krix-command-option-icon'; icon.innerHTML = item.icon==='home'?'⌂':item.icon==='upload'?'↑':item.icon==='database'?'▤':item.icon==='chart'?'⌁':item.icon==='terminal'?'›_':item.icon==='key'?'⌘':item.icon==='settings'?'⚙':item.icon==='mail'?'✉':'?';
          const body = document.createElement('span'); body.className='krix-command-option-body';
          const title = document.createElement('strong'); title.textContent=item.label;
          const detail = document.createElement('small'); detail.textContent=item.detail;
          body.append(title, detail); const enter = document.createElement('span'); enter.className='krix-command-enter'; enter.textContent='↵'; button.append(icon, body, enter);
          button.addEventListener('mouseenter',()=>{krixCommandIndex=index;renderKrixCommands(query);});
          button.addEventListener('click',()=>runKrixCommand(item)); host.append(button);
        });
        if (!filtered.length) { const empty=document.createElement('div');empty.className='krix-command-empty';empty.textContent='No matching commands';host.append(empty); }
        host.dataset.count=String(filtered.length);
      }
      function runKrixCommand(item) { closeKrixCommandPalette(); if(item.action==='shortcuts'){openShortcutsModal();return;} if(item.href){if(item.external)window.open(item.href,'_blank','noopener,noreferrer');else window.location.href=item.href;} }
      function openKrixCommandPalette() { const modal=document.getElementById('krixCommandPalette');const input=document.getElementById('krixCommandInput');if(!modal)return;modal.hidden=false;modal.setAttribute('aria-hidden','false');requestAnimationFrame(()=>{modal.classList.add('open');if(input){input.value='';renderKrixCommands('');input.focus();}}); }
      function closeKrixCommandPalette() { const modal=document.getElementById('krixCommandPalette');if(!modal)return;modal.classList.remove('open');modal.hidden=true;modal.setAttribute('aria-hidden','true'); }
      function handleKrixCommandBackdrop(e) { if(e.target && e.target.id==='krixCommandPalette')closeKrixCommandPalette(); }
      function setKrixTheme(theme) { localStorage.setItem('qw-theme',theme); if(typeof applyTheme==='function')applyTheme(theme); }
      const krixCommandInput=document.getElementById('krixCommandInput');
      if(krixCommandInput){ krixCommandInput.addEventListener('input',()=>{krixCommandIndex=0;renderKrixCommands(krixCommandInput.value);}); krixCommandInput.addEventListener('keydown',(e)=>{const host=document.getElementById('krixCommandResults');const count=Number(host?.dataset.count||0);if(e.key==='ArrowDown'&&count){e.preventDefault();krixCommandIndex=(krixCommandIndex+1)%count;renderKrixCommands(krixCommandInput.value);}else if(e.key==='ArrowUp'&&count){e.preventDefault();krixCommandIndex=(krixCommandIndex-1+count)%count;renderKrixCommands(krixCommandInput.value);}else if(e.key==='Enter'&&count){e.preventDefault();const filtered=krixCommands.filter(c=>!krixCommandInput.value.trim()||(c.label+' '+c.detail+' '+c.terms).toLowerCase().includes(krixCommandInput.value.trim().toLowerCase()));if(filtered[krixCommandIndex])runKrixCommand(filtered[krixCommandIndex]);}else if(e.key==='Escape'){closeKrixCommandPalette();}}); }
      window.openKrixCommandPalette=openKrixCommandPalette;
      function openShortcutsModal(){const m=document.getElementById('shortcutsModal');if(m){m.removeAttribute('hidden');m.classList.add('open');}}
      function closeShortcutsModal(){const m=document.getElementById('shortcutsModal');if(m){m.classList.remove('open');m.setAttribute('hidden','');}}
      function handleShortcutsBackdrop(e){if(e.target.id==='shortcutsModal')closeShortcutsModal();}
      window.addEventListener('keydown',(e)=>{const tag=(document.activeElement?.tagName||'').toLowerCase();const editing=tag==='input'||tag==='textarea'||document.activeElement?.isContentEditable;const commandOpen=!!document.getElementById('krixCommandPalette')&&!document.getElementById('krixCommandPalette').hidden;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();const m=document.getElementById('krixCommandPalette');if(m&&!m.hidden)closeKrixCommandPalette();else openKrixCommandPalette();return;}if(e.key==='Escape'){closeKrixCommandPalette();closeShortcutsModal();return;}if(editing||commandOpen)return;if(e.key==='?'||(e.key==='/'&&e.shiftKey)){e.preventDefault();openShortcutsModal();return;}if(e.key==='/'){const el=document.getElementById('toolSearchInput')||document.getElementById('storeSearchInput')||document.getElementById('keySearchInput')||document.getElementById('fileFilter');if(el){e.preventDefault();el.focus();el.select();}return;}if(e.shiftKey&&(e.key==='D'||e.key==='d')){e.preventDefault();if(typeof toggleTheme==='function')toggleTheme();return;}if(!e.ctrlKey&&!e.metaKey&&!e.altKey){const routes={h:'/home',u:'/upload',s:'/store',y:'/stats',t:'/tools',a:'/api'};const dest=routes[e.key.toLowerCase()];if(dest)window.location.href=dest;}});
      (function initKrixMotionAndProgress(){
        const progress=document.getElementById('krixScrollProgress');
        let frame=0;
        const updateProgress=()=>{
          if(frame)return;
          frame=requestAnimationFrame(()=>{
            frame=0;
            if(!progress)return;
            const max=document.documentElement.scrollHeight-window.innerHeight;
            const ratio=max>0?Math.min(1,Math.max(0,window.scrollY/max)):0;
            progress.style.width=(ratio*100).toFixed(2)+'%';
          });
        };
        window.addEventListener('scroll',updateProgress,{passive:true});
        window.addEventListener('resize',updateProgress,{passive:true});
        updateProgress();
        if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
        if(!('IntersectionObserver' in window))return;
        const targets=document.querySelectorAll('.page-heading,.visual-card,.grid-4 > .card,.grid-2 > .card');
        const presets=['fade-up','scale-in','fade-left','fade-right','blur-in','flip-in','pop-in','roll-in'];
        const observer=new IntersectionObserver((entries)=>{
          entries.forEach((entry)=>{
            if(!entry.isIntersecting)return;
            const el=entry.target;
            el.classList.remove('krix-reveal-pending');
            el.classList.add('krix-reveal-visible','motion-'+presets[Number(el.dataset.krixRevealIndex||0)%presets.length]);
            observer.unobserve(el);
          });
        },{threshold:.08,rootMargin:'0px 0px -24px 0px'});
        targets.forEach((el,index)=>{
          if(el.dataset.krixRevealReady)return;
          el.dataset.krixRevealReady='1';
          el.dataset.krixRevealIndex=String(index);
          el.classList.add('krix-reveal-pending');
          observer.observe(el);
        });
      })();
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
        You must sign in as the verified service owner or authenticate with your MCP API key to access the ${escapeHtml(pageTitle)} page.
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
  uploads?: Array<{ name: string; size: number }>;
  dynamicKeys?: Array<Omit<GeneratedKeyEntry, "key"> | GeneratedKeyEntry>;
  activeNav?: string;
}): string {
  const { base, isOwner, owner, uploads = [], dynamicKeys = [] } = params;

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

    @media (max-width: 680px) {
      .home-page {
        width: 100%;
        max-width: 100%;
        overflow-x: hidden;
        align-items: stretch;
      }
      .home-page .wrapper {
        width: 100%;
        max-width: 1080px;
        min-width: 0;
        padding: 16px 12px 24px;
        overflow: hidden;
      }
      .home-page .wrapper > div:first-child,
      .home-page .grid-2,
      .home-page .card {
        width: 100%;
        min-width: 0;
        max-width: 100%;
      }
      .home-page .wrapper > div:first-child > div:last-child {
        max-width: 100%;
        flex-wrap: wrap;
      }
      .home-page .card {
        padding: 16px;
        overflow: hidden;
      }
      .home-page .card > div,
      .home-page .endpoint-box,
      .home-page .endpoint-row,
      .home-page .code-view,
      .home-page .tab-bar {
        min-width: 0;
        max-width: 100%;
      }
      .home-page .endpoint-row input {
        width: 100%;
        min-width: 0;
        max-width: 100%;
      }
      .home-page .code-view {
        overflow-x: auto;
        overflow-y: hidden;
        overscroll-behavior-x: contain;
      }
      .home-page .card h2,
      .home-page .card strong,
      .home-page .card span {
        overflow-wrap: anywhere;
      }
      .home-page .card > div[style*="justify-content:space-between"] {
        flex-wrap: wrap;
        gap: 8px;
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
<body class="home-page">
  ${renderHeader("home", owner)}

  <div class="wrapper">
    <!-- Hero Banner -->
    <div class="page-heading">
      <div>
        <span class="krix-eyebrow">Developer workspace</span>
        <h1>Krix</h1>
        <p>Connected tools, managed files and controlled agent access in one workspace.</p>
      </div>

      <div class="page-actions">
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
            <button type="button" class="icon-btn copy-endpoint-btn" onclick="copyMcpUrl()" id="copyUrlBtn" aria-label="Copy MCP endpoint URL" title="Copy MCP endpoint URL">${renderKrixGraphic("copy", 17)}</button>
          </div>
        </div>

        <div class="tab-bar">
          <button class="tab active" data-client="claude" aria-selected="true" onclick="showTab('claude')">Claude</button>
          <button class="tab" data-client="gemini" aria-selected="false" onclick="showTab('gemini')">Gemini Apps</button>
          <button class="tab" data-client="cursor" aria-selected="false" onclick="showTab('cursor')">Cursor</button>
          <button class="tab" data-client="antigravity" aria-selected="false" onclick="showTab('antigravity')">Antigravity</button>
          <button class="tab" data-client="chatgpt" aria-selected="false" onclick="showTab('chatgpt')">ChatGPT</button>
          <button class="tab" data-client="oauth" aria-selected="false" onclick="showTab('oauth')">OAuth</button>
        </div>

        <div class="client-instructions" id="clientInstructions" aria-live="polite"></div>
        <div class="code-view" id="codebox">
          <button type="button" class="copy-btn" onclick="copySnippet()" aria-label="Copy selected client setup" title="Copy configuration">${renderKrixGraphic("copy", 17)}</button>
          <code id="snippet"></code>
        </div>

      </section>
    </div>
  </div>

  ${renderFooter()}

  <script>
    const baseUrl = '${base}';
    const mcpEndpoint = baseUrl + '/mcp';
    let activeKey = '$MCP_API_KEY';
    const clientHelp = {
      claude: '<ol><li>Open Claude on the web and go to <strong>Customize → Connectors</strong>.</li><li>Select <strong>+ Add</strong> → <strong>Add custom connector</strong>.</li><li>Name the connection <strong>Krix</strong>, paste the endpoint URL above, and continue.</li><li>Review the detected authentication method, then complete sign-in or consent. The remote connector is account-managed and also appears in Claude Desktop; do not add it to <code>claude_desktop_config.json</code>.</li><li>In a chat, enable Krix from the <strong>+</strong> menu → <strong>Connectors</strong>.</li></ol><p class="client-note">Claude remote connectors are available on supported Free, Pro, Max, Team, and Enterprise plans. Free accounts are limited to one custom connector.</p><a href="https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp" target="_blank" rel="noopener noreferrer">Claude remote connector guide</a>',
      gemini: '<ol><li>On a computer, open <strong>gemini.google.com</strong>. Custom apps must be added from the Gemini web app; after connecting, the app can also be used in Gemini mobile.</li><li>Open <strong>Settings &amp; help → Connected Apps</strong>. Under <strong>Custom apps</strong>, choose <strong>Add a custom app</strong> (or use the add-app field).</li><li>Paste the Krix MCP endpoint URL above. If the server does not support Dynamic Client Registration, open <strong>Advanced features → Show more</strong> and enter the credentials requested by Gemini.</li><li>Select <strong>Next</strong> and complete the on-screen authorization. In a chat, type <code>@</code> and select Krix.</li></ol><p class="client-note">Google currently requires age 18+, US availability, a personal Google Account, English, and Keep Activity enabled. Work or school accounts are not supported.</p><a href="https://support.google.com/gemini/answer/17209137" target="_blank" rel="noopener noreferrer">Google: Connect and manage custom apps</a>',
      cursor: '<ol><li>Create or open <code>.cursor/mcp.json</code> in your project, or <code>~/.cursor/mcp.json</code> for all projects.</li><li>Add the Krix entry shown below inside <code>mcpServers</code>.</li><li>Create an API key in Krix → API Keys, copy it when it is shown, and replace <code>$MCP_API_KEY</code> in the Authorization value.</li><li>Save the file. Open Cursor Settings → MCP (or Customize) and enable/reload Krix.</li></ol><a href="https://cursor.com/docs/mcp" target="_blank" rel="noopener noreferrer">Cursor MCP documentation</a>',
      antigravity: '<ol><li>Open Antigravity → MCP Servers → Manage MCP Servers, then view the raw configuration.</li><li>Alternatively edit the global file <code>~/.gemini/config/mcp_config.json</code> or workspace file <code>.agents/mcp_config.json</code>.</li><li>Add the Krix entry shown below inside <code>mcpServers</code>. Antigravity remote Streamable HTTP entries use <code>serverUrl</code>.</li><li>Create an API key in Krix → API Keys, copy it when it is shown, and replace <code>$MCP_API_KEY</code> in the Authorization value. Save and reload Krix.</li></ol><a href="https://antigravity.google/docs/mcp" target="_blank" rel="noopener noreferrer">Antigravity MCP configuration reference</a>',
      chatgpt: '<ol><li>Open ChatGPT <strong>Settings → Apps &amp; Connectors → Advanced settings</strong> and enable <strong>Developer mode</strong>, if your plan or workspace exposes it.</li><li>Choose <strong>Create app</strong>, enter a name and the Krix HTTPS MCP endpoint URL, and select the authentication method offered by the setup flow.</li><li>Run <strong>Scan tools</strong>, review the discovered tools and their permissions, then create the app. Enable it from a chat when needed.</li></ol><p class="client-note">Plan-gated: full MCP, including write/modify actions, is currently available to Business and Enterprise/Edu. Pro users can connect custom MCP servers with read/fetch permissions in Developer mode. Admin or workspace policies may also restrict access.</p><a href="https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt" target="_blank" rel="noopener noreferrer">OpenAI: Connect custom MCP servers</a>',
      oauth: '<ol><li>Use the Krix HTTPS MCP endpoint in a client that supports remote MCP over Streamable HTTP.</li><li>Choose OAuth when the client offers it; complete sign-in and consent in the browser.</li><li>For manual API-key authentication, choose Bearer token and provide a key created in Krix.</li></ol><p>Discovery: <code>/.well-known/oauth-protected-resource</code> and <code>/.well-known/oauth-authorization-server</code>.</p>'
    };
    function getSnippets() {
      const token = activeKey || '$MCP_API_KEY';
      return {
        claude: mcpEndpoint,
        gemini: mcpEndpoint,
        cursor: JSON.stringify({
          mcpServers: { krix: { url: mcpEndpoint, headers: { Authorization: 'Bearer ' + token } } }
        }, null, 2),
        antigravity: JSON.stringify({
          mcpServers: { krix: { serverUrl: mcpEndpoint, headers: { Authorization: 'Bearer ' + token } } }
        }, null, 2),
        chatgpt: mcpEndpoint,
        oauth: JSON.stringify({
          mcpEndpoint,
          authorization: baseUrl + '/oauth/authorize',
          token: baseUrl + '/oauth/token',
          protectedResourceMetadata: baseUrl + '/.well-known/oauth-protected-resource',
          authorizationServerMetadata: baseUrl + '/.well-known/oauth-authorization-server'
        }, null, 2)
      };
    }
    let curTab = 'claude';
    function showTab(name) {
      curTab = name;
      document.querySelectorAll('.tab-bar .tab').forEach(b => {
        const active = b.dataset.client === name;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', String(active));
      });
      const instructions = document.getElementById('clientInstructions');
      const snippet = document.getElementById('snippet');
      if (instructions) instructions.innerHTML = clientHelp[name] || '';
      if (snippet) snippet.textContent = getSnippets()[name] || '';
      const codebox = document.getElementById('codebox');
      if (codebox) codebox.style.display = ['cursor','antigravity','oauth'].includes(name) ? 'block' : 'none';
    }
    showTab('claude');
    async function copyTextToClipboard(text) {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
      }
      const helper = document.createElement('textarea');
      helper.value = text;
      helper.setAttribute('readonly', '');
      helper.style.position = 'fixed'; helper.style.opacity = '0';
      document.body.appendChild(helper); helper.select();
      const copied = document.execCommand('copy');
      helper.remove();
      if (!copied) throw new Error('Clipboard access was denied by this browser.');
    }
    async function showCopiedState(button) {
      if (!button) return;
      const original = button.innerHTML;
      button.innerHTML = '<span class="copy-state-icon">${renderKrixGraphic("check", 17)}</span>';
      button.classList.add('is-copied');
      window.setTimeout(() => { button.innerHTML = original; button.classList.remove('is-copied'); }, 1200);
    }
    async function copyMcpUrl() {
      const button = document.getElementById('copyUrlBtn');
      try { await copyTextToClipboard(mcpEndpoint); await showCopiedState(button); }
      catch (error) { window.alert(error.message || 'Could not copy the MCP URL.'); }
    }
    async function copySnippet() {
      const button = document.querySelector('.copy-btn');
      try { await copyTextToClipboard(document.getElementById('snippet').textContent || ''); await showCopiedState(button); }
      catch (error) { window.alert(error.message || 'Could not copy this configuration.'); }
    }

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
  <title>API Keys</title>
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
    .table-scroll-container { overflow-x:auto; }
    .kebab-wrap { position:relative; display:inline-flex; z-index:2; }
    .kebab-dropdown { z-index:50; right:0; left:auto; max-width:min(240px, calc(100vw - 48px)); }
    .key-row:has(.kebab-dropdown[style*="display: block"]) { position:relative; z-index:10; }
    @media (max-width: 640px) {
      .table-scroll-container { margin:0; padding:0; overflow:visible !important; }
      #keysTable { min-width:0 !important; table-layout:fixed; }
      #keysTable thead { display:none; }
      #keysTable tbody { display:grid; gap:9px; }
      #keysTable tbody tr.key-row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:4px 8px; padding:12px; border:1px solid var(--border); border-radius:12px; background:var(--card-bg); }
      #keysTable tbody tr.key-row td { min-width:0; padding:4px 2px; border:0; overflow-wrap:anywhere; }
      #keysTable tbody tr.key-row td:nth-child(1) { grid-column:1; grid-row:1; }
      #keysTable tbody tr.key-row td:nth-child(2) { grid-column:1/-1; grid-row:2; }
      #keysTable tbody tr.key-row td:nth-child(3) { grid-column:1; grid-row:3; }
      #keysTable tbody tr.key-row td:nth-child(4) { grid-column:1; grid-row:4; font-size:11px; }
      #keysTable tbody tr.key-row td:nth-child(5) { grid-column:2; grid-row:1; align-self:start; }
      #keysTable .key-display-scroll { width:auto !important; min-width:0 !important; max-width:calc(100vw - 120px) !important; }
      #keysTable tbody tr:not(.key-row) { display:block; }
      .kebab-dropdown { position:fixed; right:16px; left:auto; }
      #oauthTableBody tr { display:grid; grid-template-columns:1fr auto; gap:4px; padding:10px; border:1px solid var(--border); border-radius:10px; margin-bottom:8px; }
      #oauthTableBody td { border:0; padding:4px; min-width:0; overflow-wrap:anywhere; }
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
    <div class="page-heading">
      <div>
        <span class="krix-eyebrow">Identity and access</span>
        <h1>API Keys</h1>
        <p>Create, inspect and manage credentials for your MCP clients and custom agents.</p>
      </div>

      <div class="page-actions">
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
          <div style="font-size:12px; color:var(--accents-5); margin-bottom:12px;">Copy your secret key now. With KEY_ENCRYPTION_SECRET configured, you can reveal your own key later; older hash-only keys must be replaced.</div>
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
            <span class="badge ${keys.length > 0 ? "success" : ""}" id="keysCountBadge">${keys.length} active</span>
          </div>
          <div class="search-input-wrap" style="width:100%; max-width:320px;">
            ${renderSvg("search", 15)}
            <input type="text" id="keySearchInput" placeholder="Search keys by label, client ID, or prefix" oninput="filterKeys()">
          </div>
        </div>

        <div class="table-scroll-container" style="overflow-x:auto; -webkit-overflow-scrolling:touch; position:relative; isolation:isolate; padding-bottom:8px; margin-bottom:0;">
          <table id="keysTable" style="table-layout:auto; width:100%; min-width:760px;">
            <thead>
              <tr>
                <th style="width: 24%; min-width: 140px;">Label</th>
                <th style="width: 20%; min-width: 130px;">Client ID</th>
                <th style="width: 32%; min-width: 240px;">Key Secret</th>
                <th style="width: 14%; min-width: 100px;">Created</th>
                <th style="width: 10%; min-width: 50px; text-align:right;">Actions</th>
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
                        const isOwnKey = Boolean(owner?.email && k.email?.toLowerCase() === owner.email.toLowerCase());
                        const hasSecret = Boolean((k as any).keyEncrypted);
                        const canReveal = hasSecret && isOwnKey;
                        const fullKey = "";
                        return `
                <tr id="row-${escapeHtml(id)}" class="key-row" data-label="${escapeHtml(label.toLowerCase())}" data-client-id="${escapeHtml(cId.toLowerCase())}" data-prefix="${escapeHtml(prefix.toLowerCase())}" data-id="${escapeHtml(id.toLowerCase())}">
                  <td style="overflow:hidden; text-overflow:ellipsis;">
                    <div style="font-weight:600; color:var(--fg); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" id="key-label-text-${escapeHtml(id)}">${escapeHtml(label)}</div>
                    <div style="font-family:monospace; font-size:11px; color:var(--accents-5); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(id)}</div>
                  </td>
                  <td>
                    <div style="display:flex; align-items:center; gap:6px;">
                      <code style="font-family:ui-monospace, SFMono-Regular, monospace; font-size:12px; background:var(--code-bg); padding:3px 6px; border-radius:4px; border:1px solid var(--border); color:var(--fg);">${escapeHtml(cId || "N/A")}</code>
                      ${cId ? `<button type="button" class="btn icon-btn" onclick="copyKeyText('${escapeHtml(cId)}', 'Client ID')" style="width:28px; height:28px; flex-shrink:0; padding:0; display:inline-flex; align-items:center; justify-content:center;" title="Copy Client ID" aria-label="Copy Client ID">${renderSvg("copy", 13)}</button>` : ""}
                    </div>
                  </td>
                  <td style="width: 32%; min-width: 240px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <div class="key-display-scroll" style="width:145px; min-width:145px; max-width:145px; overflow-x:auto; white-space:nowrap; scrollbar-width:thin; padding:2px 0;">
                        <code id="key-val-${escapeHtml(id)}" data-revealed="false" data-revealable="${canReveal ? "true" : "false"}" style="font-family:ui-monospace, SFMono-Regular, monospace; background:var(--code-bg); padding:4px 8px; border-radius:7px; font-size:12px; border:1px solid var(--border); color:var(--fg); display:inline-block; box-sizing:border-box;">${canReveal ? "••••••••••••••••" : (hasSecret ? "Not available to this account" : "Reissue key to enable secure reveal")}</code>
                      </div>
                      ${canReveal ? `<button type="button" class="btn icon-btn" id="reveal-btn-${escapeHtml(id)}" onclick="toggleKeyReveal('${escapeHtml(id)}')" title="Reveal API Key" aria-label="Reveal API Key" style="width:28px; height:28px; flex-shrink:0; padding:0; display:inline-flex; align-items:center; justify-content:center;">${renderSvg("eye", 14)}</button>` : ""}
                      ${canReveal ? `<button type="button" class="btn icon-btn" onclick="copyKeySecret('${escapeHtml(id)}', 'API Key')" title="Copy API Key" aria-label="Copy API Key" style="width:28px; height:28px; flex-shrink:0; padding:0; display:inline-flex; align-items:center; justify-content:center;">${renderSvg("copy", 14)}</button>` : ""}
                    </div>
                  </td>
                  <td><span class="local-date" data-ts="${k.createdAt}">${new Date(k.createdAt).toLocaleDateString()}</span></td>
                  <td style="text-align:right;">
                    <div class="kebab-wrap">
                      <button type="button" class="kebab-btn" data-action="toggle-menu" data-target="kebab-key-${escapeHtml(id)}" aria-label="Key Actions">${renderKrixGraphic("more", 17)}</button>
                      <div class="kebab-dropdown" id="kebab-key-${escapeHtml(id)}">
                        ${canReveal ? `
                        <button type="button" class="kebab-item" onclick="copyKeySecret('${escapeHtml(id)}', 'API Key')">
                          ${renderSvg("copy", 14)} <span>Copy Key</span>
                        </button>` : ""}
                        ${
                          cId
                            ? `
                        <button type="button" class="kebab-item" onclick="copyKeyText('${escapeHtml(cId)}', 'Client ID')">
                          ${renderSvg("copy", 14)} <span>Copy Client ID</span>
                        </button>
                        `
                            : ""
                        }
                        ${isOwnKey ? `
                        <button type="button" class="kebab-item" onclick="openRenameKeyModal('${escapeHtml(id)}', '${escapeHtml(label)}')">
                          ${renderSvg("edit", 14)} <span>Rename</span>
                        </button>` : ""}
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
            <button type="button" class="pagination-btn" id="keysPrevBtn" onclick="changeKeysPage(-1)" aria-label="Previous API keys" title="Previous">${renderKrixGraphic("chevronLeft", 17)}</button>
            <button type="button" class="pagination-btn" id="keysNextBtn" onclick="changeKeysPage(1)" aria-label="Next API keys" title="Next">${renderKrixGraphic("chevronRight", 17)}</button>
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

        <div class="table-scroll-container" style="overflow-x:auto; -webkit-overflow-scrolling:touch; position:relative; isolation:isolate; padding-bottom:8px; margin-bottom:0;">
          <table style="table-layout:auto; width:100%; min-width:680px;">
            <thead>
              <tr>
                <th style="width: 28%; min-width: 140px;">Application</th>
                <th style="width: 34%; min-width: 160px;">Client ID</th>
                <th style="width: 26%; min-width: 120px;">Permissions</th>
                <th style="width: 12%; min-width: 50px; text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody id="oauthTableBody">
              ${
                oauthAuthorizations.length > 0
                  ? oauthAuthorizations
                      .map(
                        (a) => `
                <tr id="oauth-row-${escapeHtml(a.clientId)}" class="oauth-row" data-name="${escapeHtml((a.clientName || "").toLowerCase())}" data-id="${escapeHtml((a.clientId || "").toLowerCase())}" data-scope="${escapeHtml((a.scope || "").toLowerCase())}">
                  <td><strong id="oauth-name-text-${escapeHtml(a.clientId)}">${escapeHtml(a.clientName || a.clientId)}</strong></td>
                  <td style="font-family:ui-monospace, monospace; color:var(--accents-5); font-size:12px;">${escapeHtml(a.clientId)}</td>
                  <td style="font-size:12px; color:var(--accents-5);">${escapeHtml(a.scope || "mcp:tools")}</td>
                  <td style="text-align:right;">
                    <div class="kebab-wrap">
                      <button type="button" class="kebab-btn" data-action="toggle-menu" data-target="kebab-oauth-${escapeHtml(a.clientId)}" aria-label="OAuth Actions">${renderKrixGraphic("more", 17)}</button>
                      <div class="kebab-dropdown" id="kebab-oauth-${escapeHtml(a.clientId)}">
                        <button type="button" class="kebab-item" onclick="copyKeyText('${escapeHtml(a.clientId)}', 'Client ID')">
                          ${renderSvg("copy", 14)} <span>Copy Client ID</span>
                        </button>
                        <button type="button" class="kebab-item" onclick="openRenameOAuthModal('${escapeHtml(a.clientId)}', '${escapeHtml(a.clientName)}')">
                          ${renderSvg("edit", 14)} <span>Rename</span>
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
            <button type="button" class="pagination-btn" id="oauthPrevBtn" onclick="changeOAuthPage(-1)" aria-label="Previous OAuth authorizations" title="Previous">${renderKrixGraphic("chevronLeft", 17)}</button>
            <button type="button" class="pagination-btn" id="oauthNextBtn" onclick="changeOAuthPage(1)" aria-label="Next OAuth authorizations" title="Next">${renderKrixGraphic("chevronRight", 17)}</button>
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

    async function fetchKeySecret(id) {
      const res = await fetch('/api/keys/' + encodeURIComponent(id) + '/secret', { credentials: 'same-origin', cache: 'no-store', headers: { 'Accept': 'application/json' } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.key) throw new Error(data.error || 'Unable to reveal this key.');
      return data.key;
    }

    async function toggleKeyReveal(id) {
      const el = document.getElementById('key-val-' + id);
      const btn = document.getElementById('reveal-btn-' + id);
      if (!el) return;
      const isRevealed = el.getAttribute('data-revealed') === 'true';
      if (isRevealed) {
        el.textContent = '••••••••••••••••';
        el.removeAttribute('data-full');
        el.setAttribute('data-revealed', 'false');
        if (btn) { btn.innerHTML = '${renderSvg("eye", 14)}'; btn.title = 'Reveal API Key'; btn.setAttribute('aria-label','Reveal API Key'); }
        return;
      }
      if (btn) btn.disabled = true;
      try {
        const secret = await fetchKeySecret(id);
        el.textContent = secret;
        el.setAttribute('data-full', secret);
        el.setAttribute('data-revealed', 'true');
        if (btn) { btn.innerHTML = '${renderSvg("eye-off", 14)}'; btn.title = 'Hide API Key'; btn.setAttribute('aria-label','Hide API Key'); }
      } catch (error) {
        showToast(error.message || 'Could not reveal key', 'error');
      } finally { if (btn) btn.disabled = false; }
    }

    async function copyKeySecret(id, label) {
      try {
        const secret = await fetchKeySecret(id);
        await navigator.clipboard.writeText(secret);
        showToast((label || 'API key') + ' copied to clipboard', 'success');
      } catch (error) { showToast(error.message || 'Could not copy key', 'error'); }
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
            if (badge) {
              badge.textContent = remaining + ' active';
              if (remaining === 0) badge.classList.remove('success');
              else badge.classList.add('success');
            }
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
              oBadge.textContent = remainingOAuth + ' connected';
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

    // Keep kebab menus above scroll containers and close them on outside clicks.
    function closeKebabDropdown(dropdown) {
      if (!dropdown) return;
      dropdown.classList.remove('open', 'pop-up');
      dropdown.style.position = '';
      dropdown.style.top = '';
      dropdown.style.left = '';
      dropdown.style.right = '';
      dropdown.style.bottom = '';
      dropdown.style.zIndex = '';
      dropdown.style.maxHeight = '';
      dropdown.style.overflowY = '';
      const placeholder = dropdown.__kebabPlaceholder;
      if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.insertBefore(dropdown, placeholder);
        placeholder.remove();
      }
      if (dropdown.__kebabOwnerWrap) dropdown.__kebabOwnerWrap.classList.remove('is-open');
      dropdown.__kebabPlaceholder = null;
      dropdown.__kebabOwnerWrap = null;
    }

    function closeAllKebabMenus() {
      document.querySelectorAll('.kebab-dropdown.open').forEach(closeKebabDropdown);
      document.querySelectorAll('.kebab-wrap.is-open').forEach(w => w.classList.remove('is-open'));
    }

    function openKebabDropdown(dropdown, trigger, wrap) {
      if (!dropdown || !trigger) return;
      const placeholder = document.createComment('kebab-menu-placeholder');
      dropdown.parentNode.insertBefore(placeholder, dropdown);
      dropdown.__kebabPlaceholder = placeholder;
      dropdown.__kebabOwnerWrap = wrap;
      document.body.appendChild(dropdown);
      if (wrap) wrap.classList.add('is-open');

      dropdown.style.position = 'fixed';
      dropdown.style.zIndex = '2147483647';
      dropdown.style.right = 'auto';
      dropdown.style.bottom = 'auto';
      dropdown.style.maxHeight = 'calc(100vh - 16px)';
      dropdown.style.overflowY = 'auto';
      dropdown.classList.add('open');

      dropdown.style.width = 'max-content';
      dropdown.style.minWidth = 'min(210px, calc(100vw - 16px))';
      dropdown.style.maxWidth = 'calc(100vw - 16px)';
      dropdown.style.boxSizing = 'border-box';
      const rect = trigger.getBoundingClientRect();
      const viewportWidth = Math.max(240, document.documentElement.clientWidth || window.innerWidth);
      const menuWidth = Math.min(dropdown.getBoundingClientRect().width || 210, viewportWidth - 16);
      const menuHeight = Math.min(dropdown.offsetHeight, window.innerHeight - 16);
      dropdown.style.width = menuWidth + 'px';
      const left = Math.max(8, Math.min(rect.right - menuWidth, viewportWidth - menuWidth - 8));
      let top = rect.bottom + 6;
      if (top + menuHeight > window.innerHeight - 8) top = rect.top - menuHeight - 6;
      top = Math.max(8, Math.min(top, window.innerHeight - menuHeight - 8));
      dropdown.style.left = left + 'px';
      dropdown.style.top = top + 'px';
    }

    window.addEventListener('scroll', closeAllKebabMenus, { passive: true });
    window.addEventListener('resize', closeAllKebabMenus);

    document.addEventListener('click', function(e) {
      const btn = e.target.closest('.kebab-btn');
      if (btn) {
        e.stopPropagation();
        const wrap = btn.closest('.kebab-wrap');
        const dropdown = wrap ? wrap.querySelector('.kebab-dropdown') : null;
        const wasOpen = dropdown && dropdown.classList.contains('open');
        closeAllKebabMenus();
        if (dropdown && !wasOpen) openKebabDropdown(dropdown, btn, wrap);
        return;
      }
      if (e.target.closest('.kebab-dropdown')) {
        if (e.target.closest('.kebab-item')) closeAllKebabMenus();
        return;
      }
      closeAllKebabMenus();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeConfirmModal();
        closeRenameModal();
        closeAllKebabMenus();
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
              '<code id="key-val-' + safeId + '" data-revealed="false" data-revealable="' + (data.revealable ? 'true' : 'false') + '" style="font-family:ui-monospace, SFMono-Regular, monospace; background:var(--code-bg); padding:4px 8px; border-radius:4px; font-size:12px; border:1px solid var(--border); color:var(--fg); display:inline-block;">••••••••••••••••</code>' +
              '</div>' +
              (data.revealable ? '<button type="button" class="btn icon-btn reveal-key-btn" id="reveal-btn-' + safeId + '" title="Reveal API Key" aria-label="Reveal API Key" style="padding:4px 7px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>' +
              '<button type="button" class="btn icon-btn copy-key-btn" title="Copy API Key" aria-label="Copy API Key" style="padding:4px 7px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>' : '') +
              '</div>' +
              '</td>' +
              '<td><span class="local-date">' + new Date().toLocaleDateString() + '</span></td>' +
              '<td style="text-align:right;">' +
              '<div class="kebab-wrap">' +
              '<button type="button" class="kebab-btn" aria-label="Key Actions">${renderKrixGraphic("more", 17)}</button>' +
              '<div class="kebab-dropdown">' +
              (data.revealable ? '<button type="button" class="kebab-item kebab-copy-key">Copy Key</button>' : '') +
              (safeCId ? '<button type="button" class="kebab-item kebab-copy-cid">Copy Client ID</button>' : '') +
              '<button type="button" class="kebab-item kebab-rename-key">Rename</button>' +
              '<div class="kebab-divider"></div>' +
              '<button type="button" class="kebab-item danger kebab-delete-key">Delete Key</button>' +
              '</div>' +
              '</div>' +
              '</td>';

            const copyCidBtn = tr.querySelector('.copy-cid-btn');
            if (copyCidBtn) copyCidBtn.onclick = function() { copyKeyText(data.clientId, 'Client ID'); };
            const codeEl = tr.querySelector('#key-val-' + safeId);
            if (codeEl) codeEl.setAttribute('data-revealable', data.revealable ? 'true' : 'false');
            const revealBtn = tr.querySelector('.reveal-key-btn');
            if (revealBtn) revealBtn.onclick = function() { toggleKeyReveal(data.id); };
            const copyKeyBtn = tr.querySelector('.copy-key-btn');
            if (copyKeyBtn) copyKeyBtn.onclick = function() { copyKeySecret(data.id, 'API Key'); };
            
            const kebabCopyKey = tr.querySelector('.kebab-copy-key');
            if (kebabCopyKey) kebabCopyKey.onclick = function() { copyKeySecret(data.id, 'API Key'); };
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
          if (badge) {
            badge.textContent = remaining + ' active';
            if (remaining > 0) badge.classList.add('success');
          }
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

    // Initial API Keys and OAuth pagination render
    renderKeysPagination();
    renderOAuthPagination();
  </script>
</body>
</html>`;
}

function renderCustomKeySelector(
  summary: any,
  selectId = "keySelector",
): string {
  const selectedKey = summary.keys?.find(
    (k: any) => (k.keyId || k.id) === summary.selectedKeyId,
  );
  const selectedLabel = selectedKey
    ? selectedKey.label || selectedKey.keyId || selectedKey.id
    : "All Keys & OAuth";
  const apiKeys = (summary.keys || []).filter(
    (k: any) => k.type === "api_key" || k.type === "master" || !k.type,
  );
  const oauthKeys = (summary.keys || []).filter((k: any) => k.type === "oauth");

  return `
    <div style="display:flex; align-items:center; gap:8px;">
      <label for="${selectId}" style="font-size:12px; color:var(--accents-5); font-weight:500; white-space:nowrap;">Key:</label>
      <div class="custom-select-wrap" id="${selectId}Wrap">
        <select id="${selectId}" onchange="onKeyFilterChange(this)" style="display:none;" aria-hidden="true">
          <option value="" ${!summary.selectedKeyId ? "selected" : ""}>All Keys &amp; OAuth</option>
          ${
            summary.keys && summary.keys.length > 0
              ? `
            <optgroup label="API Keys">
              ${apiKeys
                .map(
                  (k: any) => `
                <option value="${escapeHtml(k.keyId || k.id)}" ${summary.selectedKeyId === (k.keyId || k.id) ? "selected" : ""}>
                  ${escapeHtml(k.label || k.keyId || k.id)}
                </option>
              `,
                )
                .join("")}
            </optgroup>
            <optgroup label="OAuth Authorizations">
              ${oauthKeys
                .map(
                  (k: any) => `
                <option value="${escapeHtml(k.keyId || k.id)}" ${summary.selectedKeyId === (k.keyId || k.id) ? "selected" : ""}>
                  ${escapeHtml(k.label || k.keyId || k.id)}
                </option>
              `,
                )
                .join("")}
            </optgroup>
          `
              : ""
          }
        </select>

        <button type="button" class="custom-select-btn" id="${selectId}Trigger" onclick="toggleCustomKeyDropdown('${selectId}')" aria-haspopup="listbox" aria-expanded="false">
          <span class="custom-select-label" id="${selectId}Label">${escapeHtml(selectedLabel)}</span>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M1 1L5 5L9 1"></path></svg>
        </button>

        <div class="custom-select-menu" id="${selectId}Menu" role="listbox">
          <button type="button" class="custom-select-item ${!summary.selectedKeyId ? "selected" : ""}" onclick="selectCustomKey('${selectId}', '')">
            <span>All Keys &amp; OAuth</span>
          </button>
          ${
            apiKeys.length > 0
              ? `
            <div style="font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:var(--accents-4); padding:6px 10px 2px;">API Keys</div>
            ${apiKeys
              .map(
                (k: any) => `
              <button type="button" class="custom-select-item ${summary.selectedKeyId === (k.keyId || k.id) ? "selected" : ""}" onclick="selectCustomKey('${selectId}', '${escapeHtml(k.keyId || k.id)}')">
                <span class="custom-select-label">${escapeHtml(k.label || k.keyId || k.id)}</span>
              </button>
            `,
              )
              .join("")}
          `
              : ""
          }
          ${
            oauthKeys.length > 0
              ? `
            <div style="font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:var(--accents-4); padding:6px 10px 2px;">OAuth Authorizations</div>
            ${oauthKeys
              .map(
                (k: any) => `
              <button type="button" class="custom-select-item ${summary.selectedKeyId === (k.keyId || k.id) ? "selected" : ""}" onclick="selectCustomKey('${selectId}', '${escapeHtml(k.keyId || k.id)}')">
                <span class="custom-select-label">${escapeHtml(k.label || k.keyId || k.id)}</span>
              </button>
            `,
              )
              .join("")}
          `
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

export function renderToolsPage(params: {
  base: string;
  isOwner: boolean;
  owner: OwnerProfile | null;
  tools: ToolDetailMeta[];
  summary?: StatsSummary;
  keys?: Array<{ id: string; label?: string }>;
  selectedKeyId?: string | null;
}): string {
  const { base, isOwner, owner, tools } = params;
  const summary: any = params.summary || {
    selectedKeyId: params.selectedKeyId || null,
    keys: params.keys || [],
    toolDistribution: {},
  };
  const toolDistribution = summary.toolDistribution || {};

  if (!isOwner) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Tools</title>
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
    "Code Graph": tools.filter(
      (t) => t.category === "Code Graph" || t.category === "Search",
    ).length,
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Tools</title>
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
    <div class="page-heading">
      <div>
        <span class="krix-eyebrow">Connected capabilities</span>
        <div class="page-title-line"><h1>Tools</h1><span class="badge">${tools.length} tools</span></div>
        <p>Explore the available MCP tools, permissions and invocation telemetry.</p>
      </div>

      <div class="page-actions">
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
            placeholder="Search tools by name or description"
            value=""
            autocomplete="off"
            spellcheck="false"
            oninput="filterTools()"
          />
        </div>
        ${renderCustomKeySelector(summary, "keySelector")}
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
          <button type="button" class="pill-btn" data-cat="Code Graph" onclick="setCategoryFilter('Code Graph', this)">
            Code Graph (${counts["Code Graph"]})
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
          const calls = toolDistribution[t.name] || 0;
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
        <button type="button" class="pagination-btn" id="toolsPrevBtn" onclick="changeToolsPage(-1)" aria-label="Previous tools" title="Previous">${renderKrixGraphic("chevronLeft", 17)}</button>
        <button type="button" class="pagination-btn" id="toolsNextBtn" onclick="changeToolsPage(1)" aria-label="Next tools" title="Next">${renderKrixGraphic("chevronRight", 17)}</button>
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

    function toggleCustomKeyDropdown(id) {
      const menu = document.getElementById(id + 'Menu');
      const trigger = document.getElementById(id + 'Trigger');
      if (!menu) return;
      const isOpen = menu.classList.contains('open');
      document.querySelectorAll('.custom-select-menu.open').forEach(m => m.classList.remove('open'));
      if (!isOpen) {
        menu.classList.add('open');
        if (trigger) trigger.setAttribute('aria-expanded', 'true');
      } else {
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      }
    }

    function selectCustomKey(id, val) {
      const sel = document.getElementById(id);
      if (sel) {
        sel.value = val;
        onKeyFilterChange(sel);
      }
    }

    document.addEventListener('click', function(e) {
      if (!e.target.closest('.custom-select-wrap')) {
        document.querySelectorAll('.custom-select-menu.open').forEach(m => m.classList.remove('open'));
        document.querySelectorAll('.custom-select-btn[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
      }
    });

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
  <title>Stats</title>
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
  <title>Stats</title>
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
    <div class="page-heading">
      <div>
        <span class="krix-eyebrow">Service telemetry</span>
        <h1>Usage &amp; Analytics</h1>
        <p>Usage, tool invocations and quota data scoped to the selected account key.</p>
      </div>

      <div class="page-actions">
        ${renderCustomKeySelector(summary, "keySelector")}
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
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
        <div>
          <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
            <h2 style="font-size:15px; font-weight:600; color:var(--fg);">Activity Timeline</h2>
            <div style="display:inline-flex; align-items:center; gap:10px; font-size:11px; color:var(--accents-5);">
              <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:7px; height:7px; border-radius:2px; background:#10b981; display:inline-block;"></span>Working</span>
              <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:7px; height:7px; border-radius:2px; background:#ef4444; display:inline-block;"></span>Errors</span>
            </div>
          </div>
          <p style="font-size:12px; color:var(--accents-5);">Volume of requests and tool invocations over time</p>
        </div>

        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <!-- 10-Day Desktop Chunk Slider -->
          <div id="dailyChunkNav" style="display:inline-flex; align-items:center; gap:4px;">
            <button type="button" class="pagination-btn" id="btnPrevDailyChunk" aria-label="Previous 10 days" title="Previous 10 days" onclick="changeDailyChunk(-1)">${renderKrixGraphic("chevronLeft", 17)}</button>
            <span id="lblDailyChunkRange" style="font-size:11px; font-variant-numeric:tabular-nums; color:var(--accents-5); padding:0 4px;">Days 21–30</span>
            <button type="button" class="pagination-btn" id="btnNextDailyChunk" aria-label="Next 10 days" title="Next 10 days" onclick="changeDailyChunk(1)">${renderKrixGraphic("chevronRight", 17)}</button>
          </div>

          <!-- Smart Year Filter -->
          <select class="filter-select" id="yearFilter" onchange="renderChart()" style="height:28px; padding:2px 8px; font-size:12px;">
            <option value="all">All Years</option>
            ${summary.availableYears.map((y) => `<option value="${y}">${y}</option>`).join("")}
          </select>

          <div style="display:flex; gap:4px;">
            <button class="tab" id="btnDaily" style="padding:4px 10px; font-size:12px;" onclick="setTimeline('daily')">Day</button>
            <button class="tab" id="btnWeekly" style="padding:4px 10px; font-size:12px;" onclick="setTimeline('weekly')">Week</button>
            <button class="tab" id="btnMonthly" style="padding:4px 10px; font-size:12px;" onclick="setTimeline('monthly')">Month</button>
          </div>
        </div>
      </div>

      <div style="overflow-x:auto; -webkit-overflow-scrolling:touch; width:100%;">
        <div id="timelineChart" class="chart-container" style="width:100%;min-width:0;">
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
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <h2 style="font-size:15px; font-weight:600; color:var(--fg);">Per-Key &amp; Client Breakdown</h2>
          <span class="stats-key-count" id="statsKeyCountBadge"><strong>${summary.keys.length}</strong><span>API keys</span></span>
        </div>
        <div class="search-input-wrap" style="width:280px; max-width:100%;">
          ${renderSvg("search", 14)}
          <input type="text" id="statsKeySearchInput" class="search-input" placeholder="Search clients, keys, or types" oninput="handleStatsKeySearch()" />
        </div>
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
          <button type="button" class="pagination-btn" id="statsPrevBtn" onclick="changeStatsPage(-1)" aria-label="Previous analytics page" title="Previous">${renderKrixGraphic("chevronLeft", 17)}</button>
          <button type="button" class="pagination-btn" id="statsNextBtn" onclick="changeStatsPage(1)" aria-label="Next analytics page" title="Next">${renderKrixGraphic("chevronRight", 17)}</button>
        </div>
      </div>
    </div>
  </div>

  ${renderFooter()}

  <script>
    let dailyData = ${JSON.stringify(summary.dailyTimeline)};
    let weeklyData = ${JSON.stringify(summary.weeklyTimeline)};
    let monthlyData = ${JSON.stringify(summary.monthlyTimeline)};

    const timelineOptions = [
      { key: 'daily', data: dailyData, button: 'btnDaily' },
      { key: 'weekly', data: weeklyData, button: 'btnWeekly' },
      { key: 'monthly', data: monthlyData, button: 'btnMonthly' }
    ];
    let currentTimeline = (timelineOptions.find(item => Array.isArray(item.data) && item.data.length > 0) || timelineOptions[0]).key;
    let dailyChunkIndex = -1;

    timelineOptions.forEach(item => {
      const button = document.getElementById(item.button);
      if (button) button.hidden = !Array.isArray(item.data) || item.data.length === 0;
    });
    const yearFilterControl = document.getElementById('yearFilter');
    if (yearFilterControl && (!Array.isArray(${JSON.stringify(summary.availableYears)} ) || ${summary.availableYears.length} <= 1)) yearFilterControl.hidden = true;
    timelineOptions.forEach(item => {
      const button = document.getElementById(item.button);
      if (button) button.classList.toggle('active', item.key === currentTimeline);
    });

    function changeDailyChunk(delta) {
      const filterYear = document.getElementById('yearFilter')?.value;
      let data = dailyData;
      if (filterYear && filterYear !== 'all') data = data.filter(d => String(d.date || '').startsWith(filterYear));
      const totalChunks = Math.max(1, Math.ceil(data.length / 10));
      if (dailyChunkIndex === -1) dailyChunkIndex = totalChunks - 1;
      dailyChunkIndex = Math.max(0, Math.min(totalChunks - 1, dailyChunkIndex + delta));
      renderChart();
    }

    function setTimeline(mode) {
      const item = timelineOptions.find(option => option.key === mode);
      if (!item || !Array.isArray(item.data) || item.data.length === 0) return;
      currentTimeline = mode;
      timelineOptions.forEach(option => {
        const button = document.getElementById(option.button);
        if (button) button.classList.toggle('active', option.key === mode);
      });
      renderChart();
    }

    function renderChart() {
      const container = document.getElementById('timelineChart');
      const chunkNav = document.getElementById('dailyChunkNav');
      if (!container) return;
      let data = currentTimeline === 'daily' ? dailyData : currentTimeline === 'weekly' ? weeklyData : monthlyData;
      const labelKey = currentTimeline === 'daily' ? 'date' : currentTimeline === 'weekly' ? 'week' : 'month';
      const filterYear = document.getElementById('yearFilter')?.value;
      if (filterYear && filterYear !== 'all') data = data.filter(d => String(d[labelKey] || '').startsWith(filterYear));

      if (currentTimeline === 'daily') {
        const totalChunks = Math.max(1, Math.ceil(data.length / 10));
        if (dailyChunkIndex === -1 || dailyChunkIndex >= totalChunks) dailyChunkIndex = totalChunks - 1;
        const startIdx = dailyChunkIndex * 10;
        const endIdx = Math.min(startIdx + 10, data.length);
        const range = document.getElementById('lblDailyChunkRange');
        const previous = document.getElementById('btnPrevDailyChunk');
        const next = document.getElementById('btnNextDailyChunk');
        if (range) range.textContent = data.length ? (startIdx + 1) + '–' + endIdx : 'No days';
        if (previous) previous.disabled = dailyChunkIndex <= 0;
        if (next) next.disabled = dailyChunkIndex >= totalChunks - 1;
        if (chunkNav) chunkNav.style.display = data.length > 10 ? 'inline-flex' : 'none';
        data = data.slice(startIdx, endIdx);
      } else if (chunkNav) chunkNav.style.display = 'none';

      if (!data || data.length === 0) {
        container.innerHTML = '<div class="timeline-empty">No activity data for this selection</div>';
        return;
      }

      const totals = data.map(d => Math.max(0, Number(d.requests) || 0));
      const maxVal = Math.max(1, ...totals);
      const width = Math.max(280, Math.floor(container.clientWidth || container.getBoundingClientRect().width || 320));
      const height = 190;
      const pad = { top: 12, right: 8, bottom: 34, left: 38 };
      const plotWidth = Math.max(1, width - pad.left - pad.right);
      const plotHeight = height - pad.top - pad.bottom;
      const slot = plotWidth / data.length;
      const barWidth = Math.max(7, Math.min(28, slot * .52));
      let svg = '<svg role="img" aria-label="Activity requests by ' + currentTimeline + ' period" width="100%" height="190" viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none" style="display:block;width:100%;height:190px;">';
      svg += '<defs>';
      data.forEach((d, i) => {
        const total = Math.max(0, Number(d.requests) || 0);
        const errors = Math.min(total, Math.max(0, Number(d.errors) || 0));
        const ratio = total ? errors / total : 0;
        const split = Math.max(0, Math.min(100, ratio * 100));
        svg += '<linearGradient id="timelineBar' + i + '" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#ef4444"/><stop offset="' + split + '%" stop-color="#ef4444"/><stop offset="' + split + '%" stop-color="#10b981"/><stop offset="100%" stop-color="#10b981"/></linearGradient>';
      });
      svg += '</defs>';
      [0, .25, .5, .75, 1].forEach(ratio => {
        const y = pad.top + plotHeight - ratio * plotHeight;
        const value = Math.round(maxVal * ratio);
        svg += '<line x1="' + pad.left + '" y1="' + y + '" x2="' + (width - pad.right) + '" y2="' + y + '" stroke="var(--border)" stroke-width="1"/>';
        svg += '<text x="' + (pad.left - 7) + '" y="' + (y + 3.5) + '" fill="var(--accents-5)" text-anchor="end" font-size="9">' + value + '</text>';
      });
      data.forEach((d, i) => {
        const total = Math.max(0, Number(d.requests) || 0);
        const errors = Math.min(total, Math.max(0, Number(d.errors) || 0));
        const success = d.success !== undefined ? Math.max(0, Number(d.success) || 0) : Math.max(0, total - errors);
        const barHeight = total ? Math.max(2, (total / maxVal) * plotHeight) : 0;
        const x = pad.left + i * slot + (slot - barWidth) / 2;
        const y = pad.top + plotHeight - barHeight;
        const raw = String(d[labelKey] || '');
        const display = raw.includes('-') ? raw.split('-').slice(1).join('/') : raw;
        const label = display.length > 8 ? display.slice(0, 8) : display;
        if (total > 0) {
          svg += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + barWidth.toFixed(1) + '" height="' + barHeight.toFixed(1) + '" rx="3" fill="url(#timelineBar' + i + ')"/>';
        } else {
          svg += '<line x1="' + x.toFixed(1) + '" y1="' + (pad.top + plotHeight) + '" x2="' + (x + barWidth).toFixed(1) + '" y2="' + (pad.top + plotHeight) + '" stroke="var(--accents-3)" stroke-width="2"/>';
        }
        svg += '<text x="' + (x + barWidth / 2).toFixed(1) + '" y="' + (height - 12) + '" text-anchor="middle" font-size="9" fill="var(--accents-5)">' + label + '</text>';
        svg += '<title>' + raw.replace(/&/g, '&amp;').replace(/</g, '&lt;') + ': ' + total + ' requests (' + success + ' successful, ' + errors + ' errors)</title>';
      });
      svg += '</svg>';
      container.innerHTML = svg;
    }
    renderChart();
    if (window.ResizeObserver) {
      const timelineResizeObserver = new ResizeObserver(() => renderChart());
      const timelineNode = document.getElementById('timelineChart');
      if (timelineNode && timelineNode.parentElement) timelineResizeObserver.observe(timelineNode.parentElement);
    } else window.addEventListener('resize', renderChart);

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

    function toggleCustomKeyDropdown(id) {
      const menu = document.getElementById(id + 'Menu');
      const trigger = document.getElementById(id + 'Trigger');
      if (!menu) return;
      const isOpen = menu.classList.contains('open');
      document.querySelectorAll('.custom-select-menu.open').forEach(m => m.classList.remove('open'));
      if (!isOpen) {
        menu.classList.add('open');
        if (trigger) trigger.setAttribute('aria-expanded', 'true');
      } else {
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      }
    }

    function selectCustomKey(id, val) {
      const sel = document.getElementById(id);
      if (sel) {
        sel.value = val;
        onKeyFilterChange(sel);
      }
    }

    document.addEventListener('click', function(e) {
      if (!e.target.closest('.custom-select-wrap')) {
        document.querySelectorAll('.custom-select-menu.open').forEach(m => m.classList.remove('open'));
        document.querySelectorAll('.custom-select-btn[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
      }
    });

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
    let statsFilterQuery = '';

    function handleStatsKeySearch() {
      const input = document.getElementById('statsKeySearchInput');
      statsFilterQuery = (input ? input.value : '').toLowerCase().trim();
      statsCurrentPage = 1;
      renderStatsPagination();
    }

    function renderStatsPagination() {
      const allRows = Array.from(document.querySelectorAll('#statsKeysTableBody tr.stats-key-row'));
      const matchingRows = allRows.filter(r => {
        if (!statsFilterQuery) return true;
        return r.textContent.toLowerCase().includes(statsFilterQuery);
      });
      allRows.forEach(r => { r.style.display = 'none'; });

      const total = matchingRows.length;
      const totalPages = Math.max(1, Math.ceil(total / STATS_PER_PAGE));
      if (statsCurrentPage > totalPages) statsCurrentPage = totalPages;
      if (statsCurrentPage < 1) statsCurrentPage = 1;

      const start = (statsCurrentPage - 1) * STATS_PER_PAGE;
      const end = start + STATS_PER_PAGE;

      matchingRows.forEach((r, idx) => {
        r.style.display = (idx >= start && idx < end) ? '' : 'none';
      });

      const indicator = document.getElementById('statsPageIndicator');
      if (indicator) {
        indicator.textContent = total > 0 ? ('Showing ' + (start + 1) + '–' + Math.min(end, total) + ' of ' + total + ' keys' + (statsFilterQuery ? ' (filtered)' : '')) : 'No matching keys';
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
    }

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
  shareUrl?: string;
  isPublic?: boolean;
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
  <title>Store</title>
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
  <title>Store</title>
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
    <div class="page-heading">
      <div>
        <span class="krix-eyebrow">Cloud and workspace storage</span>
        <h1>Sandbox &amp; Cloud Store</h1>
        <p>Manage persistent and temporary files associated with this account.</p>
      </div>

      <div class="page-actions">
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
        <div style="font-size:12px; color:var(--accents-5);">${usage ? formatBytes(usage.bytes) + " in Cloud Store" : "Direct access"}</div>
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
                      const isPublic = f.isPublic !== false;
                      const dateStr = f.createdAt
                        ? new Date(f.createdAt).toLocaleDateString()
                        : "N/A";
                      const expiresStr = isPerm
                        ? "Permanent"
                        : f.expiresAt
                          ? new Date(f.expiresAt).toLocaleDateString()
                          : "60m TTL";
                      const shareLink =
                        f.shareUrl ||
                        f.downloadUrl ||
                        (f.id ? `${base}/store/download/${f.id}` : "#");
                      return `
              <tr class="store-file-row" id="file-row-${escapeHtml(f.id)}" data-id="${escapeHtml(f.id)}" data-name="${escapeHtml(f.name)}" data-perm="${isPerm ? "true" : "false"}" data-size="${f.size || 0}" data-source="${escapeHtml(f.source)}" data-url="${escapeHtml(shareLink)}">
                <td>
                  <div style="font-weight:600; font-family:ui-monospace, monospace; color:var(--fg); font-size:13px; word-break:break-all;" id="file-name-text-${escapeHtml(f.id)}">
                    ${escapeHtml(f.name)}
                  </div>
                  <div style="display:flex; align-items:center; gap:6px; margin-top:3px;">
                    <span style="font-size:11px; color:var(--accents-5);">${escapeHtml(f.contentType)}</span>
                    <span class="badge ${isPublic ? "success" : ""}" id="privacy-badge-${escapeHtml(f.id)}">${isPublic ? "Public" : "Private"}</span>
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
                      <button type="button" class="kebab-item" data-action="copy" data-url="${escapeHtml(shareLink)}" role="menuitem">
                        ${renderSvg("copy", 14)} Copy URL
                      </button>
                      <button type="button" class="kebab-item" id="privacy-btn-${escapeHtml(f.id)}" data-action="toggle-privacy" data-file-id="${escapeHtml(f.id)}" data-public="${isPublic ? "true" : "false"}" role="menuitem">
                        <span id="privacy-icon-${escapeHtml(f.id)}">${isPublic ? renderSvg("lock", 14) : renderSvg("globe", 14)}</span>
                        <span id="privacy-text-${escapeHtml(f.id)}">${isPublic ? "Make Private" : "Make Public"}</span>
                      </button>
                      <a href="${escapeHtml(shareLink)}" download class="kebab-item" role="menuitem">
                        ${renderSvg("download", 14)} Download File
                      </a>
                      ${
                        f.source !== "sandbox"
                          ? `
                      <button type="button" class="kebab-item" id="perm-btn-${escapeHtml(f.id)}" data-action="toggle-perm" data-file-id="${escapeHtml(f.id)}" data-perm="${isPerm ? "true" : "false"}" title="${isPerm ? "Revert" : "Keep"}" aria-label="${isPerm ? "Revert" : "Keep"}" role="menuitem">
                        <span id="perm-icon-${escapeHtml(f.id)}">${isPerm ? renderSvg("clock", 14) : renderSvg("shield", 14)}</span>
                        <span id="perm-text-${escapeHtml(f.id)}">${isPerm ? "Revert" : "Keep"}</span>
                      </button>
                      `
                          : ""
                      }
                      <button type="button" class="kebab-item" data-action="rename" data-file-id="${escapeHtml(f.id)}" data-file-name="${escapeHtml(f.name)}" data-source="${escapeHtml(f.source)}" role="menuitem">
                        ${renderSvg("edit", 14)} Rename
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
          <button type="button" class="pagination-btn" id="storePrevBtn" onclick="changeStorePage(-1)" aria-label="Previous store page" title="Previous">${renderKrixGraphic("chevronLeft", 17)}</button>
          <button type="button" class="pagination-btn" id="storeNextBtn" onclick="changeStorePage(1)" aria-label="Next store page" title="Next">${renderKrixGraphic("chevronRight", 17)}</button>
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

    function closeStoreKebabDropdown(dropdown) {
      if (!dropdown) return;
      dropdown.classList.remove('open', 'pop-up');
      dropdown.style.position = '';
      dropdown.style.top = '';
      dropdown.style.left = '';
      dropdown.style.right = '';
      dropdown.style.bottom = '';
      dropdown.style.zIndex = '';
      dropdown.style.maxHeight = '';
      dropdown.style.overflowY = '';
      const placeholder = dropdown.__kebabPlaceholder;
      if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.insertBefore(dropdown, placeholder);
        placeholder.remove();
      }
      dropdown.__kebabPlaceholder = null;
    }

    function closeAllKebabMenus() {
      document.querySelectorAll('.kebab-dropdown.open').forEach(closeStoreKebabDropdown);
    }

    function openStoreKebabDropdown(menu, trigger) {
      if (!menu || !trigger) return;
      const placeholder = document.createComment('kebab-menu-placeholder');
      menu.parentNode.insertBefore(placeholder, menu);
      menu.__kebabPlaceholder = placeholder;
      document.body.appendChild(menu);
      menu.style.position = 'fixed';
      menu.style.zIndex = '2147483647';
      menu.style.right = 'auto';
      menu.style.bottom = 'auto';
      menu.style.maxHeight = 'calc(100vh - 16px)';
      menu.style.overflowY = 'auto';
      menu.classList.add('open');

      menu.style.width = 'max-content';
      menu.style.minWidth = 'min(210px, calc(100vw - 16px))';
      menu.style.maxWidth = 'calc(100vw - 16px)';
      menu.style.boxSizing = 'border-box';
      const rect = trigger.getBoundingClientRect();
      const viewportWidth = Math.max(240, document.documentElement.clientWidth || window.innerWidth);
      const menuWidth = Math.min(menu.getBoundingClientRect().width || 210, viewportWidth - 16);
      const menuHeight = Math.min(menu.offsetHeight, window.innerHeight - 16);
      menu.style.width = menuWidth + 'px';
      const left = Math.max(8, Math.min(rect.right - menuWidth, viewportWidth - menuWidth - 8));
      let top = rect.bottom + 6;
      if (top + menuHeight > window.innerHeight - 8) top = rect.top - menuHeight - 6;
      top = Math.max(8, Math.min(top, window.innerHeight - menuHeight - 8));
      menu.style.left = left + 'px';
      menu.style.top = top + 'px';
    }

    window.addEventListener('scroll', closeAllKebabMenus, { passive: true });
    window.addEventListener('resize', closeAllKebabMenus);

    document.addEventListener('click', (e) => {
      if (e.target.closest('.kebab-dropdown')) {
        if (e.target.closest('.kebab-item')) closeAllKebabMenus();
        return;
      }
      if (!e.target.closest('.kebab-wrap')) closeAllKebabMenus();
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
      document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('[data-action="toggle-menu"]');
        if (toggleBtn) {
          e.stopPropagation();
          const fileId = toggleBtn.getAttribute('data-file-id');
          const menu = document.getElementById('kebab-menu-' + fileId);
          if (menu) {
            const wasOpen = menu.classList.contains('open');
            closeAllKebabMenus();
            if (!wasOpen) openStoreKebabDropdown(menu, toggleBtn);
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

        const privBtn = e.target.closest('[data-action="toggle-privacy"]');
        if (privBtn) {
          e.stopPropagation();
          closeAllKebabMenus();
          const fileId = privBtn.getAttribute('data-file-id');
          const isPub = privBtn.getAttribute('data-public') === 'true';
          toggleFilePrivacy(fileId, !isPub);
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

    async function toggleFilePrivacy(id, makePublic) {
      const btn = document.getElementById('privacy-btn-' + id);
      if (btn) btn.disabled = true;
      try {
        const res = await fetch('/store/files/' + encodeURIComponent(id) + '/privacy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublic: makePublic })
        });
        const data = await res.json();
        if (res.ok) {
          if (btn) {
            btn.setAttribute('data-public', makePublic ? 'true' : 'false');
            const txt = document.getElementById('privacy-text-' + id);
            if (txt) txt.textContent = makePublic ? 'Make Private' : 'Make Public';
            const icon = document.getElementById('privacy-icon-' + id);
            if (icon) {
              icon.innerHTML = makePublic
                ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>'
                : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>';
            }
          }
          const badge = document.getElementById('privacy-badge-' + id);
          if (badge) {
            badge.textContent = makePublic ? 'Public' : 'Private';
            if (makePublic) badge.classList.add('success');
            else badge.classList.remove('success');
          }
          showToast(makePublic ? 'File link is now Public' : 'File link is now Private (requires authentication)', 'success');
        } else {
          showToast(data.error || 'Failed to update file privacy', 'error');
        }
      } catch (err) {
        showToast('Network error: ' + err.message, 'error');
      } finally {
        if (btn) btn.disabled = false;
      }
    }
    window.toggleFilePrivacy = toggleFilePrivacy;

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
            if (txt) txt.textContent = makePerm ? 'Revert' : 'Keep';
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

    window.togglePermanent = togglePermanent;
    window.openDeleteFileModal = openDeleteFileModal;
    window.closeStoreModal = closeStoreModal;
    window.openStoreRenameModal = openStoreRenameModal;
    window.copyFileUrl = copyFileUrl;

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllKebabMenus();
        closeStoreModal();
        closeStoreRenameModal();
      }
    });

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
  const nonce = params.nonce;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>404 · Page not found</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#000000">
  <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2">
  <style>
    * { box-sizing:border-box; }
    html,body { min-height:100%;margin:0;background:#000;color:#fafafa;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    body { min-height:100svh;display:grid;place-items:center;padding:24px;background:#000; }
    .not-found { width:min(100%,460px);text-align:center;padding:clamp(24px,6vw,44px);border:1px solid #292929;border-radius:10px;background:#050505; }
    .not-found-code { margin:0 0 12px;font-size:clamp(64px,18vw,92px);line-height:.95;letter-spacing:-.075em;font-weight:750; }
    .not-found-message { margin:0 0 24px;color:#a1a1aa;font-size:15px;line-height:1.6; }
    .not-found-home { width:100%;min-height:46px;display:inline-flex;align-items:center;justify-content:center;padding:12px 18px;border:1px solid #fafafa;border-radius:7px;background:#fafafa;color:#09090b;text-decoration:none;font-size:14px;font-weight:650; }
    .not-found-home:focus-visible { outline:2px solid #a1a1aa;outline-offset:3px; }
    @media (prefers-reduced-motion:no-preference) { .not-found-home { transition:background-color .15s ease,color .15s ease; } .not-found-home:hover { background:#d4d4d8;border-color:#d4d4d8; } }
  </style>
</head>
<body>
  <main class="not-found" aria-labelledby="notFoundTitle">
    <h1 class="not-found-code" id="notFoundTitle">404</h1>
    <p class="not-found-message">This page doesn't exist.</p>
    <a class="not-found-home" href="/home">Back to home</a>
  </main>
</body>
</html>`;
}

export function renderSettingsPage(params: {
  base: string;
  isOwner: boolean;
  owner: OwnerProfile | null;
  keys: Array<{
    id: string;
    label?: string;
    prefix?: string;
    role?: string;
    email?: string;
  }>;
  selectedKeyId: string;
  keySettings: KeySettings;
  toolsCatalog: ToolDetailMeta[];
  userQuota: UserQuotaConfig;
  nonce?: string;
}): string {
  const {
    base,
    isOwner,
    owner,
    keys,
    selectedKeyId,
    keySettings,
    toolsCatalog,
    userQuota,
    nonce,
  } = params;

  if (!owner) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Settings</title>
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
  ${renderHeader("settings", owner, nonce)}
  <div class="wrapper">
    ${renderAuthRequiredCard("Settings & Key Management", "/settings")}
  </div>
  ${renderFooter()}
</body>
</html>`;
  }

  const isServerOwner = userQuota.role === "owner";
  const maskedGitHub = maskSecret(keySettings.customGitHubToken);
  const maskedRender = maskSecret(keySettings.customRenderToken);

  const enabledSet = new Set(keySettings.enabledTools || []);
  const disabledSet = new Set(keySettings.disabledTools || []);

  const isToolActive = (t: ToolDetailMeta): boolean => {
    if (disabledSet.has(t.name)) return false;
    const explicit = enabledSet.has(t.name);
    const categoryDefault = t.category !== "Code Graph" && t.category !== "Search";
    const risk = keySettings.toolRiskLevels?.[t.name] || getDefaultToolRiskLevel(t.name, t.category);
    const acknowledged = keySettings.riskAcknowledgedTools?.includes(t.name) || false;
    if ((risk === "high" || risk === "critical") && !acknowledged) return false;
    return explicit || categoryDefault;
  };

  const codeGraphCount = toolsCatalog.filter(
    (t) => t.category === "Code Graph" || t.category === "Search",
  ).length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Settings</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2">
  <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png?v=2">
  <style>
    ${getBaseStyles()}

    .settings-header {
      margin: 20px 0 28px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .settings-title {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: var(--fg);
    }
    .settings-desc {
      font-size: 13px;
      color: var(--accents-5);
      margin-top: 2px;
    }
    .settings-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
      margin-bottom: 32px;
    }
    @media (min-width: 900px) {
      .settings-grid-split {
        grid-template-columns: 1fr 1fr;
      }
    }
    .section-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--fg);
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-desc {
      font-size: 12px;
      color: var(--accents-5);
      margin-bottom: 16px;
      line-height: 1.5;
    }
    .field-group {
      margin-bottom: 16px;
    }
    .field-label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: var(--accents-6);
      margin-bottom: 6px;
    }
    .secret-input-wrap {
      display: flex;
      position: relative;
      align-items: center;
    }
    .secret-input-wrap input {
      padding-right: 84px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      font-family: ui-monospace, monospace;
      font-size: 13px;
    }
    .secret-actions {
      position: absolute;
      right: 6px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .icon-btn {
      background: none;
      border: none;
      padding: 6px;
      color: var(--accents-4);
      cursor: pointer;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s ease, background-color 0.15s ease;
    }
    .icon-btn:hover {
      color: var(--fg);
      background-color: var(--accents-2);
    }

    /* Geist Switch Toggle */
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 36px;
      height: 20px;
      flex-shrink: 0;
    }
    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: var(--accents-2);
      border: 1px solid var(--border);
      transition: .15s ease;
      border-radius: 20px;
    }
    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: 2px;
      bottom: 2px;
      background-color: var(--accents-5);
      transition: .15s ease;
      border-radius: 50%;
    }
    input:checked + .toggle-slider {
      background-color: var(--fg);
      border-color: var(--fg);
    }
    input:checked + .toggle-slider:before {
      transform: translateX(16px);
      background-color: var(--bg);
    }

    .tools-manager-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .tool-perm-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      gap: 12px;
      transition: background-color 0.1s ease;
    }
    .tool-perm-row:hover {
      background-color: var(--accents-1);
    }
    .tool-perm-row:last-child {
      border-bottom: none;
    }
    .tool-perm-info {
      flex: 1;
      min-width: 0;
    }
    .tool-perm-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--fg);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tool-perm-desc {
      font-size: 12px;
      color: var(--accents-5);
      margin-top: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tier-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .tier-badge.owner {
      background: var(--fg);
      color: var(--bg);
    }
    .tier-badge.member {
      background: var(--accents-2);
      color: var(--accents-7);
      border: 1px solid var(--border);
    }
    .resource-stat-box {
      background: var(--accents-1);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .resource-stat-label {
      font-size: 11px;
      color: var(--accents-5);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    .resource-stat-value {
      font-size: 16px;
      font-weight: 700;
      color: var(--fg);
    }
    .resource-stat-sub {
      font-size: 11px;
      color: var(--accents-4);
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
  ${renderHeader("settings", owner, nonce)}

  <div class="wrapper">
    <div class="settings-header page-heading">
      <div>
        <span class="krix-eyebrow">Account controls</span>
        <h1 class="settings-title">Account & Key Settings</h1>
        <p class="settings-desc">
          Configure per-user credentials, isolated sandboxes, and granular tool permissions for every API key and OAuth client.
        </p>
      </div>

      <div style="display:flex; align-items:center; gap:8px;">
        <a href="/tools" class="btn" style="font-size:12px;">Browse Tools</a>
      </div>
    </div>

    <nav class="settings-tabs" aria-label="Settings sections">
      <a href="#resources">Overview</a>
      <a href="#integrations">Integrations</a>
      <a href="#permissions">Tool permissions</a>
    </nav>

    <!-- Resource Allocation & Quotas Card -->
    <div id="resources" class="card" style="margin-bottom:24px;">
      <div class="section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
          <line x1="6" y1="6" x2="6.01" y2="6"></line>
          <line x1="6" y1="18" x2="6.01" y2="18"></line>
        </svg>
        <span>Hardware & Quota Distribution</span>
      </div>
      <p class="section-desc">
        ${
          isServerOwner
            ? "Your account's configured sandbox and request limits are shown below."
            : "Your account has an isolated sandbox with the configured storage and request limits shown below."
        }
      </p>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-top:12px;">
        <div class="resource-stat-box">
          <span class="resource-stat-label">Total Storage Quota</span>
          <span class="resource-stat-value">${userQuota.maxTotalMb} MB</span>
          <span class="resource-stat-sub">Across stored files and workspace data</span>
        </div>
        <div class="resource-stat-box">
          <span class="resource-stat-label">File Upload Max</span>
          <span class="resource-stat-value">${userQuota.maxFileMb} MB</span>
          <span class="resource-stat-sub">Per file limit</span>
        </div>
        <div class="resource-stat-box">
          <span class="resource-stat-label">Process Capacity</span>
          <span class="resource-stat-value">${userQuota.ulimitProc} PIDs</span>
          <span class="resource-stat-sub">Configured process limit</span>
        </div>
        <div class="resource-stat-box">
          <span class="resource-stat-label">Rate Limiter</span>
          <span class="resource-stat-value">${userQuota.rateLimitPerMin} req/min</span>
          <span class="resource-stat-sub">${userQuota.maxOutputBytes / 1024} KB max output</span>
        </div>
      </div>
    </div>

    <!-- Active Key / Client Selector Bar -->
    <div class="card" style="margin-bottom:24px; padding:16px 20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <label for="settingKeySelector" style="font-size:13px; font-weight:600; color:var(--fg); display:block; margin-bottom:2px;">
            Target API Key or Client
          </label>
          <span style="font-size:12px; color:var(--accents-5);">
            Select which API key or OAuth authorization you are configuring:
          </span>
        </div>

        <div class="setting-key-select-wrap">
          <select id="settingKeySelector" onchange="onSettingKeyChange(this)" aria-label="Target API key" class="setting-key-native">
            ${keys.map(k => `<option value="${escapeHtml(k.id)}" ${k.id === selectedKeyId ? "selected" : ""}>${escapeHtml(k.label || k.id)}${k.prefix ? ` (${escapeHtml(k.prefix)})` : ""}</option>`).join("")}
          </select>
          <button type="button" class="setting-key-trigger" id="settingKeyTrigger" aria-haspopup="listbox" aria-expanded="false" onclick="toggleSettingKeyMenu()">
            <span id="settingKeySelectedLabel">${escapeHtml((keys.find(k => k.id === selectedKeyId)?.label || keys.find(k => k.id === selectedKeyId)?.id || 'Select a key'))}</span>
            ${renderKrixGraphic("chevronDown", 16)}
          </button>
          <div class="setting-key-menu" id="settingKeyMenu" role="listbox" aria-label="API keys">
            ${keys.map(k => `<button type="button" role="option" aria-selected="${k.id === selectedKeyId}" class="setting-key-option" data-key-id="${escapeHtml(k.id)}" onclick="selectSettingKey('${escapeHtml(k.id)}')"><span>${escapeHtml(k.label || k.id)}</span><small>${escapeHtml(k.prefix || k.id.slice(0, 8))}</small></button>`).join("")}
          </div>
        </div>
      </div>
    </div>

    <!-- Custom API Credentials Card -->
    <div id="integrations" class="card" style="margin-bottom:24px;">
      <div class="section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span>Per-Key Custom Credentials</span>
      </div>
      <p class="section-desc">
        Optionally configure custom GitHub Personal Access Tokens and Render API keys for this specific key. When an agent calls Krix with this key, it automatically authenticates against your personal accounts instead of server defaults.
      </p>

      <form id="credentialsForm" onsubmit="saveCredentials(event)">
        <div class="credentials-grid">
        <div class="field-group">
          <label class="field-label" for="customGithubInput">GitHub Personal Access Token (PAT)</label>
          <div class="secret-input-wrap">
            <input
              type="password"
              id="customGithubInput"
              name="githubToken"
              value=""
              placeholder="Enter a new token to replace the saved credential"
              autocomplete="off"
              spellcheck="false"
            >
            <div class="secret-actions">
              <button type="button" class="icon-btn" onclick="copySecretField('customGithubInput')" title="Copy token" aria-label="Copy GitHub token">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="8" width="13" height="13" rx="2"></rect><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"></path></svg>
              </button>
              <button type="button" class="icon-btn" onclick="toggleInputVisibility('customGithubInput')" title="Show / Hide token" aria-label="Toggle GitHub token visibility">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
            </div>
          </div>
          <span id="githubCredentialStatus" class="credential-status" style="font-size:11px; color:var(--accents-5); margin-top:7px; display:block;">
            ${keySettings.customGitHubToken ? `Saved GitHub credential · <code>${maskedGitHub}</code>. The secret itself stays server-side.` : "No GitHub token saved for this key. Add a token to enable GitHub access."}
          </span>
          ${keySettings.customGitHubToken ? `<button type="button" class="credential-remove-btn" onclick="deleteCredential('github')">${renderKrixGraphic("trash", 13)} Remove GitHub credential</button>` : ""}
        </div>

        <div class="field-group">
          <label class="field-label" for="customRenderInput">Render Cloud API Key</label>
          <div class="secret-input-wrap">
            <input
              type="password"
              id="customRenderInput"
              name="renderToken"
              value=""
              placeholder="Enter a new key to replace the saved credential"
              autocomplete="off"
              spellcheck="false"
            >
            <div class="secret-actions">
              <button type="button" class="icon-btn" onclick="copySecretField('customRenderInput')" title="Copy key" aria-label="Copy Render key">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="8" width="13" height="13" rx="2"></rect><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"></path></svg>
              </button>
              <button type="button" class="icon-btn" onclick="toggleInputVisibility('customRenderInput')" title="Show / Hide token" aria-label="Toggle Render API key visibility">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
            </div>
          </div>
          <span id="renderCredentialStatus" class="credential-status" style="font-size:11px; color:var(--accents-5); margin-top:7px; display:block;">
            ${keySettings.customRenderToken ? `Saved Render credential · <code>${maskedRender}</code>. The secret itself stays server-side.` : "No Render key saved for this key. Add a key to enable Render access."}
          </span>
          ${keySettings.customRenderToken ? `<button type="button" class="credential-remove-btn" onclick="deleteCredential('render')">${renderKrixGraphic("trash", 13)} Remove Render credential</button>` : ""}
        </div>

        </div>
        <div class="credentials-form-actions">
          <button type="submit" class="btn primary" id="saveCredsBtn" style="font-size:12px; padding:6px 16px;">
            Save Credentials
          </button>
        </div>
      </form>
    </div>

    <!-- Granular Tool Permissions Card -->
    <div id="permissions" class="card" style="margin-bottom:32px;">
      <div class="section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
        <span>Granular Tool Permissions & Code Graph</span>
      </div>
      <p class="section-desc">
        Select which tools are enabled for this key. <strong>Code Graph Context (${codeGraphCount} tools)</strong> and <strong>Web Search</strong> are disabled by default for maximum security; toggle individual tools below to enable them for your agent.
      </p>

      <div class="visual-card" style="margin-bottom:14px;display:flex;align-items:center;gap:12px;">
        <span class="graphic-tile accent">${renderKrixGraphic("shield", 21)}</span>
        <div><div class="visual-card-title" style="margin:0;">Per-tool risk policy</div><div class="visual-card-desc">High and Critical tools remain unavailable until you explicitly acknowledge the risk. The server enforces this policy for this key.</div></div>
      </div>
      <div class="tools-manager-bar">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <input
            type="search"
            id="toolSearchInput"
            placeholder="Search tools by name or description…"
            oninput="filterToolRows()"
            style="font-size:12px; padding:6px 12px; border-radius:6px; min-width:240px; background:var(--input-bg); color:var(--fg); border:1px solid var(--border);"
          >
          <div class="pill-group">
            <button type="button" class="pill-btn active" data-filter="All" onclick="setToolCatFilter('All', this)">All (${toolsCatalog.length})</button>
            <button type="button" class="pill-btn" data-filter="Code Graph" onclick="setToolCatFilter('Code Graph', this)">Code Graph (${codeGraphCount})</button>
            <button type="button" class="pill-btn" data-filter="Sandbox" onclick="setToolCatFilter('Sandbox', this)">Sandbox</button>
            <button type="button" class="pill-btn" data-filter="Render" onclick="setToolCatFilter('Render', this)">Render</button>
            <button type="button" class="pill-btn" data-filter="GitHub" onclick="setToolCatFilter('GitHub', this)">GitHub</button>
            <button type="button" class="pill-btn" data-filter="Files" onclick="setToolCatFilter('Files', this)">Files</button>
          </div>
        </div>

        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button type="button" class="btn" onclick="batchToggleCodeGraph(true)" style="font-size:11px; padding:4px 10px;">
            Enable Code Graph (${codeGraphCount})
          </button>
          <button type="button" class="btn" onclick="batchToggleCodeGraph(false)" style="font-size:11px; padding:4px 10px;">
            Disable Code Graph
          </button>
          <button type="button" class="btn" onclick="resetToolDefaults()" style="font-size:11px; padding:4px 10px;">
            Reset Defaults
          </button>
        </div>
      </div>

      <div style="border:1px solid var(--border); border-radius:8px; overflow:hidden;" id="toolsListContainer">
        ${toolsCatalog
          .map((t) => {
            const active = isToolActive(t);
            const isCodeGraph = t.category === "Code Graph" || t.category === "Search";
            const riskLevel = keySettings.toolRiskLevels?.[t.name] || getDefaultToolRiskLevel(t.name, t.category);
            const riskAcknowledged = keySettings.riskAcknowledgedTools?.includes(t.name) || false;
            return `
          <div class="tool-perm-row" data-name="${escapeHtml(t.name.toLowerCase())}" data-category="${escapeHtml(t.category)}" data-desc="${escapeHtml(t.description.toLowerCase())}" data-risk="${riskLevel}">
            <div class="tool-perm-info">
              <div class="tool-perm-name">
                <span>${escapeHtml(t.name)}</span>
                <span class="badge ${isCodeGraph ? "primary" : ""}">${escapeHtml(t.category)}</span>
                ${isCodeGraph ? '<span class="badge" style="font-size:10px;">CGC Engine</span>' : ""}
              </div>
              <div class="tool-perm-desc" title="${escapeHtml(t.description)}">
                ${escapeHtml(t.description)}
              </div>
            </div>

            <div class="tool-risk-control">
              <span class="risk-pill risk-${riskLevel}" title="Current risk tier">${riskLevel.toUpperCase()}${(riskLevel === "high" || riskLevel === "critical") && !riskAcknowledged ? " · ACK NEEDED" : ""}</span>
              <select class="tool-risk-select" data-risk-tool="${escapeHtml(t.name)}" aria-label="Risk tier for ${escapeHtml(t.name)}" onchange="onToolRiskChange(this, '${escapeHtml(t.name)}')">
                ${(["safe","low","moderate","high","critical"] as const).map((level) => `<option value="${level}" ${riskLevel === level ? "selected" : ""}>${level.charAt(0).toUpperCase()+level.slice(1)} risk</option>`).join("")}
              </select>
              <label class="toggle-switch" title="Toggle ${escapeHtml(t.name)}">
                <input type="checkbox" data-tool="${escapeHtml(t.name)}" ${active ? "checked" : ""} onchange="onToolToggle(this, '${escapeHtml(t.name)}')">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        `;
          })
          .join("")}
      </div>
      <div class="tool-permission-pagination" id="toolPermissionPagination" hidden>
        <span id="toolPermissionPageLabel" aria-live="polite"></span>
        <div class="pagination-controls">
          <button type="button" class="pagination-btn" id="toolPermissionPrev" aria-label="Previous tools" onclick="changeToolPermissionPage(-1)">${renderKrixGraphic("chevronLeft", 17)}</button>
          <button type="button" class="pagination-btn" id="toolPermissionNext" aria-label="Next tools" onclick="changeToolPermissionPage(1)">${renderKrixGraphic("chevronRight", 17)}</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast Notification Container -->
  <div id="settingsToast" style="display:none; position:fixed; bottom:24px; right:24px; z-index:9999; background:var(--fg); color:var(--bg); padding:10px 18px; border-radius:8px; font-size:13px; font-weight:500; box-shadow:0 8px 24px rgba(0,0,0,0.3); transition:all 0.2s ease;">
  </div>

  ${renderFooter()}

  <script>
    const currentKeyId = ${JSON.stringify(selectedKeyId)};

    function showToast(msg, isError = false) {
      const el = document.getElementById('settingsToast');
      if (!el) return;
      el.textContent = msg;
      el.style.background = isError ? '#e00' : 'var(--fg)';
      el.style.color = isError ? '#fff' : 'var(--bg)';
      el.style.display = 'block';
      setTimeout(() => { el.style.display = 'none'; }, 3000);
    }

    function toggleSettingKeyMenu() {
      const menu = document.getElementById('settingKeyMenu');
      const trigger = document.getElementById('settingKeyTrigger');
      if (!menu || !trigger) return;
      const opening = !menu.classList.contains('open');
      document.querySelectorAll('.setting-key-menu.open').forEach(el => el.classList.remove('open'));
      menu.classList.toggle('open', opening);
      trigger.setAttribute('aria-expanded', String(opening));
    }
    function selectSettingKey(id) {
      const select = document.getElementById('settingKeySelector');
      if (!select) return;
      select.value = id;
      onSettingKeyChange(select);
    }
    document.addEventListener('click', function(event) {
      if (!event.target.closest('.setting-key-select-wrap')) {
        document.getElementById('settingKeyMenu')?.classList.remove('open');
        document.getElementById('settingKeyTrigger')?.setAttribute('aria-expanded', 'false');
      }
    });
    function onSettingKeyChange(selectEl) {
      const val = selectEl.value;
      const url = new URL(window.location.href);
      url.searchParams.set('key', val);
      window.location.href = url.toString();
    }

    function toggleInputVisibility(id) {
      const el = document.getElementById(id);
      if (!el) return;
      el.type = el.type === 'password' ? 'text' : 'password';
    }

    async function copySecretField(id) {
      const el = document.getElementById(id);
      if (!el || !el.value) {
        alert('Enter a new credential before copying it. Saved credentials are never exposed again.');
        return;
      }
      try {
        await navigator.clipboard.writeText(el.value);
      } catch {
        el.focus();
        el.select();
        document.execCommand('copy');
        el.setSelectionRange(0, 0);
      }
    }

    async function deleteCredential(provider) {
      const label = provider === 'github' ? 'GitHub' : 'Render';
      if (!window.confirm('Remove the saved ' + label + ' credential from this API key? Existing tool access using this credential will stop.')) return;
      try {
        const res = await fetch('/settings/api/credentials/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({keyId:currentKeyId,provider}) });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'Credential removal failed.');
        showToast(label + ' credential removed');
        setTimeout(() => window.location.reload(), 450);
      } catch (error) { showToast(error.message || 'Credential removal failed', true); }
    }

    async function saveCredentials(e) {
      e.preventDefault();
      const btn = document.getElementById('saveCredsBtn');
      const ghInput = document.getElementById('customGithubInput');
      const rndInput = document.getElementById('customRenderInput');

      btn.disabled = true;
      btn.textContent = 'Saving…';

      try {
        const res = await fetch('/settings/api/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyId: currentKeyId,
            githubToken: ghInput.value,
            renderToken: rndInput.value
          })
        });
        const data = await res.json();
        if (data.ok) {
          showToast('Credentials saved successfully');
          if (data.maskedGitHub) document.getElementById('githubCredentialStatus').innerHTML = 'Saved GitHub credential · <code>' + data.maskedGitHub + '</code>. The secret itself stays server-side.';
          if (data.maskedRender) document.getElementById('renderCredentialStatus').innerHTML = 'Saved Render credential · <code>' + data.maskedRender + '</code>. The secret itself stays server-side.';
          ghInput.value = '';
          rndInput.value = '';
        } else {
          showToast(data.error || 'Failed to save credentials', true);
        }
      } catch (err) {
        showToast('Network error saving credentials', true);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save Credentials';
      }
    }

    async function onToolRiskChange(selectEl, toolName) {
      const riskLevel = selectEl.value;
      const needsAck = riskLevel === 'high' || riskLevel === 'critical';
      if (needsAck && !window.confirm('This classification permits a high-impact tool. You must explicitly acknowledge that calls can modify or disrupt external resources. Continue?')) {
        window.location.reload(); return;
      }
      selectEl.disabled = true;
      try {
        const res = await fetch('/settings/api/tool-risk', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({keyId:currentKeyId,toolName,riskLevel,acknowledgeHighRisk:needsAck}) });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'Could not update risk policy.');
        showToast(toolName + ' risk tier updated');
        setTimeout(() => window.location.reload(), 350);
      } catch (error) {
        showToast(error.message || 'Risk policy update failed', true);
        window.location.reload();
      } finally { selectEl.disabled = false; }
    }

    async function onToolToggle(checkboxEl, toolName) {
      const enabled = checkboxEl.checked;
      try {
        const res = await fetch('/settings/api/tool-toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyId: currentKeyId,
            toolName: toolName,
            enabled: enabled
          })
        });
        const data = await res.json();
        if (data.ok) {
          showToast(toolName + (enabled ? ' enabled' : ' disabled'));
        } else {
          checkboxEl.checked = !enabled;
          showToast(data.error || 'Failed to toggle tool', true);
        }
      } catch (err) {
        checkboxEl.checked = !enabled;
        showToast('Network error updating tool permission', true);
      }
    }

    async function batchToggleCodeGraph(enable) {
      const boxes = document.querySelectorAll('#toolsListContainer .tool-perm-row');
      const promises = [];
      boxes.forEach(row => {
        const cat = row.getAttribute('data-category');
        if (cat === 'Code Graph' || cat === 'Search') {
          const cb = row.querySelector('input[type="checkbox"]');
          if (cb && cb.checked !== enable) {
            cb.checked = enable;
            const tName = cb.getAttribute('data-tool');
            promises.push(
              fetch('/settings/api/tool-toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyId: currentKeyId, toolName: tName, enabled: enable })
              })
            );
          }
        }
      });
      await Promise.all(promises);
      showToast(enable ? 'All Code Graph tools enabled' : 'All Code Graph tools disabled');
    }

    async function resetToolDefaults() {
      const res = await fetch('/settings/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyId: currentKeyId,
          enabledTools: [],
          disabledTools: []
        })
      });
      const data = await res.json();
      if (data.ok) {
        showToast('Tool permissions reset to defaults');
        setTimeout(() => window.location.reload(), 500);
      }
    }

    let activeToolCat = 'All';
    function setToolCatFilter(cat, btn) {
      activeToolCat = cat;
      document.querySelectorAll('.tools-manager-bar .pill-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      filterToolRows();
    }

    const TOOL_PERMISSION_PAGE_SIZE = 20;
    let toolPermissionPage = 0;
    function renderToolPermissionPage() {
      const q = (document.getElementById('toolSearchInput')?.value || '').trim().toLowerCase();
      const rows = Array.from(document.querySelectorAll('#toolsListContainer .tool-perm-row'));
      const matched = rows.filter(r => {
        const name = r.getAttribute('data-name') || '';
        const cat = r.getAttribute('data-category') || '';
        const desc = r.getAttribute('data-desc') || '';
        const catMatches = activeToolCat === 'All' ||
          (activeToolCat === 'Code Graph' && (cat === 'Code Graph' || cat === 'Search')) ||
          cat.toLowerCase() === activeToolCat.toLowerCase();
        return catMatches && (!q || name.includes(q) || desc.includes(q) || cat.toLowerCase().includes(q));
      });
      const totalPages = Math.max(1, Math.ceil(matched.length / TOOL_PERMISSION_PAGE_SIZE));
      toolPermissionPage = Math.max(0, Math.min(toolPermissionPage, totalPages - 1));
      const start = toolPermissionPage * TOOL_PERMISSION_PAGE_SIZE;
      const visible = new Set(matched.slice(start, start + TOOL_PERMISSION_PAGE_SIZE));
      rows.forEach(row => { row.style.display = visible.has(row) ? 'flex' : 'none'; });
      const pager = document.getElementById('toolPermissionPagination');
      const label = document.getElementById('toolPermissionPageLabel');
      const prev = document.getElementById('toolPermissionPrev');
      const next = document.getElementById('toolPermissionNext');
      if (pager) pager.hidden = matched.length <= TOOL_PERMISSION_PAGE_SIZE;
      if (label) label.textContent = matched.length ? 'Showing ' + (start + 1) + '–' + Math.min(start + TOOL_PERMISSION_PAGE_SIZE, matched.length) + ' of ' + matched.length + ' tools' : 'No matching tools';
      if (prev) prev.disabled = toolPermissionPage <= 0;
      if (next) next.disabled = toolPermissionPage >= totalPages - 1;
    }
    function changeToolPermissionPage(delta) {
      toolPermissionPage += delta;
      renderToolPermissionPage();
      document.getElementById('toolsListContainer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    function filterToolRows() {
      toolPermissionPage = 0;
      renderToolPermissionPage();
    }
    renderToolPermissionPage();
  </script>
</body>
</html>`;
}
