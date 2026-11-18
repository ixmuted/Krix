// Application frame: collapsible sidebar on desktop, compact dropdown menu with a top bar on mobile.

import { renderSvg, renderGoogleLogoSvg } from "./icons.js";

export function escapeAttr(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const NAV_LINKS = [
  { id: "home", href: "/", label: "Home", icon: "home" },
  { id: "upload", href: "/upload", label: "Upload", icon: "upload" },
  { id: "store", href: "/store", label: "Files", icon: "files" },
  { id: "tools", href: "/tools", label: "Tools", icon: "terminal" },
  { id: "api", href: "/api", label: "API keys", icon: "key" },
  { id: "stats", href: "/stats", label: "Usage", icon: "activity" },
];

export function renderHeader(activeTab: string = "home", owner?: any): string {
  const isAuth = !!(owner && (owner.email || owner.name));
  const isHome = activeTab === "home";
  const userEmail = isAuth ? escapeAttr(owner.email || "") : "";
  const userName = isAuth
    ? escapeAttr(owner.name || (owner.email || "").split("@")[0] || "User")
    : "";
  const userPicture = isAuth && owner.picture ? escapeAttr(owner.picture) : "";
  const profileSvg = renderSvg("user", 16);
  const avatar = userPicture
    ? `<img class="profile-avatar-img" src="${userPicture}" alt="" referrerpolicy="no-referrer"><span class="profile-avatar-fallback" style="display:none;align-items:center;justify-content:center;width:100%;height:100%;">${profileSvg}</span>`
    : `<span class="profile-avatar-fallback" style="display:inline-flex;align-items:center;justify-content:center;width:100%;height:100%;">${profileSvg}</span>`;

  const links = NAV_LINKS.map(
    (l) => `
        <a href="${l.href}" class="sb-link${activeTab === l.id ? " active" : ""}" title="${l.label}"${activeTab === l.id ? ' aria-current="page"' : ""}>
          ${renderSvg(l.icon, 18)}<span>${l.label}</span>
        </a>`,
  ).join("");

  const account = isAuth
    ? `
      <div id="headerProfileDropdownWrap">
      <button type="button" class="sb-user" id="headerProfileTrigger" onclick="window.toggleKebabMenu(event, 'headerProfileMenu')" aria-label="Account menu" aria-haspopup="menu">
        <span class="profile-avatar-wrap">${avatar}</span>
        <span class="sb-user-text">
          <div class="profile-trigger-name">${userName}</div>
          <div class="sb-user-sub">${userEmail}</div>
        </span>
        ${renderSvg("chevron-up", 14)}
      </button>
      <div id="headerProfileMenu" class="krix-dropdown-menu sb-menu" role="menu">
        <div class="profile-menu-head">
          <div class="profile-menu-name">${userName}</div>
          <div class="profile-menu-email">${userEmail}</div>
        </div>
        <a href="/settings" class="krix-dropdown-item" role="menuitem">${renderSvg("settings", 16)}<span>Settings</span></a>
        <a href="/help" class="krix-dropdown-item" role="menuitem">${renderSvg("help-circle", 16)}<span>Help</span></a>
        <a href="https://quickwitty.onrender.com" target="_blank" rel="noopener noreferrer" class="krix-dropdown-item" role="menuitem">${renderSvg("external-link", 16)}<span>QuickWitty</span></a>
        <a href="https://github.com/ixmuted/Krix" target="_blank" rel="noopener noreferrer" class="krix-dropdown-item" role="menuitem">${renderSvg("github", 16)}<span>GitHub</span></a>
        <div class="krix-dropdown-divider"></div>
        <button type="button" class="krix-dropdown-item danger" role="menuitem" onclick="document.getElementById('headerSignOutModal').style.display='flex'">${renderSvg("log-out", 16)}<span>Sign out</span></button>
      </div>
      </div>
      <div class="modal-backdrop" id="headerSignOutModal" hidden role="dialog" aria-modal="true" aria-labelledby="signOutTitle" onclick="if(event.target===this)this.style.display='none'">
        <div class="modal-card">
          <h3 class="modal-title" id="signOutTitle">Sign out of Krix?</h3>
          <p class="modal-text">You will need to sign in with Google again to manage keys and files.</p>
          <div class="modal-actions">
            <button type="button" class="btn" onclick="document.getElementById('headerSignOutModal').style.display='none'">Cancel</button>
            <a href="/auth/logout" class="btn danger">Confirm Sign Out</a>
          </div>
        </div>
      </div>`
    : `
      <a href="/auth/google" class="btn primary sb-signin">${renderGoogleLogoSvg(16)}<span>Sign in with Google</span></a>`;

  const topbarLeft = isAuth
    ? `<button type="button" id="topbarNavToggle" class="icon-btn topbar-menu-btn" onclick="window.toggleNav()" aria-label="Open menu" aria-expanded="false" aria-controls="appSidebar"><span class="icon-menu">${renderSvg("sidebar", 22)}</span><span class="icon-close">${renderSvg("x", 22)}</span></button>`
    : `<span class="topbar-spacer" aria-hidden="true"></span>`;

  const topbarRight = isHome
    ? `<span class="topbar-spacer" aria-hidden="true"></span>`
    : `<button type="button" class="icon-btn topbar-search-btn" onclick="window.toggleCommandPalette(true)" aria-label="Search" title="Search (Ctrl+K or /)">${renderSvg("search", 20)}</button>`;

  return `
    <aside class="sidebar${isAuth ? "" : " sidebar-unauth"}" id="appSidebar" aria-label="Primary">
      <div class="sb-head">
        <a href="/" class="sb-brand"><img src="/icon-48.png?v=2" alt="" width="24" height="24"><span>Krix</span></a>
        <button type="button" class="icon-btn sb-collapse-btn" onclick="window.toggleSidebar()" aria-label="Collapse sidebar" title="Collapse sidebar">${renderSvg("sidebar", 20)}</button>
      </div>
      <nav class="sb-nav">
        ${links}
      </nav>
      <div class="sb-foot">${account}</div>
    </aside>
    <div class="scrim" onclick="window.toggleNav(false)"></div>
    <header class="topbar">
      ${topbarLeft}
      <a href="/" class="sb-brand"><img src="/icon-48.png?v=2" alt="" width="24" height="24"><span>Krix</span></a>
      ${topbarRight}
    </header>
  `;
}

export function renderFooter(): string {
  return `
    <footer class="page-foot">
      <a href="/store">Files</a>
      <a href="/help">Help</a>
      <a href="/privacy">Privacy</a>
      <a href="/terms">Terms</a>
      <a href="https://github.com/ixmuted/Krix" target="_blank" rel="noopener noreferrer">GitHub</a>
    </footer>
  `;
}

export function renderRecaptchaNotice(): string {
  return `
    <p class="recaptcha-notice">This site is protected by reCAPTCHA and the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a> and <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> apply.</p>
  `;
}
