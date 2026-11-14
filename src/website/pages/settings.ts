// Workspace & Account Settings Page
// Contract Invariants: 50 MB / 300 MB quota cards, Standard Member / Server Owner badges, 2.5 MB, Per file limit, 400 KB max output, 204 PIDs, 2048 PIDs, Code Graph Context (29 tools), Tool Permissions

import { renderPageShell, escapeHtml } from "../components.js";
import { renderSvg } from "../icons.js";
import { isDefaultGithubTool } from "../../toolDefaults.js";

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
  const githubSecret = String(keySettings.customGitHubToken || "");
  const renderSecret = String(keySettings.customRenderToken || "");
  const maskedGitHub = githubSecret
    ? `${githubSecret.slice(0, 4)}••••••••${githubSecret.slice(-4)}`
    : "";
  const maskedRender = renderSecret
    ? `${renderSecret.slice(0, 4)}••••••••${renderSecret.slice(-4)}`
    : "";
  const enabledTools = new Set<string>(
    Array.isArray(keySettings.enabledTools) ? keySettings.enabledTools : [],
  );
  const disabledTools = new Set<string>(
    Array.isArray(keySettings.disabledTools) ? keySettings.disabledTools : [],
  );
  const enabledCategories = new Set<string>(
    Array.isArray(keySettings.enabledCategories)
      ? keySettings.enabledCategories
      : [],
  );
  const isToolEnabled = (tool: any): boolean => {
    const name = String(tool.name || "");
    if (disabledTools.has(name)) return false;
    if (enabledTools.has(name)) return true;
    if (name === "web_search") return false;
    const category = String(tool.category || "");
    const categoryKeys: Record<string, string[]> = {
      GitHub: [],
      Sandbox: ["sandbox"],
      Files: ["files"],
      Execution: ["sandbox"],
      Filesystem: ["files"],
      "Code Graph": ["codegraph"],
      Search: ["search"],
    };
    // With a GitHub token only the default GitHub tool set is on; everything else is opt-in.
    if (category === "GitHub" && params.credentialAvailability?.github)
      return isDefaultGithubTool(name);
    if (category === "Sandbox" && params.credentialAvailability?.github)
      return true;
    return (
      category !== "Code Graph" &&
      category !== "Search" &&
      (categoryKeys[category] || []).some((item) => enabledCategories.has(item))
    );
  };

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
          <div class="settings-secret-control">
            <input type="text" id="settingsGithubInput" value="${escapeHtml(maskedGitHub)}" data-secret="${escapeHtml(githubSecret)}" data-masked="${escapeHtml(maskedGitHub)}" data-editing="false" data-revealed="false" readonly placeholder="Not configured — select Edit to add a token" style="width:100%; padding:9px 10px; background:var(--bg-surface-0); border:1px solid var(--border-medium); border-radius:6px; font-family:var(--font-mono); font-size:12px; color:var(--fg); outline:none;">
            <button type="button" class="btn ghost" onclick="toggleSettingsSecret('settingsGithubInput','reveal')" title="Show or hide GitHub token" aria-label="Show or hide GitHub token" style="padding:7px; border-radius:6px;">${renderSvg("eye", 14)}</button>
            <button type="button" class="btn ghost" onclick="toggleSettingsSecret('settingsGithubInput','edit')" title="Edit GitHub token" aria-label="Edit GitHub token" style="padding:7px; border-radius:6px;">${renderSvg("edit", 14)}</button>
          </div>
        </div>

        <div style="padding:16px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
            ${renderSvg("render", 18)}
            <span style="font-size:13px; font-weight:600; color:var(--fg);">Render API Key</span>
          </div>
          <div class="settings-secret-control">
            <input type="text" id="settingsRenderInput" value="${escapeHtml(maskedRender)}" data-secret="${escapeHtml(renderSecret)}" data-masked="${escapeHtml(maskedRender)}" data-editing="false" data-revealed="false" readonly placeholder="Not configured — select Edit to add a token" style="width:100%; padding:9px 10px; background:var(--bg-surface-0); border:1px solid var(--border-medium); border-radius:6px; font-family:var(--font-mono); font-size:12px; color:var(--fg); outline:none;">
            <button type="button" class="btn ghost" onclick="toggleSettingsSecret('settingsRenderInput','reveal')" title="Show or hide Render token" aria-label="Show or hide Render token" style="padding:7px; border-radius:6px;">${renderSvg("eye", 14)}</button>
            <button type="button" class="btn ghost" onclick="toggleSettingsSecret('settingsRenderInput','edit')" title="Edit Render token" aria-label="Edit Render token" style="padding:7px; border-radius:6px;">${renderSvg("edit", 14)}</button>
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; align-items:center; gap:8px;">
        <button type="button" id="settingsCancelCredentialsBtn" class="btn secondary" onclick="cancelSettingsCredentials()" style="display:none; border-radius:6px; padding:8px 18px;">
          <span>Cancel Changes</span>
        </button>
        <button type="button" id="settingsSaveCredentialsBtn" class="btn primary deploy-btn" onclick="saveSettingsCredentials()" style="display:none; border-radius:6px; padding:8px 18px;">
          ${renderSvg("shield", 14)}
          <span>Save Changes</span>
        </button>
      </div>
    </div>

    <!-- Tool Permissions Section -->
    <div class="card spotlight-card" style="padding:24px; margin-bottom:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
        <div>
          <h2 style="font-size:16px; font-weight:600; color:var(--fg);">Tool Permissions</h2>
          <p style="font-size:12px; color:var(--geist-gray-50); margin-top:2px;">
            Manage tool access for this workspace and its API credentials.
          </p>
        </div>
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

      <div class="category-filter-grid" style="margin-bottom:14px;">
        <button type="button" class="category-filter-pill active" data-cat="All" onclick="filterSettingsCat('All', this)">
          All (${(params.toolsCatalog || []).length})
        </button>
        <button type="button" class="category-filter-pill" data-cat="Sandbox" onclick="filterSettingsCat('Sandbox', this)">
          Sandbox (${(params.toolsCatalog || []).filter((t: any) => t.category === "Sandbox" || t.category === "Files" || t.category === "Search").length})
        </button>
        <button type="button" class="category-filter-pill" data-cat="Render" onclick="filterSettingsCat('Render', this)">
          Render (${(params.toolsCatalog || []).filter((t: any) => t.category === "Render").length})
        </button>
        <button type="button" class="category-filter-pill" data-cat="GitHub" onclick="filterSettingsCat('GitHub', this)">
          GitHub (${(params.toolsCatalog || []).filter((t: any) => t.category === "GitHub").length})
        </button>
        <button type="button" class="category-filter-pill" data-cat="Code Graph" onclick="filterSettingsCat('Code Graph', this)">
          Code Graph (${(params.toolsCatalog || []).filter((t: any) => t.category === "Code Graph").length})
        </button>
      </div>

      <div id="settingsToolsGrid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:10px; max-height:360px; overflow-y:auto; padding:4px;">
        ${(params.toolsCatalog && params.toolsCatalog.length > 0
          ? params.toolsCatalog
          : codeGraphTools
        )
          .map((t: any) => {
            const cat = t.category || "General";
            const isEnabled = isToolEnabled(t);
            return `
              <div class="settings-tool-row tool-toggle-row" data-cat="${escapeHtml(cat)}" data-tool-name="${escapeHtml(t.name).toLowerCase()}" data-name="${escapeHtml(t.name)}" style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md); font-size:12px;">
                <div style="min-width:0; flex:1; padding-right:10px;">
                  <div style="font-family:var(--font-mono); font-weight:600; color:var(--fg); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${escapeHtml(t.name)}</div>
                  <div style="font-size:11px; color:var(--geist-gray-50);">${escapeHtml(cat)}</div>
                </div>
                <label class="switch krix-switch" title="Toggle Tool Permission">
                  <input type="checkbox" onchange="toggleToolPermission('${escapeHtml(t.name)}', this.checked, this)" ${isEnabled ? "checked" : ""}>
                  <span class="krix-slider"></span>
                </label>
              </div>
            `;
          })
          .join("")}
      </div>
      <div class="permission-pagination" style="display:flex; align-items:center; gap:10px; margin-top:14px;">
        <span id="settingsToolsPageInfo" style="font-size:12px; color:var(--geist-gray-50); margin-right:auto;">Page 1 of 1</span>
        <button type="button" id="settingsToolsPrev" class="pager-btn pager-prev" onclick="changeSettingsToolsPage(-1)" aria-label="Previous page">${renderSvg("chevron-left", 16)}<span>Previous</span></button>
        <button type="button" id="settingsToolsNext" class="pager-btn pager-next" onclick="changeSettingsToolsPage(1)" aria-label="Next page"><span>Next</span>${renderSvg("chevron-right", 16)}</button>
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
          <div class="theme-mode-control" style="display:inline-flex; align-items:center; gap:4px; padding:4px; border:1px solid var(--border-medium); border-radius:6px; background:var(--bg-surface-1);">
            <button type="button" class="theme-mode-button" data-theme-mode="system" onclick="window.setThemeMode('system')" style="display:inline-flex; align-items:center; gap:6px; height:34px; padding:0 10px; border:1px solid transparent; border-radius:4px; font-size:12px;">${renderSvg("monitor", 17)}</button>
            <button type="button" class="theme-mode-button" data-theme-mode="light" onclick="window.setThemeMode('light')" style="display:inline-flex; align-items:center; gap:6px; height:34px; padding:0 10px; border:1px solid transparent; border-radius:4px; font-size:12px;">${renderSvg("sun", 17)}</button>
            <button type="button" class="theme-mode-button" data-theme-mode="dark" onclick="window.setThemeMode('dark')" style="display:inline-flex; align-items:center; gap:6px; height:34px; padding:0 10px; border:1px solid transparent; border-radius:4px; font-size:12px;">${renderSvg("moon", 17)}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Danger Zone: Session Termination & Account Deletion -->
    <div class="card spotlight-card" style="padding:24px; border-color:rgba(239, 68, 68, 0.3); margin-bottom:24px;">
      <h2 style="font-size:16px; font-weight:600; color:var(--error); margin-bottom:16px;">Danger Zone</h2>

      <div style="display:flex; flex-direction:column; gap:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding-bottom:16px; border-bottom:1px solid var(--border-subtle);">
          <div>
            <div style="font-size:13px; font-weight:600; color:var(--fg);">Reset Tool Permissions</div>
            <div style="font-size:12px; color:var(--geist-gray-50); margin-top:2px;">Reset all tool access overrides to their default permissions.</div>
          </div>
          <button type="button" class="btn danger" onclick="resetToolDefaults()" style="border:1px solid rgba(239,68,68,.35); border-radius:6px; min-width:180px; min-height:38px; padding:8px 18px; justify-content:center; box-sizing:border-box;">
            ${renderSvg("refresh", 15)}<span>Reset Tools</span>
          </button>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding-bottom:16px; border-bottom:1px solid var(--border-subtle);">
          <div>
            <div style="font-size:13px; font-weight:600; color:var(--fg);">Session Termination</div>
            <div style="font-size:12px; color:var(--geist-gray-50); margin-top:2px;">Sign out of your active Google session on this workstation.</div>
          </div>
          <a href="/auth/logout" class="btn danger" style="border-radius:6px; padding:8px 18px; min-width:180px; min-height:38px; justify-content:center;">
            ${renderSvg("lock", 14)}
            <span>Sign Out</span>
          </a>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <div style="font-size:13px; font-weight:600; color:var(--error);">Account Deletion</div>
            <div style="font-size:12px; color:var(--geist-gray-50); margin-top:2px;">Permanently delete your account, API keys, and all uploaded repository artifacts.</div>
          </div>
          <button type="button" class="btn danger" onclick="openDeleteAccountModal()" style="border-radius:6px; padding:8px 18px; min-width:180px; min-height:38px; justify-content:center;">
            ${renderSvg("trash", 14)}
            <span>Delete Account</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Account Deletion Confirmation Modal Dialog -->
    <div id="deleteAccountModal" class="modal-backdrop" hidden role="dialog" aria-modal="true" style="position:fixed; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(6px); z-index:var(--z-modal); display:none; align-items:center; justify-content:center; padding:16px;">
      <div class="modal-card card spotlight-card" style="max-width:440px; width:100%; max-height:calc(100dvh - 32px); overflow-y:auto; padding:24px;">
        <h3 style="font-size:17px; font-weight:700; color:var(--error); margin-bottom:8px;">Delete Account &amp; Purge Data</h3>
        <p style="font-size:13px; color:var(--geist-gray-50); line-height:1.5; margin-bottom:16px;">
          This action is permanent and cannot be undone. All your API keys, OAuth authorizations, and stored files will be permanently erased.
        </p>
        <p style="font-size:12px; color:var(--fg); margin-bottom:12px;">
          Please type <strong>DELETE</strong> to confirm:
        </p>
        <input type="text" id="deleteAccountConfirmInput" placeholder="DELETE" style="width:100%; padding:8px 12px; background:var(--bg-surface-1); border:1px solid var(--border-medium); border-radius:var(--radius-md); font-family:var(--font-mono); font-size:13px; color:var(--fg); margin-bottom:20px; outline:none;">
        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button type="button" class="btn ghost" onclick="closeDeleteAccountModal()">Cancel</button>
          <button type="button" id="confirmDeleteAccountBtn" class="btn danger" onclick="submitDeleteAccount()">Confirm Permanent Deletion</button>
        </div>
      </div>
    </div>

    <script>
      const activeKeyId = ${JSON.stringify(currentKeyId)};

      let currentSettingsCategory = 'All';
      let currentSettingsToolsPage = 1;
      const settingsToolsPageSize = 12;

      function openDeleteAccountModal() {
        const m = document.getElementById('deleteAccountModal');
        if (m) { m.hidden = false; m.style.display = 'flex'; }
      }

      function closeDeleteAccountModal() {
        const m = document.getElementById('deleteAccountModal');
        if (m) { m.hidden = true; m.style.display = 'none'; }
      }

      function submitDeleteAccount() {
        const val = document.getElementById('deleteAccountConfirmInput')?.value?.trim();
        if (val !== 'DELETE') {
          if (window.showToast) window.showToast('Please type DELETE to confirm', 'error');
          return;
        }
        fetch('/api/account/delete', { method: 'POST' }).then(res => {
          if (res.ok) {
            if (window.showToast) window.showToast('Account deleted successfully', 'success');
            setTimeout(() => { window.location.href = '/home'; }, 1000);
          } else {
            if (window.showToast) window.showToast('Failed to delete account', 'error');
          }
        }).catch(err => {
          if (window.showToast) window.showToast('Network error: ' + err.message, 'error');
        });
      }

      function toggleSettingsSecret(id, mode) {
        const input = document.getElementById(id);
        if (!input) return;
        if (mode === 'edit') {
          if (input.dataset.editing !== 'true') {
            input.value = input.dataset.secret || '';
            input.readOnly = false;
            input.type = 'password';
            input.dataset.editing = 'true';
            input.dataset.revealed = 'false';
            document.getElementById('settingsSaveCredentialsBtn').style.display = 'inline-flex';
            const cancelBtn = document.getElementById('settingsCancelCredentialsBtn');
            if (cancelBtn) cancelBtn.style.display = 'inline-flex';
            input.focus();
          }
          return;
        }
        if (input.dataset.editing === 'true') {
          input.type = input.type === 'password' ? 'text' : 'password';
          return;
        }
        const reveal = input.dataset.revealed !== 'true';
        input.dataset.revealed = reveal ? 'true' : 'false';
        input.value = reveal ? (input.dataset.secret || '') : (input.dataset.masked || '');
      }

      function cancelSettingsCredentials() {
        ['settingsGithubInput', 'settingsRenderInput'].forEach(id => {
          const input = document.getElementById(id);
          if (input && input.dataset.editing === 'true') {
            input.value = input.dataset.masked || '';
            input.readOnly = true;
            input.type = 'text';
            input.dataset.editing = 'false';
            input.dataset.revealed = 'false';
          }
        });
        const saveBtn = document.getElementById('settingsSaveCredentialsBtn');
        const cancelBtn = document.getElementById('settingsCancelCredentialsBtn');
        if (saveBtn) saveBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'none';
      }

      function saveSettingsCredentials() {
        const ghInput = document.getElementById('settingsGithubInput');
        const rnInput = document.getElementById('settingsRenderInput');
        const payload = { keyId: activeKeyId };
        if (ghInput?.dataset.editing === 'true') payload.githubToken = ghInput.value.trim();
        if (rnInput?.dataset.editing === 'true') payload.renderToken = rnInput.value.trim();
        if (payload.githubToken === undefined && payload.renderToken === undefined) {
          if (window.showToast) window.showToast('Edit a credential before saving.', 'info');
          return;
        }

        const button = document.getElementById('settingsSaveCredentialsBtn');
        if (button) { button.disabled = true; button.textContent = 'Saving…'; }
        fetch('/settings/api/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(res => res.json()).then(data => {
          if (data && data.ok) {
            if (window.showToast) window.showToast('Credentials updated successfully', 'success');
            setTimeout(() => window.location.reload(), 600);
          } else {
            if (window.showToast) window.showToast(data.error || 'Credential validation or save failed', 'error');
          }
        }).catch(err => {
          if (window.showToast) window.showToast('Network error: ' + err.message, 'error');
        }).finally(() => { if (button) { button.disabled = false; button.innerHTML = 'Save Changes'; } });
      }

      function filterSettingsCat(cat, btn) {
        currentSettingsCategory = cat;
        document.querySelectorAll('.category-filter-pill, .settings-cat-pill').forEach(b => {
          b.classList.remove('active');
        });
        if (btn) btn.classList.add('active');
        currentSettingsToolsPage = 1;
        renderSettingsTools();
      }

      function toggleToolPermission(toolName, enabled, input) {
        fetch('/settings/api/tool-toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyId: activeKeyId, toolName: toolName, enabled: enabled })
        }).then(res => res.json()).then(data => {
          if (data && data.ok) {
            if (window.showToast) window.showToast(toolName + (enabled ? ' enabled' : ' disabled'), 'success');
          } else {
            // Server refused (for example a missing GitHub/Render credential): undo the toggle.
            if (input) input.checked = !enabled;
            if (window.showToast) window.showToast((data && data.error) || 'This tool is unavailable until its required provider credential is saved.', 'error');
          }
        }).catch(err => {
          if (input) input.checked = !enabled;
          if (window.showToast) window.showToast('Network error', 'error');
        });
      }

      function filterToolRows() {
        currentSettingsToolsPage = 1;
        renderSettingsTools();
      }

      function renderSettingsTools() {
        const q = (document.getElementById('toolSearchInput')?.value || '').toLowerCase().trim();
        const rows = Array.from(document.querySelectorAll('.tool-toggle-row'));
        const filtered = rows.filter(row => {
          const category = row.getAttribute('data-cat') || '';
          const name = row.getAttribute('data-tool-name') || '';
          const categoryMatch = currentSettingsCategory === 'All' || category === currentSettingsCategory || (currentSettingsCategory === 'Sandbox' && ['Files','Search','Filesystem','Execution'].includes(category));
          return categoryMatch && (!q || row.textContent.toLowerCase().includes(q));
        });
        const totalPages = Math.max(1, Math.ceil(filtered.length / settingsToolsPageSize));
        currentSettingsToolsPage = Math.min(currentSettingsToolsPage, totalPages);
        const start = (currentSettingsToolsPage - 1) * settingsToolsPageSize;
        rows.forEach(row => row.style.display = 'none');
        filtered.forEach((row, index) => { if (index >= start && index < start + settingsToolsPageSize) row.style.display = 'flex'; });
        const info = document.getElementById('settingsToolsPageInfo');
        const prev = document.getElementById('settingsToolsPrev');
        const next = document.getElementById('settingsToolsNext');
        if (info) info.textContent = filtered.length ? 'Page ' + currentSettingsToolsPage + ' of ' + totalPages + ' · ' + filtered.length + ' tools' : 'No matching tools';
        if (prev) prev.disabled = currentSettingsToolsPage <= 1 || !filtered.length;
        if (next) next.disabled = currentSettingsToolsPage >= totalPages || !filtered.length;
      }

      function changeSettingsToolsPage(delta) {
        currentSettingsToolsPage += delta;
        renderSettingsTools();
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

      document.querySelectorAll('.theme-mode-button').forEach(button => {
        const mode = button.dataset.themeMode || 'system';
        if (mode === (localStorage.getItem('qw-theme') || 'system')) {
          button.style.background = 'var(--bg-surface-2)';
          button.style.borderColor = 'var(--border-medium)';
          button.style.color = 'var(--fg)';
        }
      });
      renderSettingsTools();
    </script>
  `;

  return renderPageShell({
    title: "Settings",
    activeTab: "settings",
    content,
    owner: params.owner,
  });
}
