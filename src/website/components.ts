// Reusable UI Components, Page Shell, Kebab Menus, and Modal Dialogs for Krix
// Zero Omission Policy, Strict Typing, and Contract Compatibility

import { getTokensCss } from "./tokens.css.js";
import { getClientScripts } from "./clientScripts.js";
import { renderHeader, renderFooter } from "./shell.js";
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

export function renderCommandPaletteModal(): string {
  const views = [
    { name: "Home Overview", path: "/home", icon: "terminal", cat: "Views" },
    {
      name: "File Ingestion Workbench",
      path: "/upload",
      icon: "upload",
      cat: "Views",
    },
    {
      name: "FileStore Repository",
      path: "/store",
      icon: "folder",
      cat: "Views",
    },
    { name: "Telemetry & Metrics", path: "/stats", icon: "cpu", cat: "Views" },
    {
      name: "Tools Capabilities Catalog",
      path: "/tools",
      icon: "sliders",
      cat: "Views",
    },
    {
      name: "API Keys & Integrations",
      path: "/api",
      icon: "lock",
      cat: "Views",
    },
    {
      name: "Workspace Settings",
      path: "/settings",
      icon: "settings",
      cat: "Views",
    },
  ];

  return `
    <div id="krixCommandPalette" class="krix-palette-overlay" onclick="if(event.target===this) window.toggleCommandPalette(false)">
      <div class="krix-palette-dialog">
        <div class="krix-palette-search">
          ${renderSvg("search", 18, "text-muted")}
          <input type="text" class="krix-palette-input" placeholder="Search views, tools, keys" oninput="filterPalette(this.value)">
          <kbd style="font-size:10px; padding:2px 6px; background:var(--bg-surface-2); border:1px solid var(--border-subtle); border-radius:4px; font-family:var(--font-mono); color:var(--geist-gray-50);">ESC</kbd>
        </div>

        <div class="krix-palette-results">
          ${views
            .map(
              (v) => `
            <a href="${v.path}" class="krix-palette-item" onclick="window.toggleCommandPalette(false)">
              ${renderSvg(v.icon, 16)}
              <span style="flex:1;">${v.name}</span>
              <span style="font-size:11px; color:var(--geist-gray-50); font-family:var(--font-mono);">${v.path}</span>
            </a>
          `,
            )
            .join("")}
        </div>

        <div class="krix-palette-footer">
          <span>Navigate with mouse or keyboard</span>
          <div style="display:flex; gap:12px;">
            <span><kbd>↑</kbd> <kbd>↓</kbd> Select</span>
            <span><kbd>↵</kbd> Open</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderScrollProgressFab(): string {
  return `
    <div id="scrollProgressFab" title="Return to Top" aria-label="Return to Top">
      <svg width="40" height="40" viewBox="0 0 40 40" style="transform:rotate(-90deg);">
        <circle cx="20" cy="20" r="16" fill="none" stroke="var(--border-subtle)" stroke-width="2.5"/>
        <circle id="scrollProgressCircle" cx="20" cy="20" r="16" fill="none" stroke="var(--fg)" stroke-width="2.5" stroke-linecap="round" stroke-dashoffset="100"/>
      </svg>
      <div style="position:absolute; display:flex; align-items:center; justify-content:center;">
        ${renderSvg("chevron-up", 16)}
      </div>
    </div>
  `;
}

export interface PageShellOptions {
  title?: string;
  activeTab?: string;
  content: string;
  owner?: any;
  nonce?: string;
  headExtra?: string;
}

export function renderPageShell(options: PageShellOptions): string {
  const pageTitle = options.title ? escapeHtml(options.title) : "Krix";
  const nonceAttr = options.nonce ? `nonce="${escapeHtml(options.nonce)}"` : "";

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${pageTitle}</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png?v=2">
  <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.png">
  <meta name="description" content="High-efficiency Model Context Protocol hub and isolated agent execution workbench.">
  <style ${nonceAttr}>
    ${getTokensCss()}
  </style>
  ${options.headExtra || ""}
</head>
<body class="noise-overlay">
  <!-- Ambient Radial Glow Mesh -->
  <div class="ambient-hero-mesh"></div>

  <!-- Sticky Global Header -->
  ${renderHeader(options.activeTab, options.owner)}

  <!-- Main Viewport Body -->
  <main class="wrapper">
    ${options.content}
  </main>

  <!-- Minimalist Platform Footer -->
  ${renderFooter()}

  <!-- Custom Stacked Toast Container -->
  <div id="krixToastContainer"></div>

  <!-- Command Palette Modal Dialog -->
  ${renderCommandPaletteModal()}

  <!-- Circular Scroll Progress FAB -->
  ${renderScrollProgressFab()}

  <!-- Google reCAPTCHA v3 Integration -->
  ${renderRecaptchaScript(options.nonce)}

  <script ${nonceAttr}>
    (function() {
      function applyTheme(mode) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = mode === 'dark' || (mode === 'system' && prefersDark);
        document.documentElement.classList.toggle('dark', isDark);
        document.querySelectorAll('.theme-mode-button').forEach(button => {
          const selected = button.dataset.themeMode === mode;
          button.style.background = selected ? 'var(--bg-surface-2)' : 'transparent';
          button.style.borderColor = selected ? 'var(--border-medium)' : 'transparent';
          button.style.color = selected ? 'var(--fg)' : 'var(--geist-gray-50)';
        });
      }
      const saved = localStorage.getItem('qw-theme');
      const initialMode = saved === 'dark' || saved === 'light' || saved === 'system' ? saved : 'system';
      applyTheme(initialMode);
      window.setThemeMode = function(mode) {
        const nextMode = ['system', 'light', 'dark'].includes(mode) ? mode : 'system';
        localStorage.setItem('qw-theme', nextMode);
        applyTheme(nextMode);
      };
      window.toggleTheme = function() {
        const isDark = document.documentElement.classList.contains('dark');
        window.setThemeMode(isDark ? 'light' : 'dark');
      };
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
        if ((localStorage.getItem('qw-theme') || 'system') === 'system') applyTheme('system');
      });
    })();
    ${getClientScripts()}
  </script>
</body>
</html>`;
}
