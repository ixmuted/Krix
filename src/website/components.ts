// Reusable UI Components, Page Shell, Kebab Menus, and Modal Dialogs for Krix
// Zero Omission Policy, Strict Typing, and Contract Compatibility

import { getTokensCss } from "./tokens.css.js";
import { getClientScripts } from "./clientScripts.js";
import { renderHeader, renderFooter, renderHomeFooter, renderRecaptchaNotice } from "./shell.js";
import { renderSvg } from "./icons.js";
export { renderAuthRequiredCard } from "./pages/authCard.js";

export function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderRecaptchaScript(nonce?: string): string {
  const siteKey =
    process.env.RECAPTCHA_SITE_KEY ||
    process.env.GOOGLE_RECAPTCHA_SITE_KEY ||
    "6Ld_sample_krix_recaptcha_key";
  return `
    <script src="https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}"${nonce ? ` nonce="${escapeHtml(nonce)}"` : ""}></script>
    <script${nonce ? ` nonce="${escapeHtml(nonce)}"` : ""}>
      if (typeof grecaptcha !== 'undefined') {
        grecaptcha.ready(function() {
          // Google reCAPTCHA v3 active
        });
      }
    </script>
  `;
}

export function formatCompactCount(count: number): string {
  const n = Number(count) || 0;
  if (n <= 9999) return n.toLocaleString();
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  }
  return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function getBaseStyles(): string {
  return getTokensCss();
}

export interface KebabItem {
  label: string;
  icon: string;
  href?: string;
  onclick?: string;
  danger?: boolean;
}

export function renderKebabMenu(items: KebabItem[], menuId: string): string {
  return `
    <div class="krix-dropdown">
      <button type="button" class="krix-kebab-trigger kebab-btn" onclick="window.toggleKebabMenu(event, '${escapeHtml(menuId)}')" aria-label="More Actions" title="Actions">
        ${renderSvg("more-vertical", 16)}
      </button>

      <div id="${escapeHtml(menuId)}" class="krix-dropdown-menu kebab-dropdown">
        ${items
          .map((item) => {
            const cleanLabel = escapeHtml(
              item.label.replace(/\.{2,}|…/g, "").trim(),
            );
            const dangerClass = item.danger ? "danger" : "";
            const iconSvg = renderSvg(item.icon, 15);

            if (item.href) {
              return `
                <a href="${escapeHtml(item.href)}" class="krix-dropdown-item ${dangerClass}">
                  ${iconSvg}
                  <span>${cleanLabel}</span>
                </a>
              `;
            }

            return `
              <button type="button" class="krix-dropdown-item ${dangerClass}" onclick="${escapeHtml(item.onclick || "")}">
                ${iconSvg}
                <span>${cleanLabel}</span>
              </button>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

export interface CustomDropdownOption {
  value: string;
  label: string;
  secondary?: string;
  selected?: boolean;
}

export function renderCustomDropdown(params: {
  id: string;
  options: CustomDropdownOption[];
  selectedValue?: string;
  onchange?: string;
  ariaLabel?: string;
  className?: string;
  style?: string;
}): string {
  const {
    id,
    options,
    selectedValue,
    onchange,
    ariaLabel,
    className = "",
    style = "",
  } = params;
  let activeOpt = options.find((o) =>
    selectedValue !== undefined ? o.value === selectedValue : o.selected,
  );
  if (!activeOpt && options.length > 0) activeOpt = options[0];
  const activeLabel = activeOpt ? activeOpt.label : "Select...";
  const safeId = escapeHtml(id);

  return `
    <div class="krix-custom-dropdown ${escapeHtml(className)}" id="${safeId}_wrapper">
      <button type="button" class="krix-dropdown-trigger" id="${safeId}_trigger" onclick="window.toggleCustomDropdown('${safeId}')" aria-haspopup="listbox" aria-expanded="false" aria-label="${escapeHtml(ariaLabel || activeLabel)}">
        <span class="krix-dropdown-label" id="${safeId}_label">${escapeHtml(activeLabel)}</span>
        <span class="krix-dropdown-chevron">${renderSvg("chevron-down", 14)}</span>
      </button>
      <div class="krix-dropdown-popover" id="${safeId}_popover" role="listbox" hidden>
        ${options
          .map((opt) => {
            const isSelected = activeOpt
              ? opt.value === activeOpt.value
              : false;
            return `
          <div class="krix-dropdown-option ${isSelected ? "selected" : ""}" role="option" aria-selected="${isSelected ? "true" : "false"}" data-value="${escapeHtml(opt.value)}" onclick="window.selectCustomDropdownOption('${safeId}', '${escapeHtml(opt.value).replace(/'/g, "\\'")}', '${escapeHtml(opt.label).replace(/'/g, "\\'")}')">
            ${escapeHtml(opt.label)}
          </div>
        `;
          })
          .join("")}
      </div>
      <select id="${safeId}" class="krix-dropdown-native" onchange="${escapeHtml(onchange || "")}">
        ${options
          .map((opt) => {
            const isSelected = activeOpt
              ? opt.value === activeOpt.value
              : false;
            return `<option value="${escapeHtml(opt.value)}" ${isSelected ? "selected" : ""}>${escapeHtml(opt.label)}</option>`;
          })
          .join("")}
      </select>
    </div>
  `;
}

