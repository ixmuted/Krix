// Key-specific credentials and tool permissions configuration page.
// Route: /api/settings?key=<id>

import { renderPageShell, escapeHtml, formatCompactCount } from "../components.js";
import { renderSvg } from "../icons.js";
import { getToolCredentialRequirement } from "../../security.js";
import {
  blockedToolReasonLabel,
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
  globalKeySettings?: any;
  apiKeyToken?: string;
  credentialAvailability?: {
    github?: boolean;
    render?: boolean;
    workspaceGithub?: boolean;
    workspaceRender?: boolean;
    sandboxEnabled?: boolean;
  };
  sandboxAllowed?: boolean;
  /** Per-tool on/off decided by the server (same rules as tools/list). */
  toolStates?: Record<string, { enabled: boolean; reason?: string }>;
}): string {
  const key = params.key || {};
  const sandboxAllowed = params.sandboxAllowed !== false;
  const rawKeyId = String(key.id || key.clientId || "");
  const keyId = escapeHtml(rawKeyId);
  // For use inside the page's <script>: the HTML-escaped form above would corrupt ids that contain
  // & < > " ' (and "</script>" must never appear), so scripts get these instead.
  const jsKeyId = JSON.stringify(rawKeyId).replace(/</g, "\\u003c");
  const urlKeyId = encodeURIComponent(rawKeyId).replace(/'/g, "%27");
  const keyName = escapeHtml(
    key.label || key.clientName || key.name || `Key ${rawKeyId.slice(0, 4)}`,
  );
  const tools = Array.isArray(params.toolsCatalog) ? params.toolsCatalog : [];
  const settings = params.keySettings || {};
  const globalSettings =
    rawKeyId !== "primary-key" ? params.globalKeySettings || {} : {};
  const enabledTools = new Set<string>(
    Array.isArray(settings.enabledTools) ? settings.enabledTools : [],
  );
  const disabledTools = new Set<string>(
    Array.isArray(settings.disabledTools) ? settings.disabledTools : [],
  );
  const globalEnabledTools = new Set<string>(
    Array.isArray(globalSettings.enabledTools)
      ? globalSettings.enabledTools
      : [],
  );
  const globalDisabledTools = new Set<string>(
    Array.isArray(globalSettings.disabledTools)
      ? globalSettings.disabledTools
      : [],
  );
  const enabledCategories = new Set<string>(
    Array.isArray(settings.enabledCategories) ? settings.enabledCategories : [],
  );
  const isKeyDisabled = !!settings.disabled;
  const serverToolStates: Record<string, { enabled: boolean; reason?: string }> | undefined =
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
      ["Sandbox", "Files", "Execution", "Filesystem"].includes(category) &&
      (!sandboxAllowed || params.credentialAvailability?.sandboxEnabled === false)
    ) {
      return false;
    }
    if (disabledTools.has(name)) return false;
    if (enabledTools.has(name)) return true;
    if (globalDisabledTools.has(name)) return false;
    if (globalEnabledTools.has(name)) return true;
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

  const createdDate = key.createdAt
    ? new Date(key.createdAt).toLocaleDateString()
    : "Recent";
  const appName = escapeHtml(
    key.clientName ||
      key.app ||
      (key.type === "oauth" ? "OAuth Client" : "Direct API Integration"),
  );
  const requestCount = formatCompactCount(Number(
    key.totalRequests || key.requestCount || 0,
  ));
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
  const maskIdentity = (value: string) =>
    value.length > 8
      ? `${value.slice(0, 3)}••••••••${value.slice(-3)}`
      : "••••••••";
  const maskedClientId = maskIdentity(clientId || rawKeyId);
  const showTokenField =
    Boolean(rawApiToken) || (key.type !== "oauth" && key.type !== "master");
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
    <div class="page-head">
      <div style="min-width:0;">
        <a href="/api" class="text-muted" style="font-size:13px; display:inline-flex; align-items:center; gap:4px; margin-bottom:8px;">${renderSvg("chevron-left", 14)}<span>API keys</span></a>
        <h1 class="page-title">${keyName}</h1>
        <p class="page-sub mono" style="font-size:13px; overflow-wrap:anywhere;">${keyId}</p>
      </div>
    </div>

    <div class="key-metadata-grid">
      <div class="stat">
        <div><div class="key-meta-label">Key Status</div><div id="keyStatusText" class="key-meta-value" style="color:${isKeyDisabled ? "var(--error)" : "var(--success)"};">${isKeyDisabled ? "Disabled" : "Active"}</div></div>
      </div>
      <div class="stat"><div class="key-meta-label">Created Date</div><div class="key-meta-value">${escapeHtml(createdDate)}</div></div>
      <div class="stat"><div class="key-meta-label">Connected App</div><div class="key-meta-value">${appName}</div></div>
      <div class="stat"><div class="key-meta-label">Total Invocations</div><div class="key-meta-value">${requestCount} calls</div></div>
      <div class="stat"><div class="key-meta-label">Last Active</div><div class="key-meta-value">${escapeHtml(lastActive)}</div></div>
    </div>

    <style>
      .key-metadata-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:16px}
      .key-metadata-grid>.stat{display:flex;justify-content:space-between;align-items:center;gap:10px}
      @media(max-width:640px){.key-metadata-grid{grid-template-columns:1fr 1fr}.key-metadata-grid>.stat{flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:4px}.key-metadata-grid>.stat:first-child{flex-direction:row;align-items:center;justify-content:space-between}.key-metadata-grid>.stat:last-child{grid-column:1/-1;flex-direction:row;align-items:center;justify-content:space-between}.key-meta-value{overflow-wrap:anywhere}}
      .key-identity-grid,.key-credential-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
      .key-meta-label{font-size:12px;color:var(--fg-3)}
      .key-meta-value{font-size:14px;font-weight:500;margin-top:4px;overflow-wrap:anywhere}
      .key-secret-row{display:flex;align-items:center;gap:6px;min-width:0}
      .key-secret-value{display:block;min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:9px 12px;background:var(--bg-surface-1);border:1px solid var(--border-subtle);border-radius:var(--radius-md);font:13px var(--font-mono)}
      .key-secret-value.not-configured{color:var(--fg-3)}
      .key-secret-actions{display:flex;gap:4px;flex-shrink:0}
      .key-secret-actions button{width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;border-radius:var(--radius-md);color:var(--fg-3)}
      .key-secret-actions button:hover{background:var(--hover);color:var(--fg)}
      .key-credential-input{width:100%;min-width:0;height:38px;padding:0 12px;background:var(--bg-surface-0);border:1px solid var(--border-medium);border-radius:var(--radius-md);font:13px var(--font-mono);color:var(--fg)}
      .key-credential-input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
      .key-tool-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-bottom:1px solid var(--border-subtle)}
      .key-tool-row[hidden]{display:none!important}
      .key-tool-row:last-child{border-bottom:0}
      #keyToolGrid{max-height:460px;overflow:auto;border:1px solid var(--border-subtle);border-radius:var(--radius-lg)}
      .key-pagination{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:12px;font-size:13px;color:var(--fg-3)}
      .key-section-title{font-size:16px;font-weight:500}
      .key-section-sub{font-size:13px;color:var(--fg-3);margin-top:2px}
      .key-field-label{display:block;font-size:13px;font-weight:500;margin-bottom:6px}
    </style>

    <section class="panel key-settings-card">
      <h2 class="key-section-title">Key Identity</h2>
      <p class="key-section-sub" style="margin-bottom:14px;">The token and OAuth client ID for this key.</p>
      <div class="key-identity-grid">
        ${
          showTokenField
            ? `<div><label class="key-field-label">API Key Token</label>
          <div class="key-secret-row"><code id="apiKeyTokenValue" class="key-secret-value" data-raw="${escapeHtml(rawApiToken)}" data-masked="${escapeHtml(rawApiToken ? maskedApiToken : "••••••••••••")}" data-is-visible="false" data-fetch-url="/api/keys/${encodeURIComponent(rawKeyId)}/secret">${escapeHtml(rawApiToken ? maskedApiToken : "••••••••••••")}</code><div class="key-secret-actions"><button type="button" onclick="toggleKeyIdentityReveal('apiKeyTokenValue',this)" title="Reveal token" aria-label="Reveal token">${renderSvg("eye", 14)}</button><button type="button" onclick="copyKeyIdentity('apiKeyTokenValue',this)" title="Copy token" aria-label="Copy token">${renderSvg("copy", 14)}</button></div></div>
        </div>`
            : ""
        }
        <div><label class="key-field-label">Client ID</label>
          <div class="key-secret-row"><code id="oauthClientIdValue" class="key-secret-value" data-raw="${escapeHtml(clientId || rawKeyId)}" data-masked="${escapeHtml(maskedClientId)}" data-is-visible="false">${escapeHtml(maskedClientId)}</code><div class="key-secret-actions"><button type="button" onclick="toggleKeyIdentityReveal('oauthClientIdValue',this)" title="Reveal client ID" aria-label="Reveal client ID">${renderSvg("eye", 14)}</button><button type="button" onclick="copyKeyIdentity('oauthClientIdValue',this)" title="Copy client ID" aria-label="Copy client ID">${renderSvg("copy", 14)}</button></div></div>
        </div>
      </div>
    </section>

    <section class="panel key-settings-card">
      <div class="panel-head" style="margin-bottom:14px;">
        <div><h2 class="key-section-title">Credential Overrides</h2><p class="key-section-sub">Provider credentials used only by this key. Empty values inherit workspace credentials.</p></div>
      </div>
      <div class="key-credential-grid">
        <div><label class="key-field-label" for="customGithubToken">Custom GitHub Token</label>
          <div class="key-secret-row" id="githubCredentialView"><code id="githubCredentialMasked" class="key-secret-value${!githubSecret ? " not-configured" : ""}" data-raw="${escapeHtml(githubSecret)}" data-is-configured="${githubSecret ? "true" : "false"}" style="${!githubSecret ? "color:var(--geist-gray-50);" : ""}">${githubSecret ? escapeHtml(maskSecret(githubSecret)) : `Not configured<span class="hide-sm"> (inherits workspace token)</span>`}</code><div class="key-secret-actions"><button type="button" id="githubRevealBtn" onclick="toggleOverrideReveal('github',this)" title="Reveal token" aria-label="Reveal GitHub token" style="${githubSecret ? "" : "display:none;"}">${renderSvg("eye", 14)}</button><button type="button" onclick="editOverride('github')" title="Edit token" aria-label="Edit GitHub token">${renderSvg("edit", 14)}</button></div></div>
          <div id="githubCredentialEdit" style="display:none;gap:6px;align-items:center;width:100%;box-sizing:border-box;flex-wrap:wrap;"><input class="key-credential-input" type="password" id="customGithubToken" value="${escapeHtml(githubSecret)}" placeholder="Leave blank to inherit workspace token"><button type="button" class="btn ghost" onclick="toggleOverrideInput('customGithubToken',this)" aria-label="Show GitHub token">${renderSvg("eye", 14)}</button></div>
        </div>
        <div><label class="key-field-label" for="customRenderKey">Custom Render API Key</label>
          <div class="key-secret-row" id="renderCredentialView"><code id="renderCredentialMasked" class="key-secret-value${!renderSecret ? " not-configured" : ""}" data-raw="${escapeHtml(renderSecret)}" data-is-configured="${renderSecret ? "true" : "false"}" style="${!renderSecret ? "color:var(--geist-gray-50);" : ""}">${renderSecret ? escapeHtml(maskSecret(renderSecret)) : `Not configured<span class="hide-sm"> (inherits workspace key)</span>`}</code><div class="key-secret-actions"><button type="button" id="renderRevealBtn" onclick="toggleOverrideReveal('render',this)" title="Reveal token" aria-label="Reveal Render token" style="${renderSecret ? "" : "display:none;"}">${renderSvg("eye", 14)}</button><button type="button" onclick="editOverride('render')" title="Edit token" aria-label="Edit Render token">${renderSvg("edit", 14)}</button></div></div>
          <div id="renderCredentialEdit" style="display:none;gap:6px;align-items:center;width:100%;box-sizing:border-box;flex-wrap:wrap;"><input class="key-credential-input" type="password" id="customRenderKey" value="${escapeHtml(renderSecret)}" placeholder="Leave blank to inherit workspace token"><button type="button" class="btn ghost" onclick="toggleOverrideInput('customRenderKey',this)" aria-label="Show Render token">${renderSvg("eye", 14)}</button></div>
        </div>
      </div>
      <div class="modal-actions">
        <button type="button" id="cancelKeySettingsButton" class="btn secondary" onclick="cancelKeySettings()" style="display:none;"><span>Cancel</span></button>
        <button type="button" id="saveKeySettingsButton" class="btn primary" onclick="saveKeySettings()" style="display:none;"><span>Save changes</span></button>
      </div>
    </section>

    <section class="panel key-settings-card">
      <div class="panel-head">
        <div><h2 class="key-section-title">Tool Permissions</h2><p class="key-section-sub">Choose the exact tools this key is allowed to use.</p></div>
      </div>
      <div class="search block" style="margin-bottom:12px;">${renderSvg("search", 16)}<input type="search" id="keyToolSearch" placeholder="Search tools" aria-label="Search tools" oninput="filterKeyTools()"></div>
      <div class="category-filter-grid" style="margin-bottom:14px;">
        ${categories.map((category) => `<button type="button" class="category-filter-pill${category === "All" ? " active" : ""}" data-cat="${escapeHtml(category)}" onclick="selectKeyToolCategory('${escapeHtml(category).replace(/'/g, "\\'")}',this)">${escapeHtml(category)} (${category === "All" ? tools.length : categoryCounts.get(category) || 0})</button>`).join("")}
      </div>
      <div id="keyToolGrid">
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
                  const blockedLabel = blockedToolReasonLabel(
                    serverToolStates?.[toolName]?.reason,
                  );
                  return `<div class="key-tool-row" data-requires="${requires}" data-cat="${escapeHtml(category)}" data-search="${escapeHtml(`${toolName} ${category} ${tool.description || ""}`.toLowerCase())}">
            <div class="grow"><div class="list-name mono" style="font-size:13px;overflow-wrap:anywhere;">${escapeHtml(toolName)}</div><div class="list-meta">${escapeHtml(category)}${Number(tool.totalCalls) > 0 ? ` · ${formatCompactCount(Number(tool.totalCalls))} call${Number(tool.totalCalls) === 1 ? "" : "s"}` : ""}${blockedLabel ? ` · ${escapeHtml(blockedLabel)}` : ""}</div></div>
            <label class="switch krix-switch" title="${blockedLabel ? escapeHtml(blockedLabel) : `Toggle permission for ${escapeHtml(toolName)}`}"><input type="checkbox" class="key-tool-check" value="${escapeHtml(toolName)}" ${checked ? "checked" : ""} onchange="onKeyToolToggle(this)"><span class="krix-slider"></span></label>
          </div>`;
                })
                .join("")
            : `<div>No tools available.</div>`
        }
      </div>
      <div class="key-pagination"><button type="button" class="pager-btn pager-prev" id="keyToolsPrev" onclick="changeKeyToolsPage(-1)" aria-label="Previous page">${renderSvg("chevron-left", 16)}<span>Previous</span></button><span id="keyToolsPageInfo">Page 1 of 1</span><button type="button" class="pager-btn pager-next" id="keyToolsNext" onclick="changeKeyToolsPage(1)" aria-label="Next page"><span>Next</span>${renderSvg("chevron-right", 16)}</button></div>
    </section>

    <section class="panel key-settings-card">
      <h2 class="key-section-title" style="margin-bottom:14px;">Friendly zone</h2>
      <div class="rows">
        <div class="row">
          <div><div class="row-title">Key status</div><div class="row-desc">${rawKeyId === "primary-key" ? "The primary key is always active." : "Enable or disable this key without deleting it."}</div></div>
          <label class="switch krix-switch" title="${rawKeyId === "primary-key" ? "The primary key cannot be disabled" : "Enable or disable this key"}"><input type="checkbox" id="keyActiveToggle" ${!isKeyDisabled ? "checked" : ""} ${rawKeyId === "primary-key" ? "disabled" : ""} onchange="updateKeyStatusLabel(this.checked)"><span class="krix-slider"></span></label>
        </div>
        <div class="row">
          <div><div class="row-title">Rename ${key.type === "oauth" ? "app" : "API key"}</div><div class="row-desc">Update the display name for this ${key.type === "oauth" ? "authorized app" : "key"} (4–16 characters).</div></div>
          <button type="button" class="btn danger-zone-btn" onclick="openRenameKeySettingsModal()" ${rawKeyId === "primary-key" ? "disabled" : ""}>${renderSvg("edit", 15)}<span>Rename</span></button>
        </div>
      </div>
    </section>

    <section class="panel danger key-settings-card">
      <h2 class="key-section-title" style="color:var(--error); margin-bottom:14px;">Danger zone</h2>
      <div class="rows">
        <div class="row">
          <div><div class="row-title">Reset tool permissions</div><div class="row-desc">Remove this key's own on/off choices so it follows workspace defaults again.</div></div>
          <button type="button" class="btn danger danger-zone-btn" onclick="resetKeyToolOverrides()">${renderSvg("refresh", 15)}<span>Reset to Default</span></button>
        </div>
        <div class="row">
          <div><div class="row-title danger">Delete ${key.type === "oauth" ? "OAuth access" : "API key"}</div><div class="row-desc">${rawKeyId === "primary-key" ? "The primary key cannot be deleted." : "Permanently revoke this key. Connected clients will lose access immediately."}</div></div>
          <button type="button" class="btn danger danger-zone-btn" onclick="openDeleteKeySettingsModal()" ${rawKeyId === "primary-key" ? "disabled" : ""}>${renderSvg("trash", 15)}<span>Delete API Key</span></button>
        </div>
      </div>
    </section>

    <div id="renameKeySettingsModal" class="modal-backdrop" hidden role="dialog" aria-modal="true" aria-labelledby="renameKeySettingsTitle" onclick="if(event.target===this) closeRenameKeySettingsModal()">
      <div class="modal-card">
        <h3 class="modal-title" id="renameKeySettingsTitle">Rename ${key.type === "oauth" ? "app" : "API key"}</h3>
        <p class="modal-text">Enter a new name (4–16 characters).</p>
        <div class="modal-body">
          <input type="text" id="renameKeySettingsInput" class="input" minlength="4" maxlength="16" value="${keyName}" aria-label="New name">
        </div>
        <div class="modal-actions" style="margin-top:0;">
          <button type="button" class="btn" onclick="closeRenameKeySettingsModal()">Cancel</button>
          <button type="button" id="renameKeySettingsSubmitBtn" class="btn primary" onclick="submitRenameKeySettings()">Save name</button>
        </div>
      </div>
    </div>

    <div id="deleteKeySettingsModal" class="modal-backdrop" hidden role="dialog" aria-modal="true" aria-labelledby="deleteKeySettingsTitle" onclick="if(event.target===this) closeDeleteKeySettingsModal()">
      <div class="modal-card">
        <h3 class="modal-title" id="deleteKeySettingsTitle">Delete ${key.type === "oauth" ? "OAuth access" : "API key"}?</h3>
        <p class="modal-text">Are you sure you want to permanently delete "${keyName}"? Any connected clients will lose access immediately.</p>
        <div class="modal-actions">
          <button type="button" class="btn" onclick="closeDeleteKeySettingsModal()">Cancel</button>
          <button type="button" id="deleteKeySettingsConfirmBtn" class="btn danger" onclick="submitDeleteKeySettings()">Delete</button>
        </div>
      </div>
    </div>

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
      function getKeyToolPageSize() {
        return window.innerWidth <= 768 ? 10 : 24;
      }
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
        const pageSize = getKeyToolPageSize();
        const pages = Math.max(1, Math.ceil(matches.length / pageSize));
        keyToolPage = Math.min(Math.max(1, keyToolPage), pages);
        const start = (keyToolPage - 1) * pageSize;
        const pageItems = matches.slice(start, start + pageSize);
        allRows.forEach(row => row.hidden = true);
        pageItems.forEach(row => row.hidden = false);
        const info = document.getElementById('keyToolsPageInfo');
        const prev = document.getElementById('keyToolsPrev');
        const next = document.getElementById('keyToolsNext');
        const end = start + pageItems.length;
        if (info) info.textContent = matches.length ? (window.innerWidth <= 640 ? ('Page ' + keyToolPage + ' of ' + pages) : ('Showing ' + (start + 1) + '-' + end + ' of ' + matches.length + ' tools · Page ' + keyToolPage + ' of ' + pages)) : 'No matching tools';
        if (prev) prev.disabled = keyToolPage <= 1 || !matches.length;
        if (next) next.disabled = keyToolPage >= pages || !matches.length;
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
            body: JSON.stringify({ keyId: ${jsKeyId}, toolName: toolName, enabled: enabled })
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
      async function resetKeyToolOverrides() {
        if (!confirm('Remove all of this key\\'s own tool choices? It will follow the workspace settings again.')) return;
        try {
          const res = await fetch('/settings/api/tools/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyId: ${jsKeyId} })
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) throw new Error(data.error || 'Could not reset tool permissions.');
          showToast('Tool permissions reset to workspace defaults', 'success');
          setTimeout(() => location.reload(), 500);
        } catch (err) {
          showToast(err.message || 'Could not reset tool permissions.', 'error');
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
        window.addEventListener('resize', renderKeyToolsPage, { passive: true });
      const isOAuthKeyType = ${JSON.stringify(key.type === "oauth")};
      function openRenameKeySettingsModal() {
        const modal = document.getElementById('renameKeySettingsModal');
        const input = document.getElementById('renameKeySettingsInput');
        if (modal) {
          if (modal.parentNode !== document.body) document.body.appendChild(modal);
          modal.hidden = false;
          modal.style.display = 'flex';
          setTimeout(() => input?.focus(), 50);
        }
      }
      function closeRenameKeySettingsModal() {
        const modal = document.getElementById('renameKeySettingsModal');
        if (modal) { modal.hidden = true; modal.style.display = 'none'; }
      }
      async function submitRenameKeySettings() {
        const input = document.getElementById('renameKeySettingsInput');
        const newName = (input?.value || '').trim();
        if (newName.length < 4 || newName.length > 16) {
          showToast('Name must be 4–16 characters long', 'error');
          return;
        }
        const btn = document.getElementById('renameKeySettingsSubmitBtn');
        if (btn) btn.disabled = true;
        try {
          const url = isOAuthKeyType ? '/oauth/authorizations/${urlKeyId}' : '/api/keys/${urlKeyId}';
          const payload = isOAuthKeyType ? { name: newName } : { label: newName };
          const res = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || data.ok === false || data.success === false) {
            throw new Error(data.error || 'Rename failed');
          }
          showToast('Renamed successfully', 'success');
          closeRenameKeySettingsModal();
          setTimeout(() => window.location.reload(), 400);
        } catch (err) {
          showToast(err.message || 'Rename failed', 'error');
        } finally {
          if (btn) btn.disabled = false;
        }
      }
      function openDeleteKeySettingsModal() {
        const modal = document.getElementById('deleteKeySettingsModal');
        if (modal) {
          if (modal.parentNode !== document.body) document.body.appendChild(modal);
          modal.hidden = false;
          modal.style.display = 'flex';
        }
      }
      function closeDeleteKeySettingsModal() {
        const modal = document.getElementById('deleteKeySettingsModal');
        if (modal) { modal.hidden = true; modal.style.display = 'none'; }
      }
      async function submitDeleteKeySettings() {
        const btn = document.getElementById('deleteKeySettingsConfirmBtn');
        if (btn) btn.disabled = true;
        try {
          const url = isOAuthKeyType ? '/oauth/authorizations/${urlKeyId}' : '/api/keys/${urlKeyId}';
          const res = await fetch(url, { method: 'DELETE' });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || data.ok === false || data.success === false) {
            throw new Error(data.error || 'Delete failed');
          }
          showToast('Deleted successfully', 'success');
          setTimeout(() => { window.location.href = '/api'; }, 450);
        } catch (err) {
          showToast(err.message || 'Delete failed', 'error');
          if (btn) btn.disabled = false;
        }
      }
      renderKeyToolsPage();
      }
      let initialActiveState = Boolean(document.getElementById('keyActiveToggle')?.checked);
      const initialToolCheckStates = new Map();
      document.querySelectorAll('.key-tool-check').forEach(chk => {
        initialToolCheckStates.set(chk.value, chk.checked);
      });
      let initialGithubSecret = ${JSON.stringify(githubSecret || "")};
      let initialRenderSecret = ${JSON.stringify(renderSecret || "")};

      function setKeyStatusLabel(active) {
        const label = document.getElementById('keyStatusText');
        if (label) { label.textContent = active ? 'Active' : 'Disabled'; label.style.color = active ? 'var(--success)' : 'var(--error)'; }
      }
      // The Active switch applies the moment it is flipped: no Save / Cancel needed. If the
      // server refuses, the switch snaps back so the page never shows a state that is not saved.
      async function updateKeyStatusLabel(active) {
        const toggle = document.getElementById('keyActiveToggle');
        setKeyStatusLabel(active);
        if (toggle) toggle.disabled = true;
        try {
          const response = await fetch('/api/keys/${urlKeyId}/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ disabled: !active })
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok || data.success === false) throw new Error(data.error || 'Could not update this key.');
          initialActiveState = active;
          showToast(active ? 'Key enabled' : 'Key disabled', 'success');
        } catch (error) {
          if (toggle) toggle.checked = !active;
          setKeyStatusLabel(!active);
          showToast(error.message || 'Could not update this key.', 'error');
        } finally {
          if (toggle) toggle.disabled = false;
        }
      }
      // Save / Cancel belong to the credential boxes only: shown while one is open for editing.
      function refreshKeySettingsBar() {
        if (overrideEditing.github || overrideEditing.render) showKeySettingsSave();
        else hideKeySettingsSave();
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
      async function ensureIdentityRaw(el) {
        if (el.dataset.raw) return el.dataset.raw;
        const url = el.dataset.fetchUrl;
        if (!url) return '';
        try {
          const res = await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.key) throw new Error(data.error || 'Could not load this key.');
          el.dataset.raw = data.key;
          el.dataset.masked = data.key.slice(0, 4) + '••••••••' + data.key.slice(-4);
          return data.key;
        } catch (err) {
          showToast(err.message || 'Could not load this key.', 'error');
          return '';
        }
      }
      async function toggleKeyIdentityReveal(id, button) {
        const el = document.getElementById(id);
        if (!el) return;
        const visible = el.dataset.isVisible === 'true';
        if (!visible) {
          const raw = await ensureIdentityRaw(el);
          if (!raw) return;
        }
        el.textContent = visible ? el.dataset.masked : el.dataset.raw;
        el.dataset.isVisible = visible ? 'false' : 'true';
        if (button) button.innerHTML = visible ? '${renderSvg("eye", 14)}' : '${renderSvg("eye-off", 14)}';
      }
      async function copyKeyIdentity(id, button) {
        const el = document.getElementById(id);
        if (!el) return;
        const raw = await ensureIdentityRaw(el);
        if (!raw) return;
        if (window.copyToClipboard) window.copyToClipboard(raw, button);
        else { try { await navigator.clipboard.writeText(raw); showToast('Copied to clipboard', 'success'); } catch (e) { showToast('Copy failed', 'error'); } }
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
        // The Active switch and every tool toggle save instantly on their own; this button only
        // saves the credential boxes. (Sending every tool would turn each one into a per-key
        // override and break inheritance from the workspace settings.)
        const body = {};
        if (overrideEditing.github) body.githubToken = document.getElementById('customGithubToken')?.value || '';
        if (overrideEditing.render) body.renderApiKey = document.getElementById('customRenderKey')?.value || '';
        try {
          const response = await fetch('/api/keys/${urlKeyId}/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          const data = await response.json().catch(() => ({}));
          if (!response.ok || data.success === false) throw new Error(data.error || 'Could not save key settings.');
          showToast('Key settings saved successfully', 'success');
          // Adding or removing a credential changes which tools are available, so the tool
          // switches (and their locks) must be redrawn from the server's view of the key.
          const credentialsChanged = overrideEditing.github || overrideEditing.render;
          if (overrideEditing.github) {
            const value = (document.getElementById('customGithubToken')?.value || '').trim();
            keyOverrideConfigured.github = Boolean(value);
            const display = document.getElementById('githubCredentialMasked');
            const eyeBtn = document.getElementById('githubRevealBtn');
            if (display) {
              display.dataset.raw = value;
              display.dataset.isConfigured = value ? 'true' : 'false';
              display.innerHTML = value ? (value.slice(0,4) + '••••••••' + value.slice(-4)) : 'Not configured<span class="hide-sm"> (inherits workspace token)</span>';
              display.style.fontStyle = 'normal';
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
              display.innerHTML = value ? (value.slice(0,4) + '••••••••' + value.slice(-4)) : 'Not configured<span class="hide-sm"> (inherits workspace key)</span>';
              display.style.fontStyle = 'normal';
              display.style.color = value ? 'var(--fg)' : 'var(--geist-gray-50)';
              display.dataset.visible = 'false';
            }
            if (eyeBtn) eyeBtn.style.display = value ? 'inline-flex' : 'none';
            document.getElementById('renderCredentialView').style.display = 'flex';
            document.getElementById('renderCredentialEdit').style.display = 'none';
            overrideEditing.render = false;
          }
          initialGithubSecret = (document.getElementById('customGithubToken')?.value || '').trim();
          initialRenderSecret = (document.getElementById('customRenderKey')?.value || '').trim();
          hideKeySettingsSave();
          if (credentialsChanged) setTimeout(() => window.location.reload(), 600);
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
