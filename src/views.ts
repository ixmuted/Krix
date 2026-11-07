import type { OwnerProfile, GeneratedKeyEntry } from "./googleAuth.js";
import type { StatsSummary, KeyMetrics, ToolDetailMeta } from "./stats.js";
import type { ActiveOAuthInfo } from "./mcpOAuth.js";

export function escapeHtml(str: string): string {
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
    | "zap"
    | "search",
  size = 14,
): string {
  switch (name) {
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
          <input type="text" id="keyLabelInput" placeholder="Key Name (e.g. Claude Desktop, min 4 characters)" minlength="4" required style="flex:1; min-width:240px; padding:9px 12px; border-radius:8px; border:1px solid var(--border); background:var(--code-bg); color:var(--fg); font-size:13px;">
          <button type="submit" class="btn primary" id="createKeyBtn">Generate Key</button>
        </form>

        <div id="newKeyBanner" style="display:none; margin-top:16px; padding:16px; background:rgba(0,112,243,0.06); border:1px solid rgba(0,112,243,0.3); border-radius:8px;">
          <div style="font-size:13px; font-weight:600; color:#0070f3; margin-bottom:4px;">New Key Generated Successfully</div>
          <div style="font-size:12px; color:var(--accents-5); margin-bottom:12px;">Copy your secret key and 12-character client ID now. Both are safely stored and always viewable below.</div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; gap:8px; align-items:center;">
              <span style="font-size:12px; color:var(--accents-5); width:75px;">API Key:</span>
              <input type="text" id="newKeyField" readonly style="flex:1; padding:8px 10px; font-family:monospace; font-size:12px; border-radius:6px; border:1px solid var(--border); background:var(--code-bg); color:var(--fg);">
              <button type="button" class="btn" onclick="copyCreatedKey()" id="copyKeyBtn">Copy Key</button>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
              <span style="font-size:12px; color:var(--accents-5); width:75px;">Client ID:</span>
              <input type="text" id="newClientIdField" readonly style="flex:1; padding:8px 10px; font-family:monospace; font-size:12px; border-radius:6px; border:1px solid var(--border); background:var(--code-bg); color:var(--fg);">
              <button type="button" class="btn" onclick="copyCreatedClientId()" id="copyClientIdBtn">Copy Client ID</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Keys Table Card with Live Search -->
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

        <div style="overflow-x:auto;">
          <table id="keysTable">
            <thead>
              <tr>
                <th>Label</th>
                <th>Client ID</th>
                <th>Key Secret</th>
                <th>Created</th>
                <th>Status</th>
                <th>Action</th>
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
                    <div style="font-weight:600; color:var(--fg);">${escapeHtml(label)}</div>
                    <div style="font-family:monospace; font-size:11px; color:var(--accents-5);">${escapeHtml(id)}</div>
                  </td>
                  <td>
                    <div style="display:flex; align-items:center; gap:6px;">
                      <code style="font-family:ui-monospace, SFMono-Regular, monospace; font-size:12px; background:var(--code-bg); padding:3px 6px; border-radius:4px; border:1px solid var(--border); color:var(--fg);">${escapeHtml(cId || "N/A")}</code>
                      ${cId ? `<button type="button" class="btn" onclick="copyKeyText('${escapeHtml(cId)}', 'Client ID')" style="font-size:11px; padding:3px 6px;">Copy</button>` : ""}
                    </div>
                  </td>
                  <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <code id="key-val-${escapeHtml(id)}" data-full="${escapeHtml(fullKey)}" data-revealed="false" style="font-family:ui-monospace, SFMono-Regular, monospace; background:var(--code-bg); padding:4px 8px; border-radius:4px; font-size:12px; border:1px solid var(--border); color:var(--fg);">••••••••••••••••</code>
                      <button type="button" class="btn" onclick="toggleKeyReveal('${escapeHtml(id)}')" style="font-size:11px; padding:3px 8px;">Reveal</button>
                      <button type="button" class="btn" onclick="copyKeyText('${escapeHtml(fullKey)}', 'API Key')" style="font-size:11px; padding:3px 8px;">Copy</button>
                    </div>
                  </td>
                  <td><span class="local-date" data-ts="${k.createdAt}">${new Date(k.createdAt).toLocaleDateString()}</span></td>
                  <td><span class="badge success">Active</span></td>
                  <td>
                    <button class="btn" onclick="openRevokeKeyModal('${escapeHtml(id)}', '${escapeHtml(label)}')" style="font-size:11px; padding:4px 8px; color:var(--error);">Revoke</button>
                  </td>
                </tr>
              `;
                      })
                      .join("")
                  : `
                <tr id="emptyKeysRow">
                  <td colspan="6" style="text-align:center; padding:24px; color:var(--accents-5);">
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
      </div>

      <!-- Active OAuth Authorizations Card -->
      <div class="card" style="margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <h2 style="font-size:15px; font-weight:600; color:var(--fg);">Active OAuth Authorizations</h2>
            <span class="badge ${oauthAuthorizations.length > 0 ? "success" : ""}">${oauthAuthorizations.length} connected</span>
          </div>
        </div>

        <div style="overflow-x:auto;">
          <table>
            <thead>
              <tr>
                <th>Application</th>
                <th>Client ID</th>
                <th>Permissions</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="oauthTableBody">
              ${
                oauthAuthorizations.length > 0
                  ? oauthAuthorizations
                      .map(
                        (a) => `
                <tr id="oauth-row-${escapeHtml(a.clientId)}">
                  <td><strong>${escapeHtml(a.clientName)}</strong></td>
                  <td style="font-family:ui-monospace, monospace; color:var(--accents-5); font-size:12px;">${escapeHtml(a.clientId)}</td>
                  <td style="font-size:12px; color:var(--accents-5);">${escapeHtml(a.scope)}</td>
                  <td><span class="badge success">Authorized</span></td>
                  <td>
                    <button class="btn" onclick="openRevokeOAuthModal('${escapeHtml(a.clientId)}', '${escapeHtml(a.clientName)}')" style="font-size:11px; padding:4px 8px; color:var(--error);">Revoke</button>
                  </td>
                </tr>
              `,
                      )
                      .join("")
                  : `
                <tr>
                  <td colspan="5" style="text-align:center; padding:24px; color:var(--accents-5);">
                    No active OAuth connections. Connect Google Gemini or any OAuth 2.1 client to view it here.
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

  <!-- Custom Geist Toast Container -->
  <div id="toastContainer" class="toast-container" aria-live="polite"></div>

  <!-- Custom Geist Confirmation Modal -->
  <div id="confirmModal" class="modal-backdrop" hidden role="dialog" aria-modal="true">
    <div class="modal-card">
      <h3 id="modalTitle" style="font-size:16px; font-weight:700; margin-bottom:8px; color:var(--fg);">Confirm Revocation</h3>
      <p id="modalDesc" style="font-size:13px; color:var(--accents-5); margin-bottom:20px; line-height:1.5;"></p>
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn" onclick="closeConfirmModal()">Cancel</button>
        <button type="button" id="modalConfirmBtn" class="btn" style="background:#e00; color:#fff; border-color:#e00;">Revoke</button>
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
        r.style.display = match ? '' : 'none';
        if (match) visible++;
      });
      const noMatch = document.getElementById('noKeysMatch');
      if (noMatch) noMatch.style.display = (visible === 0 && rows.length > 0) ? 'block' : 'none';
    }

    function toggleKeyReveal(id) {
      const el = document.getElementById('key-val-' + id);
      if (!el) return;
      const isRevealed = el.getAttribute('data-revealed') === 'true';
      const full = el.getAttribute('data-full') || '';
      if (isRevealed) {
        el.textContent = '••••••••••••••••';
        el.setAttribute('data-revealed', 'false');
      } else {
        el.textContent = full;
        el.setAttribute('data-revealed', 'true');
      }
    }

    function copyKeyText(text, label) {
      if (!text) return;
      navigator.clipboard.writeText(text);
      showToast((label || 'API key') + ' copied to clipboard', 'success');
    }

    let activeConfirmAction = null;
    function openRevokeKeyModal(id, label) {
      document.getElementById('modalTitle').textContent = 'Revoke API Key';
      document.getElementById('modalDesc').textContent = 'Are you sure you want to revoke key "' + label + '"? Any agent using this key will immediately be disconnected.';
      activeConfirmAction = async () => {
        closeConfirmModal();
        try {
          const res = await fetch('/api/keys/' + encodeURIComponent(id), { method: 'DELETE' });
          if (res.ok) {
            const row = document.getElementById('row-' + id);
            if (row) row.remove();
            showToast('Key revoked successfully', 'success');
            
            // Update counter badge accurately
            const remaining = document.querySelectorAll('#keysTableBody tr.key-row').length;
            const badge = document.getElementById('keysCountBadge');
            if (badge) badge.textContent = remaining + ' active';
            if (remaining === 0) {
              const tbody = document.getElementById('keysTableBody');
              if (tbody) {
                tbody.innerHTML = '<tr id="emptyKeysRow"><td colspan="6" style="text-align:center; padding:24px; color:var(--accents-5);">No dynamic keys created yet. Generate one above.</td></tr>';
              }
            }
            filterKeys();
          } else {
            showToast('Failed to revoke key', 'error');
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
      document.getElementById('modalTitle').textContent = 'Revoke OAuth Connection';
      document.getElementById('modalDesc').textContent = 'Are you sure you want to revoke OAuth authorization for "' + clientName + '"? The connected client will need to re-authenticate.';
      activeConfirmAction = async () => {
        closeConfirmModal();
        try {
          const res = await fetch('/oauth/authorizations/' + encodeURIComponent(clientId), { method: 'DELETE' });
          if (res.ok) {
            const row = document.getElementById('oauth-row-' + clientId);
            if (row) row.remove();
            showToast('OAuth connection revoked', 'success');
          } else {
            showToast('Failed to revoke OAuth authorization', 'error');
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

    function closeConfirmModal() {
      const modal = document.getElementById('confirmModal');
      if (modal) {
        modal.setAttribute('hidden', '');
        modal.classList.remove('open');
      }
      activeConfirmAction = null;
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeConfirmModal();
    });

    async function handleCreateKey(ev) {
      ev.preventDefault();
      const btn = document.getElementById('createKeyBtn');
      const input = document.getElementById('keyLabelInput');
      const labelVal = (input.value || '').trim();
      if (labelVal.length < 4) {
        showToast('Key name must be at least 4 characters long.', 'error');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Generating';

      try {
        const res = await fetch('/api/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: labelVal })
        });
        const data = await res.json();
        if (data.key) {
          document.getElementById('newKeyBanner').style.display = 'block';
          document.getElementById('newKeyField').value = data.key;
          document.getElementById('newClientIdField').value = data.clientId || '';
          input.value = '';
          showToast('New API key generated successfully', 'success');

          // Dynamically prepend new row into table
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
            const safeKey = (data.key || '').replace(/'/g, "\\'");

            tr.innerHTML = '<td>' +
              '<div style="font-weight:600; color:var(--fg);">' + safeLabel + '</div>' +
              '<div style="font-family:monospace; font-size:11px; color:var(--accents-5);">' + safeId + '</div>' +
              '</td>' +
              '<td>' +
              '<div style="display:flex; align-items:center; gap:6px;">' +
              '<code style="font-family:ui-monospace, SFMono-Regular, monospace; font-size:12px; background:var(--code-bg); padding:3px 6px; border-radius:4px; border:1px solid var(--border); color:var(--fg);">' + (safeCId || 'N/A') + '</code>' +
              (safeCId ? '<button type="button" class="btn" onclick="copyKeyText(\'' + safeCId + '\', \'Client ID\')" style="font-size:11px; padding:3px 6px;">Copy</button>' : '') +
              '</div>' +
              '</td>' +
              '<td>' +
              '<div style="display:flex; align-items:center; gap:8px;">' +
              '<code id="key-val-' + safeId + '" data-full="' + safeKey + '" data-revealed="false" style="font-family:ui-monospace, SFMono-Regular, monospace; background:var(--code-bg); padding:4px 8px; border-radius:4px; font-size:12px; border:1px solid var(--border); color:var(--fg);">••••••••••••••••</code>' +
              '<button type="button" class="btn" onclick="toggleKeyReveal(\'' + safeId + '\')" style="font-size:11px; padding:3px 8px;">Reveal</button>' +
              '<button type="button" class="btn" onclick="copyKeyText(\'' + safeKey + '\', \'API Key\')" style="font-size:11px; padding:3px 8px;">Copy</button>' +
              '</div>' +
              '</td>' +
              '<td><span class="local-date">' + new Date().toLocaleDateString() + '</span></td>' +
              '<td><span class="badge success">Active</span></td>' +
              '<td>' +
              '<button class="btn" onclick="openRevokeKeyModal(\'' + safeId + '\', \'' + safeLabel + '\')" style="font-size:11px; padding:4px 8px; color:var(--error);">Revoke</button>' +
              '</td>';
            tbody.insertBefore(tr, tbody.firstChild);
          }

          // Update counter badge accurately
          const remaining = document.querySelectorAll('#keysTableBody tr.key-row').length;
          const badge = document.getElementById('keysCountBadge');
          if (badge) badge.textContent = remaining + ' active';
        } else {
          showToast('Could not generate key: ' + (data.error || 'Unknown error'), 'error');
        }
      } catch (e) {
        showToast('Network error: ' + e.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Generate Key';
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
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png">
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
      <div class="search-input-wrap" style="max-width:420px;">
        ${renderSvg("search", 15)}
        <input
          type="text"
          id="toolSearchInput"
          placeholder="Search tools by name, description, or category"
          oninput="filterTools()"
        />
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
  </div>

  ${renderFooter()}

  <script>
    let currentCategory = 'All';

    function setCategoryFilter(category, btn) {
      currentCategory = category;
      document.querySelectorAll('.pill-group .pill-btn').forEach(el => el.classList.remove('active'));
      if (btn) btn.classList.add('active');
      filterTools();
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
          box.style.display = 'flex';
          matchCount++;
        } else {
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

      <div id="timelineChart" class="chart-container">
        <!-- Responsive SVG rendered below -->
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
                <tr>
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
