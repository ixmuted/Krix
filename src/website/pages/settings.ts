// Workspace & Account Settings Page
// Contract Invariants: 50 MB / 300 MB quota cards, Standard Member / Server Owner badges, 2.5 MB, Per file limit, 400 KB max output, 204 PIDs, 2048 PIDs, Code Graph Context (29 tools), Tool Permissions

import { renderPageShell, escapeHtml } from "../components.js";
import { renderSvg } from "../icons.js";
import {
  blockedToolReasonLabel,
  globalSkippedLabel,
  isDefaultGithubTool,
} from "../../toolDefaults.js";

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
  sandboxAllowed?: boolean;
  /** Per-tool on/off decided by the server (same rules as tools/list). */
  toolStates?: Record<string, { enabled: boolean; reason?: string; remembered?: boolean }>;
  /** True when the workspace stops global tool enables from reaching keys. */
  globalLocked?: boolean;
}): string {
  const isOwner = !!(params.isOwner || params.isServerOwner);
  const globalLocked = params.globalLocked === true;
  const sandboxAllowed = params.sandboxAllowed !== false;
  const quotaLimitDisplay = isOwner ? "300 MB" : "50 MB";
  const roleBadge = isOwner
    ? "Server Owner"
    : "Standard Member (1/10th Limits)";
  const pidsLimit = isOwner ? "2048 PIDs" : "204 PIDs";
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
  const serverToolStates: Record<string, { enabled: boolean; reason?: string; remembered?: boolean }> | undefined =
    params.toolStates && typeof params.toolStates === "object"
      ? params.toolStates
      : undefined;
  const isToolEnabled = (tool: any): boolean => {
    const name = String(tool.name || "");
    // The server already applied defaults, workspace + key overrides and credentials with the
    // exact rules tools/list uses; trust it. The code below is only a fallback.
    if (serverToolStates && serverToolStates[name])
      return Boolean(serverToolStates[name].enabled);
    const category = String(tool.category || "");
    if (
      ["Sandbox", "Execution"].includes(category) &&
      (!sandboxAllowed || params.credentialAvailability?.sandboxEnabled === false)
    ) {
      return false;
    }
    if (disabledTools.has(name)) return false;
    if (enabledTools.has(name)) return true;
    if (name === "web_search") return false;
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

  const totalTools = (params.toolsCatalog || []).length;
  const countCat = (pred: (t: any) => boolean) => (params.toolsCatalog || []).filter(pred).length;
  const secretField = (inputId: string, icon: string, label: string, masked: string, secret: string, short: string) => `
        <div class="field">
          <label for="${inputId}" class="cluster" style="gap:8px;">${renderSvg(icon, 16)}<span>${label}</span></label>
          <div class="settings-secret-control">
            <input type="text" id="${inputId}" class="input mono" value="${escapeHtml(masked)}" data-secret="${escapeHtml(secret)}" data-masked="${escapeHtml(masked)}" data-editing="false" data-revealed="false" readonly tabindex="-1" placeholder="Not configured">
            <button type="button" class="btn ghost icon" onclick="toggleSettingsSecret('${inputId}','reveal',this)" title="Show or hide ${short} token" aria-label="Show or hide ${short} token">${renderSvg("eye", 15)}</button>
            <button type="button" class="btn ghost icon" onclick="toggleSettingsSecret('${inputId}','edit')" title="Edit ${short} token" aria-label="Edit ${short} token">${renderSvg("edit", 15)}</button>
          </div>
        </div>`;

  const content = `
    <div class="page-head">
      <div>
        <h1 class="page-title">Settings</h1>
        <p class="page-sub">Storage limits, provider credentials, tool access and appearance.</p>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <div>
          <h2 class="panel-title">Resource allocation &amp; quota</h2>
          <p class="panel-sub">${isOwner ? "Owner tier: full storage capacity and unlimited sandbox compute" : "User tier: standard workspace sandbox quota"}</p>
        </div>
        <span class="badge">${quotaLimitDisplay}</span>
      </div>
      <div class="stats">
        <div class="stat"><div class="stat-label">Storage Capacity</div><div class="stat-value">${quotaLimitDisplay}</div></div>
        <div class="stat"><div class="stat-label">Account Role</div><div class="stat-value sm">${roleBadge}</div></div>
        <div class="stat"><div class="stat-label">Buffer Limit</div><div class="stat-value sm mono">${bufferLimit}</div></div>
        <div class="stat"><div class="stat-label">Process Limit</div><div class="stat-value sm mono">${pidsLimit}</div></div>
      </div>
    </div>

    <div class="panel">
      <h2 class="panel-title">Provider credentials &amp; tokens</h2>
      <p class="panel-sub" style="margin-bottom:16px;">Used by the agent to reach GitHub and Render on your behalf.</p>
      <div class="stack">
        ${secretField("settingsGithubInput", "github", "GitHub personal access token", maskedGitHub, githubSecret, "GitHub")}
        ${secretField("settingsRenderInput", "render", "Render API key", maskedRender, renderSecret, "Render")}
      </div>
      <div class="modal-actions">
        <button type="button" id="settingsCancelCredentialsBtn" class="btn secondary" onclick="cancelSettingsCredentials()" style="display:none;">Cancel</button>
        <button type="button" id="settingsSaveCredentialsBtn" class="btn primary" onclick="saveSettingsCredentials()" style="display:none;">Save changes</button>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <div>
          <h2 class="panel-title">Tool Permissions</h2>
          <p class="panel-sub">Default tool access inherited by every API key and connected OAuth client.</p>
        </div>
      </div>
      <div class="stack" style="gap:12px;">
        <div class="search block search-input-wrap">
          ${renderSvg("search", 16)}
          <input type="text" id="toolSearchInput" placeholder="Search tools" oninput="filterToolRows()" autocomplete="off" spellcheck="false" aria-label="Search tools">
        </div>
        <div class="category-filter-grid">
          <button type="button" class="category-filter-pill active" data-cat="All" onclick="filterSettingsCat('All', this)">All (${totalTools})</button>
          <button type="button" class="category-filter-pill" data-cat="Sandbox" onclick="filterSettingsCat('Sandbox', this)">Sandbox (${countCat((t: any) => ["Sandbox", "Files", "Search"].includes(t.category))})</button>
          <button type="button" class="category-filter-pill" data-cat="Render" onclick="filterSettingsCat('Render', this)">Render (${countCat((t: any) => t.category === "Render")})</button>
          <button type="button" class="category-filter-pill" data-cat="GitHub" onclick="filterSettingsCat('GitHub', this)">GitHub (${countCat((t: any) => t.category === "GitHub")})</button>
          <button type="button" class="category-filter-pill" data-cat="Code Graph" onclick="filterSettingsCat('Code Graph', this)">Code Graph (${countCat((t: any) => t.category === "Code Graph")})</button>
        </div>
      </div>
      <div id="settingsToolsGrid" class="settings-tools-grid">
        ${(params.toolsCatalog && params.toolsCatalog.length > 0
          ? params.toolsCatalog
          : codeGraphTools
        )
          .map((t: any) => {
            const cat = t.category || "General";
            const toolState = serverToolStates?.[String(t.name || "")];
            const blockedLabel = blockedToolReasonLabel(toolState?.reason);
            const skippedLabel = globalSkippedLabel(toolState?.reason);
            const credentialBlocked = /^needs-/.test(String(toolState?.reason || ""));
            // A tool that is only blocked by a missing credential keeps showing the choice made
            // for it (greyed out), so adding the credential back needs no re-enabling.
            const isEnabled =
              credentialBlocked && toolState
                ? Boolean(toolState.remembered)
                : isToolEnabled(t);
            const returnsHint =
              credentialBlocked && toolState?.remembered
                ? " · back on once added"
                : "";
            return `
          <div class="settings-tool-row tool-toggle-row${credentialBlocked ? " tool-blocked" : ""}" data-cat="${escapeHtml(cat)}" data-tool-name="${escapeHtml(t.name).toLowerCase()}" data-name="${escapeHtml(t.name)}">
            <div class="grow">
              <div class="list-name mono" style="font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(t.name)}</div>
              <div class="list-meta">${escapeHtml(cat)}${blockedLabel ? ` · ${escapeHtml(blockedLabel)}${escapeHtml(returnsHint)}` : ""}${skippedLabel ? ` · ${escapeHtml(skippedLabel)}` : ""}</div>
            </div>
            <label class="switch krix-switch" title="${blockedLabel ? escapeHtml(blockedLabel) : "Toggle tool permission"}">
              <input type="checkbox" aria-label="${escapeHtml(t.name)}" onchange="toggleToolPermission('${escapeHtml(t.name)}', this.checked, this)" ${isEnabled ? "checked" : ""}${credentialBlocked ? " disabled" : ""}>
              <span class="krix-slider"></span>
            </label>
          </div>`;
          })
          .join("")}
      </div>
      <div class="pager permission-pagination">
        <span id="settingsToolsPageInfo">Page 1 of 1</span>
        <div class="cluster">
          <button type="button" id="settingsToolsPrev" class="pager-btn pager-prev" onclick="changeSettingsToolsPage(-1)" aria-label="Previous page">${renderSvg("chevron-left", 16)}<span>Previous</span></button>
          <button type="button" id="settingsToolsNext" class="pager-btn pager-next" onclick="changeSettingsToolsPage(1)" aria-label="Next page"><span>Next</span>${renderSvg("chevron-right", 16)}</button>
        </div>
      </div>
    </div>

    <div class="panel">
      <h2 class="panel-title" style="margin-bottom:14px;">Friendly zone</h2>
      <div class="rows">
        <div class="row">
          <div>
            <div class="row-title">Lock global tool changes <span id="globalLockBadge" class="badge" style="margin-left:6px;">${globalLocked ? "Locked" : "Unlocked"}</span></div>
            <div class="row-desc">Stops global tool enables and disables, plus newly unlocked GitHub or Render defaults, from affecting your existing API keys and OAuth apps. Each key can override this on its own page.</div>
          </div>
          <button type="button" id="globalLockBtn" class="btn friendly-zone-btn" data-locked="${globalLocked ? "true" : "false"}" onclick="toggleGlobalLock()">${renderSvg(globalLocked ? "unlock" : "lock", 15)}<span>${globalLocked ? "Unlock changes" : "Lock changes"}</span></button>
        </div>
      </div>
    </div>

    <div class="panel">
      <h2 class="panel-title" style="margin-bottom:14px;">Appearance</h2>
      <div class="rows">
        <div class="row">
          <div><div class="row-title">Theme</div><div class="row-desc">Match your system or pick a fixed color scheme.</div></div>
          <div class="theme-mode-control">
            <button type="button" class="theme-mode-button" data-theme-mode="system" onclick="window.setThemeMode('system')" aria-label="System theme" title="System">${renderSvg("monitor", 16)}</button>
            <button type="button" class="theme-mode-button" data-theme-mode="light" onclick="window.setThemeMode('light')" aria-label="Light theme" title="Light">${renderSvg("sun", 16)}</button>
            <button type="button" class="theme-mode-button" data-theme-mode="dark" onclick="window.setThemeMode('dark')" aria-label="Dark theme" title="Dark">${renderSvg("moon", 16)}</button>
          </div>
        </div>
      </div>
    </div>

    <div class="panel danger">
      <h2 class="panel-title" style="color:var(--error); margin-bottom:14px;">Danger zone</h2>
      <div class="rows">
        <div class="row">
          <div><div class="row-title">Reset Tool Permissions</div><div class="row-desc">Reset all tool access overrides to their default permissions.</div></div>
          <button type="button" class="btn danger danger-zone-btn" onclick="resetToolDefaults()">${renderSvg("refresh", 15)}<span>Reset tools</span></button>
        </div>
        <div class="row">
          <div><div class="row-title">Sign out</div><div class="row-desc">End your Google session on this device.</div></div>
          <button type="button" class="btn danger danger-zone-btn" onclick="window.openSignOutModal ? window.openSignOutModal() : (window.location.href='/auth/logout')">${renderSvg("log-out", 15)}<span>Sign out</span></button>
        </div>
        <div class="row">
          <div><div class="row-title danger">Delete account</div><div class="row-desc">Permanently delete your account, API keys and all uploaded files.</div></div>
          <button type="button" class="btn danger danger-zone-btn" onclick="openDeleteAccountModal()">${renderSvg("trash", 15)}<span>Delete account</span></button>
        </div>
      </div>
    </div>

    <div id="resetToolsModal" class="modal-backdrop" hidden role="dialog" aria-modal="true" aria-labelledby="resetToolsTitle" onclick="if(event.target===this) closeResetToolsModal()">
      <div class="modal-card">
        <h3 class="modal-title" id="resetToolsTitle">Reset tool permissions?</h3>
        <p class="modal-text">Reset all tool access overrides to their default permissions? Any custom on/off choices will be cleared.</p>
        <div class="modal-actions">
          <button type="button" class="btn" onclick="closeResetToolsModal()">Cancel</button>
          <button type="button" id="confirmResetToolsBtn" class="btn danger" onclick="submitResetToolDefaults()">Reset tools</button>
        </div>
      </div>
    </div>

    <div id="deleteAccountModal" class="modal-backdrop" hidden role="dialog" aria-modal="true" aria-labelledby="deleteAccountTitle" onclick="if(event.target===this) closeDeleteAccountModal()">
      <div class="modal-card">
        <h3 class="modal-title" id="deleteAccountTitle">Delete account and data?</h3>
        <p class="modal-text">This is permanent. All your API keys, OAuth authorizations and stored files will be erased.</p>
        <div class="modal-body">
          <div class="field">
            <label for="deleteAccountConfirmInput">Type <strong>DELETE</strong> to confirm</label>
            <input type="text" id="deleteAccountConfirmInput" class="input mono" placeholder="DELETE" autocomplete="off">
          </div>
        </div>
        <div class="modal-actions" style="margin-top:0;">
          <button type="button" class="btn" onclick="closeDeleteAccountModal()">Cancel</button>
          <button type="button" id="confirmDeleteAccountBtn" class="btn danger" onclick="submitDeleteAccount()">Delete permanently</button>
        </div>
      </div>
    </div>

    <script>
      const activeKeyId = ${JSON.stringify(currentKeyId)};

      let currentSettingsCategory = 'All';
      let currentSettingsToolsPage = 1;
      function getSettingsToolsPageSize() {
        return window.innerWidth <= 768 ? 10 : 24;
      }

      const LOCK_SVG = '${renderSvg("lock", 15)}';
      const UNLOCK_SVG = '${renderSvg("unlock", 15)}';
      async function toggleGlobalLock() {
        const btn = document.getElementById('globalLockBtn');
        if (!btn) return;
        const nextLocked = btn.dataset.locked !== 'true';
        btn.disabled = true;
        try {
          const res = await fetch('/settings/api/global-lock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ locked: nextLocked })
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) throw new Error(data.error || 'Could not update the global tool lock.');
          btn.dataset.locked = data.locked ? 'true' : 'false';
          btn.innerHTML = (data.locked ? UNLOCK_SVG : LOCK_SVG) + '<span>' + (data.locked ? 'Unlock changes' : 'Lock changes') + '</span>';
          const badge = document.getElementById('globalLockBadge');
          if (badge) badge.textContent = data.locked ? 'Locked' : 'Unlocked';
          if (window.showToast) window.showToast(data.locked ? 'Global tool changes locked. Your keys keep the tools they have now.' : 'Global tool changes unlocked. Your keys follow workspace tool changes again.', 'success');
        } catch (err) {
          if (window.showToast) window.showToast(err.message || 'Could not update the global tool lock.', 'error');
        } finally {
          btn.disabled = false;
        }
      }

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

      function setSecretEyeIcon(btn, visible) {
        if (btn) btn.innerHTML = visible ? '${renderSvg("eye-off", 15)}' : '${renderSvg("eye", 15)}';
      }

      function resetSecretEyeIcon(id) {
        const btn = document.querySelector('button[onclick*="' + id + '"][onclick*="reveal"]');
        setSecretEyeIcon(btn, false);
      }

      function toggleSettingsSecret(id, mode, btn) {
        const input = document.getElementById(id);
        if (!input) return;
        if (mode === 'edit') {
          if (input.dataset.editing !== 'true') {
            input.value = input.dataset.secret || '';
            input.readOnly = false;
            input.tabIndex = 0;
            input.placeholder = 'Paste token';
            input.type = 'password';
            input.dataset.editing = 'true';
            input.dataset.revealed = 'false';
            resetSecretEyeIcon(id);
            document.getElementById('settingsSaveCredentialsBtn').style.display = 'inline-flex';
            const cancelBtn = document.getElementById('settingsCancelCredentialsBtn');
            if (cancelBtn) cancelBtn.style.display = 'inline-flex';
            input.focus();
          }
          return;
        }
        if (input.dataset.editing === 'true') {
          input.type = input.type === 'password' ? 'text' : 'password';
          setSecretEyeIcon(btn, input.type === 'text');
          return;
        }
        const reveal = input.dataset.revealed !== 'true';
        input.dataset.revealed = reveal ? 'true' : 'false';
        input.value = reveal ? (input.dataset.secret || '') : (input.dataset.masked || '');
        setSecretEyeIcon(btn, reveal);
      }

      function cancelSettingsCredentials() {
        ['settingsGithubInput', 'settingsRenderInput'].forEach(id => {
          const input = document.getElementById(id);
          if (input && input.dataset.editing === 'true') {
            input.value = input.dataset.masked || '';
            input.readOnly = true;
            input.tabIndex = -1;
            input.placeholder = 'Not configured';
            input.type = 'text';
            input.dataset.editing = 'false';
            input.dataset.revealed = 'false';
            resetSecretEyeIcon(id);
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
        }).finally(() => { if (button) { button.disabled = false; button.innerHTML = 'Save changes'; } });
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
        if (input) input.disabled = true;
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
        }).finally(() => {
          if (input) input.disabled = false;
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
        const pageSize = getSettingsToolsPageSize();
        const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
        currentSettingsToolsPage = Math.min(Math.max(1, currentSettingsToolsPage), totalPages);
        const start = (currentSettingsToolsPage - 1) * pageSize;
        const pageItems = filtered.slice(start, start + pageSize);
        rows.forEach(row => row.style.display = 'none');
        pageItems.forEach(row => row.style.display = 'flex');
        const info = document.getElementById('settingsToolsPageInfo');
        const prev = document.getElementById('settingsToolsPrev');
        const next = document.getElementById('settingsToolsNext');
        const end = start + pageItems.length;
        if (info) info.textContent = filtered.length ? (window.innerWidth <= 640 ? ('Page ' + currentSettingsToolsPage + ' of ' + totalPages) : ('Showing ' + (start + 1) + '-' + end + ' of ' + filtered.length + ' tools · Page ' + currentSettingsToolsPage + ' of ' + totalPages)) : 'No matching tools';
        if (prev) prev.disabled = currentSettingsToolsPage <= 1 || !filtered.length;
        if (next) next.disabled = currentSettingsToolsPage >= totalPages || !filtered.length;
      }

      function changeSettingsToolsPage(delta) {
        currentSettingsToolsPage += delta;
        renderSettingsTools();
      }

      function resetToolDefaults() {
        const m = document.getElementById('resetToolsModal');
        if (m) {
          if (m.parentNode !== document.body) document.body.appendChild(m);
          m.hidden = false;
          m.style.display = 'flex';
        }
      }

      function closeResetToolsModal() {
        const m = document.getElementById('resetToolsModal');
        if (m) { m.hidden = true; m.style.display = 'none'; }
      }

      async function submitResetToolDefaults() {
        const btn = document.getElementById('confirmResetToolsBtn');
        if (btn) btn.disabled = true;
        try {
          const res = await fetch('/settings/api/tools', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyId: activeKeyId, enabledTools: [], disabledTools: [] })
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) throw new Error(data.error || 'Could not reset tool permissions.');
          closeResetToolsModal();
          if (window.showToast) window.showToast('Tool permissions reset', 'success');
          setTimeout(() => window.location.reload(), 500);
        } catch (err) {
          if (btn) btn.disabled = false;
          if (window.showToast) window.showToast(err.message || 'Could not reset tool permissions.', 'error');
        }
      }

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeResetToolsModal();
          closeDeleteAccountModal();
        }
      });

      window.addEventListener('resize', renderSettingsTools, { passive: true });
      renderSettingsTools();
    </script>
  `;

  return renderPageShell({
    title: "Settings",
    activeTab: "settings",
    recaptchaNotice: true,
    content,
    owner: params.owner,
  });
}
