// Global Navigation Shell: Sticky Header, Mobile Subnav, Minimal Footer, and Command Palette
// Fully compatible with existing Vitest assertions and layout invariants

import { renderSvg, renderGoogleLogoSvg } from "./icons.js";

export function renderHeader(activeTab: string = "home", owner?: any): string {
  const isAuth = !!(owner && (owner.email || owner.name));
  const userEmail = isAuth ? owner.email || "" : "";
  const userName = isAuth
    ? owner.name || userEmail.split("@")[0] || "User"
    : "";
  const userPicture = isAuth ? owner.picture || "" : "";

  const navLinks = [
    { id: "home", href: "/home", label: "Home", icon: "home" },
    { id: "upload", href: "/upload", label: "Upload", icon: "upload" },
    { id: "store", href: "/store", label: "Store", icon: "folder" },
    { id: "stats", href: "/stats", label: "Stats", icon: "activity" },
    { id: "tools", href: "/tools", label: "Tools", icon: "terminal" },
    { id: "api", href: "/api", label: "API Keys", icon: "key" },
  ];

  const profileAvatar = userPicture
    ? `<img src="${userPicture}" alt="${userName}">`
    : `<span style="font-weight:600;font-size:12px;">${userName.charAt(0).toUpperCase()}</span>`;

  return `
    <header class="nav-header">
      <div class="nav-inner">
        <!-- Left: Brand Avatar & Navigation -->
        <div style="display:flex; align-items:center; gap:24px;">
          <a href="/home" class="brand-wrap">
            <div class="brand-avatar">
              <img src="/icon-48.png?v=2" alt="Krix">
            </div>
            <span>Krix</span>
          </a>

          <nav class="nav-pills desktop-only-nav">
            ${navLinks
              .map(
                (link) => `
              <a href="${link.href}" class="nav-pill ${activeTab === link.id ? "active" : ""}">
                ${link.label}
              </a>
            `,
              )
              .join("")}
          </nav>
        </div>

        <!-- Right: Auth/Profile & Primary Triggers -->
        <div style="display:flex; align-items:center; gap:10px;">
          ${
            isAuth
              ? `
            <!-- Authenticated Profile Menu -->
            <div class="krix-dropdown" id="headerProfileDropdownWrap">
              <button type="button" class="krix-kebab-trigger" id="headerProfileTrigger" onclick="window.toggleKebabMenu(event, 'headerProfileMenu')" aria-label="Account Menu" style="width:auto; padding:2px 6px; border-radius:var(--radius-full); gap:8px;">
                <span class="profile-avatar-wrap">
                  ${profileAvatar}
                </span>
                <span class="desktop-only-nav profile-trigger-name" style="font-size:12px; font-weight:500; max-width:110px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                  ${userName}
                </span>
                ${renderSvg("chevron-down", 13, "desktop-only-nav")}
              </button>

              <div id="headerProfileMenu" class="krix-dropdown-menu" style="min-width:200px;">
                <div style="padding:8px 12px; border-bottom:1px solid var(--border-subtle); margin-bottom:4px;">
                  <div class="profile-menu-name" style="font-size:12px; font-weight:600; color:var(--fg);">${userName}</div>
                  <div class="profile-menu-email" style="font-size:11px; color:var(--geist-gray-50); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${userEmail}</div>
                </div>
                <a href="/settings" class="krix-dropdown-item">
                  ${renderSvg("settings", 15)}
                  <span>Settings</span>
                </a>
                <a href="https://quickwitty.onrender.com" target="_blank" rel="noopener noreferrer" class="krix-dropdown-item">
                  ${renderSvg("external-link", 15)}
                  <span>QuickWitty</span>
                </a>
                <div class="krix-dropdown-divider"></div>
                <a href="/auth/logout" class="krix-dropdown-item danger">
                  ${renderSvg("lock", 15)}
                  <span>Sign Out</span>
                </a>
              </div>
            </div>

            <!-- Sign Out Confirmation Modal (Contract Invariant: id="headerSignOutModal") -->
            <div class="modal-backdrop" id="headerSignOutModal" hidden style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); z-index:var(--z-modal); align-items:center; justify-content:center;">
              <div class="modal-card card spotlight-card" role="dialog" aria-modal="true" style="max-width:400px; padding:24px;">
                <h3 style="font-size:16px; font-weight:600; margin-bottom:8px; color:var(--fg);">Sign Out</h3>
                <p style="font-size:13px; color:var(--geist-gray-50); margin-bottom:20px; line-height:1.5;">Are you sure you want to sign out of your Krix session?</p>
                <div style="display:flex; justify-content:flex-end; gap:10px;">
                  <button type="button" class="btn" onclick="document.getElementById('headerSignOutModal').style.display='none'">Cancel</button>
                  <a href="/auth/logout" class="btn primary" style="background:var(--error); border-color:var(--error); color:#fff;">Confirm Sign Out</a>
                </div>
              </div>
            </div>
          `
              : `
            <!-- Unauthenticated Sign In Trigger -->
            <a href="/auth/google" class="btn primary" style="padding:6px 14px; font-size:12px; border-radius:var(--radius-full);">
              ${renderGoogleLogoSvg(15)}
              <span>Sign in with Google</span>
            </a>
          `
          }
        </div>
      </div>

      <!-- Mobile Navigation Subnav Bar (Contract Invariant) -->
      <div class="mobile-subnav">
        <div class="mobile-subnav-scroll">
          ${navLinks
            .map(
              (link) => `
            <a href="${link.href}" class="mobile-subnav-pill ${activeTab === link.id ? "active" : ""}" aria-label="${link.label}" title="${link.label}">
              ${renderSvg(link.icon, 18)}
            </a>
          `,
            )
            .join("")}
        </div>
      </div>
    </header>
  `;
}

