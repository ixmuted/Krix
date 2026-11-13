// API Keys, Integrations & Provider Credentials Page
// Contract Invariants: id="keySearchInput", class="toast-container", function showToast(, id="confirmModal" class="modal-backdrop" hidden, function openRevokeKeyModal(, Active OAuth Authorizations, Client ID, keysCountBadge, id="providerCredentialsCard", id="githubTokenCode", id="renderTokenCode", toggleCredReveal, copyCredSecret, key-display-scroll, toggleKeyReveal, oauthSearchInput, filterOAuth

import {
  renderPageShell,
  renderKebabMenu,
  renderAuthRequiredCard,
  escapeHtml,
} from "../components.js";
import { renderSvg } from "../icons.js";

export function renderApiKeysPage(params: {
  base: string;
  isOwner?: boolean;
  owner?: any;
  keys?: any[];
  dynamicKeys?: any[];
  oauthAuthorizations?: any[];
  oauthClients?: any[];
  credentials?: { githubToken?: string; renderApiKey?: string };
}): string {
  if (params.isOwner === false) {
    return renderPageShell({
      title: "API Keys",
      activeTab: "api",
      owner: null,
      content: renderAuthRequiredCard(
        "API Keys",
        "You must sign in as the verified service owner or authenticate with your MCP API key to access API key management.",
        "/api",
      ),
    });
  }

  const keys = Array.isArray(params.keys)
    ? params.keys
    : Array.isArray(params.dynamicKeys)
      ? params.dynamicKeys
      : [];

  const oauthClients = Array.isArray(params.oauthAuthorizations)
    ? params.oauthAuthorizations
    : Array.isArray(params.oauthClients)
      ? params.oauthClients
      : [];

  const githubToken = params.credentials?.githubToken || "";
  const renderApiKey = params.credentials?.renderApiKey || "";
  const maskedGithub = githubToken
    ? `${githubToken.slice(0, 4)}••••••••${githubToken.slice(-4)}`
    : "Not Configured";
  const maskedRender = renderApiKey
    ? `${renderApiKey.slice(0, 4)}••••••••${renderApiKey.slice(-4)}`
    : "Not Configured";

  const content = `
    <!-- Top Header Deck -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; flex-wrap:wrap; gap:16px;">
      <div>
        <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:var(--geist-gray-50);">CREDENTIALS & ACCESS</div>
        <h1 style="font-size:24px; font-weight:700; letter-spacing:-0.03em; color:var(--fg); margin-top:4px;">API Keys & Integrations</h1>
        <p style="font-size:13px; color:var(--geist-gray-50); margin-top:2px;">
          Manage personal access keys, OAuth 2.1 client applications, and default provider tokens.
        </p>
      </div>

      <button type="button" class="btn primary deploy-btn" onclick="openCreateKeyModal()" style="border-radius:var(--radius-full); gap:8px;">
        ${renderSvg("key", 15)}
        <span>Create API Key</span>
      </button>
    </div>

    <!-- Profile Default Integrations Card (Contract Invariant: id="providerCredentialsCard") -->
    <div id="providerCredentialsCard" class="card spotlight-card card-top-border" style="padding:22px 24px; margin-bottom:28px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
        <div>
          <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:var(--geist-gray-50);">DEFAULT INTEGRATIONS</div>
          <h2 style="font-size:16px; font-weight:600; color:var(--fg); margin-top:2px;">Platform Provider Credentials</h2>
        </div>
        <button type="button" class="btn" onclick="openEditCredsModal()" style="padding:5px 14px; font-size:12px; border-radius:var(--radius-full); gap:6px;">
          ${renderSvg("edit", 13)}
          <span>Edit Credentials</span>
        </button>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">
        <!-- GitHub Token Cell -->
        <div style="display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-radius:var(--radius-md); background:var(--bg-surface-1); border:1px solid var(--border-subtle);">
          <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
            ${renderSvg("github", 20)}
            <div style="min-width:0; flex:1;">
              <div style="font-size:12px; font-weight:600; color:var(--fg);">GitHub Token</div>
              <code id="githubTokenCode" data-raw="${escapeHtml(githubToken)}" data-masked-val="${escapeHtml(maskedGithub)}" data-masked="true" style="font-size:11px; color:var(--geist-gray-50); font-family:var(--font-mono); overflow:hidden; text-overflow:ellipsis; display:block;">${escapeHtml(maskedGithub)}</code>
            </div>
          </div>
          <div style="display:flex; gap:4px; flex-shrink:0;">
            <button type="button" class="btn ghost toggleCredReveal" onclick="window.toggleSecretReveal('githubTokenCode', this)" style="padding:4px;" title="Reveal Secret">
              ${renderSvg("eye", 14)}
            </button>
            <button type="button" class="btn ghost copyCredSecret" onclick="window.copyToClipboard('${escapeHtml(githubToken)}', this)" style="padding:4px;" title="Copy Secret">
              ${renderSvg("copy", 14)}
            </button>
          </div>
        </div>

        <!-- Render API Key Cell -->
        <div style="display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-radius:var(--radius-md); background:var(--bg-surface-1); border:1px solid var(--border-subtle);">
          <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
            ${renderSvg("render", 20)}
            <div style="min-width:0; flex:1;">
              <div style="font-size:12px; font-weight:600; color:var(--fg);">Render API Key</div>
              <code id="renderTokenCode" data-raw="${escapeHtml(renderApiKey)}" data-masked-val="${escapeHtml(maskedRender)}" data-masked="true" style="font-size:11px; color:var(--geist-gray-50); font-family:var(--font-mono); overflow:hidden; text-overflow:ellipsis; display:block;">${escapeHtml(maskedRender)}</code>
            </div>
          </div>
          <div style="display:flex; gap:4px; flex-shrink:0;">
            <button type="button" class="btn ghost toggleCredReveal" onclick="window.toggleSecretReveal('renderTokenCode', this)" style="padding:4px;" title="Reveal Secret">
              ${renderSvg("eye", 14)}
            </button>
            <button type="button" class="btn ghost copyCredSecret" onclick="window.copyToClipboard('${escapeHtml(renderApiKey)}', this)" style="padding:4px;" title="Copy Secret">
              ${renderSvg("copy", 14)}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Active API Keys Table Section (Contract Invariant: id="keySearchInput", keysCountBadge, Client ID) -->
    <div class="card spotlight-card" style="padding:24px; margin-bottom:28px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <h2 style="font-size:16px; font-weight:600; color:var(--fg);">Active API Keys</h2>
          <span class="badge ${keys.length > 0 ? "success" : ""}" id="keysCountBadge" style="font-family:var(--font-mono);">${keys.length} active</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-full); padding:6px 14px; width:260px; max-width:100%;">
          ${renderSvg("search", 14, "text-muted")}
          <input type="text" id="keySearchInput" placeholder="Search API keys" oninput="filterApiKeys(this.value)" style="border:none; background:transparent; font-size:12px; color:var(--fg); outline:none; width:100%;">
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:13px; text-align:left;">
          <thead>
            <tr style="border-bottom:1px solid var(--border-subtle); color:var(--geist-gray-50); font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">
              <th style="padding:10px 12px; font-weight:600;">Label</th>
              <th style="padding:10px 12px; font-weight:600;">Client ID</th>
              <th style="padding:10px 12px; font-weight:600;">Key Token</th>
              <th style="padding:10px 12px; font-weight:600;">Status</th>
              <th style="padding:10px 12px; font-weight:600;">Created</th>
              <th style="padding:10px 12px; font-weight:600; text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody id="keysTableBody">
            ${
              keys.length === 0
                ? `<tr id="emptyKeysRow"><td colspan="6" style="text-align:center; padding:32px; color:var(--geist-gray-50);">No active API keys found. Click "Create API Key" to generate one.</td></tr>`
                : keys
                    .map((k, idx) => {
                      const keyId = escapeHtml(k.id || "");
                      const keyLabel = escapeHtml(
                        k.label || k.name || `Key ${keyId.slice(0, 4)}`,
                      );
                      const rawKey = escapeHtml(k.key || k.token || "");
                      const maskedKey =
                        rawKey.length > 8
                          ? `${rawKey.slice(0, 4)}••••••••${rawKey.slice(-4)}`
                          : "••••••••";
                      const clientId = escapeHtml(k.clientId || "N/A");
                      const menuId = `keyMenu_${idx}`;

                      return `
                  <tr class="api-key-row" id="row-${keyId}" data-label="${keyLabel.toLowerCase()}" data-client-id="${clientId.toLowerCase()}" style="border-bottom:1px solid var(--border-subtle);">
                    <td style="padding:12px;">
                      <span id="key-name-text-${keyId}" class="key-label-text-${keyId}" style="font-weight:600; color:var(--fg);">${keyLabel}</span>
                      <div style="font-family:var(--font-mono); font-size:11px; color:var(--geist-gray-50);">${keyId}</div>
                    </td>
                    <td style="padding:12px;">
                      <div style="display:flex; align-items:center; gap:6px;">
                        <code style="font-family:var(--font-mono); font-size:12px; background:var(--bg-surface-2); padding:3px 6px; border-radius:4px; border:1px solid var(--border-subtle); color:var(--fg); font-variant-numeric:tabular-nums;">${clientId}</code>
                        ${clientId !== "N/A" ? `<button type="button" class="btn ghost copyClientIdBtn" onclick="window.copyToClipboard('${clientId}', this)" style="padding:3px;" title="Copy Client ID">${renderSvg("copy", 13)}</button>` : ""}
                      </div>
                    </td>
                    <td style="padding:12px;">
                      <div class="key-display-scroll" style="display:flex; align-items:center; gap:8px;">
                        <code id="keyCode_${idx}" data-raw="${rawKey}" data-masked-val="${maskedKey}" data-masked="true" style="font-family:var(--font-mono); color:var(--fg);">${maskedKey}</code>
                        <button type="button" class="btn ghost toggleKeyReveal" onclick="window.toggleSecretReveal('keyCode_${idx}', this)" style="padding:3px;" title="Reveal Key">
                          ${renderSvg("eye", 13)}
                        </button>
                        <button type="button" class="btn ghost" onclick="window.copyToClipboard('${rawKey}', this)" style="padding:3px;" title="Copy Key">
                          ${renderSvg("copy", 13)}
                        </button>
                      </div>
                    </td>
                    <td style="padding:12px;">
                      <span class="status-pill" style="font-size:11px;">
                        <span class="status-dot-available" style="width:5px; height:5px;"></span>
                        <span>Active</span>
                      </span>
                    </td>
                    <td style="padding:12px; color:var(--geist-gray-50); font-family:var(--font-mono); font-size:11px; font-variant-numeric:tabular-nums;">
                      ${escapeHtml(k.createdAt ? new Date(k.createdAt).toLocaleDateString() : "Recent")}
                    </td>
                    <td style="padding:12px; text-align:right;">
                      <div class="krix-dropdown" style="display:inline-block; position:relative;">
                        <button type="button" class="btn ghost kebab-trigger" onclick="toggleKeyDropdown('${menuId}')" style="padding:4px 6px;" aria-label="Key Actions">
                          ${renderSvg("more-vertical", 14)}
                        </button>
                        <div id="${menuId}" class="krix-dropdown-menu" style="display:none; position:absolute; right:0; top:calc(100% + 4px); background:var(--bg-surface-0); border:1px solid var(--border-medium); border-radius:var(--radius-md); box-shadow:var(--shadow-popover); padding:4px; z-index:var(--z-dropdown); min-width:160px; text-align:left;">
                          <a href="/settings" class="btn ghost" style="width:100%; justify-content:flex-start; font-size:12px; padding:6px 10px; border-radius:var(--radius-sm); text-decoration:none;">
                            ${renderSvg("settings", 13)}
                            <span>Configure</span>
                          </a>
                          <button type="button" class="btn ghost" onclick="openRenameKeyModal('${keyId}', '${keyLabel}'); closeKeyDropdown('${menuId}')" style="width:100%; justify-content:flex-start; font-size:12px; padding:6px 10px; border-radius:var(--radius-sm);">
                            ${renderSvg("edit", 13)}
                            <span>Rename</span>
                          </button>
                          <div style="height:1px; background:var(--border-subtle); margin:4px 0;"></div>
                          <button type="button" class="btn ghost danger" onclick="openRevokeKeyModal('${keyId}', '${keyLabel}'); closeKeyDropdown('${menuId}')" style="width:100%; justify-content:flex-start; font-size:12px; padding:6px 10px; border-radius:var(--radius-sm); color:var(--error);">
                            ${renderSvg("trash", 13)}
                            <span>Revoke</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                `;
                    })
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Active OAuth Authorizations Section (Contract Invariant: Active OAuth Authorizations, oauthSearchInput, filterOAuth) -->
    <div class="card spotlight-card" style="padding:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <h2 style="font-size:16px; font-weight:600; color:var(--fg);">Active OAuth Authorizations</h2>
            <span class="badge" id="oauthCountBadge">${oauthClients.length}</span>
          </div>
          <p style="font-size:12px; color:var(--geist-gray-50); margin-top:2px;">Applications granted access to your MCP instance</p>
        </div>

        <div style="display:flex; align-items:center; gap:8px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-full); padding:6px 12px; width:220px; max-width:100%;">
          ${renderSvg("search", 13, "text-muted")}
          <input type="text" id="oauthSearchInput" class="filterOAuth" placeholder="Filter applications" oninput="filterOAuthClients(this.value)" style="border:none; background:transparent; font-size:12px; color:var(--fg); outline:none; width:100%;">
        </div>
      </div>

      <div id="oauthClientsContainer" style="display:flex; flex-direction:column; gap:8px;">
        ${
          oauthClients.length === 0
            ? `<div style="text-align:center; padding:32px; color:var(--geist-gray-50); font-size:13px;">No third-party applications authorized yet.</div>`
            : oauthClients
                .map((client) => {
                  const cId = escapeHtml(client.clientId || "");
                  const cName = escapeHtml(client.clientName || cId);
                  const cScope = escapeHtml(client.scope || "mcp:all");
                  const lastUsed = client.lastUsedAt
                    ? new Date(client.lastUsedAt).toLocaleDateString()
                    : "Active";

                  return `
              <div class="oauth-client-row card" data-name="${cName.toLowerCase()}" style="display:flex; justify-content:space-between; align-items:center; padding:14px 18px; border-radius:var(--radius-md); background:var(--bg-surface-1); border:1px solid var(--border-subtle);">
                <div style="display:flex; align-items:center; gap:12px;">
                  <div style="width:36px; height:36px; border-radius:8px; background:var(--bg-surface-2); display:flex; align-items:center; justify-content:center; border:1px solid var(--border-subtle);">
                    ${renderSvg("shield", 16)}
                  </div>
                  <div>
                    <div style="font-weight:600; font-size:13px; color:var(--fg);">${cName}</div>
                    <div style="display:flex; align-items:center; gap:8px; font-size:11px; color:var(--geist-gray-50); font-family:var(--font-mono); margin-top:2px;">
                      <span>ID: ${cId}</span>
                      <span>&bull;</span>
                      <span>Scope: ${cScope}</span>
                    </div>
                  </div>
                </div>

                <div style="display:flex; align-items:center; gap:12px;">
                  <span style="font-size:11px; color:var(--geist-gray-50); font-family:var(--font-mono);">${lastUsed}</span>
                  <button type="button" class="btn ghost danger" onclick="revokeOAuthClient('${cId}', '${cName}')" style="font-size:12px; padding:4px 8px; border-radius:var(--radius-sm); color:var(--error);" title="Revoke Authorization">
                    ${renderSvg("trash", 13)}
                    <span>Revoke</span>
                  </button>
                </div>
              </div>
            `;
                })
                .join("")
        }
      </div>
    </div>

    <!-- Create API Key Modal (Concentric Vercel Geist Dialog) -->
    <div id="createKeyModal" class="modal-backdrop" hidden role="dialog" aria-modal="true" style="position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(6px); z-index:var(--z-modal); display:none; align-items:center; justify-content:center; padding:16px;">
      <div class="modal-card card spotlight-card" style="max-width:420px; width:100%; padding:24px; box-shadow:var(--shadow-popover);">
        <h3 style="font-size:16px; font-weight:700; color:var(--fg); margin-bottom:6px;">Create API Key</h3>
        <p style="font-size:12px; color:var(--geist-gray-50); margin-bottom:16px;">Provide a descriptive label for your new key (minimum 4 characters).</p>
        <form id="createKeyForm" onsubmit="event.preventDefault(); handleCreateKey(event); return false;" action="javascript:void(0);" method="post" style="display:flex; flex-direction:column; gap:12px;">
          <input type="text" id="createKeyInput" placeholder="e.g. Gemini-CLI or Cursor-Prod" style="width:100%; padding:8px 12px; background:var(--bg-surface-1); border:1px solid var(--border-medium); border-radius:var(--radius-md); font-size:13px; color:var(--fg); outline:none;">
          <div style="display:flex; justify-content:flex-end; gap:8px;">
            <button type="button" class="btn ghost" onclick="closeCreateKeyModal()">Cancel</button>
            <button type="button" id="createKeyBtn" class="btn primary" onclick="handleCreateKey(event)">Generate Key</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Rename API Key Modal (Concentric Vercel Geist Dialog) -->
    <div id="renameKeyModal" class="modal-backdrop" hidden role="dialog" aria-modal="true" style="position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(6px); z-index:var(--z-modal); display:none; align-items:center; justify-content:center; padding:16px;">
      <div class="modal-card card spotlight-card" style="max-width:420px; width:100%; padding:24px; box-shadow:var(--shadow-popover);">
        <h3 style="font-size:16px; font-weight:700; color:var(--fg); margin-bottom:6px;">Rename API Key</h3>
        <p style="font-size:12px; color:var(--geist-gray-50); margin-bottom:16px;">Enter a new label for this key (minimum 4 characters).</p>
        <input type="text" id="renameKeyInput" style="width:100%; padding:8px 12px; background:var(--bg-surface-1); border:1px solid var(--border-medium); border-radius:var(--radius-md); font-size:13px; color:var(--fg); margin-bottom:20px; outline:none;">
        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <button type="button" class="btn ghost" onclick="closeRenameKeyModal()">Cancel</button>
          <button type="button" id="renameKeySubmitBtn" class="btn primary" onclick="submitRenameKey()">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- Edit Provider Credentials Modal (Concentric Vercel Geist Dialog) -->
    <div id="editCredsModal" class="modal-backdrop" hidden role="dialog" aria-modal="true" style="position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(6px); z-index:var(--z-modal); display:none; align-items:center; justify-content:center; padding:16px;">
      <div class="modal-card card spotlight-card" style="max-width:460px; width:100%; padding:24px; box-shadow:var(--shadow-popover);">
        <h3 style="font-size:16px; font-weight:700; color:var(--fg); margin-bottom:6px;">Platform Provider Credentials</h3>
        <p style="font-size:12px; color:var(--geist-gray-50); margin-bottom:16px;">Configure your GitHub PAT token and Render API key for agent tooling.</p>
        
        <div style="display:flex; flex-direction:column; gap:14px; margin-bottom:20px;">
          <div>
            <label for="inputGithubToken" style="font-size:12px; font-weight:600; color:var(--fg); display:block; margin-bottom:4px;">GitHub Personal Access Token</label>
            <input type="password" id="inputGithubToken" placeholder="ghp_token or github_pat_token" style="width:100%; padding:8px 12px; background:var(--bg-surface-1); border:1px solid var(--border-medium); border-radius:var(--radius-md); font-family:var(--font-mono); font-size:12px; color:var(--fg); outline:none;">
          </div>
          <div>
            <label for="inputRenderKey" style="font-size:12px; font-weight:600; color:var(--fg); display:block; margin-bottom:4px;">Render API Key</label>
            <input type="password" id="inputRenderKey" placeholder="rnd_token" style="width:100%; padding:8px 12px; background:var(--bg-surface-1); border:1px solid var(--border-medium); border-radius:var(--radius-md); font-family:var(--font-mono); font-size:12px; color:var(--fg); outline:none;">
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <button type="button" class="btn ghost" onclick="closeEditCredsModal()">Cancel</button>
          <button type="button" id="saveCredsSubmitBtn" class="btn primary" onclick="submitEditCreds()">Save Credentials</button>
        </div>
      </div>
    </div>

    <!-- Custom Confirmation Modal (Contract Invariant: id="confirmModal" class="modal-backdrop" hidden) -->
    <div id="confirmModal" class="modal-backdrop" hidden role="dialog" aria-modal="true" style="position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(6px); z-index:var(--z-modal); display:none; align-items:center; justify-content:center; padding:16px;">
      <div class="modal-card card spotlight-card" style="max-width:400px; width:100%; padding:24px; box-shadow:var(--shadow-popover);">
        <h3 id="modalTitle" style="font-size:16px; font-weight:700; color:var(--fg); margin-bottom:6px;">Confirm Action</h3>
        <p id="modalDesc" style="font-size:13px; color:var(--geist-gray-50); margin-bottom:20px; line-height:1.5;">Are you sure you want to revoke this API key? Any connected applications will lose access.</p>
        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <button type="button" class="btn ghost" onclick="closeConfirmModal()">Cancel</button>
          <button type="button" id="modalConfirmBtn" class="btn danger" onclick="executeConfirmedAction()">Revoke Key</button>
        </div>
      </div>
    </div>

    <!-- Custom Toast Notification Container (Contract Invariant: class="toast-container") -->
    <div id="toastContainer" class="toast-container" aria-live="polite"></div>

    <script>
      let activeKeyMenuId = null;
      let pendingActionKeyId = null;

      function toggleKeyDropdown(id) {
        if (activeKeyMenuId && activeKeyMenuId !== id) {
          closeKeyDropdown(activeKeyMenuId);
        }
        const el = document.getElementById(id);
        if (el) {
          const isOpen = el.style.display === 'block';
          el.style.display = isOpen ? 'none' : 'block';
          activeKeyMenuId = isOpen ? null : id;
        }
      }

      function closeKeyDropdown(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
        if (activeKeyMenuId === id) activeKeyMenuId = null;
      }

      document.addEventListener('click', function(e) {
        if (!e.target.closest('.krix-dropdown')) {
          if (activeKeyMenuId) closeKeyDropdown(activeKeyMenuId);
        }
      });

      function showToast(message, type = 'success') {
        if (window.showToast) {
          window.showToast(message, type);
          return;
        }
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast ' + type;
        toast.textContent = message;
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
          toast.classList.remove('show');
          setTimeout(() => toast.remove(), 250);
        }, 3000);
      }

      function filterApiKeys(query) {
        const q = (query || '').toLowerCase().trim();
        document.querySelectorAll('.api-key-row').forEach(row => {
          const label = row.getAttribute('data-label') || '';
          const cid = row.getAttribute('data-client-id') || '';
          const match = !q || label.includes(q) || cid.includes(q);
          row.style.display = match ? '' : 'none';
        });
      }

      function filterOAuthClients(query) {
        const q = (query || '').toLowerCase().trim();
        document.querySelectorAll('.oauth-client-row').forEach(row => {
          const name = row.getAttribute('data-name') || '';
          row.style.display = (!q || name.includes(q)) ? 'flex' : 'none';
        });
      }

      function openCreateKeyModal() {
        const modal = document.getElementById('createKeyModal');
        const input = document.getElementById('createKeyInput');
        if (input) input.value = '';
        if (modal) {
          modal.hidden = false;
          modal.style.display = 'flex';
          input?.focus();
        }
      }

      function closeCreateKeyModal() {
        const modal = document.getElementById('createKeyModal');
        if (modal) {
          modal.hidden = true;
          modal.style.display = 'none';
        }
      }

      function handleCreateKey(event) {
        if (event && event.preventDefault) event.preventDefault();
        submitCreateKey();
        return false;
      }

      function submitCreateKey() {
        const input = document.getElementById('createKeyInput');
        const name = (input?.value || '').trim();
        if (!name || name.length < 4) {
          showToast('Key label must be at least 4 characters long', 'error');
          return;
        }

        const btn = document.getElementById('createKeySubmitBtn');
        if (btn) btn.disabled = true;

        fetch('/api/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: name })
        }).then(res => res.json()).then(data => {
          if (btn) btn.disabled = false;
          if (data && (data.id || data.key)) {
            closeCreateKeyModal();
            showToast('API key created successfully', 'success');
            setTimeout(() => window.location.reload(), 600);
          } else {
            showToast(data.error || 'Failed to create key', 'error');
          }
        }).catch(err => {
          if (btn) btn.disabled = false;
          showToast('Network error: ' + err.message, 'error');
        });
      }

      function openRenameKeyModal(keyId, currentName) {
        pendingActionKeyId = keyId;
        const modal = document.getElementById('renameKeyModal');
        const input = document.getElementById('renameKeyInput');
        if (input) input.value = currentName;
        if (modal) {
          modal.hidden = false;
          modal.style.display = 'flex';
          input?.focus();
        }
      }

      function closeRenameKeyModal() {
        const modal = document.getElementById('renameKeyModal');
        if (modal) {
          modal.hidden = true;
          modal.style.display = 'none';
        }
        pendingActionKeyId = null;
      }

      function submitRenameKey() {
        if (!pendingActionKeyId) return;
        const input = document.getElementById('renameKeyInput');
        const newName = (input?.value || '').trim();
        if (!newName || newName.length < 4) {
          showToast('Key label must be at least 4 characters long', 'error');
          return;
        }

        fetch('/api/keys/' + encodeURIComponent(pendingActionKeyId), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: newName })
        }).then(res => res.json()).then(data => {
          if (data && data.ok !== false) {
            const el = document.getElementById('key-name-text-' + pendingActionKeyId);
            if (el) el.textContent = newName;
            closeRenameKeyModal();
            showToast('Key renamed successfully', 'success');
          } else {
            showToast(data.error || 'Rename failed', 'error');
          }
        }).catch(err => {
          showToast('Network error: ' + err.message, 'error');
        });
      }

      function openRevokeKeyModal(keyId, keyLabel = 'this key') {
        pendingActionKeyId = keyId;
        const modal = document.getElementById('confirmModal');
        const desc = document.getElementById('modalDesc');
        if (desc) desc.textContent = 'Are you sure you want to revoke key "' + keyLabel + '"? This action cannot be reversed.';
        if (modal) {
          modal.hidden = false;
          modal.style.display = 'flex';
        }
      }

      function closeConfirmModal() {
        const modal = document.getElementById('confirmModal');
        if (modal) {
          modal.hidden = true;
          modal.style.display = 'none';
        }
        pendingActionKeyId = null;
      }

      function executeConfirmedAction() {
        if (!pendingActionKeyId) return;
        const id = pendingActionKeyId;
        fetch('/api/keys/' + encodeURIComponent(id), { method: 'DELETE' })
          .then(res => res.json()).then(data => {
            if (data && data.ok !== false) {
              const row = document.getElementById('row-' + id);
              if (row) row.remove();
              closeConfirmModal();
              showToast('Key revoked successfully', 'success');
              const remaining = document.querySelectorAll('#keysTableBody tr.api-key-row').length;
              const badge = document.getElementById('keysCountBadge');
              if (badge) badge.textContent = remaining + ' active';
            } else {
              showToast(data.error || 'Revocation failed', 'error');
            }
          }).catch(err => {
            showToast('Network error: ' + err.message, 'error');
          });
      }

      function revokeOAuthClient(clientId, clientName) {
        if (!confirm('Revoke access for ' + clientName + '?')) return;
        fetch('/api/oauth/clients/' + encodeURIComponent(clientId), { method: 'DELETE' })
          .then(res => {
            if (res.ok) {
              showToast('Client authorization revoked', 'success');
              setTimeout(() => window.location.reload(), 500);
            } else {
              showToast('Revocation failed', 'error');
            }
          }).catch(err => showToast('Network error', 'error'));
      }

      function openEditCredsModal() {
        const modal = document.getElementById('editCredsModal');
        if (modal) {
          modal.hidden = false;
          modal.style.display = 'flex';
        }
      }

      function closeEditCredsModal() {
        const modal = document.getElementById('editCredsModal');
        if (modal) {
          modal.hidden = true;
          modal.style.display = 'none';
        }
      }

      function submitEditCreds() {
        const gh = document.getElementById('inputGithubToken')?.value || '';
        const rn = document.getElementById('inputRenderKey')?.value || '';
        
        // Find first active key to bind or use default
        const firstRow = document.querySelector('.api-key-row');
        const keyId = firstRow ? firstRow.getAttribute('id')?.replace('row-', '') : 'primary-key';

        fetch('/settings/api/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyId: keyId || 'primary-key', githubToken: gh, renderToken: rn })
        }).then(res => res.json()).then(data => {
          if (data && data.ok) {
            closeEditCredsModal();
            showToast('Credentials saved successfully', 'success');
            setTimeout(() => window.location.reload(), 600);
          } else {
            showToast(data.error || 'Failed to save credentials', 'error');
          }
        }).catch(err => {
          showToast('Network error: ' + err.message, 'error');
        });
      }

      document.addEventListener('DOMContentLoaded', () => {
        const createForm = document.getElementById('createKeyForm');
        if (createForm) {
          createForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleCreateKey(e);
            return false;
          });
        }
      });
    </script>
  `;

  return renderPageShell({
    title: "API Keys",
    activeTab: "api",
    content,
    owner: params.owner,
  });
}
