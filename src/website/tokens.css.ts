// Krix design system: a warm, quiet interface modelled on the Claude web app.
// One stylesheet, no external fonts, no decorative layers. Motion is limited to state changes.

export function getTokensCss(): string {
  return `
:root {
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-serif: ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, Cambria, "Times New Roman", serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;

  --bg: #faf9f5;
  --bg-side: #f5f4ed;
  --fg: #141413;
  --fg-2: #3d3d3a;
  --fg-3: #73726c;
  --bg-surface-0: #ffffff;
  --bg-surface-1: #faf9f5;
  --bg-surface-2: #f0eee6;
  --bg-surface-3: #e8e6dc;
  --hover: rgba(31, 30, 29, 0.05);
  --active: rgba(31, 30, 29, 0.08);
  --border-subtle: rgba(31, 30, 29, 0.1);
  --border-medium: rgba(31, 30, 29, 0.18);
  --border-focus: #c6613f;

  --accent: #c6613f;
  --accent-hover: #b4553a;
  --accent-fg: #ffffff;
  --accent-soft: rgba(198, 97, 63, 0.1);
  --success: #166534;
  --success-subtle: rgba(22, 101, 52, 0.14);
  --warning: #9a6a12;
  --warning-subtle: rgba(154, 106, 18, 0.12);
  --error: #991b1b;
  --error-subtle: rgba(153, 27, 27, 0.14);

  --geist-gray-100: var(--fg);
  --geist-gray-90: var(--fg);
  --geist-gray-80: var(--fg-2);
  --geist-gray-70: var(--fg-2);
  --geist-gray-60: var(--fg-3);
  --geist-gray-50: var(--fg-3);
  --geist-gray-40: var(--fg-3);

  --shadow-sm: 0 1px 2px rgba(20, 20, 19, 0.04);
  --shadow-md: 0 4px 20px rgba(20, 20, 19, 0.05);
  --shadow-lg: 0 8px 32px rgba(20, 20, 19, 0.1);
  --shadow-popover: 0 4px 24px rgba(20, 20, 19, 0.1), 0 0 0 1px rgba(31, 30, 29, 0.08);
  --scrim: rgba(20, 20, 19, 0.4);

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  --sidebar-w: 272px;
  --sidebar-w-collapsed: 56px;
  --z-sticky: 100;
  --z-dropdown: 200;
  --z-drawer: 600;
  --z-modal: 620;
  --z-toast: 700;
  color-scheme: light;
}

html.dark {
  --bg: #262624;
  --bg-side: #1f1e1d;
  --fg: #faf9f5;
  --fg-2: #dedcd1;
  --fg-3: #9c9a92;
  --bg-surface-0: #30302e;
  --bg-surface-1: #2b2b29;
  --bg-surface-2: #3a3938;
  --bg-surface-3: #454443;
  --hover: rgba(250, 249, 245, 0.05);
  --active: rgba(250, 249, 245, 0.09);
  --border-subtle: rgba(222, 220, 209, 0.1);
  --border-medium: rgba(222, 220, 209, 0.2);

  --accent: #d97757;
  --accent-hover: #e58a6b;
  --accent-fg: #1f1e1d;
  --accent-soft: rgba(217, 119, 87, 0.14);
  --success: #4ade80;
  --success-subtle: rgba(22, 101, 52, 0.3);
  --warning: #d8a64a;
  --warning-subtle: rgba(216, 166, 74, 0.14);
  --error: #f87171;
  --error-subtle: rgba(153, 27, 27, 0.32);

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.25);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.4);
  --shadow-popover: 0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(222, 220, 209, 0.12);
  --scrim: rgba(0, 0, 0, 0.55);
  color-scheme: dark;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
html { font-family: var(--font-sans); font-size: 15px; line-height: 1.5; background: var(--bg); color: var(--fg); -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -webkit-tap-highlight-color: transparent; overflow-x: clip; }
body { min-height: 100vh; min-height: 100dvh; background: var(--bg); color: var(--fg); overflow-x: clip; width: 100%; }
a { color: inherit; text-decoration: none; }
button, input, select, textarea { font: inherit; color: inherit; }
button { background: none; border: 0; cursor: pointer; }
button:disabled { cursor: not-allowed; }
h1, h2, h3 { font-weight: 500; line-height: 1.25; }
code, kbd, pre, samp { font-family: var(--font-mono); }
pre { white-space: pre-wrap; overflow-wrap: anywhere; }
::selection { background: var(--accent-soft); }
:focus:not(:focus-visible) { outline: none; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
input:focus-visible, textarea:focus-visible, select:focus-visible { outline: none; }
[hidden] { display: none !important; }
.text-muted { color: var(--fg-3); }
.mono { font-family: var(--font-mono); }
* { scrollbar-width: thin; scrollbar-color: var(--border-medium) transparent; }

/* ---------- App frame (compact dropdown across Mobile, Tablet & PC) ---------- */
.app { display: flex; min-height: 100vh; min-height: 100dvh; }
.sidebar {
  position: fixed;
  top: 58px; left: 12px; right: auto; bottom: auto;
  width: min(272px, calc(100vw - 24px));
  max-height: calc(100dvh - 74px);
  background: var(--bg-side);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  z-index: var(--z-sticky);
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
  pointer-events: none;
  transition: opacity .16s ease, transform .16s ease;
  overflow: hidden;
}
.sidebar .sb-head { display: none; }
.nav-open .sidebar { opacity: 1; transform: none; pointer-events: auto; }
.nav-open .scrim { opacity: 1; pointer-events: auto; }
.main { flex: 1; min-width: 0; margin-left: 0; padding-top: 52px; display: flex; flex-direction: column; min-height: 100vh; min-height: 100dvh; }
.sb-brand { display: flex; align-items: center; gap: 10px; font-family: var(--font-serif); font-size: 20px; letter-spacing: -0.01em; color: var(--fg); min-width: 0; }
.sb-brand img { width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0; }
.sb-nav { display: flex; flex-direction: column; gap: 2px; padding: 8px; overflow-y: auto; flex: 1; }
.sb-label { padding: 14px 10px 6px; font-size: 12px; color: var(--fg-3); }
.sb-link { display: flex; align-items: center; gap: 10px; height: 38px; padding: 0 10px; border-radius: var(--radius-md); color: var(--fg-2); font-size: 14px; white-space: nowrap; transition: background .12s; }
.sb-link svg { flex-shrink: 0; color: var(--fg-3); }
.sb-link:hover { background: var(--hover); color: var(--fg); }
.sb-link.active { background: var(--active); color: var(--fg); font-weight: 500; }
.sb-link.active svg { color: var(--fg); }
.sb-foot { padding: 8px; border-top: 1px solid var(--border-subtle); position: relative; flex-shrink: 0; }
.sb-user { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px; border-radius: var(--radius-lg); text-align: left; min-width: 0; }
.sb-user:hover { background: var(--hover); }
.sb-user-text { min-width: 0; flex: 1; }
.profile-trigger-name { font-size: 14px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sb-user-sub { font-size: 12px; color: var(--fg-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.profile-avatar-wrap { width: 32px; height: 32px; border-radius: 50%; background: var(--fg); color: var(--bg); display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; overflow: hidden; flex-shrink: 0; }
.profile-avatar-wrap img { width: 100%; height: 100%; object-fit: cover; }
.icon-btn { width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-md); color: var(--fg-3); flex-shrink: 0; }
.icon-btn:hover { background: var(--hover); color: var(--fg); }
.sb-signin { margin: 4px; width: calc(100% - 8px); }
.sb-collapse-btn, .sb-close-btn { display: none; }

.topbar { display: flex; position: fixed; top: 0; left: 0; right: 0; z-index: var(--z-sticky); height: 52px; align-items: center; justify-content: space-between; padding: 0 12px; background: var(--bg); border-bottom: 1px solid var(--border-subtle); }
.topbar-spacer { width: 34px; height: 34px; display: inline-block; flex-shrink: 0; }
.topbar-menu-btn .icon-menu { display: inline-flex; }
.topbar-menu-btn .icon-close { display: none; }
.nav-open .topbar-menu-btn .icon-menu { display: none; }
.nav-open .topbar-menu-btn .icon-close { display: inline-flex; }
.scrim { position: fixed; inset: 0; background: var(--scrim); z-index: calc(var(--z-sticky) - 1); opacity: 0; pointer-events: none; transition: opacity .18s; }

html.scroll-locked, html.scroll-locked body { overflow: hidden !important; touch-action: none; overscroll-behavior: none; }

@media (min-width: 641px) and (max-width: 1024px) {
  .btn { height: 40px; padding: 0 16px; font-size: 14.5px; }
  .btn.sm { height: 34px; padding: 0 12px; font-size: 13.5px; }
  .icon-btn { width: 38px; height: 38px; }
  .topbar { height: 58px; padding: 0 16px; }
  .main { padding-top: 58px; }
  .sidebar { top: 64px; width: 284px; }
  .sb-link { height: 42px; font-size: 15px; }
  .krix-dropdown-trigger { height: 40px; font-size: 14.5px; }
  .input, .search, .krix-pill-search { height: 42px; }
  .pager-btn { height: 36px; padding: 0 12px; font-size: 14px; }
  .nav-pill { height: 34px; padding: 0 14px; font-size: 13.5px; }
  .category-filter-pill { height: 36px; padding: 0 14px; font-size: 13.5px; }
  .page { padding: 36px 24px 28px; }
}

@media (min-width: 1025px) {
  .topbar { height: 56px; padding: 0 20px; }
  .main { padding-top: 56px; }
  .sidebar { top: 62px; left: 20px; width: 272px; }
}

/* ---------- Page ---------- */
.page { width: 100%; max-width: 760px; margin: 0 auto; padding: 48px 24px 32px; flex: 1; }
.page.wide { max-width: 1040px; }
.page.narrow { max-width: 620px; }
.page-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 28px; }
.page-title { font-family: var(--font-serif); font-size: 32px; font-weight: 400; letter-spacing: -0.015em; }
.page-sub { margin-top: 6px; color: var(--fg-3); font-size: 15px; max-width: 60ch; }
.page-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.page-foot { padding: 20px 24px 28px; text-align: center; font-size: 12px; color: var(--fg-3); display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 16px; }
.page-foot a:hover { color: var(--fg); text-decoration: underline; }
.page-foot .recaptcha-notice { width: 100%; }
.section-title { font-size: 14px; font-weight: 500; margin: 32px 0 10px; }
.stack { display: flex; flex-direction: column; gap: 16px; }
.cluster { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.grow { flex: 1; min-width: 0; }
@media (max-width: 860px) { .page { padding: 28px 16px 24px; } .page-title { font-size: 26px; } }

/* ---------- Surfaces ---------- */
.panel, .card { background: var(--bg-surface-0); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 20px; }
.panel + .panel { margin-top: 16px; }
.panel.flush { padding: 0; overflow: hidden; }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
.panel.flush > .panel-head { padding: 16px 20px; margin: 0; border-bottom: 1px solid var(--border-subtle); }
.panel-title { font-size: 16px; font-weight: 500; }
.panel-sub { font-size: 13px; color: var(--fg-3); margin-top: 2px; }
.panel.danger { border-color: rgba(181, 51, 51, 0.35); }
.rows > .row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--border-subtle); flex-wrap: wrap; }
.rows > .row:first-child { padding-top: 0; }
.rows > .row:last-child { border-bottom: 0; padding-bottom: 0; }
.row-title { font-size: 14px; font-weight: 500; }
.row-desc { font-size: 13px; color: var(--fg-3); margin-top: 2px; }
.row-title.danger { color: var(--error); }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
.stat { background: var(--bg-surface-1); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 12px 14px; min-width: 0; }
html.dark .stat { background: var(--bg-surface-1); }
.stat-label { font-size: 12px; color: var(--fg-3); }
.stat-value { font-family: var(--font-serif); font-size: 24px; margin-top: 2px; overflow-wrap: anywhere; }
.stat-value.sm { font-family: var(--font-sans); font-size: 15px; font-weight: 500; margin-top: 4px; }
.stat-value.ok { color: var(--success); }
.stat-value.bad { color: var(--error); }
.empty { text-align: center; padding: 40px 16px; color: var(--fg-3); font-size: 14px; }

/* ---------- Lists ---------- */
.list { display: flex; flex-direction: column; }
.list-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 20px; border-bottom: 1px solid var(--border-subtle); min-width: 0; }
.list-item:last-child { border-bottom: 0; }
.list-item.clickable { cursor: pointer; }
.list-item.clickable:hover { background: var(--hover); }
.list-main { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; }
.list-name { font-size: 14px; font-weight: 500; overflow-wrap: anywhere; }
.list-meta { font-size: 12px; color: var(--fg-3); }
.logo-tile { width: 36px; height: 36px; flex: 0 0 36px; border-radius: var(--radius-md); background: var(--bg-surface-2); border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.oauth-app-favicon { display: block; width: 100%; height: 100%; object-fit: contain; }
.oauth-app-favicon:not([src]), .oauth-app-favicon[src=""], .client-logo-img:not([src]), .client-logo-img[src=""], .oauth-app-favicon.hidden, .client-logo-img.hidden { display: none; }
.oauth-scope-line { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; max-height: 44px; overflow: hidden; }
.oauth-scope-chip { font: 500 11px/1 var(--font-mono); padding: 4px 7px; border-radius: var(--radius-sm); background: var(--bg-surface-2); color: var(--fg-3); max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.table-wrap { overflow-x: auto; }
.oauth-authorizations-card, .oauth-client-row { overflow: visible !important; }
table { width: 100%; border-collapse: collapse; font-size: 14px; text-align: left; }
th { font-weight: 500; font-size: 12px; color: var(--fg-3); padding: 10px 16px; border-bottom: 1px solid var(--border-subtle); white-space: nowrap; }
td { padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); vertical-align: middle; }
tbody tr:last-child td { border-bottom: 0; }
tbody tr.clickable { cursor: pointer; }
tbody tr.clickable:hover { background: var(--hover); }

/* ---------- Buttons ---------- */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 36px; padding: 0 14px; border-radius: var(--radius-md); border: 1px solid var(--border-medium); background: var(--bg-surface-0); color: var(--fg); font-size: 14px; font-weight: 500; white-space: nowrap; cursor: pointer; transition: background .12s, border-color .12s; }
.btn:hover:not(:disabled) { background: var(--hover); }
.btn:active:not(:disabled) { background: var(--active); }
.btn:disabled { opacity: .5; }
.btn.primary { background: var(--fg); color: var(--bg); border-color: var(--fg); }
.btn.primary:hover:not(:disabled) { background: var(--fg-2); border-color: var(--fg-2); }
.btn.accent { background: var(--accent); color: var(--accent-fg); border-color: var(--accent); }
.btn.accent:hover:not(:disabled) { background: var(--accent-hover); border-color: var(--accent-hover); }
.btn.danger { color: var(--error); border-color: rgba(181, 51, 51, 0.35); background: transparent; }
.btn.danger:hover:not(:disabled) { background: var(--error-subtle); }
.btn.ghost, .btn.secondary { background: transparent; border-color: transparent; }
.btn.secondary { border-color: var(--border-medium); }
.btn.ghost:hover:not(:disabled) { background: var(--hover); }
.btn.sm { height: 30px; padding: 0 10px; font-size: 13px; }
.btn.icon { width: 32px; height: 32px; padding: 0; }
.btn.block { width: 100%; }
.status-pill, .badge { display: inline-flex; align-items: center; gap: 6px; padding: 2px 10px; border-radius: var(--radius-full); background: var(--bg-surface-2); color: var(--fg-2); font-size: 12px; font-weight: 500; white-space: nowrap; }
.badge.success { background: var(--success-subtle); color: var(--success); }
.badge.warn { background: var(--warning-subtle); color: var(--warning); }
.badge.bad { background: var(--error-subtle); color: var(--error); }
.status-dot-available { width: 8px; height: 8px; border-radius: 50%; background: var(--success); display: inline-block; }

/* ---------- Inputs ---------- */
.input, .krix-select, select, textarea.input { width: 100%; height: 38px; padding: 0 12px; background: var(--bg-surface-0); border: 1px solid var(--border-medium); border-radius: var(--radius-md); font-size: 14px; color: var(--fg); transition: border-color .12s, box-shadow .12s; }
textarea.input { height: auto; padding: 10px 12px; line-height: 1.5; resize: vertical; font-family: var(--font-mono); font-size: 13px; }
.input:focus, select:focus, textarea.input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.input.mono { font-family: var(--font-mono); font-size: 13px; }
.input::placeholder { color: var(--fg-3); }
.field { display: flex; flex-direction: column; gap: 6px; }
.field > label { font-size: 13px; font-weight: 500; }
.search, .krix-pill-search { display: flex; align-items: center; gap: 8px; height: 38px; padding: 0 12px; background: var(--bg-surface-0); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); color: var(--fg-3); min-width: 0; width: 100%; max-width: 360px; }
.search:focus-within, .krix-pill-search:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.search input, .krix-pill-search input { flex: 1; min-width: 0; border: 0; background: transparent; outline: none; font-size: 14px; color: var(--fg); height: 100%; }
.search.block { max-width: none; }
.settings-secret-control { display: flex; align-items: center; gap: 4px; }
.settings-secret-control input { flex: 1; min-width: 0; }
input[type="checkbox"]:not(.krix-switch input) { accent-color: var(--accent); width: 16px; height: 16px; }
.krix-switch { position: relative; display: inline-block; width: 36px; height: 20px; flex-shrink: 0; }
.krix-switch input { position: absolute; opacity: 0; inset: 0; width: 100%; height: 100%; margin: 0; cursor: pointer; z-index: 1; }
.krix-slider { position: absolute; inset: 0; border-radius: 20px; background: var(--bg-surface-3); transition: background .15s; }
.krix-slider::before { content: ""; position: absolute; width: 16px; height: 16px; left: 2px; top: 2px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.25); transition: transform .15s; }
.krix-switch input:checked + .krix-slider { background: var(--accent); }
.krix-switch input:checked + .krix-slider::before { transform: translateX(16px); }
.krix-switch input:focus-visible + .krix-slider { outline: 2px solid var(--accent); outline-offset: 2px; }
.krix-switch input:disabled + .krix-slider { opacity: .5; }

/* ---------- Tabs and chips ---------- */
.tabs, .density-toggle, .theme-mode-control, .store-view-toggle { display: inline-flex; gap: 2px; padding: 3px; background: var(--bg-surface-2); border-radius: var(--radius-lg); }
.nav-pill, .theme-mode-button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 30px; padding: 0 12px; border-radius: var(--radius-md); font-size: 13px; font-weight: 500; color: var(--fg-3); white-space: nowrap; }
.nav-pill:hover, .theme-mode-button:hover { color: var(--fg); }
.nav-pill.active, .theme-mode-button.active { background: var(--bg-surface-0); color: var(--fg); box-shadow: var(--shadow-sm); }
html.dark .nav-pill.active, html.dark .theme-mode-button.active { background: var(--bg-surface-3); }
.theme-mode-button { width: 36px; padding: 0; }
.category-filter-grid, .chips { display: flex; flex-wrap: wrap; gap: 8px; }
.category-filter-pill, .chip { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: var(--radius-full); border: 1px solid var(--border-medium); color: var(--fg-2); font-size: 13px; white-space: nowrap; background: transparent; }
.category-filter-pill:hover, .chip:hover { background: var(--hover); color: var(--fg); }
.category-filter-pill.active { background: var(--fg); color: var(--bg); border-color: var(--fg); }

/* ---------- Code ---------- */
.codeblock { background: var(--bg-surface-1); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); overflow: hidden; }
html.dark .codeblock { background: var(--bg-side); }
.codeblock-head { display: flex; align-items: center; justify-content: space-between; padding: 8px 8px 8px 14px; font-size: 12px; color: var(--fg-3); border-bottom: 1px solid var(--border-subtle); font-family: var(--font-mono); }
.codeblock pre { padding: 14px; font-size: 13px; line-height: 1.6; overflow-x: auto; white-space: pre; }
.inline-code, .api-client-id-box code { font-family: var(--font-mono); font-size: 12.5px; background: var(--bg-surface-2); padding: 2px 6px; border-radius: var(--radius-sm); }
.endpoint-row { display: flex; align-items: center; gap: 8px; padding: 8px 8px 8px 14px; background: var(--bg-surface-1); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); font-family: var(--font-mono); font-size: 13px; min-width: 0; }
.endpoint-row code { flex: 1; min-width: 0; overflow-x: auto; white-space: nowrap; }
.key-display-scroll { overflow-x: auto; white-space: nowrap; }
kbd { font-size: 11px; padding: 1px 6px; background: var(--bg-surface-2); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: var(--fg-3); }

/* ---------- Composer-style hero ---------- */
.hero { text-align: center; padding: 8vh 0 24px; }
.hero-title { font-family: var(--font-serif); font-size: clamp(30px, 5vw, 40px); font-weight: 400; letter-spacing: -0.02em; }
.hero-sub { margin: 10px auto 0; color: var(--fg-3); font-size: 16px; max-width: 52ch; }
.composer { background: var(--bg-surface-0); border: 1px solid var(--border-subtle); border-radius: 20px; box-shadow: var(--shadow-md); padding: 14px; text-align: left; }
.composer .endpoint-row { border: 0; background: transparent; padding: 4px 4px 4px 6px; font-size: 14px; }
.composer-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 10px; flex-wrap: wrap; }

/* ---------- Menus ---------- */
.krix-dropdown { position: relative; display: inline-block; }
.krix-dropdown-menu { display: none; position: absolute; min-width: 200px; padding: 6px; background: var(--bg-surface-0); border-radius: var(--radius-lg); box-shadow: var(--shadow-popover); z-index: var(--z-dropdown); flex-direction: column; gap: 1px; }
.krix-dropdown-menu.active { display: flex; animation: pop .12s ease-out; }
.krix-dropdown-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px; border-radius: var(--radius-md); font-size: 14px; color: var(--fg); text-align: left; cursor: pointer; }
.krix-dropdown-item svg { color: var(--fg-3); flex-shrink: 0; }
.krix-dropdown-item:hover { background: var(--hover); }
.krix-dropdown-item.danger, .krix-dropdown-item.danger svg { color: var(--error); }
.krix-dropdown-item.danger:hover { background: var(--error-subtle); }
.krix-dropdown-divider { height: 1px; background: var(--border-subtle); margin: 4px 2px; }
.krix-kebab-trigger { width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-md); color: var(--fg-3); }
.krix-kebab-trigger:hover { background: var(--hover); color: var(--fg); }
.sb-menu { position: absolute; left: 8px; right: 8px; bottom: calc(100% + 4px); }
.sb-collapsed .sb-menu { right: auto; width: 240px; }
.profile-menu-head { padding: 8px 10px 10px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 4px; }
.profile-menu-name { font-size: 14px; font-weight: 500; }
.profile-menu-email { font-size: 12px; color: var(--fg-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.krix-custom-dropdown { position: relative; display: inline-block; min-width: 160px; }
.krix-dropdown-trigger { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; height: 36px; padding: 0 10px 0 12px; border: 1px solid var(--border-medium); border-radius: var(--radius-md); background: var(--bg-surface-0); color: var(--fg); font-size: 13.5px; font-weight: 450; text-align: left; cursor: pointer; transition: border-color .14s ease, background-color .14s ease, box-shadow .14s ease; }
.krix-dropdown-trigger:hover:not(:disabled) { border-color: var(--fg-3); background: var(--bg-surface-1); }
.krix-dropdown-trigger:focus-visible, .krix-custom-dropdown.open .krix-dropdown-trigger { outline: none; border-color: var(--border-focus); box-shadow: 0 0 0 3px var(--accent-soft); }
.krix-dropdown-trigger:disabled { opacity: .55; cursor: not-allowed; }
.krix-dropdown-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.krix-dropdown-chevron { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 16px; height: 16px; color: var(--fg-3); transition: transform .18s cubic-bezier(0.16, 1, 0.3, 1), color .14s ease; }
.krix-dropdown-chevron svg { display: block; width: 15px; height: 15px; }
.krix-custom-dropdown.open .krix-dropdown-chevron { transform: rotate(180deg); color: var(--fg); }
.krix-dropdown-popover { position: absolute; top: calc(100% + 6px); left: 0; min-width: 100%; max-width: min(320px, calc(100vw - 32px)); max-height: 280px; overflow-y: auto; padding: 5px; background: var(--bg-surface-0); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); box-shadow: var(--shadow-popover); z-index: var(--z-dropdown); animation: pop .12s ease-out; display: flex; flex-direction: column; gap: 2px; }
.krix-dropdown-option { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 10px; border-radius: var(--radius-md); font-size: 13.5px; color: var(--fg-2); cursor: pointer; white-space: nowrap; transition: background-color .1s ease, color .1s ease; }
.krix-dropdown-option:hover { background: var(--hover); color: var(--fg); }
.krix-dropdown-option.selected { background: var(--accent-soft); color: var(--fg); font-weight: 500; }
.krix-dropdown-option-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.krix-dropdown-check { opacity: 0; color: var(--accent); flex-shrink: 0; transition: opacity .12s ease; }
.krix-dropdown-option.selected .krix-dropdown-check { opacity: 1; }
.krix-dropdown-native { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }

/* ---------- Modal, drawer, toast, palette ---------- */
.modal-backdrop { display: none; position: fixed; inset: 0; background: var(--scrim); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); z-index: var(--z-modal); align-items: center; justify-content: center; padding: 16px; overscroll-behavior: contain; }
.modal-card { width: 100%; max-width: 440px; max-height: calc(100dvh - 32px); overflow-y: auto; background: var(--bg-surface-0); border: 1px solid var(--border-subtle); border-radius: 20px; padding: 24px; box-shadow: var(--shadow-lg); animation: pop .14s ease-out; }
.modal-title { font-family: var(--font-serif); font-size: 20px; font-weight: 400; }
.modal-text { margin-top: 6px; font-size: 14px; color: var(--fg-3); }
.modal-body { margin: 18px 0; display: flex; flex-direction: column; gap: 14px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.drawer { position: fixed; top: 0; right: 0; bottom: 0; width: min(480px, 100vw); background: var(--bg-surface-0); border-left: 1px solid var(--border-subtle); z-index: var(--z-drawer); transform: translateX(105%); transition: transform .2s ease; display: flex; flex-direction: column; padding: 0 20px; }
.drawer-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 0; border-bottom: 1px solid var(--border-subtle); flex-shrink: 0; }
.drawer-body { flex: 1; min-height: 0; overflow-y: auto; padding: 16px 0 24px; display: flex; flex-direction: column; gap: 16px; }
@media (max-width: 640px) { .drawer { width: 100vw; } }
#krixToastContainer, .toast-container { position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px; z-index: var(--z-toast); pointer-events: none; width: max-content; max-width: calc(100vw - 32px); }
.krix-toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 240px;
  max-width: min(420px, calc(100vw - 32px));
  padding: 10px 10px 10px 12px;
  background: var(--bg-surface-0);
  color: var(--fg);
  border: 1px solid var(--border-medium);
  border-radius: 14px;
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.4;
  box-shadow: var(--shadow-popover);
  animation: toast-in .18s cubic-bezier(0.16, 1, 0.3, 1);
  transition: opacity .16s ease, transform .16s ease;
}
.krix-toast.leaving { opacity: 0; transform: translateY(6px) scale(0.98); }
.krix-toast-text { flex: 1; min-width: 0; }
.krix-toast-icon {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--accent-soft);
  color: var(--accent);
}
.krix-toast-icon svg { stroke: currentColor !important; }
.krix-toast.success { border-color: rgba(22, 101, 52, 0.35); }
.krix-toast.success .krix-toast-icon { background: var(--success-subtle); color: var(--success); }
.krix-toast.error { border-color: rgba(153, 27, 27, 0.4); }
.krix-toast.error .krix-toast-icon { background: var(--error-subtle); color: var(--error); }
.krix-toast-close {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--fg-3);
  flex-shrink: 0;
  transition: background .12s, color .12s;
}
.krix-toast-close:hover { background: var(--hover); color: var(--fg); }
.toast { pointer-events: auto; padding: 10px 14px; background: var(--fg); color: var(--bg); border-radius: var(--radius-lg); font-size: 14px; opacity: 0; transform: translateY(6px); transition: opacity .16s, transform .16s; }
.toast.show { opacity: 1; transform: none; }
.toast.error { background: #991b1b; color: #fff; border: 1px solid #7f1d1d; }
.toast.success { background: #166534; color: #fff; border: 1px solid #14532d; }
.krix-palette-overlay { display: none; position: fixed; inset: 0; background: var(--scrim); z-index: var(--z-modal); align-items: flex-start; justify-content: center; padding: 12vh 16px 16px; }
.krix-palette-overlay.active { display: flex; }
.krix-palette-dialog { width: 100%; max-width: 560px; background: var(--bg-surface-0); border-radius: 20px; box-shadow: var(--shadow-lg); border: 1px solid var(--border-subtle); overflow: hidden; animation: pop .14s ease-out; }
.krix-palette-search { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--border-subtle); color: var(--fg-3); }
.krix-palette-input { flex: 1; border: 0; background: transparent; outline: none; font-size: 16px; color: var(--fg); }
.krix-palette-results { padding: 6px; max-height: 320px; overflow-y: auto; }
.krix-palette-item { display: flex; align-items: center; gap: 12px; padding: 9px 10px; border-radius: var(--radius-md); font-size: 14px; }
.krix-palette-item svg { color: var(--fg-3); }
.krix-palette-item:hover, .krix-palette-item.selected { background: var(--hover); }
.krix-palette-path { margin-left: auto; font-size: 12px; color: var(--fg-3); font-family: var(--font-mono); }
.krix-palette-footer { display: flex; gap: 16px; padding: 10px 16px; border-top: 1px solid var(--border-subtle); font-size: 12px; color: var(--fg-3); }
@keyframes pop { from { opacity: 0; transform: scale(.98) translateY(-2px); } to { opacity: 1; transform: none; } }
@keyframes toast-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

.tools-grid.concise .tool-desc { display: none; }
.tools-grid.verbose .tool-desc { display: block; margin-top: 2px; }
.tools-grid .list-item { content-visibility: auto; contain-intrinsic-size: 52px; }
.tools-grid .list-meta { overflow: hidden; text-overflow: ellipsis; }
.tools-grid.concise .list-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ---------- Tool toggle grid ---------- */
.settings-tools-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 8px; margin-top: 16px; }
.settings-tool-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); min-width: 0; }
.tool-toggle-row[style*="display: none"] { display: none; }

.chart { min-height: 140px; display: flex; align-items: flex-end; gap: 8px; padding: 8px 0 0; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 0; }
.bar { width: 100%; max-width: 40px; background: var(--accent); border-radius: 4px 4px 0 0; opacity: .9; }
.bar-label { font-size: 11px; font-family: var(--font-mono); color: var(--fg-3); }
.text-ok { color: var(--success); }
.text-bad { color: var(--error); }

.file-tile { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border-radius: var(--radius-md); background: var(--bg-surface-2); }
.store-grid { display: none; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; padding: 16px 20px; }
.store-grid-card { display: flex; flex-direction: column; gap: 12px; padding: 14px; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); min-width: 0; }
.store-row[style*="display: none"], .store-grid-card[style*="display: none"] { display: none; }

/* ---------- App surface (workspace pages) ---------- */
body.surface-app { --bg: #fcfbf8; --bg-side: #f4f3ee; }
html.dark body.surface-app {
  --bg: #191919; --bg-side: #141414;
  --bg-surface-0: #232323; --bg-surface-1: #1d1d1d; --bg-surface-2: #2e2e2e; --bg-surface-3: #3a3a3a;
  --border-subtle: rgba(255, 255, 255, 0.08); --border-medium: rgba(255, 255, 255, 0.16);
  --hover: rgba(255, 255, 255, 0.05); --active: rgba(255, 255, 255, 0.09);
}
html.dark:has(body.surface-app) { background: #191919; }
html:has(body.surface-app):not(.dark) { background: #fcfbf8; }

/* ---------- Home: workspace cards, composer ---------- */
.ws-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.ws-card { display: grid; grid-template-columns: 40px minmax(0, 1fr) auto; gap: 14px; align-items: start; padding: 16px; background: var(--bg-surface-0); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); transition: border-color .12s, background .12s; }
a.ws-card:hover { border-color: var(--border-medium); background: var(--hover); }
.ws-icon { width: 40px; height: 40px; border-radius: 12px; background: var(--accent-soft); color: var(--accent); display: inline-flex; align-items: center; justify-content: center; }
.ws-title { font-size: 15px; font-weight: 500; display: flex; align-items: center; flex-wrap: wrap; gap: 6px 8px; }
.ws-desc { margin-top: 4px; font-size: 13px; color: var(--fg-3); }
.ws-go { color: var(--fg-3); align-self: center; display: inline-flex; }
.composer .endpoint-row code { white-space: normal; overflow-wrap: anywhere; word-break: break-all; overflow: visible; }
.composer-hint { margin: 8px 6px 0; font-size: 13px; color: var(--fg-3); }
.composer-bar { margin-top: 12px; justify-content: space-between; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.meta-sm { display: none; margin-top: 2px; }
.recaptcha-notice { margin-top: 32px; font-size: 12px; color: var(--fg-3); text-align: center; }
.recaptcha-notice a { text-decoration: underline; text-underline-offset: 2px; }

@media (max-width: 860px) { .ws-grid { grid-template-columns: 1fr; } }
@media (max-width: 640px) {
  .tabs-fit { display: grid; grid-template-columns: 1fr 1fr; width: 100%; }
  .panel.flush > .panel-head:has(.tabs-fit) { padding: 12px; }
  .codeblock pre { white-space: pre-wrap; overflow-wrap: anywhere; }
  .hide-sm { display: none; }
  .meta-sm { display: block; }
  .category-filter-grid { flex-wrap: nowrap; overflow-x: auto; margin-inline: -16px; padding-inline: 16px; scrollbar-width: none; }
  .panel .category-filter-grid { margin-inline: -20px; padding-inline: 20px; }
  .panel.tools-toolbar-box .category-filter-grid { margin-inline: -16px; padding-inline: 16px; }
  .category-filter-grid::-webkit-scrollbar { display: none; }
  .category-filter-pill { flex-shrink: 0; height: 34px; }
  .panel.flush > .panel-head, .list-item { padding-left: 16px; padding-right: 16px; }
  .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  td, th { padding: 12px; }
}

/* ---------- Pager, progress, misc ---------- */
.pager { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 2px 0; font-size: 13px; color: var(--fg-3); flex-wrap: wrap; }
.pager-btn { display: inline-flex; align-items: center; gap: 4px; height: 32px; padding: 0 10px; border: 1px solid var(--border-medium); border-radius: var(--radius-md); font-size: 13px; color: var(--fg); background: var(--bg-surface-0); }
.pager-btn:hover:not(:disabled) { background: var(--hover); }
.pager-btn:disabled { opacity: .4; }
.progress { height: 6px; border-radius: 6px; background: var(--bg-surface-3); overflow: hidden; }
.progress > span { display: block; height: 100%; background: var(--accent); border-radius: 6px; }
.dropzone { border: 1.5px dashed var(--border-medium); border-radius: var(--radius-xl); padding: 40px 20px; text-align: center; color: var(--fg-3); cursor: pointer; transition: background .12s, border-color .12s; }
.dropzone:hover, .dropzone.dragover { background: var(--accent-soft); border-color: var(--accent); }
.auth-gate { min-height: 50vh; display: flex; align-items: center; justify-content: center; padding: 24px 0; }
.auth-gate-card { max-width: 420px; width: 100%; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px; }
.auth-gate-card h2 { font-family: var(--font-serif); font-size: 26px; font-weight: 400; }
.prose { font-size: 15px; line-height: 1.7; color: var(--fg-2); }
.prose h2 { font-family: var(--font-serif); font-size: 20px; font-weight: 500; color: var(--fg); margin: 28px 0 8px; }
.prose p + p { margin-top: 10px; }
.prose ul, .prose ol { padding-left: 22px; margin-top: 8px; display: flex; flex-direction: column; gap: 6px; }
.prose a { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
.prose strong { color: var(--fg); font-weight: 600; }
.center-screen { min-height: 100vh; min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: 24px; }

@media (max-width: 640px) {
  .btn, .krix-dropdown-trigger, .input { min-height: 40px; }
  .modal-card { padding: 20px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; transition-duration: .001ms !important; }
}

/* ---------- Greeting, integration modal, auth box, chart Y-axis, balanced grids ---------- */
.hero-greeting { font-size: 14px; font-weight: 500; color: var(--accent); margin-bottom: 8px; letter-spacing: 0.01em; }
.integration-modal-card { max-width: 520px; }
.integration-modal-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.integration-modal-note { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: var(--radius-md); background: var(--bg-surface-1); border: 1px solid var(--border-subtle); font-size: 13px; color: var(--fg-2); }
.integration-modal-note svg { color: var(--success); flex-shrink: 0; }
.auth-required-box { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 4px; }

.panel + .stats, .stats + .panel, .stats + .stats { margin-top: 16px; }
.stats-balanced-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; align-items: stretch; }
.stats-balanced-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: stretch; }
.stats-balanced-3 > .panel, .stats-balanced-2 > .panel { height: 100%; }
@media (max-width: 900px) { .stats-balanced-3, .stats-balanced-2 { grid-template-columns: 1fr; } }

.panel.flush > .panel-head .search.krix-pill-search { width: 100%; max-width: 300px; flex-shrink: 0; }
@media (max-width: 640px) { .panel.flush > .panel-head .search.krix-pill-search { max-width: none; } }

.danger-zone-btn { min-width: 170px; width: 170px; justify-content: center; flex-shrink: 0; }
@media (max-width: 640px) { .danger-zone-btn { width: 100%; } }

.chart-with-axis { display: flex; align-items: stretch; gap: 10px; width: 100%; padding-top: 8px; }
.chart-y-axis { display: flex; flex-direction: column; justify-content: space-between; height: 140px; text-align: right; min-width: 34px; flex-shrink: 0; }
.chart-y-tick { font-size: 11px; line-height: 1; font-family: var(--font-mono); color: var(--fg-3); }
.chart-plot { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; }
.chart-gridlines { position: absolute; top: 0; left: 0; right: 0; height: 140px; display: flex; flex-direction: column; justify-content: space-between; pointer-events: none; }
.chart-gridlines span { display: block; width: 100%; border-top: 1px dashed var(--border-subtle); }
.chart-bars { position: relative; z-index: 1; display: flex; align-items: flex-end; gap: 8px; width: 100%; }
.bar-track { height: 140px; width: 100%; display: flex; align-items: flex-end; justify-content: center; }
.key-id-link { display: inline-block; transition: color .12s; }
.key-id-link:hover { color: var(--fg); text-decoration: underline; }

.quick-config-panel .codeblock pre { height: 210px; overflow: auto; }
.integration-modal-card .codeblock pre { height: 185px; overflow: auto; }
.integration-card { cursor: pointer; text-align: left; }
.hero-kicker { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: var(--radius-full); background: var(--bg-surface-2); color: var(--fg-2); font-size: 12px; font-weight: 500; margin-bottom: 12px; }
.home-showcase { background: linear-gradient(155deg, var(--bg-surface-0) 0%, var(--bg-surface-2) 100%); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 28px 24px; margin-top: 24px; text-align: center; box-shadow: var(--shadow-sm); }
.home-showcase-title { font-family: var(--font-serif); font-size: clamp(22px, 3.6vw, 30px); font-weight: 400; letter-spacing: -0.015em; }
.home-showcase-sub { margin: 8px auto 0; max-width: 52ch; font-size: 14px; color: var(--fg-3); }
.home-showcase-actions { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-top: 18px; }
.editorial-stack { display: flex; flex-direction: column; gap: 14px; }
.editorial-card { background: var(--bg-surface-0); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 20px; }
.editorial-card-meta { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--fg-3); margin-bottom: 8px; }
.editorial-card-title { font-family: var(--font-serif); font-size: 20px; font-weight: 400; color: var(--fg); }
.editorial-card-desc { margin-top: 6px; font-size: 14px; color: var(--fg-3); line-height: 1.55; }
.editorial-specs { margin-top: 14px; border-top: 1px solid var(--border-subtle); }
.editorial-spec-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border-subtle); font-size: 13px; }
.editorial-spec-row:last-child { border-bottom: 0; }
.editorial-spec-k { color: var(--fg-3); }
.editorial-spec-v { font-family: var(--font-mono); color: var(--fg); text-align: right; }
.editorial-cta { margin-top: 14px; width: 100%; }

.store-view-body { min-height: 280px; }

/* ---------- Greeting starburst, animations, and 12-feature grid ---------- */
.hero-greeting-row { display: inline-flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 10px; }
.hero-spark { color: var(--accent); display: inline-flex; align-items: center; justify-content: center; animation: krix-spin-slow 18s linear infinite; }
.hero-greeting-text { font-family: var(--font-serif); font-size: clamp(22px, 3.8vw, 30px); font-weight: 400; color: var(--fg); letter-spacing: -0.015em; line-height: 1.2; }
@keyframes krix-spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.live-pulse-wrap { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 10px; height: 10px; }
.live-pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); }
.live-pulse-ring { position: absolute; inset: -3px; border-radius: 50%; border: 1.5px solid var(--success); animation: krix-pulse 2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite; }
@keyframes krix-pulse { 0% { transform: scale(0.8); opacity: 0.9; } 100% { transform: scale(2.1); opacity: 0; } }

.animated-terminal { margin-top: 18px; text-align: left; background: var(--bg-surface-0); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); }
.animated-terminal-head { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-surface-1); font-size: 12px; color: var(--fg-3); font-family: var(--font-mono); }
.term-dots { display: inline-flex; gap: 5px; }
.term-dots span { width: 9px; height: 9px; border-radius: 50%; background: var(--border-medium); }
.term-dots span:nth-child(1) { background: #ff5f56; }
.term-dots span:nth-child(2) { background: #ffbd2e; }
.term-dots span:nth-child(3) { background: #27c93f; }
.animated-terminal-body { padding: 12px 14px; font-family: var(--font-mono); font-size: 12.5px; line-height: 1.65; color: var(--fg-2); height: 112px; overflow: hidden; display: flex; flex-direction: column; justify-content: center; }
.term-line { display: flex; align-items: center; gap: 8px; }
.term-prompt { color: var(--accent); font-weight: 600; }
.term-cursor { display: inline-block; width: 7px; height: 14px; background: var(--accent); vertical-align: middle; animation: krix-blink 1.1s step-end infinite; }
@keyframes krix-blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }

.features-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
@media (max-width: 900px) { .features-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 580px) { .features-grid { grid-template-columns: 1fr; } }
.feature-card { display: flex; flex-direction: column; gap: 8px; padding: 16px; background: var(--bg-surface-0); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); transition: transform .16s ease, border-color .16s ease, box-shadow .16s ease; }
.feature-card:hover { transform: translateY(-2px); border-color: var(--border-medium); box-shadow: var(--shadow-sm); }
.feature-icon { width: 34px; height: 34px; border-radius: 10px; background: var(--accent-soft); color: var(--accent); display: inline-flex; align-items: center; justify-content: center; }
.feature-title { font-size: 14px; font-weight: 500; color: var(--fg); }
.feature-desc { font-size: 13px; color: var(--fg-3); line-height: 1.45; }

.anthropic-id-pill {
  display: block;
  max-width: 100%;
  margin-top: 8px;
  padding: 6px 12px;
  background: var(--bg-surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--fg-2);
  overflow-x: auto;
  white-space: nowrap;
}
.anthropic-id-label {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--fg-3);
  padding-right: 6px;
  border-right: 1px solid var(--border-subtle);
}
.anthropic-id-val { white-space: nowrap; }
.friendly-zone-btn { min-width: 170px; width: 170px; justify-content: center; flex-shrink: 0; }
@media (max-width: 640px) { .friendly-zone-btn { width: 100%; } }
.friendly-zone-select { min-width: 244px; width: 244px; flex-shrink: 0; }
.friendly-zone-select .krix-dropdown-popover { left: auto; right: 0; min-width: 100%; }
@media (max-width: 640px) { .friendly-zone-select { width: 100%; min-width: 0; } .friendly-zone-select .krix-dropdown-popover { left: 0; right: 0; } }
/* A tool its provider credential is missing for: greyed out and locked, but it keeps the choice
   made for it, so adding the credential back needs no re-enabling. */
.tool-blocked .list-name, .tool-blocked .list-meta { opacity: .55; }
.krix-switch input:disabled { cursor: not-allowed; }
.tool-blocked .krix-switch input:checked + .krix-slider { background: var(--fg-3); }
@media (min-width: 641px) { .key-status-top-card { display: none !important; } }

/* ---------- Cookie consent banner (Anthropic solid dark floating card) ---------- */
.krix-cookie-banner {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: var(--z-toast);
  width: min(380px, calc(100vw - 32px));
  padding: 20px;
  background: #181715;
  color: #faf9f5;
  border: 1px solid rgba(250, 249, 245, 0.14);
  border-radius: var(--radius-xl);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.42);
  display: flex;
  flex-direction: column;
  gap: 10px;
  opacity: 1;
  animation: toast-in .18s cubic-bezier(0.16, 1, 0.3, 1);
}
.krix-cookie-head { display: flex; align-items: center; gap: 8px; }
.krix-cookie-icon { width: 26px; height: 26px; border-radius: 8px; background: rgba(204, 120, 92, 0.18); color: #cc785c; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.krix-cookie-title { font-size: 14px; font-weight: 600; color: #faf9f5; }
.krix-cookie-text { font-size: 13px; line-height: 1.5; color: #a09d96; }
.krix-cookie-text a { color: #faf9f5; text-decoration: underline; text-underline-offset: 2px; }
.krix-cookie-text a:hover { color: #cc785c; }
.krix-cookie-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 4px; width: 100%; }
.krix-cookie-actions .btn { width: 100%; min-width: 0; height: 38px; padding: 0 12px; justify-content: center; background: #252320; color: #faf9f5; border-color: rgba(250, 249, 245, 0.16); box-sizing: border-box; }
.krix-cookie-actions .btn:hover { background: #302e2a; }
.krix-cookie-actions .btn.primary { background: #faf9f5; color: #141413; border-color: #faf9f5; }
.krix-cookie-actions .btn.primary:hover { background: #e8e6dc; border-color: #e8e6dc; }
@media (max-width: 640px) {
  .krix-cookie-banner { left: 16px; right: 16px; bottom: 16px; width: auto; }
}

/* ---------- Homepage-specific header, spacing, and full-width balance ---------- */
body[data-tab="home"] .topbar { height: 64px; padding: 0 20px; }
body[data-tab="home"] .topbar .sb-brand { font-size: 24px; gap: 11px; }
body[data-tab="home"] .topbar .sb-brand img { width: 28px; height: 28px; }
body[data-tab="home"] .topbar .icon-btn { width: 40px; height: 40px; }
body[data-tab="home"] .main { padding-top: 64px; }
body[data-tab="home"] .sidebar { top: 70px; }
body[data-tab="home"] .page.wide { max-width: 1140px; padding: 18px 24px 36px; }
body[data-tab="home"] .hero { padding: 14px 0 20px; }
@media (max-width: 1024px) {
  body[data-tab="home"] .page.wide { max-width: 100%; padding: 16px 18px 32px; }
}
@media (max-width: 640px) {
  body[data-tab="home"] .page.wide { padding: 14px 14px 28px; }
  body[data-tab="home"] .topbar { height: 60px; padding: 0 14px; }
  body[data-tab="home"] .main { padding-top: 60px; }
  body[data-tab="home"] .sidebar { top: 66px; }
}

/* ---------- PC-only: app pages use the same full-width container as the homepage ---------- */
@media (min-width: 1025px) {
  body[data-tab="upload"] .page,
  body[data-tab="store"] .page,
  body[data-tab="tools"] .page,
  body[data-tab="api"] .page,
  body[data-tab="stats"] .page,
  body[data-tab="settings"] .page { max-width: 1140px; padding: 32px 24px 36px; }
  body[data-tab="upload"] .topbar,
  body[data-tab="store"] .topbar,
  body[data-tab="tools"] .topbar,
  body[data-tab="api"] .topbar,
  body[data-tab="stats"] .topbar,
  body[data-tab="settings"] .topbar { height: 64px; padding: 0 20px; }
  body[data-tab="upload"] .topbar .sb-brand,
  body[data-tab="store"] .topbar .sb-brand,
  body[data-tab="tools"] .topbar .sb-brand,
  body[data-tab="api"] .topbar .sb-brand,
  body[data-tab="stats"] .topbar .sb-brand,
  body[data-tab="settings"] .topbar .sb-brand { font-size: 24px; gap: 11px; }
  body[data-tab="upload"] .topbar .sb-brand img,
  body[data-tab="store"] .topbar .sb-brand img,
  body[data-tab="tools"] .topbar .sb-brand img,
  body[data-tab="api"] .topbar .sb-brand img,
  body[data-tab="stats"] .topbar .sb-brand img,
  body[data-tab="settings"] .topbar .sb-brand img { width: 28px; height: 28px; }
  body[data-tab="upload"] .topbar .icon-btn,
  body[data-tab="store"] .topbar .icon-btn,
  body[data-tab="tools"] .topbar .icon-btn,
  body[data-tab="api"] .topbar .icon-btn,
  body[data-tab="stats"] .topbar .icon-btn,
  body[data-tab="settings"] .topbar .icon-btn { width: 40px; height: 40px; }
  body[data-tab="upload"] .main,
  body[data-tab="store"] .main,
  body[data-tab="tools"] .main,
  body[data-tab="api"] .main,
  body[data-tab="stats"] .main,
  body[data-tab="settings"] .main { padding-top: 64px; }
  body[data-tab="upload"] .sidebar,
  body[data-tab="store"] .sidebar,
  body[data-tab="tools"] .sidebar,
  body[data-tab="api"] .sidebar,
  body[data-tab="stats"] .sidebar,
  body[data-tab="settings"] .sidebar { top: 70px; }
}

/* ---------- Homepage redesign ---------- */
.hm { display: flex; flex-direction: column; gap: 84px; padding-top: 8px; width: 100%; min-width: 0; }
.hm > section { min-width: 0; max-width: 100%; }
.hm-hero { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr); gap: 48px; align-items: center; padding-top: 28px; }
.hm-hero > * { min-width: 0; max-width: 100%; }
.hm-kicker { display: inline-flex; align-items: center; gap: 8px; padding: 5px 12px; border: 1px solid var(--border-medium); border-radius: var(--radius-full); background: var(--bg-surface-1); font-size: 12.5px; color: var(--fg-2); }
.hm-kicker i { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); }
.hm-title { margin-top: 0; font-family: var(--font-serif); font-size: clamp(30px, 5.2vw, 58px); line-height: 1.08; letter-spacing: -0.025em; font-weight: 400; overflow-wrap: break-word; }
.hm-title strong { font-family: var(--font-sans); font-weight: 600; letter-spacing: -0.03em; }
.hm-lead { margin-top: 18px; max-width: 54ch; font-size: 17px; line-height: 1.6; color: var(--fg-3); }
.hm-endpoint { display: flex; align-items: center; gap: 10px; margin-top: 24px; width: 100%; max-width: 540px; min-width: 0; padding: 8px 8px 8px 16px; background: var(--bg-surface-0); border: 1px solid var(--border-medium); border-radius: var(--radius-xl); }
.hm-endpoint code { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13.5px; }
.hm-cta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
.hm-google-signup { margin-top: 14px; display: flex; align-items: center; }
.hm-google-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 44px;
  padding: 0 20px;
  border-radius: var(--radius-lg);
  background: var(--bg-surface-0);
  color: var(--fg);
  border: 1px solid var(--border-medium);
  font-size: 14.5px;
  font-weight: 500;
  box-shadow: var(--shadow-sm);
  transition: background .15s ease, border-color .15s ease, transform .15s ease, box-shadow .15s ease;
}
.hm-google-btn:hover {
  background: var(--bg-surface-2);
  border-color: var(--fg-3);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
.hm-google-btn:active { transform: translateY(0); }
.hm-art { position: relative; }
.hm-art::before { content: ""; position: absolute; inset: 0; background: radial-gradient(60% 60% at 60% 40%, var(--accent-soft), transparent 70%); z-index: 0; pointer-events: none; }
.hm-term { position: relative; z-index: 1; background: #1b1b1a; color: #e8e6dc; border-radius: 20px; overflow: hidden; box-shadow: var(--shadow-lg); border: 1px solid rgba(255, 255, 255, 0.08); }
.hm-term-head { display: flex; align-items: center; gap: 12px; padding: 12px 16px; font: 500 12px var(--font-mono); color: #9c9a92; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
.hm-dots { display: inline-flex; gap: 6px; }
.hm-dots span { width: 10px; height: 10px; border-radius: 50%; background: #454443; }
.hm-dots span:nth-child(1) { background: #ff5f56; }
.hm-dots span:nth-child(2) { background: #ffbd2e; }
.hm-dots span:nth-child(3) { background: #27c93f; }
.hm-term-body { padding: 22px 20px 26px; min-height: 210px; font: 13.5px/1.7 var(--font-mono); overflow-wrap: anywhere; }
.hm-dim { color: #8a8880; }
.hm-line { margin-top: 10px; }
.hm-prompt { color: #d97757; margin-right: 10px; }
.hm-cur { display: inline-block; width: 8px; height: 15px; margin-left: 4px; vertical-align: -3px; background: #d97757; animation: hm-blink 1s steps(2) infinite; }
.hm-out { margin-top: 6px; color: #9fd8a8; }
.hm-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1px solid var(--border-subtle); border-bottom: 1px solid var(--border-subtle); }
.hm-stat { padding: 26px 22px; border-left: 1px solid var(--border-subtle); }
.hm-stat:first-child { border-left: 0; padding-left: 0; }
.hm-stat-n { font-family: var(--font-serif); font-size: clamp(34px, 4.4vw, 48px); letter-spacing: -0.02em; line-height: 1; }
.hm-stat-l { margin-top: 10px; font-size: 13.5px; color: var(--fg-3); }
.hm-sec-head { max-width: 64ch; margin-bottom: 28px; }
.hm-eyebrow { font-size: 12.5px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); }
.hm-h2 { margin-top: 8px; font-family: var(--font-serif); font-size: clamp(26px, 3.6vw, 40px); font-weight: 400; line-height: 1.15; letter-spacing: -0.02em; }
.hm-sub { margin-top: 10px; font-size: 16px; line-height: 1.6; color: var(--fg-3); }
.hm-clients { display: flex; flex-wrap: wrap; gap: 10px; }
.hm-client { display: inline-flex; align-items: center; gap: 9px; padding: 10px 16px; background: var(--bg-surface-0); border: 1px solid var(--border-subtle); border-radius: var(--radius-full); font-size: 14px; color: var(--fg-2); }
.hm-steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.hm-step { padding: 26px; background: var(--bg-surface-1); border: 1px solid var(--border-subtle); border-radius: 20px; }
.hm-step-n { font-family: var(--font-serif); font-size: 38px; line-height: 1; color: var(--accent); }
.hm-step h3 { margin-top: 18px; font-size: 18px; }
.hm-step p { margin-top: 8px; font-size: 14.5px; line-height: 1.6; color: var(--fg-3); }
.hm-caps { display: flex; flex-direction: column; gap: 16px; }
.hm-cap { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 32px; align-items: center; padding: 34px; background: var(--bg-surface-1); border: 1px solid var(--border-subtle); border-radius: 24px; }
.hm-cap > * { min-width: 0; }
.hm-cap:nth-child(even) .hm-cap-text { order: 2; }
.hm-cap h3 { margin: 14px 0 0; font-family: var(--font-serif); font-size: clamp(22px, 2.8vw, 30px); font-weight: 400; letter-spacing: -0.015em; }
.hm-cap p { margin: 10px 0 20px; font-size: 15px; line-height: 1.65; color: var(--fg-3); }
.hm-specs { background: var(--bg-surface-0); border: 1px solid var(--border-subtle); border-radius: 16px; overflow: hidden; }
.hm-spec { display: flex; flex-direction: column; gap: 3px; padding: 16px 20px; border-top: 1px solid var(--border-subtle); }
.hm-spec:first-child { border-top: 0; }
.hm-spec span { font-size: 12px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--fg-3); }
.hm-spec strong { font-size: 14.5px; font-weight: 500; }
.hm-secure { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); gap: 48px; padding: 52px; background: var(--fg); color: var(--bg); border-radius: 28px; }
.hm-secure > * { min-width: 0; }
.hm-secure .hm-h2 { color: var(--bg); }
.hm-secure .hm-sub { color: var(--bg); opacity: 0.7; }
.hm-secure-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px 32px; align-content: start; }
.hm-secure-list > div { padding-top: 16px; border-top: 1px solid color-mix(in srgb, var(--bg) 22%, transparent); }
.hm-secure-list h3 { font-size: 16px; }
.hm-secure-list p { margin-top: 6px; font-size: 14px; line-height: 1.6; opacity: 0.72; }
.hm-code-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: start; }
.hm-code-grid > * { min-width: 0; }
.hm-faq { border-top: 1px solid var(--border-subtle); }
.hm-faq-item { border-bottom: 1px solid var(--border-subtle); }
.hm-faq-item summary { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 0; font-size: 17px; cursor: pointer; list-style: none; }
.hm-faq-item summary::-webkit-details-marker { display: none; }
html { scroll-behavior: smooth; }
.hm-faq-item summary::after { content: "+"; font-size: 22px; color: var(--fg-3); transition: transform .24s cubic-bezier(0.22, 1, 0.36, 1), color .15s ease; }
.hm-faq-item[open] summary::after { transform: rotate(45deg); color: var(--accent); }
.hm-faq-item p, .hm-faq-item .hlp-details-body p { margin: 0; padding: 0 40px 22px 0; max-width: 70ch; font-size: 15px; line-height: 1.65; color: var(--fg-3); }
.hm-final { text-align: center; padding: 64px 24px; background: var(--bg-surface-2); border-radius: 28px; }
.hm-final .hm-sub { margin-left: auto; margin-right: auto; }
.hm-hero-text, .hm-art { animation: hm-rise .6s ease-out both; }
.hm-art { animation-delay: .12s; }
@keyframes hm-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes hm-blink { 50% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .hm-hero-text, .hm-art, .hm-cur { animation: none; } }
@media (max-width: 900px) {
  .hm { gap: 60px; }
  .hm-hero, .hm-cap, .hm-secure, .hm-code-grid, .hm-steps { grid-template-columns: minmax(0, 1fr); }
  .hm-hero { gap: 32px; }
  .hm-cap:nth-child(even) .hm-cap-text { order: 0; }
  .hm-cap { padding: 24px; gap: 22px; }
  .hm-secure { padding: 30px 24px; gap: 30px; }
  .hm-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hm-stat:nth-child(3) { border-left: 0; padding-left: 0; }
  .hm-stat:nth-child(n+3) { border-top: 1px solid var(--border-subtle); }
}
@media (max-width: 560px) { .hm-secure-list { grid-template-columns: minmax(0, 1fr); } .hm-final { padding: 44px 18px; } }

/* ---------- Anthropic-style Home Footer ---------- */
.hm-footer {
  margin-top: 72px;
  background: #0f0f0e;
  color: #e8e6dc;
  border-top: 1px solid rgba(250, 249, 245, 0.08);
}
html.dark .hm-footer {
  background: #0e0e0d;
  border-top-color: rgba(250, 249, 245, 0.08);
}
.hm-footer-inner {
  width: 100%;
  max-width: 1140px;
  margin: 0 auto;
  padding: 64px 24px 36px;
}
.hm-footer-grid {
  display: grid;
  grid-template-columns: 1.65fr repeat(4, minmax(0, 1fr));
  gap: 40px 32px;
  align-items: start;
}
.hm-footer-brand {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 320px;
}
.hm-footer-logo {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 400;
  letter-spacing: -0.015em;
  color: #faf9f5;
  width: fit-content;
}
.hm-footer-logo img {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  flex-shrink: 0;
}
.hm-footer-tagline {
  font-size: 13.5px;
  line-height: 1.65;
  color: #9c9a92;
}
.hm-footer-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 5px 11px;
  border-radius: var(--radius-full);
  background: rgba(250, 249, 245, 0.05);
  border: 1px solid rgba(250, 249, 245, 0.1);
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: #dedcd1;
}
.hm-footer-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4ade80;
  flex-shrink: 0;
}
.hm-footer-social {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 2px;
}
.hm-footer-social a {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  background: rgba(250, 249, 245, 0.05);
  border: 1px solid rgba(250, 249, 245, 0.1);
  font-size: 12.5px;
  color: #dedcd1;
  transition: background .14s ease, border-color .14s ease, color .14s ease;
}
.hm-footer-social a:hover {
  background: rgba(250, 249, 245, 0.1);
  border-color: rgba(250, 249, 245, 0.22);
  color: #faf9f5;
}
.hm-footer-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}
.hm-footer-heading {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #faf9f5;
}
.hm-footer-col ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.hm-footer-col a {
  font-size: 14px;
  color: #9c9a92;
  transition: color .14s ease;
}
.hm-footer-col a:hover {
  color: #faf9f5;
}
.hm-footer-bottom {
  margin-top: 52px;
  padding-top: 24px;
  border-top: 1px solid rgba(250, 249, 245, 0.1);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px 24px;
  flex-wrap: wrap;
}
.hm-footer-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
  color: #8a8880;
}
.hm-footer-meta a {
  color: #b8b5ab;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.hm-footer-meta a:hover { color: #faf9f5; }
.hm-footer-recaptcha { font-size: 12px; color: #73726c; }
.hm-footer-legal {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 20px;
  font-size: 13px;
  color: #9c9a92;
}
.hm-footer-legal a:hover { color: #faf9f5; }

@media (max-width: 960px) {
  .hm-footer-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 36px 24px;
  }
  .hm-footer-brand {
    grid-column: 1 / -1;
    max-width: 480px;
  }
}
@media (max-width: 640px) {
  .hm-google-signup { width: 100%; }
  .hm-google-btn { width: 100%; }
  .hm-footer { margin-top: 48px; }
  .hm-footer-inner { padding: 48px 18px 28px; }
  .hm-footer-bottom { margin-top: 36px; flex-direction: column; gap: 14px; }
}
`;
}