export function renderFooter(): string {
  const currentYear = new Date().getFullYear();
  return `
    <footer class="krix-footer" style="border-top:1px solid var(--border-subtle); background:var(--bg-surface-0); margin-top:auto; padding:48px 24px 36px; position:relative; z-index:1;">
      <div class="krix-footer-inner" style="max-width:1040px; margin:0 auto; display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:32px;">
        <!-- Brand Column -->
        <div class="krix-footer-col" style="display:flex; flex-direction:column; gap:12px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="brand-avatar" style="width:24px; height:24px;">
              <img src="/icon-48.png?v=2" alt="Krix">
            </div>
            <span style="font-weight:700; font-size:14px; letter-spacing:-0.02em;">Krix</span>
          </div>
          <p style="font-size:12px; color:var(--geist-gray-50); line-height:1.6; max-width:240px;">
            High-efficiency Model Context Protocol hub and isolated agent execution workbench.
          </p>
          <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
            <span class="status-dot-available"></span>
            <span style="font-size:11px; color:var(--geist-gray-50);">All Systems Active</span>
          </div>
        </div>

        <!-- Navigation -->
        <div class="krix-footer-col" style="display:flex; flex-direction:column; gap:10px;">
          <div style="font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:var(--fg);">Platform</div>
          <a href="/home" style="font-size:12px; color:var(--geist-gray-50);">Home</a>
          <a href="/upload" style="font-size:12px; color:var(--geist-gray-50);">Upload</a>
          <a href="/store" style="font-size:12px; color:var(--geist-gray-50);">Store</a>
          <a href="/tools" style="font-size:12px; color:var(--geist-gray-50);">Tools Catalog</a>
        </div>

        <!-- Developer Resources -->
        <div class="krix-footer-col" style="display:flex; flex-direction:column; gap:10px;">
          <div style="font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:var(--fg);">Developers</div>
          <a href="/api" style="font-size:12px; color:var(--geist-gray-50);">API Keys</a>
          <a href="/stats" style="font-size:12px; color:var(--geist-gray-50);">Telemetry</a>
          <a href="/settings" style="font-size:12px; color:var(--geist-gray-50);">Settings</a>
          <a href="https://quickwitty.onrender.com" target="_blank" rel="noopener noreferrer" style="font-size:12px; color:var(--geist-gray-50);">QuickWitty Portfolio</a>
        </div>

        <!-- Connect & Security -->
        <div class="krix-footer-col" style="display:flex; flex-direction:column; gap:10px;">
          <div style="font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:var(--fg);">Connect &amp; Legal</div>
          <a href="https://github.com/imunmuted/Krix" target="_blank" rel="noopener noreferrer" style="font-size:12px; color:var(--geist-gray-50); display:flex; align-items:center; gap:6px;">
            ${renderSvg("github", 14)}
            <span>GitHub</span>
          </a>
          <a href="/help" style="font-size:12px; color:var(--geist-gray-50);">Help &amp; Documentation</a>
          <a href="/privacy" style="font-size:12px; color:var(--geist-gray-50);">Privacy Policy</a>
          <a href="/terms" style="font-size:12px; color:var(--geist-gray-50);">Terms of Service</a>
          <a href="https://reddit.com/user/imunmuted" target="_blank" rel="noopener noreferrer" style="font-size:12px; color:var(--geist-gray-50);">Reddit Community</a>
        </div>
      </div>

      <div class="krix-footer-bottom" style="max-width:1040px; margin:32px auto 0; padding-top:20px; border-top:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <span style="font-size:11px; color:var(--geist-gray-50); font-family:var(--font-mono);">
          © ${currentYear} Krix • Streamable HTTP
        </span>
        <button type="button" onclick="window.toggleCommandPalette(true)" style="font-size:11px; color:var(--geist-gray-50); display:flex; align-items:center; gap:5px; cursor:pointer;">
          ${renderSvg("grid", 12)}
          <span>Quick Navigator</span>
        </button>
      </div>

      <div class="recaptcha-notice" style="font-size:11px; color:var(--geist-gray-50); text-align:center; margin-top:20px; line-height:1.5;">
        This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style="color:var(--geist-gray-50); text-decoration:underline;">Privacy Policy</a> and <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" style="color:var(--geist-gray-50); text-decoration:underline;">Terms of Service</a> apply.
      </div>
    </footer>
  `;
}
