// Key-specific credentials and tool permissions configuration page.
// Route: /api/settings?key=<id>

import { renderPageShell, escapeHtml } from "../components.js";
import { renderSvg } from "../icons.js";
import { getToolCredentialRequirement } from "../../security.js";
import {
  credentialRequiredMessage,
  isDefaultGithubTool,
} from "../../toolDefaults.js";

export function renderApiKeySettingsPage(params: {
  base: string;
  isOwner?: boolean;
  owner?: any;
  key: any;
  toolsCatalog: any[];
  keySettings: any;
  apiKeyToken?: string;
  credentialAvailability?: {
    github?: boolean;
    render?: boolean;
    workspaceGithub?: boolean;
    workspaceRender?: boolean;
  };
}): string {
  const key = params.key || {};
  const rawKeyId = String(key.id || key.clientId || "");
  const keyId = escapeHtml(rawKeyId);
  const keyName = escapeHtml(
    key.label || key.clientName || key.name || `Key ${rawKeyId.slice(0, 4)}`,
  );
  const tools = Array.isArray(params.toolsCatalog) ? params.toolsCatalog : [];
  const settings = params.keySettings || {};
  const enabledTools = new Set<string>(
    Array.isArray(settings.enabledTools) ? settings.enabledTools : [],
  );
  const disabledTools = new Set<string>(
    Array.isArray(settings.disabledTools) ? settings.disabledTools : [],
  );
  const enabledCategories = new Set<string>(
    Array.isArray(settings.enabledCategories) ? settings.enabledCategories : [],
  );
  const isKeyDisabled = !!settings.disabled;
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

  const createdDate = key.createdAt
    ? new Date(key.createdAt).toLocaleDateString()
    : "Recent";
  const appName = escapeHtml(
    key.clientName ||
      key.app ||
      (key.type === "oauth" ? "OAuth Client" : "Direct API Integration"),
  );
  const requestCount = Number(
    key.totalRequests || key.requestCount || 0,
  ).toLocaleString();
  const lastActive = key.lastActiveAt
    ? new Date(key.lastActiveAt).toLocaleString()
    : "No recent activity";
  const rawApiToken = String(params.apiKeyToken || "");
  const clientId = String(
    key.clientId || (key.type === "oauth" ? key.id : "") || "",
  );
  const maskedApiToken = rawApiToken
    ? `${rawApiToken.slice(0, 4)}••••••••${rawApiToken.slice(-4)}`
    : "Not available for this key";
  const maskedClientId = clientId
    ? `${clientId.length > 14 ? `${clientId.slice(0, 7)}…${clientId.slice(-5)}` : clientId}`
    : rawKeyId;
  const githubSecret = String(settings.customGitHubToken || "");
  const renderSecret = String(settings.customRenderToken || "");
  const maskSecret = (value: string) =>
    value
      ? `${value.slice(0, 4)}••••••••${value.slice(-4)}`
      : "Not configured · inherits workspace credential";
  const categories = ["All", "Sandbox", "Render", "GitHub", "Code Graph"];
  const categoryCounts = new Map<string, number>();
  for (const tool of tools) {
    let category = String(tool.category || "General");
    if (category === "Files" || category === "Search") category = "Sandbox";
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  }

  const content = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
      <div style="min-width:0;">
        <h1 style="font-size:24px; font-weight:700; letter-spacing:-0.03em; color:var(--fg);">Configure Key: ${keyName}</h1>
        <p style="font-size:13px; color:var(--geist-gray-50); margin-top:2px; font-family:var(--font-mono); overflow-wrap:anywhere;">Key ID: ${keyId}</p>
      </div>
    </div>

    <div class="key-metadata-grid" style="display:grid; grid-template-columns:repeat(5, minmax(0, 1fr)); gap:10px; margin-bottom:22px;">
      <div class="card spotlight-card card-top-border" style="padding:14px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
        <div><div class="key-meta-label">Key Status</div><div id="keyStatusText" class="key-meta-value" style="color:${isKeyDisabled ? "var(--error)" : "var(--success)"};">${isKeyDisabled ? "Disabled" : "Active"}</div></div>
        <label class="switch krix-switch" title="Enable or disable this key"><input type="checkbox" id="keyActiveToggle" ${!isKeyDisabled ? "checked" : ""} onchange="updateKeyStatusLabel(this.checked)"><span class="krix-slider"></span></label>
      </div>
      <div class="card spotlight-card card-top-border" style="padding:14px;"><div class="key-meta-label">Created Date</div><div class="key-meta-value">${escapeHtml(createdDate)}</div></div>
      <div class="card spotlight-card card-top-border" style="padding:14px;"><div class="key-meta-label">Connected App</div><div class="key-meta-value">${appName}</div></div>
      <div class="card spotlight-card card-top-border" style="padding:14px;"><div class="key-meta-label">Total Invocations</div><div class="key-meta-value">${requestCount} calls</div></div>
      <div class="card spotlight-card card-top-border" style="padding:14px;"><div class="key-meta-label">Last Active</div><div class="key-meta-value">${escapeHtml(lastActive)}</div></div>
    </div>

    <style>
      .key-meta-label{font-size:10px;font-weight:650;text-transform:uppercase;letter-spacing:.04em;color:var(--geist-gray-50)}
      .key-meta-value{font-size:13px;font-weight:650;color:var(--fg);margin-top:6px;overflow-wrap:anywhere}
      .key-secret-row{display:flex;align-items:center;gap:6px;min-width:0}
      .key-secret-value{display:block;min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:9px 11px;background:var(--bg-surface-1);border:1px solid var(--border-subtle);border-radius:6px;color:var(--fg);font:12px var(--font-mono)}
      .key-secret-actions{display:flex;gap:3px;flex-shrink:0}
      .key-secret-actions button{width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--border-subtle);border-radius:6px;background:var(--bg-surface-1);color:var(--fg)}
      .key-credential-input{width:100%;min-width:0;padding:9px 11px;background:var(--bg-surface-1);border:1px solid var(--border-subtle);border-radius:6px;color:var(--fg);font:12px var(--font-mono)}
      .key-tool-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-radius:6px;background:var(--bg-surface-1);border:1px solid var(--border-subtle)}
      .key-tool-row[hidden]{display:none!important}
      .key-pagination{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:12px}
      @media(max-width:900px){.key-metadata-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.key-metadata-grid>div:first-child{grid-column:span 2}}
      @media(max-width:540px){.key-metadata-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.key-meta-value{font-size:12px}.key-identity-grid{grid-template-columns:minmax(0,1fr)!important}.key-settings-card{padding:16px!important}.key-tool-row{padding:9px 10px}}
    </style>

    <section class="card spotlight-card card-top-border key-settings-card" style="padding:22px; margin-bottom:20px;">
      <h2 style="font-size:16px;font-weight:650;color:var(--fg);margin-bottom:5px;">Key Identity</h2>
      <p style="font-size:12px;color:var(--geist-gray-50);margin-bottom:14px;">View this key's token and OAuth client identifier.</p>
      <div class="key-identity-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;">
        ${
          rawApiToken
            ? `<div style="min-width:0;"><label style="display:block;font-size:11px;font-weight:600;color:var(--geist-gray-50);margin-bottom:6px;">API Key Token</label>
          <div class="key-secret-row"><code id="apiKeyTokenValue" class="key-secret-value" data-raw="${escapeHtml(rawApiToken)}" data-masked="${escapeHtml(maskedApiToken)}" data-is-visible="false">${escapeHtml(maskedApiToken)}</code><div class="key-secret-actions"><button type="button" onclick="toggleKeyIdentityReveal('apiKeyTokenValue',this)" title="Reveal token" aria-label="Reveal token">${renderSvg("eye", 14)}</button><button type="button" onclick="window.copyToClipboard(document.getElementById('apiKeyTokenValue').dataset.raw,this)" title="Copy token" aria-label="Copy token">${renderSvg("copy", 14)}</button></div></div>
        </div>`
            : ""
        }
        <div style="min-width:0;"><label style="display:block;font-size:11px;font-weight:600;color:var(--geist-gray-50);margin-bottom:6px;">Client ID</label>
          <div class="key-secret-row"><code id="oauthClientIdValue" class="key-secret-value" data-raw="${escapeHtml(clientId || rawKeyId)}" data-masked="${escapeHtml(maskedClientId)}" data-is-visible="false">${escapeHtml(maskedClientId)}</code><div class="key-secret-actions"><button type="button" onclick="toggleKeyIdentityReveal('oauthClientIdValue',this)" title="Reveal client ID" aria-label="Reveal client ID">${renderSvg("eye", 14)}</button><button type="button" onclick="window.copyToClipboard(document.getElementById('oauthClientIdValue').dataset.raw,this)" title="Copy client ID" aria-label="Copy client ID">${renderSvg("copy", 14)}</button></div></div>
        </div>
      </div>
    </section>

    <section class="card spotlight-card card-top-border key-settings-card" style="padding:22px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:14px;">
        <div><h2 style="font-size:16px;font-weight:650;color:var(--fg);">Credential Overrides</h2><p style="font-size:12px;color:var(--geist-gray-50);margin-top:3px;">Optional provider credentials used only by this key. Empty values inherit workspace credentials.</p></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;">
        <div style="min-width:0;"><label for="customGithubToken" style="display:block;font-size:12px;font-weight:600;color:var(--fg);margin-bottom:6px;">Custom GitHub Token</label>
          <div class="key-secret-row" id="githubCredentialView"><code id="githubCredentialMasked" class="key-secret-value${!githubSecret ? " not-configured" : ""}" data-raw="${escapeHtml(githubSecret)}" data-is-configured="${githubSecret ? "true" : "false"}" style="${!githubSecret ? "color:var(--geist-gray-50);font-style:italic;" : ""}">${githubSecret ? escapeHtml(maskSecret(githubSecret)) : "Not configured (inherits workspace token)"}</code><div class="key-secret-actions"><button type="button" id="githubRevealBtn" onclick="toggleOverrideReveal('github',this)" title="Reveal token" aria-label="Reveal GitHub token" style="${githubSecret ? "" : "display:none;"}">${renderSvg("eye", 14)}</button><button type="button" onclick="editOverride('github')" title="Edit token" aria-label="Edit GitHub token">${renderSvg("edit", 14)}</button></div></div>
          <div id="githubCredentialEdit" style="display:none;gap:6px;align-items:center;width:100%;box-sizing:border-box;flex-wrap:wrap;"><input class="key-credential-input" type="password" id="customGithubToken" value="${escapeHtml(githubSecret)}" placeholder="Leave blank to inherit workspace token" style="flex:1 1 200px;min-width:0;box-sizing:border-box;"><button type="button" class="btn ghost" onclick="toggleOverrideInput('customGithubToken',this)" aria-label="Show GitHub token" style="height:36px;flex-shrink:0;">${renderSvg("eye", 14)}</button></div>
        </div>
        <div style="min-width:0;"><label for="customRenderKey" style="display:block;font-size:12px;font-weight:600;color:var(--fg);margin-bottom:6px;">Custom Render API Key</label>
          <div class="key-secret-row" id="renderCredentialView"><code id="renderCredentialMasked" class="key-secret-value${!renderSecret ? " not-configured" : ""}" data-raw="${escapeHtml(renderSecret)}" data-is-configured="${renderSecret ? "true" : "false"}" style="${!renderSecret ? "color:var(--geist-gray-50);font-style:italic;" : ""}">${renderSecret ? escapeHtml(maskSecret(renderSecret)) : "Not configured (inherits workspace key)"}</code><div class="key-secret-actions"><button type="button" id="renderRevealBtn" onclick="toggleOverrideReveal('render',this)" title="Reveal token" aria-label="Reveal Render token" style="${renderSecret ? "" : "display:none;"}">${renderSvg("eye", 14)}</button><button type="button" onclick="editOverride('render')" title="Edit token" aria-label="Edit Render token">${renderSvg("edit", 14)}</button></div></div>
          <div id="renderCredentialEdit" style="display:none;gap:6px;align-items:center;width:100%;box-sizing:border-box;flex-wrap:wrap;"><input class="key-credential-input" type="password" id="customRenderKey" value="${escapeHtml(renderSecret)}" placeholder="Leave blank to inherit workspace token" style="flex:1 1 200px;min-width:0;box-sizing:border-box;"><button type="button" class="btn ghost" onclick="toggleOverrideInput('customRenderKey',this)" aria-label="Show Render token" style="height:36px;flex-shrink:0;">${renderSvg("eye", 14)}</button></div>
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:14px;">
        <button type="button" id="cancelKeySettingsButton" class="btn secondary" onclick="cancelKeySettings()" style="display:none;border-radius:6px;padding:8px 18px;"><span>Cancel Changes</span></button>
        <button type="button" id="saveKeySettingsButton" class="btn primary" onclick="saveKeySettings()" style="display:none;border-radius:6px;">${renderSvg("save", 14)}<span>Save Changes</span></button>
      </div>
    </section>

    <section class="card spotlight-card key-settings-card" style="padding:22px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px;">
        <div><h2 style="font-size:16px;font-weight:650;color:var(--fg);">Tool Permissions</h2><p style="font-size:12px;color:var(--geist-gray-50);margin-top:3px;">Choose the exact tools this key is allowed to use.</p></div>
        <input type="search" id="keyToolSearch" placeholder="Search tools" oninput="filterKeyTools()" style="width:min(260px,100%);padding:8px 11px;border:1px solid var(--border-subtle);border-radius:6px;background:var(--bg-surface-1);color:var(--fg);font-size:12px;">
      </div>
      <div class="category-filter-grid" style="margin-bottom:14px;">
        ${categories.map((category) => `<button type="button" class="category-filter-pill${category === "All" ? " active" : ""}" data-cat="${escapeHtml(category)}" onclick="selectKeyToolCategory('${escapeHtml(category).replace(/'/g, "\\'")}',this)">${escapeHtml(category)} (${category === "All" ? tools.length : categoryCounts.get(category) || 0})</button>`).join("")}
      </div>
      <div id="keyToolGrid" style="display:flex;flex-direction:column;gap:6px;max-height:420px;overflow:auto;padding:2px;">
        ${
          tools.length
            ? tools
                .map((tool) => {
                  const toolName = String(tool.name || "");
                  const rawCategory = String(tool.category || "General");
                  const category =
                    rawCategory === "Files" || rawCategory === "Search"
                      ? "Sandbox"
                      : rawCategory;
                  const checked = isToolEnabled(tool);
                  const requires = getToolCredentialRequirement(toolName) || "";
                  return `<div class="key-tool-row" data-requires="${requires}" data-cat="${escapeHtml(category)}" data-search="${escapeHtml(`${toolName} ${category} ${tool.description || ""}`.toLowerCase())}">
            <div style="min-width:0;flex:1;"><div style="font:600 12px var(--font-mono);color:var(--fg);overflow-wrap:anywhere;">${escapeHtml(toolName)}</div><div style="font-size:11px;color:var(--geist-gray-50);margin-top:2px;">${escapeHtml(category)}</div></div>
            <label class="switch krix-switch" title="Toggle permission for ${escapeHtml(toolName)}"><input type="checkbox" class="key-tool-check" value="${escapeHtml(toolName)}" ${checked ? "checked" : ""} onchange="onKeyToolToggle(this)"><span class="krix-slider"></span></label>
          </div>`;
                })
                .join("")
            : `<div style="text-align:center;padding:28px;color:var(--geist-gray-50);font-size:12px;">No tools available.</div>`
        }
      </div>
      <div class="key-pagination"><button type="button" class="pager-btn pager-prev" id="keyToolsPrev" onclick="changeKeyToolsPage(-1)" aria-label="Previous page">${renderSvg("chevron-left", 16)}<span>Previous</span></button><span id="keyToolsPageInfo" style="font-size:11px;color:var(--geist-gray-50);">Page 1 of 1</span><button type="button" class="pager-btn pager-next" id="keyToolsNext" onclick="changeKeyToolsPage(1)" aria-label="Next page"><span>Next</span>${renderSvg("chevron-right", 16)}</button></div>
    </section>

    <script>
      const credentialReady = {
        github: ${Boolean(params.credentialAvailability?.github)},
        render: ${Boolean(params.credentialAvailability?.render)}
      };
      const workspaceCredentialReady = {
        github: ${Boolean(params.credentialAvailability?.workspaceGithub ?? params.credentialAvailability?.github)},
        render: ${Boolean(params.credentialAvailability?.workspaceRender ?? params.credentialAvailability?.render)}
      };
      const keyOverrideConfigured = {
        github: ${Boolean(githubSecret)},
        render: ${Boolean(renderSecret)}
      };
      const credentialMessages = {
        github: ${JSON.stringify(credentialRequiredMessage("github", undefined, "key")).replace(/</g, "\\u003c")},
        render: ${JSON.stringify(credentialRequiredMessage("render", undefined, "key")).replace(/</g, "\\u003c")}
      };
      const keyToolPageSize = 12;
      let keyToolPage = 1;
      let keyToolCategory = 'All';
      let overrideEditing = { github: false, render: false };
      function visibleKeyToolRows() {
        const query = (document.getElementById('keyToolSearch')?.value || '').toLowerCase().trim();
        return Array.from(document.querySelectorAll('.key-tool-row')).filter(row => {
          const rowCat = row.dataset.cat || '';
          const categoryMatch = keyToolCategory === 'All'
            || rowCat === keyToolCategory
            || (keyToolCategory === 'Sandbox' && (rowCat === 'Sandbox' || rowCat === 'Files' || rowCat === 'Search'));
          return categoryMatch && (!query || (row.dataset.search || '').includes(query));
        });
      }
      function renderKeyToolsPage() {
        const allRows = Array.from(document.querySelectorAll('.key-tool-row'));
        const matches = visibleKeyToolRows();
        const pages = Math.max(1, Math.ceil(matches.length / keyToolPageSize));
        keyToolPage = Math.min(Math.max(1, keyToolPage), pages);
        allRows.forEach(row => row.hidden = true);
        matches.slice((keyToolPage - 1) * keyToolPageSize, keyToolPage * keyToolPageSize).forEach(row => row.hidden = false);
        const info = document.getElementById('keyToolsPageInfo');
        const prev = document.getElementById('keyToolsPrev');
        const next = document.getElementById('keyToolsNext');
        if (info) info.textContent = 'Page ' + keyToolPage + ' of ' + pages + ' · ' + matches.length + ' tools';
        if (prev) prev.disabled = keyToolPage <= 1;
        if (next) next.disabled = keyToolPage >= pages;
      }
      function providerReady(provider) {
        // A credential typed into the override box counts. If left blank/empty, it inherits the workspace credential.
        const inputId = provider === 'github' ? 'customGithubToken' : 'customRenderKey';
        if (overrideEditing[provider]) {
          const val = (document.getElementById(inputId)?.value || '').trim();
          if (val) return true;
          return Boolean(workspaceCredentialReady[provider]);
        }
        return Boolean(keyOverrideConfigured[provider] || workspaceCredentialReady[provider] || credentialReady[provider]);
      }
      async function onKeyToolToggle(input) {
        const requires = input.closest('.key-tool-row')?.dataset.requires || '';
        const toolName = input.value;
        const enabled = input.checked;
        if (enabled && requires && !providerReady(requires)) {
          input.checked = false;
          showToast('"' + toolName + '" ' + credentialMessages[requires].replace(/^This tool /, ''), 'error');
          return;
        }
        input.disabled = true;
        try {
          const res = await fetch('/settings/api/tool-toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyId: ${JSON.stringify(keyId)}, toolName: toolName, enabled: enabled })
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) {
            throw new Error(data.error || 'Failed to toggle tool.');
          }
          initialToolCheckStates.set(toolName, enabled);
          showToast('"' + toolName + '" ' + (enabled ? 'enabled' : 'disabled') + ' successfully', 'success');
        } catch (err) {
          input.checked = !enabled;
          showToast(err.message || 'Failed to toggle tool', 'error');
        } finally {
          input.disabled = false;
        }
      }
      function changeKeyToolsPage(delta) { keyToolPage += delta; renderKeyToolsPage(); }
      function filterKeyTools() { keyToolPage = 1; renderKeyToolsPage(); }
      function selectKeyToolCategory(category, button) {
        keyToolCategory = category;
        keyToolPage = 1;
        document.querySelectorAll('.category-filter-pill, .settings-cat-pill').forEach(item => {
          item.classList.toggle('active', item === button);
        });
        renderKeyToolsPage();
      }
      let initialActiveState = Boolean(document.getElementById('keyActiveToggle')?.checked);
      const initialToolCheckStates = new Map();
      document.querySelectorAll('.key-tool-check').forEach(chk => {
        initialToolCheckStates.set(chk.value, chk.checked);
      });
      let initialGithubSecret = ${JSON.stringify(githubSecret || "")};
      let initialRenderSecret = ${JSON.stringify(renderSecret || "")};

      function updateKeyStatusLabel(active) {
        const label = document.getElementById('keyStatusText');
        if (label) { label.textContent = active ? 'Active' : 'Disabled'; label.style.color = active ? 'var(--success)' : 'var(--error)'; }
        showKeySettingsSave();
      }
      function showKeySettingsSave() {
        const saveBtn = document.getElementById('saveKeySettingsButton');
        const cancelBtn = document.getElementById('cancelKeySettingsButton');
        if (saveBtn) saveBtn.style.display = 'inline-flex';
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';
      }
      function hideKeySettingsSave() {
        const saveBtn = document.getElementById('saveKeySettingsButton');
        const cancelBtn = document.getElementById('cancelKeySettingsButton');
        if (saveBtn) saveBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'none';
      }
      function cancelKeySettings() {
        const toggle = document.getElementById('keyActiveToggle');
        if (toggle) {
          toggle.checked = initialActiveState;
          const label = document.getElementById('keyStatusText');
          if (label) {
            label.textContent = initialActiveState ? 'Active' : 'Disabled';
            label.style.color = initialActiveState ? 'var(--success)' : 'var(--error)';
          }
        }
        document.querySelectorAll('.key-tool-check').forEach(chk => {
          if (initialToolCheckStates.has(chk.value)) {
            chk.checked = initialToolCheckStates.get(chk.value);
          }
        });
        if (overrideEditing.github) {
          const input = document.getElementById('customGithubToken');
          if (input) input.value = initialGithubSecret;
          const view = document.getElementById('githubCredentialView');
          const edit = document.getElementById('githubCredentialEdit');
          if (view) view.style.display = 'flex';
          if (edit) edit.style.display = 'none';
          overrideEditing.github = false;
        }
        if (overrideEditing.render) {
          const input = document.getElementById('customRenderKey');
          if (input) input.value = initialRenderSecret;
          const view = document.getElementById('renderCredentialView');
          const edit = document.getElementById('renderCredentialEdit');
          if (view) view.style.display = 'flex';
          if (edit) edit.style.display = 'none';
          overrideEditing.render = false;
        }
        hideKeySettingsSave();
      }
      function toggleKeyIdentityReveal(id, button) {
        const el = document.getElementById(id);
        if (!el) return;
        const visible = el.dataset.isVisible === 'true';
        el.textContent = visible ? el.dataset.masked : el.dataset.raw;
        el.dataset.isVisible = visible ? 'false' : 'true';
        if (button) button.innerHTML = visible ? '${renderSvg("eye", 14)}' : '${renderSvg("eye-off", 14)}';
      }
      function editOverride(provider) {
        overrideEditing[provider] = true;
        const view = document.getElementById(provider + 'CredentialView');
        const edit = document.getElementById(provider + 'CredentialEdit');
        if (view) view.style.display = 'none';
        if (edit) edit.style.display = 'flex';
        const input = document.getElementById(provider === 'github' ? 'customGithubToken' : 'customRenderKey');
        input?.focus();
        showKeySettingsSave();
      }
      function toggleOverrideReveal(provider, button) {
        const id = provider === 'github' ? 'githubCredentialMasked' : 'renderCredentialMasked';
        const el = document.getElementById(id);
        if (!el) return;
        const raw = el.dataset.raw || '';
        if (!raw) return;
        const isVisible = el.dataset.visible === 'true';
        el.textContent = isVisible ? (raw.slice(0,4) + '••••••••' + raw.slice(-4)) : raw;
        el.dataset.visible = isVisible ? 'false' : 'true';
        if (button) button.innerHTML = isVisible ? '${renderSvg("eye", 14)}' : '${renderSvg("eye-off", 14)}';
      }
      function toggleOverrideInput(id, button) {
        const input = document.getElementById(id);
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
        if (button) button.innerHTML = input.type === 'password' ? '${renderSvg("eye", 14)}' : '${renderSvg("eye-off", 14)}';
      }
      async function saveKeySettings() {
        const button = document.getElementById('saveKeySettingsButton');
        if (button) button.disabled = true;
        const enabled = Array.from(document.querySelectorAll('.key-tool-check:checked')).map(input => input.value);
        const disabledTools = Array.from(document.querySelectorAll('.key-tool-check:not(:checked)')).map(input => input.value);
        const body = {
          enabledTools: enabled,
          disabledTools,
          disabled: !document.getElementById('keyActiveToggle')?.checked
        };
        if (overrideEditing.github) body.githubToken = document.getElementById('customGithubToken')?.value || '';
        if (overrideEditing.render) body.renderApiKey = document.getElementById('customRenderKey')?.value || '';
        try {
          const response = await fetch('/api/keys/${keyId}/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          const data = await response.json().catch(() => ({}));
          if (!response.ok || data.success === false) throw new Error(data.error || 'Could not save key settings.');
          showToast('Key settings saved successfully', 'success');
          if (overrideEditing.github) {
            const value = (document.getElementById('customGithubToken')?.value || '').trim();
            keyOverrideConfigured.github = Boolean(value);
            const display = document.getElementById('githubCredentialMasked');
            const eyeBtn = document.getElementById('githubRevealBtn');
            if (display) {
              display.dataset.raw = value;
              display.dataset.isConfigured = value ? 'true' : 'false';
              display.textContent = value ? value.slice(0,4) + '••••••••' + value.slice(-4) : 'Not configured (inherits workspace token)';
              display.style.fontStyle = value ? 'normal' : 'italic';
              display.style.color = value ? 'var(--fg)' : 'var(--geist-gray-50)';
              display.dataset.visible = 'false';
            }
            if (eyeBtn) eyeBtn.style.display = value ? 'inline-flex' : 'none';
            document.getElementById('githubCredentialView').style.display = 'flex';
            document.getElementById('githubCredentialEdit').style.display = 'none';
            overrideEditing.github = false;
          }
          if (overrideEditing.render) {
            const value = (document.getElementById('customRenderKey')?.value || '').trim();
            keyOverrideConfigured.render = Boolean(value);
            const display = document.getElementById('renderCredentialMasked');
            const eyeBtn = document.getElementById('renderRevealBtn');
            if (display) {
              display.dataset.raw = value;
              display.dataset.isConfigured = value ? 'true' : 'false';
              display.textContent = value ? value.slice(0,4) + '••••••••' + value.slice(-4) : 'Not configured (inherits workspace key)';
              display.style.fontStyle = value ? 'normal' : 'italic';
              display.style.color = value ? 'var(--fg)' : 'var(--geist-gray-50)';
              display.dataset.visible = 'false';
            }
            if (eyeBtn) eyeBtn.style.display = value ? 'inline-flex' : 'none';
            document.getElementById('renderCredentialView').style.display = 'flex';
            document.getElementById('renderCredentialEdit').style.display = 'none';
            overrideEditing.render = false;
          }
          initialActiveState = Boolean(document.getElementById('keyActiveToggle')?.checked);
          initialToolCheckStates.clear();
          document.querySelectorAll('.key-tool-check').forEach(chk => {
            initialToolCheckStates.set(chk.value, chk.checked);
          });
          initialGithubSecret = (document.getElementById('customGithubToken')?.value || '').trim();
          initialRenderSecret = (document.getElementById('customRenderKey')?.value || '').trim();
          hideKeySettingsSave();
        } catch (error) { showToast(error.message || 'Failed to save key settings', 'error'); }
        finally { if (button) button.disabled = false; }
      }
      function showToast(message, type) { if (window.showToast) window.showToast(message, type || 'success'); else alert(message); }
      renderKeyToolsPage();
    </script>
  `;

  return renderPageShell({
    title: keyName,
    activeTab: "api",
    content,
    owner: params.owner,
  });
}
