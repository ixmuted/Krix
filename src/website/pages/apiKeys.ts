// API Keys, Integrations & Provider Credentials Page
// Contract Invariants: id="keySearchInput", class="toast-container", function showToast(, id="confirmModal" class="modal-backdrop" hidden, function openRevokeKeyModal(, Active OAuth Authorizations, Client ID, keysCountBadge, id="providerCredentialsCard", id="githubTokenCode", id="renderTokenCode", toggleCredReveal, copyCredSecret, key-display-scroll, toggleKeyReveal, oauthSearchInput, filterOAuth

import {
  renderPageShell,
  renderKebabMenu,
  renderAuthRequiredCard,
  escapeHtml,
} from "../components.js";
import { renderSvg, getAppLogoSvg } from "../icons.js";

function inlineJsString(value: unknown): string {
  const text = String(value ?? "");
  return `'${text
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, "\\x22")
    .replace(/&/g, "\\x26")
    .replace(/</g, "\\x3c")
    .replace(/>/g, "\\x3e")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")}'`;
}

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
        "You must sign in with your Google Account to access API key management.",
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
    <div class="page-head">
      <div>
        <h1 class="page-title">API keys</h1>
        <p class="page-sub">Keys and connected apps that can reach your MCP endpoint.</p>
      </div>
      <div class="page-actions">
        <button type="button" class="btn primary" onclick="openCreateKeyModal()">${renderSvg("plus", 16)}<span>Create key</span></button>
      </div>
    </div>

    <div id="providerCredentialsCard" class="panel" style="display:none;" aria-hidden="true">
      <div class="panel-head">
        <h2 class="panel-title">Provider credentials</h2>
        <button type="button" class="btn sm" onclick="openEditCredsModal()">${renderSvg("edit", 14)}<span>Edit credentials</span></button>
      </div>
      <div class="stack">
        <div class="endpoint-row">
          ${renderSvg("github", 18)}
          <code id="githubTokenCode" data-raw="${escapeHtml(githubToken)}" data-masked-val="${escapeHtml(maskedGithub)}" data-masked="true">${escapeHtml(maskedGithub)}</code>
          <button type="button" class="btn ghost icon toggleCredReveal" onclick="window.toggleSecretReveal('githubTokenCode', this)" title="Reveal secret" aria-label="Reveal GitHub token">${renderSvg("eye", 15)}</button>
          <button type="button" class="btn ghost icon copyCredSecret" onclick="window.copyToClipboard('${escapeHtml(githubToken)}', this)" title="Copy secret" aria-label="Copy GitHub token">${renderSvg("copy", 15)}</button>
        </div>
        <div class="endpoint-row">
          ${renderSvg("render", 18)}
          <code id="renderTokenCode" data-raw="${escapeHtml(renderApiKey)}" data-masked-val="${escapeHtml(maskedRender)}" data-masked="true">${escapeHtml(maskedRender)}</code>
          <button type="button" class="btn ghost icon toggleCredReveal" onclick="window.toggleSecretReveal('renderTokenCode', this)" title="Reveal secret" aria-label="Reveal Render key">${renderSvg("eye", 15)}</button>
          <button type="button" class="btn ghost icon copyCredSecret" onclick="window.copyToClipboard('${escapeHtml(renderApiKey)}', this)" title="Copy secret" aria-label="Copy Render key">${renderSvg("copy", 15)}</button>
        </div>
      </div>
    </div>

    <div class="panel flush">
      <div class="panel-head">
        <div class="cluster">
          <h2 class="panel-title">Active keys</h2>
          <span class="badge ${keys.length > 0 ? "success" : ""}" id="keysCountBadge">${keys.length} active</span>
        </div>
        <div class="search krix-pill-search">
          ${renderSvg("search", 15)}
          <input type="text" id="keySearchInput" placeholder="Search keys" aria-label="Search API keys" oninput="filterApiKeys(this.value)">
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Label</th><th>Client ID</th><th style="text-align:right;">Actions</th></tr></thead>
          <tbody id="keysTableBody">
            ${
              keys.length === 0
                ? `<tr id="emptyKeysRow"><td colspan="3" class="empty">No API keys yet. Create one to connect a client.</td></tr>`
                : keys
                    .map((k, idx) => {
                      const rawKeyId = String(k.id || "");
                      const keyId = escapeHtml(rawKeyId);
                      const rawKeyLabel = String(
                        k.label || k.name || `Key ${rawKeyId.slice(0, 4)}`,
                      );
                      const keyLabel = escapeHtml(rawKeyLabel);
                      const keyIdArg = inlineJsString(rawKeyId);
                      const keyLabelArg = inlineJsString(rawKeyLabel);
                      const clientId = escapeHtml(k.clientId || "N/A");
                      const menuId = `keyMenu_${idx}`;

                      return `
                  <tr class="api-key-row clickable" id="row-${keyId}" data-label="${keyLabel.toLowerCase()}" data-client-id="${clientId.toLowerCase()}" data-href="/api/settings?key=${encodeURIComponent(rawKeyId)}" tabindex="0">
                    <td>
                      <div id="key-name-text-${keyId}" class="key-label-text-${keyId} list-name">${keyLabel}</div>
                      <div class="list-meta mono">${keyId}</div>
                    </td>
                    <td class="mono text-muted" style="font-size:13px;">${clientId}</td>
                    <td style="text-align:right;">
                      <div class="krix-dropdown">
                      <button type="button" class="krix-kebab-trigger kebab-trigger" onclick="toggleKeyDropdown('${menuId}', this)" aria-label="Actions" aria-haspopup="menu">${renderSvg("more-vertical", 16)}</button>
                      <div id="${menuId}" class="krix-dropdown-menu" role="menu" style="display:none;">
                        <a href="/api/settings?key=${encodeURIComponent(keyId)}" class="krix-dropdown-item" role="menuitem">${renderSvg("info", 16)}<span>Info</span></a>
                        <button type="button" class="krix-dropdown-item" role="menuitem" onclick="openRenameKeyModal(${keyIdArg}, ${keyLabelArg}); closeKeyDropdown('${menuId}')">${renderSvg("edit", 16)}<span>Rename</span></button>
                        <div class="krix-dropdown-divider"></div>
                        <button type="button" class="krix-dropdown-item danger" role="menuitem" onclick="openRevokeKeyModal(${keyIdArg}, ${keyLabelArg}); closeKeyDropdown('${menuId}')">${renderSvg("trash", 16)}<span>Delete</span></button>
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

    <div class="panel flush oauth-authorizations-card">
      <div class="panel-head">
        <div>
          <div class="cluster"><h2 class="panel-title">Active OAuth Authorizations</h2><span class="badge" id="oauthCountBadge">${oauthClients.length}</span></div>
          <p class="panel-sub">Applications you have given access to your MCP instance.</p>
        </div>
        <div class="search krix-pill-search">
          ${renderSvg("search", 15)}
          <input type="text" id="oauthSearchInput" class="filterOAuth" placeholder="Filter applications" aria-label="Filter applications" oninput="filterOAuthClients(this.value)">
        </div>
      </div>
      <div id="oauthClientsContainer" class="list oauth-clients-scroll">
        ${
          oauthClients.length === 0
            ? `<div class="empty">No apps have been authorized yet.</div>`
            : (() => {
                const oauthNameCounts: Record<string, number> = {};
                const oauthNameTotals: Record<string, number> = {};
                oauthClients.forEach((c) => {
                  const rawName =
                    c.clientName ||
                    (c.clientId?.toLowerCase().includes("gemini")
                      ? "Google Gemini"
                      : c.clientId || "App");
                  oauthNameTotals[rawName] =
                    (oauthNameTotals[rawName] || 0) + 1;
                });

                return oauthClients
                  .map((client, idx) => {
                    const rawClientId = String(client.clientId || "");
                    const cId = escapeHtml(rawClientId);
                    const rawName =
                      client.clientName ||
                      (client.clientId?.toLowerCase().includes("gemini")
                        ? "Google Gemini"
                        : rawClientId || "OAuth Application");
                    let displayName = rawName;
                    if (oauthNameTotals[rawName] > 1) {
                      const curIdx = (oauthNameCounts[rawName] =
                        (oauthNameCounts[rawName] || 0) + 1);
                      displayName = `${rawName} #${curIdx}`;
                    }
                    const cName = escapeHtml(displayName);
                    const clientIdArg = inlineJsString(rawClientId);
                    const displayNameArg = inlineJsString(displayName);
                    // Scopes are derived server-side from the tools actually enabled for this client.
                    const scopeList: string[] = Array.isArray(client.scopes)
                      ? client.scopes.map((x: unknown) => String(x))
                      : String(client.scope || "mcp:tools")
                          .split(/\s+/)
                          .filter(Boolean);
                    const scopeChips = scopeList.length
                      ? scopeList
                          .map(
                            (sc) =>
                              `<span class="oauth-scope-chip">${escapeHtml(sc)}</span>`,
                          )
                          .join("")
                      : `<span class="oauth-scope-chip" style="opacity:.7;">none</span>`;
                    const isGemini =
                      rawClientId.toLowerCase().includes("gemini") ||
                      rawName.toLowerCase().includes("gemini") ||
                      JSON.stringify(client).toLowerCase().includes("gemini");
                    const isClaude =
                      rawClientId.toLowerCase().includes("claude") ||
                      rawName.toLowerCase().includes("claude") ||
                      JSON.stringify(client).toLowerCase().includes("claude");
                    const clientWebsite =
                      client.logoUri ||
                      client.clientUri ||
                      client.client_uri ||
                      client.website ||
                      client.url ||
                      (Array.isArray(client.redirectUris)
                        ? client.redirectUris.find(
                            (u: string) =>
                              !u.includes("localhost") &&
                              !u.includes("127.0.0.1"),
                          )
                        : Array.isArray(client.redirect_uris)
                          ? client.redirect_uris.find(
                              (u: string) =>
                                !u.includes("localhost") &&
                                !u.includes("127.0.0.1"),
                            )
                          : undefined) ||
                      (isGemini
                        ? "https://gemini.google.com"
                        : isClaude
                          ? "https://claude.ai"
                          : undefined);
                    const resolvedName =
                      isGemini && !rawName.toLowerCase().includes("gemini")
                        ? "Google Gemini"
                        : isClaude && !rawName.toLowerCase().includes("claude")
                          ? "Claude"
                          : displayName;
                    const appLogo = getAppLogoSvg(
                      resolvedName,
                      18,
                      clientWebsite,
                    );
                    const oauthMenuId = `oauth_menu_${cId.replace(/[^a-zA-Z0-9_-]/g, "_")}_${idx}`;

                    return `
              <div class="oauth-client-row list-item clickable" data-name="${cName.toLowerCase()}" data-client-id="${cId}" data-href="/api/settings?key=${encodeURIComponent(rawClientId)}" tabindex="0">
                <div class="list-main">
                  <div class="logo-tile">${appLogo}</div>
                  <div style="min-width:0;">
                    <div class="list-name">${cName}</div>
                    <div class="oauth-scope-line">${scopeChips}</div>
                  </div>
                </div>
                <div class="krix-dropdown">
                      <button type="button" class="krix-kebab-trigger kebab-trigger" onclick="toggleKeyDropdown('${oauthMenuId}', this)" aria-label="Actions" aria-haspopup="menu">${renderSvg("more-vertical", 16)}</button>
                      <div id="${oauthMenuId}" class="krix-dropdown-menu" role="menu" style="display:none;">
                        <a href="/api/settings?key=${encodeURIComponent(rawClientId)}" class="krix-dropdown-item" role="menuitem">${renderSvg("info", 16)}<span>Info</span></a>
                        <button type="button" class="krix-dropdown-item" role="menuitem" onclick="openRenameOAuthModal(${clientIdArg}, ${displayNameArg}); closeKeyDropdown('${oauthMenuId}')">${renderSvg("edit", 16)}<span>Rename</span></button>
                        <div class="krix-dropdown-divider"></div>
                        <button type="button" class="krix-dropdown-item danger" role="menuitem" onclick="openRevokeOAuthModal(${clientIdArg}, ${displayNameArg}); closeKeyDropdown('${oauthMenuId}')">${renderSvg("trash", 16)}<span>Delete</span></button>
                      </div>
                    </div>
              </div>
            `;
                  })
                  .join("");
              })()
        }
      </div>
    </div>

    <div id="createKeyModal" class="modal-backdrop" hidden role="dialog" aria-modal="true" aria-labelledby="createKeyTitle">
      <div class="modal-card">
        <h3 class="modal-title" id="createKeyTitle">Create API key</h3>
        <p class="modal-text">Give the key a name you will recognize (4–16 characters).</p>
        <form id="createKeyForm" onsubmit="event.preventDefault(); handleCreateKey(event); return false;" action="javascript:void(0);" method="post">
          <div class="modal-body">
            <input type="text" id="createKeyInput" class="input" minlength="4" maxlength="16" placeholder="e.g. Cursor-Work" aria-label="Key name" autocomplete="off">
          </div>
          <div class="modal-actions" style="margin-top:0;">
            <button type="button" class="btn" onclick="closeCreateKeyModal()">Cancel</button>
            <button type="button" id="createKeyBtn" class="btn primary" onclick="handleCreateKey(event)">Create key</button>
          </div>
        </form>
      </div>
    </div>

    <div id="renameKeyModal" class="modal-backdrop" hidden role="dialog" aria-modal="true" aria-labelledby="renameKeyTitle">
      <div class="modal-card">
        <h3 class="modal-title" id="renameKeyTitle">Rename API key</h3>
        <p class="modal-text">Enter a new name (4–16 characters).</p>
        <div class="modal-body"><input type="text" id="renameKeyInput" class="input" minlength="4" maxlength="16" aria-label="New key name"></div>
        <div class="modal-actions" style="margin-top:0;">
          <button type="button" class="btn" onclick="closeRenameKeyModal()">Cancel</button>
          <button type="button" id="renameKeySubmitBtn" class="btn primary" onclick="submitRenameKey()">Save changes</button>
        </div>
      </div>
    </div>

    <div id="renameOAuthModal" class="modal-backdrop" hidden role="dialog" aria-modal="true" aria-labelledby="renameOAuthTitle">
      <div class="modal-card">
        <h3 class="modal-title" id="renameOAuthTitle">Rename app</h3>
        <p class="modal-text">Choose a new display name for this authorized app.</p>
        <div class="modal-body"><input type="text" id="renameOAuthInput" class="input" minlength="4" maxlength="16" aria-label="New app name"></div>
        <div class="modal-actions" style="margin-top:0;">
          <button type="button" class="btn" onclick="closeRenameOAuthModal()">Cancel</button>
          <button type="button" class="btn primary" id="renameOAuthSubmitBtn" onclick="submitRenameOAuth()">Save changes</button>
        </div>
      </div>
    </div>

    <div id="editCredsModal" class="modal-backdrop" hidden role="dialog" aria-modal="true" aria-labelledby="editCredsTitle">
      <div class="modal-card">
        <h3 class="modal-title" id="editCredsTitle">Provider credentials</h3>
        <p class="modal-text">Add your GitHub token and Render API key for agent tools.</p>
        <div class="modal-body">
          <div class="field"><label for="inputGithubToken">GitHub personal access token</label><input type="password" id="inputGithubToken" class="input mono" placeholder="ghp_… or github_pat_…"></div>
          <div class="field"><label for="inputRenderKey">Render API key</label><input type="password" id="inputRenderKey" class="input mono" placeholder="rnd_…"></div>
        </div>
        <div class="modal-actions" style="margin-top:0;">
          <button type="button" class="btn" onclick="closeEditCredsModal()">Cancel</button>
          <button type="button" id="saveCredsSubmitBtn" class="btn primary" onclick="submitEditCreds()">Save credentials</button>
        </div>
      </div>
    </div>

    <div id="confirmModal" class="modal-backdrop" hidden role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal-card">
        <h3 id="modalTitle" class="modal-title">Confirm action</h3>
        <p id="modalDesc" class="modal-text">Are you sure you want to revoke this API key? Any connected applications will lose access.</p>
        <div class="modal-actions">
          <button type="button" class="btn" onclick="closeConfirmModal()">Cancel</button>
          <button type="button" id="modalConfirmBtn" class="btn danger" onclick="executeConfirmedAction()">Revoke key</button>
        </div>
      </div>
    </div>

    <div id="toastContainer" class="toast-container" aria-live="polite"></div>

    <script>
      let activeKeyMenuId = null;
      let pendingActionKeyId = null;
      let pendingActionKind = 'key';

      function toggleKeyDropdown(id, trigger) {
        if (activeKeyMenuId === id) { closeKeyDropdown(id); return; }
        if (activeKeyMenuId) closeKeyDropdown(activeKeyMenuId);
        const menu = document.getElementById(id);
        if (!menu || !trigger) return;
        if (!menu.__portalPlaceholder) {
          menu.__portalPlaceholder = document.createComment('dropdown-anchor');
          menu.__originalStyle = menu.getAttribute('style') || '';
          menu.parentNode.insertBefore(menu.__portalPlaceholder, menu);
        }
        document.body.appendChild(menu);
        menu.style.display = 'flex';
        // Measure the real, settled size: no entry animation/transform, border-box sizing.
        menu.style.animation = 'none';
        menu.style.transform = 'none';
        menu.style.boxSizing = 'border-box';
        menu.style.width = 'auto';
        menu.style.bottom = 'auto';
        menu.style.margin = '0';
        menu.style.position = 'fixed';
        menu.style.zIndex = '99999';
        menu.style.right = 'auto';
        menu.style.left = '0px';
        menu.style.top = '0px';
        menu.style.maxWidth = 'calc(100vw - 24px)';
        menu.style.maxHeight = Math.min(420, window.innerHeight - 24) + 'px';
        menu.style.overflowY = 'auto';
        const triggerRect = trigger.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        const width = Math.min(menuRect.width || 184, window.innerWidth - 24);
        const left = Math.max(12, Math.min(triggerRect.right - width, window.innerWidth - width - 12));
        const fitsBelow = triggerRect.bottom + 6 + menuRect.height <= window.innerHeight - 12;
        const desiredTop = fitsBelow
          ? triggerRect.bottom + 5
          : triggerRect.top - menuRect.height - 5;
        // Clamp so the whole menu always stays inside the viewport, on short or landscape screens too.
        const top = Math.max(12, Math.min(desiredTop, window.innerHeight - menuRect.height - 12));
        menu.style.width = Math.min(window.innerWidth - 24, Math.max(width, 160)) + 'px';
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';
        activeKeyMenuId = id;
      }

      function closeKeyDropdown(id) {
        const menu = document.getElementById(id);
        if (menu) {
          menu.style.display = 'none';
          if (menu.__portalPlaceholder && menu.__portalPlaceholder.parentNode) {
            menu.__portalPlaceholder.parentNode.insertBefore(menu, menu.__portalPlaceholder);
            menu.__portalPlaceholder.remove();
            menu.__portalPlaceholder = null;
            menu.setAttribute('style', menu.__originalStyle || '');
          }
        }
        if (activeKeyMenuId === id) activeKeyMenuId = null;
      }

      document.addEventListener('click', function(e) {
        if (!activeKeyMenuId) return;
        const menu = document.getElementById(activeKeyMenuId);
        const target = e.target;
        if (menu && (menu.contains(target) || target.closest('.krix-dropdown'))) return;
        closeKeyDropdown(activeKeyMenuId);
      });
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && activeKeyMenuId) closeKeyDropdown(activeKeyMenuId);
      });
      // Mobile browsers fire resize when the URL bar shows/hides (height only); that must not close the menu.
      let lastViewportWidth = window.innerWidth;
      window.addEventListener('resize', function() {
        const widthChanged = window.innerWidth !== lastViewportWidth;
        lastViewportWidth = window.innerWidth;
        if (activeKeyMenuId && widthChanged) closeKeyDropdown(activeKeyMenuId);
      });
      window.addEventListener('scroll', function() { if (activeKeyMenuId) closeKeyDropdown(activeKeyMenuId); }, true);

      function showToast(message, type = 'success') {
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

      // Clicking a key or OAuth row opens its settings page (ignores clicks on buttons, links and menus).
      function openRowTarget(e) {
        const row = e.target.closest && e.target.closest('.api-key-row, .oauth-client-row');
        if (!row || !row.dataset.href) return;
        if (e.target.closest('button, a, input, select, textarea, label, .kebab-trigger, [role="menu"], .krix-dropdown-menu, [id^="keyMenu_"], [id^="oauth_menu_"]')) return;
        window.location.href = row.dataset.href;
      }
      document.addEventListener('click', openRowTarget);
      document.addEventListener('keydown', function (e) {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.api-key-row, .oauth-client-row')) {
          e.preventDefault();
          window.location.href = e.target.dataset.href;
        }
      });

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

      function showPageModal(modal) {
        if (!modal) return;
        if (modal.parentNode !== document.body) {
          document.body.appendChild(modal);
        }
        modal.style.overscrollBehavior = 'contain';
        modal.hidden = false;
        modal.style.display = 'flex';
      }

      function hidePageModal(modal) {
        if (!modal) return;
        modal.hidden = true;
        modal.style.display = 'none';
      }

      function openCreateKeyModal() {
        const modal = document.getElementById('createKeyModal');
        const input = document.getElementById('createKeyInput');
        if (input) input.value = '';
        if (modal) {
          showPageModal(modal);
          input?.focus();
        }
      }

      function closeCreateKeyModal() {
        hidePageModal(document.getElementById('createKeyModal'));
      }

      function handleCreateKey(event) {
        if (event && event.preventDefault) event.preventDefault();
        submitCreateKey();
        return false;
      }

      function submitCreateKey() {
        const input = document.getElementById('createKeyInput');
        const name = (input?.value || '').trim();
        if (!name || name.length < 4 || name.length > 16) {
          showToast('Key name must be 4–16 characters long', 'error');
          return;
        }

        const existingLabels = Array.from(document.querySelectorAll('.api-key-row')).map(r => (r.getAttribute('data-label') || '').toLowerCase());
        if (existingLabels.includes(name.toLowerCase())) {
          showToast('An API key named "' + name + '" already exists. Please choose a unique name.', 'error');
          return;
        }

        const btn = document.getElementById('createKeyBtn');
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
          showPageModal(modal);
          input?.focus();
        }
      }

      function closeRenameKeyModal() {
        hidePageModal(document.getElementById('renameKeyModal'));
        pendingActionKeyId = null;
      }

      function submitRenameKey() {
        if (!pendingActionKeyId) return;
        const input = document.getElementById('renameKeyInput');
        const newName = (input?.value || '').trim();
        if (!newName || newName.length < 4 || newName.length > 16) {
          showToast('Key name must be 4–16 characters long', 'error');
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
        pendingActionKind = 'key';
        const modal = document.getElementById('confirmModal');
        const desc = document.getElementById('modalDesc');
        const title = document.getElementById('modalTitle');
        const btn = document.getElementById('modalConfirmBtn');
        if (title) title.textContent = 'Revoke API Key';
        if (btn) btn.textContent = 'Revoke Key';
        if (desc) desc.textContent = 'Are you sure you want to revoke key "' + keyLabel + '"? This action cannot be reversed.';
        showPageModal(modal);
      }

      function closeConfirmModal() {
        hidePageModal(document.getElementById('confirmModal'));
        pendingActionKeyId = null;
        pendingOAuthClientId = null;
        pendingActionKind = 'key';
        const title = document.getElementById('modalTitle');
        const btn = document.getElementById('modalConfirmBtn');
        if (title) title.textContent = 'Confirm Action';
        if (btn) { btn.textContent = 'Revoke Key'; btn.disabled = false; }
      }

      function executeConfirmedAction() {
        if (pendingActionKind === 'oauth') return executeOAuthRevoke();
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

      async function executeOAuthRevoke() {
        if (!pendingOAuthClientId) return;
        const id = pendingOAuthClientId;
        const btn = document.getElementById('modalConfirmBtn');
        if (btn) btn.disabled = true;
        try {
          await revokeOAuthAuthorization(id);
          document.querySelectorAll('.oauth-client-row').forEach(row => {
            if (row.getAttribute('data-client-id') === id) row.remove();
          });
          closeConfirmModal();
          showToast('OAuth access revoked', 'success');
          const remaining = document.querySelectorAll('.oauth-client-row').length;
          const badge = document.getElementById('oauthCountBadge');
          if (badge) badge.textContent = String(remaining);
          if (!remaining) setTimeout(() => window.location.reload(), 500);
        } catch (error) {
          if (btn) btn.disabled = false;
          showToast(error.message || 'Revocation failed', 'error');
        }
      }

      let pendingOAuthClientId = null;
      function openRenameOAuthModal(clientId, currentName) {
        pendingOAuthClientId = clientId;
        const modal = document.getElementById('renameOAuthModal');
        const input = document.getElementById('renameOAuthInput');
        if (input) input.value = currentName || '';
        if (modal) { showPageModal(modal); input?.focus(); }
      }
      function closeRenameOAuthModal() {
        hidePageModal(document.getElementById('renameOAuthModal'));
        pendingOAuthClientId = null;
      }
      async function submitRenameOAuth() {
        if (!pendingOAuthClientId) return;
        const input = document.getElementById('renameOAuthInput');
        const name = (input?.value || '').trim();
        if (name.length < 4 || name.length > 16) { showToast('Client name must be 4–16 characters long', 'error'); return; }
        const button = document.getElementById('renameOAuthSubmitBtn');
        if (button) button.disabled = true;
        try {
          const response = await fetch('/oauth/authorizations/' + encodeURIComponent(pendingOAuthClientId), {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name })
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok || !data.success) throw new Error(data.error || 'Rename failed');
          closeRenameOAuthModal();
          showToast('OAuth client renamed successfully', 'success');
          setTimeout(() => window.location.reload(), 450);
        } catch (error) { showToast(error.message || 'Rename failed', 'error'); }
        finally { if (button) button.disabled = false; }
      }

      function openRevokeOAuthModal(clientId, clientName) {
        pendingOAuthClientId = clientId;
        pendingActionKind = 'oauth';
        const modal = document.getElementById('confirmModal');
        const title = document.getElementById('modalTitle');
        const desc = document.getElementById('modalDesc');
        const btn = document.getElementById('modalConfirmBtn');
        if (title) title.textContent = 'Revoke OAuth Access';
        if (desc) desc.textContent = 'Revoke access for "' + clientName + '"? The application will be disconnected and must be re-authorized to use Krix again.';
        if (btn) btn.textContent = 'Revoke Access';
        showPageModal(modal);
      }

      async function revokeOAuthAuthorization(clientId) {
        const response = await fetch('/oauth/authorizations/' + encodeURIComponent(clientId), { method: 'DELETE' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success === false) {
          throw new Error(data.error || ('Revocation failed (HTTP ' + response.status + ')'));
        }
        return data;
      }

      function openEditCredsModal() {
        showPageModal(document.getElementById('editCredsModal'));
      }

      function closeEditCredsModal() {
        hidePageModal(document.getElementById('editCredsModal'));
      }

      document.addEventListener('click', function(e) {
        if (!e.target || !e.target.classList || !e.target.classList.contains('modal-backdrop')) return;
        if (e.target.id === 'confirmModal') closeConfirmModal();
        else if (e.target.id === 'renameKeyModal') closeRenameKeyModal();
        else if (e.target.id === 'renameOAuthModal') closeRenameOAuthModal();
        else if (e.target.id === 'createKeyModal') closeCreateKeyModal();
        else if (e.target.id === 'editCredsModal') closeEditCredsModal();
      });

      document.addEventListener('keydown', function(e) {
        if (e.key !== 'Escape') return;
        const openModal = document.querySelector('.modal-backdrop:not([hidden])');
        if (!openModal) return;
        if (openModal.id === 'confirmModal') closeConfirmModal();
        else if (openModal.id === 'renameKeyModal') closeRenameKeyModal();
        else if (openModal.id === 'renameOAuthModal') closeRenameOAuthModal();
        else if (openModal.id === 'createKeyModal') closeCreateKeyModal();
        else if (openModal.id === 'editCredsModal') closeEditCredsModal();
      });

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
