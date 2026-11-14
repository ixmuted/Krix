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

    <!-- Profile Default Integrations Card (Managed in /settings) -->
    <div id="providerCredentialsCard" class="card spotlight-card card-top-border" style="display:none;" aria-hidden="true">
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
        <div class="search-bar-responsive" style="display:flex; align-items:center; gap:8px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-full); padding:6px 14px; width:260px; max-width:100%; box-sizing:border-box;">
          ${renderSvg("search", 14, "text-muted")}
          <input type="text" id="keySearchInput" placeholder="Search API keys" oninput="filterApiKeys(this.value)" style="border:none; background:transparent; font-size:12px; color:var(--fg); outline:none; width:100%;">
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:13px; text-align:left;">
          <thead>
            <tr style="border-bottom:1px solid var(--border-subtle); color:var(--geist-gray-50); font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">
              <th style="padding:10px 12px; font-weight:600;">Label</th>
              <th style="padding:10px 12px; font-weight:600; text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody id="keysTableBody">
            ${
              keys.length === 0
                ? `<tr id="emptyKeysRow"><td colspan="2" style="text-align:center; padding:32px; color:var(--geist-gray-50);">No active API keys found. Click "Create API Key" to generate one.</td></tr>`
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
                  <tr class="api-key-row" id="row-${keyId}" data-label="${keyLabel.toLowerCase()}" data-client-id="${clientId.toLowerCase()}" style="border-bottom:1px solid var(--border-subtle);">
                    <td style="padding:12px;">
                      <span id="key-name-text-${keyId}" class="key-label-text-${keyId}" style="font-weight:600; color:var(--fg);">${keyLabel}</span>
                      <div style="font-family:var(--font-mono); font-size:11px; color:var(--geist-gray-50);">${keyId}</div>
                    </td>
                    <td style="padding:12px; text-align:right; position:relative; overflow:visible;">
                      <div class="krix-dropdown" style="display:inline-block; position:relative; overflow:visible;">
                        <button type="button" class="btn ghost kebab-trigger" onclick="toggleKeyDropdown('${menuId}', this)" style="padding:4px 6px;" aria-label="Key Actions">
                          ${renderSvg("more-vertical", 14)}
                        </button>
                        <div id="${menuId}" class="krix-dropdown-menu" style="display:none; position:absolute; right:0; top:calc(100% + 4px); background:var(--bg-surface-0); border:1px solid var(--border-medium); border-radius:var(--radius-md); box-shadow:var(--shadow-popover); padding:4px; z-index:680; min-width:160px; text-align:left;">
                          <a href="/api/settings?key=${encodeURIComponent(keyId)}" class="btn ghost" style="width:100%; justify-content:flex-start; font-size:12px; padding:6px 10px; border-radius:var(--radius-sm); text-decoration:none;">
                            ${renderSvg("info", 13)}
                            <span>Info</span>
                          </a>
                          <button type="button" class="btn ghost" onclick="openRenameKeyModal(${keyIdArg}, ${keyLabelArg}); closeKeyDropdown('${menuId}')" style="width:100%; justify-content:flex-start; font-size:12px; padding:6px 10px; border-radius:var(--radius-sm);">
                            ${renderSvg("edit", 13)}
                            <span>Rename</span>
                          </button>
                          <div style="height:1px; background:var(--border-subtle); margin:4px 0;"></div>
                          <button type="button" class="btn ghost danger" onclick="openRevokeKeyModal(${keyIdArg}, ${keyLabelArg}); closeKeyDropdown('${menuId}')" style="width:100%; justify-content:flex-start; font-size:12px; padding:6px 10px; border-radius:var(--radius-sm); color:var(--error);">
                            ${renderSvg("trash", 13)}
                            <span>Delete</span>
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
    <div class="card spotlight-card oauth-authorizations-card" style="padding:24px; height:auto; min-height:0; align-self:start;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <h2 style="font-size:16px; font-weight:600; color:var(--fg);">Active OAuth Authorizations</h2>
            <span class="badge" id="oauthCountBadge">${oauthClients.length}</span>
          </div>
          <p style="font-size:12px; color:var(--geist-gray-50); margin-top:2px;">Applications granted access to your MCP instance</p>
        </div>

        <div class="search-bar-responsive" style="display:flex; align-items:center; gap:8px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-full); padding:6px 14px; width:260px; max-width:100%; box-sizing:border-box;">
          ${renderSvg("search", 14, "text-muted")}
          <input type="text" id="oauthSearchInput" class="filterOAuth" placeholder="Filter applications" oninput="filterOAuthClients(this.value)" style="border:none; background:transparent; font-size:12px; color:var(--fg); outline:none; width:100%;">
        </div>
      </div>

      <div id="oauthClientsContainer" class="oauth-clients-scroll" style="display:flex; flex-direction:column; align-items:stretch; gap:8px; overflow:visible; max-width:100%; height:auto; min-height:0; flex:none;">
        ${
          oauthClients.length === 0
            ? `<div style="text-align:center; padding:32px; color:var(--geist-gray-50); font-size:13px;">No third-party applications authorized yet.</div>`
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
              <div class="oauth-client-row card" data-name="${cName.toLowerCase()}" data-client-id="${cId}" style="display:flex; justify-content:space-between; align-items:center; gap:8px; box-sizing:border-box; width:100%; min-height:68px; height:auto; padding:12px 14px; border-radius:var(--radius-md); background:var(--bg-surface-1); border:1px solid var(--border-subtle); position:relative; overflow:visible; flex:0 0 auto;">
                <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
                  <div style="width:36px; height:36px; flex:0 0 36px; border-radius:8px; background:var(--bg-surface-2); display:flex; align-items:center; justify-content:center; border:1px solid var(--border-subtle); color:var(--fg);">
                    ${appLogo}
                  </div>
                  <div style="min-width:0; flex:1;">
                    <div style="font-weight:600; font-size:13px; color:var(--fg); overflow-wrap:anywhere;">${cName}</div>
                    <div class="oauth-scope-line">${scopeChips}</div>
                  </div>
                </div>

                <div style="display:flex; align-items:center; flex:0 0 auto;">
                  <div class="krix-dropdown" style="display:inline-block; position:relative; overflow:visible;">
                    <button type="button" class="btn ghost kebab-trigger" onclick="toggleKeyDropdown('${oauthMenuId}', this)" style="padding:4px 6px;" aria-label="OAuth Actions">
                      ${renderSvg("more-vertical", 14)}
                    </button>
                    <div id="${oauthMenuId}" class="krix-dropdown-menu" style="display:none; position:absolute; right:0; top:calc(100% + 4px); background:var(--bg-surface-0); border:1px solid var(--border-medium); border-radius:var(--radius-md); box-shadow:var(--shadow-popover); padding:4px; z-index:680; min-width:160px; text-align:left;">
                      <a href="/api/settings?key=${encodeURIComponent(rawClientId)}" class="btn ghost" style="width:100%; justify-content:flex-start; font-size:12px; padding:6px 10px; border-radius:var(--radius-sm); text-decoration:none;">
                        ${renderSvg("info", 13)}
                        <span>Info</span>
                      </a>
                      <button type="button" class="btn ghost" onclick="openRenameOAuthModal(${clientIdArg}, ${displayNameArg}); closeKeyDropdown('${oauthMenuId}')" style="width:100%;justify-content:flex-start;font-size:12px;padding:6px 10px;border-radius:var(--radius-sm);">
                        ${renderSvg("edit", 13)}<span>Rename</span>
                      </button>
                      <div style="height:1px; background:var(--border-subtle); margin:4px 0;"></div>
                      <button type="button" class="btn ghost danger" onclick="openRevokeOAuthModal(${clientIdArg}, ${displayNameArg}); closeKeyDropdown('${oauthMenuId}')" style="width:100%; justify-content:flex-start; font-size:12px; padding:6px 10px; border-radius:var(--radius-sm); color:var(--error);">
                        ${renderSvg("trash", 13)}
                        <span>Delete</span>
                      </button>
                    </div>
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

    <style>
      .oauth-scope-line{display:flex;flex-wrap:wrap;gap:4px 5px;margin-top:6px;max-height:44px;overflow:hidden;min-width:0}
      .oauth-scope-chip{font:600 10px/1 var(--font-mono);padding:4px 7px;border-radius:999px;background:var(--bg-surface-2);border:1px solid var(--border-subtle);color:var(--geist-gray-50);white-space:nowrap}
      .oauth-clients-scroll{overflow-x:hidden}
    </style>

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

    <!-- Rename OAuth Client Modal -->
    <div id="renameOAuthModal" class="modal-backdrop" hidden role="dialog" aria-modal="true" style="position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(6px);z-index:var(--z-modal);display:none;align-items:center;justify-content:center;padding:16px;">
      <div class="modal-card card spotlight-card" style="max-width:420px;width:100%;padding:24px;box-shadow:var(--shadow-popover);">
        <h3 style="font-size:16px;font-weight:700;color:var(--fg);margin-bottom:6px;">Rename OAuth Client</h3>
        <p style="font-size:12px;color:var(--geist-gray-50);margin-bottom:16px;">Choose a new display name for this authorized application.</p>
        <input type="text" id="renameOAuthInput" maxlength="100" style="width:100%;padding:8px 12px;background:var(--bg-surface-1);border:1px solid var(--border-medium);border-radius:6px;font-size:13px;color:var(--fg);margin-bottom:20px;outline:none;">
        <div style="display:flex;justify-content:flex-end;gap:8px;">
          <button type="button" class="btn ghost" onclick="closeRenameOAuthModal()">Cancel</button>
          <button type="button" class="btn primary" id="renameOAuthSubmitBtn" onclick="submitRenameOAuth()">Save Changes</button>
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
        menu.style.position = 'fixed';
        menu.style.zIndex = '680';
        menu.style.right = 'auto';
        menu.style.left = '0px';
        menu.style.top = '0px';
        menu.style.maxWidth = 'calc(100vw - 24px)';
        menu.style.maxHeight = 'min(70vh, 420px)';
        menu.style.overflowY = 'auto';
        const triggerRect = trigger.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        const width = Math.min(menuRect.width || 184, window.innerWidth - 24);
        const left = Math.max(12, Math.min(triggerRect.right - width, window.innerWidth - width - 12));
        const fitsBelow = triggerRect.bottom + 6 + menuRect.height <= window.innerHeight - 12;
        const top = fitsBelow
          ? triggerRect.bottom + 5
          : Math.max(12, triggerRect.top - Math.min(menuRect.height, window.innerHeight * 0.7) - 5);
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
      window.addEventListener('resize', function() { if (activeKeyMenuId) closeKeyDropdown(activeKeyMenuId); });
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
        pendingActionKind = 'key';
        const modal = document.getElementById('confirmModal');
        const desc = document.getElementById('modalDesc');
        const title = document.getElementById('modalTitle');
        const btn = document.getElementById('modalConfirmBtn');
        if (title) title.textContent = 'Revoke API Key';
        if (btn) btn.textContent = 'Revoke Key';
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
        if (modal) { modal.hidden = false; modal.style.display = 'flex'; input?.focus(); }
      }
      function closeRenameOAuthModal() {
        const modal = document.getElementById('renameOAuthModal');
        if (modal) { modal.hidden = true; modal.style.display = 'none'; }
        pendingOAuthClientId = null;
      }
      async function submitRenameOAuth() {
        if (!pendingOAuthClientId) return;
        const input = document.getElementById('renameOAuthInput');
        const name = (input?.value || '').trim();
        if (name.length < 2) { showToast('Client name must be at least 2 characters long', 'error'); return; }
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
        if (modal) { modal.hidden = false; modal.style.display = 'flex'; }
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
