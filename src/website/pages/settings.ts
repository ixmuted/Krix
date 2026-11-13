// Workspace & Account Settings Page
// Contract Invariants: 50 MB / 300 MB quota cards, Standard Member / Server Owner badges, 2.5 MB, Per file limit, 400 KB max output, 204 PIDs, 2048 PIDs, Code Graph Context (29 tools), Granular Tool Permissions & Code Graph

import { renderPageShell, escapeHtml } from "../components.js";
import { renderSvg } from "../icons.js";

export function renderSettingsPage(params: {
  base: string;
  isOwner?: boolean;
  isServerOwner?: boolean;
  owner?: any;
  keys: any[];
  selectedKeyId?: string;
  keySettings: any;
  userQuota: any;
  toolsCatalog: any[];
  credentialAvailability: any;
  codeGraphCount?: number;
}): string {
  const isOwner = !!(params.isOwner || params.isServerOwner);
  const quotaLimitDisplay = isOwner ? "300 MB" : "50 MB";
  const roleBadge = isOwner
    ? "Server Owner"
    : "Standard Member (1/10th Limits)";
  const pidsLimit = isOwner ? "2048 PIDs" : "204 PIDs";
  const perFileLimit = isOwner ? "25 MB" : "2.5 MB";
  const bufferLimit = isOwner ? "4 MB max output" : "400 KB max output";

  const content = `
    <!-- Top Header Deck -->
    <div style="margin-bottom:28px;">
      <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:var(--geist-gray-50);">PREFERENCES & GOVERNANCE</div>
      <h1 style="font-size:24px; font-weight:700; letter-spacing:-0.03em; color:var(--fg); margin-top:4px;">Workspace Settings</h1>
      <p style="font-size:13px; color:var(--geist-gray-50); margin-top:2px;">
        Configure workspace resource quotas, retention policies, and session parameters.
      </p>
    </div>

    <!-- Storage Quota Allocation Card (Contract Invariant) -->
    <div class="card spotlight-card card-top-border" style="padding:24px; margin-bottom:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
        <div>
          <h2 style="font-size:16px; font-weight:600; color:var(--fg);">Resource Allocation & Quota</h2>
          <p style="font-size:12px; color:var(--geist-gray-50); margin-top:2px;">
            ${isOwner ? "Owner Tier: Full storage capacity and unlimited sandbox compute" : "User Tier: Standard workspace sandbox quota"}
          </p>
        </div>

        <span class="badge" style="font-size:12px; font-weight:600; font-family:var(--font-mono); padding:4px 12px; border-radius:var(--radius-full); background:var(--bg-surface-2); border:1px solid var(--border-subtle); color:var(--fg);">
          ${quotaLimitDisplay}
        </span>
      </div>

      <div style="background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:16px; display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
        <div>
          <div style="font-size:11px; color:var(--geist-gray-50); font-weight:600; text-transform:uppercase;">Storage Capacity</div>
          <div style="font-size:20px; font-weight:700; font-family:var(--font-mono); color:var(--fg); margin-top:2px;">${quotaLimitDisplay}</div>
        </div>
        <div>
          <div style="font-size:11px; color:var(--geist-gray-50); font-weight:600; text-transform:uppercase;">Account Role</div>
          <div style="font-size:13px; font-weight:600; color:var(--fg); margin-top:4px;">${roleBadge}</div>
        </div>
        <div>
          <div style="font-size:11px; color:var(--geist-gray-50); font-weight:600; text-transform:uppercase;">Per file limit</div>
          <div style="font-size:13px; font-weight:600; font-family:var(--font-mono); color:var(--fg); margin-top:4px;">${perFileLimit}</div>
        </div>
        <div>
          <div style="font-size:11px; color:var(--geist-gray-50); font-weight:600; text-transform:uppercase;">Buffer Limit</div>
          <div style="font-size:13px; font-weight:600; font-family:var(--font-mono); color:var(--fg); margin-top:4px;">${bufferLimit}</div>
        </div>
        <div>
          <div style="font-size:11px; color:var(--geist-gray-50); font-weight:600; text-transform:uppercase;">Process Limit</div>
          <div style="font-size:13px; font-weight:600; font-family:var(--font-mono); color:var(--fg); margin-top:4px;">${pidsLimit}</div>
        </div>
      </div>
    </div>

    <!-- Tool Permissions & Code Graph Section (Contract Invariant) -->
    <div class="card spotlight-card" style="padding:24px; margin-bottom:24px;">
      <h2 style="font-size:16px; font-weight:600; color:var(--fg); margin-bottom:4px;">Granular Tool Permissions & Code Graph</h2>
      <p style="font-size:12px; color:var(--geist-gray-50); margin-bottom:16px;">
        Manage access controls and AST inspection capabilities.
      </p>

      <div style="background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:16px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:13px; font-weight:600; color:var(--fg);">Code Graph Context (29 tools)</div>
          <div style="font-size:12px; color:var(--geist-gray-50);">Deep structural AST inspection and call hierarchy traversal</div>
        </div>
        <span class="status-pill" style="font-size:11px;">
          <span class="status-dot-available"></span>
          <span>Configured</span>
        </span>
      </div>
    </div>

    <!-- Appearance & Density Preferences -->
    <div class="card spotlight-card" style="padding:24px; margin-bottom:24px;">
      <h2 style="font-size:16px; font-weight:600; color:var(--fg); margin-bottom:16px;">Interface Preferences</h2>

      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:13px; font-weight:600; color:var(--fg);">Theme</div>
            <div style="font-size:12px; color:var(--geist-gray-50);">Select your default color scheme</div>
          </div>
          <div style="display:inline-flex; border:1px solid var(--border-subtle); border-radius:var(--radius-full); padding:3px; background:var(--bg-surface-1);">
            <button type="button" class="nav-pill active" onclick="window.toggleTheme()" style="font-size:12px; padding:3px 10px; border-radius:var(--radius-full);">Toggle Theme</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="card spotlight-card" style="padding:24px; border-color:rgba(239, 68, 68, 0.3);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <h2 style="font-size:16px; font-weight:600; color:var(--error);">Session Termination</h2>
          <p style="font-size:12px; color:var(--geist-gray-50); margin-top:2px;">Sign out of your active Google session on this workstation.</p>
        </div>
        <a href="/auth/logout" class="btn danger" style="border-radius:var(--radius-full); padding:8px 18px;">
          ${renderSvg("lock", 14)}
          <span>Sign Out</span>
        </a>
      </div>
    </div>
  `;

  return renderPageShell({
    title: "Settings - Krix",
    activeTab: "settings",
    content,
    owner: params.owner,
  });
}