export function renderCommandPaletteModal(): string {
  const views = [
    { name: "Home", path: "/", icon: "home" },
    { name: "Upload files", path: "/upload", icon: "upload" },
    { name: "Files", path: "/store", icon: "files" },
    { name: "Tools", path: "/tools", icon: "terminal" },
    { name: "API keys", path: "/api", icon: "key" },
    { name: "Usage", path: "/stats", icon: "activity" },
    { name: "Settings", path: "/settings", icon: "settings" },
    { name: "Help", path: "/help", icon: "help-circle" },
  ];

  return `
    <div id="krixCommandPalette" class="krix-palette-overlay" role="dialog" aria-modal="true" aria-label="Jump to" onclick="if(event.target===this) window.toggleCommandPalette(false)">
      <div class="krix-palette-dialog">
        <div class="krix-palette-search">
          ${renderSvg("search", 18)}
          <input type="text" class="krix-palette-input" placeholder="Jump to a page" autocomplete="off" oninput="filterPalette(this.value)">
          <kbd>Esc</kbd>
        </div>
        <div class="krix-palette-results">
          ${views
            .map(
              (v) => `
            <a href="${v.path}" class="krix-palette-item">
              ${renderSvg(v.icon, 16)}
              <span>${v.name}</span>
              <span class="krix-palette-path">${v.path}</span>
            </a>`,
            )
            .join("")}
        </div>
        <div class="krix-palette-footer">
          <span><kbd>${renderSvg("arrow-up", 11)}</kbd> <kbd>${renderSvg("arrow-down", 11)}</kbd> Move</span>
          <span><kbd>${renderSvg("corner-down-left", 11)}</kbd> Open</span>
          <span style="margin-left:auto;"><kbd>Ctrl</kbd>+<kbd>K</kbd> or <kbd>/</kbd></span>
        </div>
      </div>
    </div>
  `;
}

export function renderCookieBanner(): string {
  return `
    <aside id="krixCookieBanner" class="krix-cookie-banner" role="dialog" aria-label="Cookie notice" hidden>
      <div class="krix-cookie-head">
        <span class="krix-cookie-icon" aria-hidden="true">${renderSvg("shield-check", 16)}</span>
        <strong class="krix-cookie-title">Cookie Notice</strong>
      </div>
      <p class="krix-cookie-text">Krix uses strictly necessary cookies for authentication and security. Review our <a href="/privacy">Privacy Policy</a> and <a href="/terms">Terms of Service</a>.</p>
      <div class="krix-cookie-actions">
        <button type="button" class="btn sm" onclick="window.acceptCookieConsent('essential')">Essential only</button>
        <button type="button" class="btn primary sm" onclick="window.acceptCookieConsent('accepted')">Accept</button>
      </div>
    </aside>
  `;
}

export function renderScrollProgressFab(): string {
  return "";
}

export interface PageShellOptions {
  title?: string;
  activeTab?: string;
  content: string;
  owner?: any;
  nonce?: string;
  headExtra?: string;
  wide?: boolean;
  narrow?: boolean;
  footer?: boolean;
  recaptchaNotice?: boolean;
}

const APP_SURFACE_TABS = new Set(["upload", "store", "tools", "api", "stats"]);

export function renderPageShell(options: PageShellOptions): string {
  const pageTitle = options.title ? escapeHtml(options.title) : "Krix";
  const nonceAttr = options.nonce ? `nonce="${escapeHtml(options.nonce)}"` : "";
  const showFooter =
    options.footer ??
    (options.activeTab === "home" || options.content.includes("auth-required-viewport"));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${pageTitle}</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico?v=3">
  <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png?v=3">
  <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.png?v=3">
  <meta name="description" content="Krix connects your AI tools to GitHub, Render and an isolated sandbox over MCP.">
  <script ${nonceAttr}>
    (function () {
      try {
        var m = localStorage.getItem('qw-theme');
        if (m !== 'dark' && m !== 'light') m = 'system';
        var dark = m === 'dark' || (m === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('dark', dark);
        if (localStorage.getItem('krix-sidebar') === 'collapsed') document.documentElement.classList.add('sb-collapsed');
      } catch (e) {}
    })();
  </script>
  <style ${nonceAttr}>
    ${getTokensCss()}
  </style>
  ${options.headExtra || ""}
</head>
<body data-tab="${escapeHtml(options.activeTab || "home")}" class="${APP_SURFACE_TABS.has(options.activeTab || "") ? "surface-app" : ""}">
  <div class="app">
    ${renderHeader(options.activeTab, options.owner)}
    <div class="main">
      <main class="page${options.wide ? " wide" : ""}${options.narrow ? " narrow" : ""}">
        ${options.content}
        ${options.recaptchaNotice ? renderRecaptchaNotice() : ""}
      </main>
      ${showFooter ? (options.activeTab === "home" ? renderHomeFooter(options.owner) : renderFooter()) : ""}
    </div>
  </div>

  <div id="krixToastContainer" aria-live="polite"></div>
  ${renderCookieBanner()}
  ${renderCommandPaletteModal()}
  ${renderRecaptchaScript(options.nonce)}

  <script ${nonceAttr}>
    (function() {
      function applyTheme(mode) {
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var isDark = mode === 'dark' || (mode === 'system' && prefersDark);
        document.documentElement.classList.toggle('dark', isDark);
        document.querySelectorAll('.theme-mode-button').forEach(function (button) {
          button.classList.toggle('active', button.dataset.themeMode === mode);
        });
      }
      var saved = localStorage.getItem('qw-theme');
      var initialMode = saved === 'dark' || saved === 'light' || saved === 'system' ? saved : 'system';
      applyTheme(initialMode);
      window.setThemeMode = function(mode) {
        var nextMode = ['system', 'light', 'dark'].includes(mode) ? mode : 'system';
        localStorage.setItem('qw-theme', nextMode);
        applyTheme(nextMode);
      };
      window.toggleTheme = function() {
        window.setThemeMode(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
      };
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', function () {
        if ((localStorage.getItem('qw-theme') || 'system') === 'system') applyTheme('system');
      });
    })();
    ${getClientScripts()}
  </script>
</body>
</html>`;
}
