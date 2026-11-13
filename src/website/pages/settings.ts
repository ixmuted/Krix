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

  const keySettings = params.keySettings || {};
  const currentKeyId =
    params.selectedKeyId ||
    (params.keys && params.keys[0]?.id) ||
    "primary-key";
  const maskedGitHub = keySettings.customGitHubToken
    ? `${keySettings.customGitHubToken.slice(0, 4)}••••••••${keySettings.customGitHubToken.slice(-4)}`
    : "Not Configured";
  const maskedRender = keySettings.customRenderToken
    ? `${keySettings.customRenderToken.slice(0, 4)}••••••••${keySettings.customRenderToken.slice(-4)}`
    : "Not Configured";

  const codeGraphTools = (params.toolsCatalog || []).filter(
    (t: any) => t.category === "Code Graph" || t.category === "Search",
  );

  const content = `
    <!-- Top Header Deck -->
    <div style="margin-bottom:28px;">
      <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:var(--geist-gray-50);">PREFERENCES & GOVERNANCE</div>
      <h1 style="font-size:24px; font-weight:700; letter-spacing:-0.03em; color:var(--fg); margin-top:4px;">Workspace Settings</h1>
      <p style="font-size:13px; color:var(--geist-gray-50); margin-top:2px;">
        Configure workspace resource quotas, retention policies, and credential integrations.
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

      <div style="background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:16px; display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:16px;">
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

    <!-- Provider Credentials Section (Direct Configurator) -->
    <div class="card spotlight-card card-top-border" style="padding:24px; margin-bottom:24px;">
      <h2 style="font-size:16px; font-weight:600; color:var(--fg); margin-bottom:4px;">Provider Credentials & Tokens</h2>
      <p style="font-size:12px; color:var(--geist-gray-50); margin-bottom:16px;">
        Configure personal credentials used by the agent to access GitHub and Render on your behalf.
      </p>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px; margin-bottom:16px;">
        <div style="padding:16px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
            ${renderSvg("github", 18)}
            <span style="font-size:13px; font-weight:600; color:var(--fg);">GitHub Personal Access Token</span>
          </div>
          <input type="password" id="settingsGithubInput" placeholder="github_pat_... or ghp_..." style="width:100%; padding:8px 12px; background:var(--bg-surface-0); border:1px solid var(--border-medium); border-radius:var(--radius-md); font-family:var(--font-mono); font-size:12px; color:var(--fg); margin-bottom:6px; outline:none;">
          <div style="font-size:11px; color:var(--geist-gray-50);">Current: <code style="font-family:var(--font-mono);">${escapeHtml(maskedGitHub)}</code></div>
        </div>

        <div style="padding:16px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
            ${renderSvg("render", 18)}
            <span style="font-size:13px; font-weight:600; color:var(--fg);">Render API Key</span>
          </div>
          <input type="password" id="settingsRenderInput" placeholder="rnd_..." style="width:100%; padding:8px 12px; background:var(--bg-surface-0); border:1px solid var(--border-medium); border-radius:var(--radius-md); font-family:var(--font-mono); font-size:12px; color:var(--fg); margin-bottom:6px; outline:none;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size:11px; color:var(--geist-gray-50);">Current: <code style="font-family:var(--font-mono);">${escapeHtml(maskedRender)}</code></div>
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end;">
        <button type="button" class="btn primary deploy-btn" onclick="saveSettingsCredentials()" style="border-radius:var(--radius-full); padding:8px 20px;">
          ${renderSvg("shield", 14)}
          <span>Save Credentials</span>
        </button>
      </div>
    </div>

    <!-- Tool Permissions & Code Graph Section (Contract Invariant) -->
    <div class="card spotlight-card" style="padding:24px; margin-bottom:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
        <div>
          <h2 style="font-size:16px; font-weight:600; color:var(--fg);">Granular Tool Permissions & Code Graph</h2>
          <p style="font-size:12px; color:var(--geist-gray-50); margin-top:2px;">
            Manage access controls and AST inspection capabilities.
          </p>
        </div>
        <button type="button" class="btn ghost" onclick="resetToolDefaults()" style="font-size:11px; padding:4px 10px; border-radius:var(--radius-full);">
          Reset Defaults
        </button>
      </div>

      <div class="tools-manager-bar" style="display:flex; flex-direction:column; gap:12px; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div class="search-input-wrap" style="width:100%; max-width:380px; display:flex; align-items:center; gap:8px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:6px 12px;">
            ${renderSvg("search", 15)}
            <input
              type="text"
              id="toolSearchInput"
              class="search-input"
              placeholder="Search tools by name, category or description"
              oninput="filterToolRows()"
              autocomplete="off"
              spellcheck="false"
              style="border:none; background:transparent; font-size:12px; color:var(--fg); outline:none; width:100%;"
            >
          </div>
        </div>
      </div>

      <div style="background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:16px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:13px; font-weight:600; color:var(--fg);">Code Graph Context (29 tools)</div>
          <div style="font-size:12px; color:var(--geist-gray-50);">Deep structural AST inspection and call hierarchy traversal</div>
        </div>
        <span class="status-pill" style="font-size:11px;">
          <span class="status-dot-available"></span>
          <span>Configured</span>
        </span>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:10px; max-height:280px; overflow-y:auto; padding:4px;">
        ${
          codeGraphTools
            .map((t: any) => {
              const isEnabled = keySettings.enabledTools?.includes(t.name);
              return `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); font-size:12px;">
                <span style="font-family:var(--font-mono); color:var(--fg);">${escapeHtml(t.name)}</span>
                <input type="checkbox" onchange="toggleToolPermission('${escapeHtml(t.name)}', this.checked)" ${isEnabled ? "checked" : ""} style="accent-color:var(--accent); width:16px; height:16px; cursor:pointer;">
              </div>
            `;
            })
            .join("") ||
          `<div style="color:var(--geist-gray-50); font-size:12px; padding:12px;">All tools active by default</div>`
        }
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
            <button type="button" class="nav-pill active" onclick="window.toggleTheme()" style="font-size:12px; padding:4px 14px; border-radius:var(--radius-full);">Toggle Theme</button>
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

    <script>
      const activeKeyId = ${JSON.stringify(currentKeyId)};

      function saveSettingsCredentials() {
        const gh = document.getElementById('settingsGithubInput')?.value?.trim();
        const rn = document.getElementById('settingsRenderInput')?.value?.trim();

        fetch('/settings/api/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyId: activeKeyId,
            githubToken: gh !== '' ? gh : undefined,
            renderToken: rn !== '' ? rn : undefined
          })
        }).then(res => res.json()).then(data => {
          if (data && data.ok) {
            if (window.showToast) window.showToast('Credentials updated successfully', 'success');
            setTimeout(() => window.location.reload(), 600);
          } else {
            if (window.showToast) window.showToast(data.error || 'Failed to save', 'error');
          }
        }).catch(err => {
          if (window.showToast) window.showToast('Network error: ' + err.message, 'error');
        });
      }

      function toggleToolPermission(toolName, enabled) {
        fetch('/settings/api/tool-toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyId: activeKeyId, toolName: toolName, enabled: enabled })
        }).then(res => res.json()).then(data => {
          if (data && data.ok) {
            if (window.showToast) window.showToast(toolName + (enabled ? ' enabled' : ' disabled'), 'success');
          } else {
            if (window.showToast) window.showToast('Failed to toggle tool', 'error');
          }
        }).catch(err => {
          if (window.showToast) window.showToast('Network error', 'error');
        });
      }

      function filterToolRows() {
        const q = (document.getElementById('toolSearchInput')?.value || '').toLowerCase();
        document.querySelectorAll('.tool-toggle-row').forEach(row => {
          const name = row.getAttribute('data-tool-name') || '';
          row.style.display = name.toLowerCase().includes(q) ? 'flex' : 'none';
        });
      }

      function resetToolDefaults() {
        fetch('/settings/api/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyId: activeKeyId, enabledTools: [], disabledTools: [] })
        }).then(res => res.json()).then(data => {
          if (data && data.ok) {
            if (window.showToast) window.showToast('Tool permissions reset', 'success');
            setTimeout(() => window.location.reload(), 500);
          }
        });
      }
    </script>
  `;

  return renderPageShell({
    title: "Settings",
    activeTab: "settings",
    content,
    owner: params.owner,
  });
}
