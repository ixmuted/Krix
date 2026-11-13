// API Keys & Provider Credentials Dashboard
// Contract Invariants: key-display-scroll, toggleKeyReveal, oauthSearchInput, filterOAuth, providerCredentialsCard, githubTokenCode, renderTokenCode, toggleCredReveal, copyCredSecret
// Additional Invariants: keySearchInput, toast-container, showToast, confirmModal, openRevokeKeyModal, Active OAuth Authorizations
// Kebab Menus: Crisp SVGs, small concise names ("Configure", "Rename", "Revoke"), ZERO ellipses

import { renderPageShell, escapeHtml, renderKebabMenu } from "../components.js";
import { renderSvg } from "../icons.js";

export function renderApiKeysPage(params: {
  base: string;
  isOwner?: boolean;
  owner?: any;
  keys?: any[];
  oauthClients?: any[];
  oauthAuthorizations?: any[];
  credentials?: any;
}): string {
  const keys = Array.isArray(params.keys) ? params.keys : [];
  const oauthClients = Array.isArray(params.oauthClients)
    ? params.oauthClients
    : Array.isArray(params.oauthAuthorizations)
      ? params.oauthAuthorizations
      : [];
  const creds = params.credentials || {};
  const isOwner = !!params.isOwner;

  const githubToken = creds.githubToken || "";
  const renderApiKey = creds.renderApiKey || "";

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
        ${renderSvg("plus", 15)}
        <span>Create API Key</span>
      </button>
    </div>

    <!-- Profile Default Integrations Card (Contract Invariant) -->
    <div id="providerCredentialsCard" class="card spotlight-card card-top-border" style="padding:22px 24px; margin-bottom:28px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
        <div>
          <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:var(--geist-gray-50);">DEFAULT INTEGRATIONS</div>
          <h2 style="font-size:16px; font-weight:600; color:var(--fg); margin-top:2px;">Platform Provider Credentials</h2>
        </div>
        <button type="button" class="btn" onclick="openEditCredsModal()" style="padding:5px 12px; font-size:12px; border-radius:var(--radius-full);">
          ${renderSvg("edit", 13)}
          <span>Edit Credentials</span>
        </button>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">
        <!-- GitHub Token Cell -->
        <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-radius:var(--radius-md); background:var(--bg-surface-1); border:1px solid var(--border-subtle);">
          <div style="display:flex; align-items:center; gap:10px;">
            ${renderSvg("github", 18)}
            <div>
              <div style="font-size:12px; font-weight:600; color:var(--fg);">GitHub Token</div>
              <code id="githubTokenCode" data-raw="${escapeHtml(githubToken)}" data-masked-val="${escapeHtml(maskedGithub)}" data-masked="true" style="font-size:11px; color:var(--geist-gray-50);">${escapeHtml(maskedGithub)}</code>
            </div>
          </div>
          <div style="display:flex; gap:4px;">
            <button type="button" class="btn ghost toggleCredReveal" onclick="window.toggleSecretReveal('githubTokenCode', this)" style="padding:4px;" title="Reveal Secret">
              ${renderSvg("eye", 14)}
            </button>
            <button type="button" class="btn ghost copyCredSecret" onclick="window.copyToClipboard('${escapeHtml(githubToken)}', this)" style="padding:4px;" title="Copy Secret">
              ${renderSvg("copy", 14)}
            </button>
          </div>
        </div>

        <!-- Render API Key Cell -->
        <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-radius:var(--radius-md); background:var(--bg-surface-1); border:1px solid var(--border-subtle);">
          <div style="display:flex; align-items:center; gap:10px;">
            ${renderSvg("render", 18)}
            <div>
              <div style="font-size:12px; font-weight:600; color:var(--fg);">Render API Key</div>
              <code id="renderTokenCode" data-raw="${escapeHtml(renderApiKey)}" data-masked-val="${escapeHtml(maskedRender)}" data-masked="true" style="font-size:11px; color:var(--geist-gray-50);">${escapeHtml(maskedRender)}</code>
            </div>
          </div>
          <div style="display:flex; gap:4px;">
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

    <!-- Active API Keys Table Section (Contract Invariant: id="keySearchInput") -->
    <div class="card spotlight-card" style="padding:24px; margin-bottom:28px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <h2 style="font-size:16px; font-weight:600; color:var(--fg);">Active API Keys</h2>
          <span class="badge ${keys.length > 0 ? "success" : ""}" id="keysCountBadge">${keys.length} active</span>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <input type="text" id="keySearchInput" placeholder="Search API keys" oninput="filterApiKeys(this.value)" style="padding:6px 14px; font-size:12px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-full); width:200px; color:var(--fg);">
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
          <tbody>
            ${
              keys.length === 0
                ? `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--geist-gray-50);">No active API keys found. Click "Create API Key" to generate one.</td></tr>`
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
                      const menuId = `keyMenu_${idx}`;

                      const kebabItems = [
                        {
                          label: "Configure",
                          icon: "settings",
                          href: `/api/settings?key=${keyId}`,
                        },
                        {
                          label: "Rename",
                          icon: "edit",
                          onclick: `openRenameModal('${keyId}', '${keyLabel}')`,
                        },
                        {
                          label: "Revoke",
                          icon: "trash",
                          onclick: `openRevokeKeyModal('${keyId}')`,
                          danger: true,
                        },
                      ];

                      return `
                  <tr class="api-key-row" style="border-bottom:1px solid var(--border-subtle);">
                    <td style="padding:12px;">
                      <span id="key-name-text-${keyId}" class="key-label-text-${keyId}" style="font-weight:600; color:var(--fg);">${keyLabel}</span>
                      <div style="font-family:var(--font-mono); font-size:11px; color:var(--geist-gray-50);">${keyId}</div>
                    </td>
                    <td style="padding:12px;">
                      <div style="display:flex; align-items:center; gap:6px;">
                        <code style="font-family:var(--font-mono); font-size:12px; background:var(--bg-surface-2); padding:3px 6px; border-radius:4px; border:1px solid var(--border-subtle); color:var(--fg);">${escapeHtml(k.clientId || "N/A")}</code>
                        ${k.clientId ? `<button type="button" class="btn ghost copyClientIdBtn" onclick="window.copyToClipboard('${escapeHtml(k.clientId)}', this)" style="padding:3px;" title="Copy Client ID">${renderSvg("copy", 13)}</button>` : ""}
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
                    <td style="padding:12px; color:var(--geist-gray-50); font-family:var(--font-mono); font-size:11px;">
                      ${escapeHtml(k.createdAt || "Recent")}
                    </td>
                    <td style="padding:12px; text-align:right;">
                      ${renderKebabMenu(kebabItems, menuId)}
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

    <!-- Active OAuth Authorizations Section (Contract Invariant: Active OAuth Authorizations) -->
    <div class="card spotlight-card" style="padding:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
        <div>
          <h2 style="font-size:16px; font-weight:600; color:var(--fg);">Active OAuth Authorizations</h2>
          <p style="font-size:12px; color:var(--geist-gray-50); margin-top:2px;">Applications granted access to your MCP instance</p>
        </div>

        <div style="display:flex; align-items:center; gap:8px;">
          <input type="text" id="oauthSearchInput" class="filterOAuth" placeholder="Filter applications" oninput="filterOAuthClients(this.value)" style="padding:6px 12px; font-size:12px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-full); width:200px; color:var(--fg);">
        </div>
      </div>

      <div id="oauthClientsContainer" style="display:flex; flex-direction:column; gap:8px;">
        ${
          oauthClients.length === 0
            ? `<div style="text-align:center; padding:32px; color:var(--geist-gray-50); font-size:13px;">No third-party applications authorized yet.</div>`
            : oauthClients
                .map((client) => {
                  const cName = escapeHtml(
                    client.clientName || client.name || "Client",
                  );
                  const cId = escapeHtml(client.clientId || client.id || "");
                  const cScope = escapeHtml(client.scope || "mcp:tools");
                  return `
              <div class="oauth-client-row" style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-radius:var(--radius-md); background:var(--bg-surface-1); border:1px solid var(--border-subtle); gap:12px;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="width:32px; height:32px; border-radius:var(--radius-md); background:var(--bg-surface-2); display:flex; align-items:center; justify-content:center; color:var(--fg);">
                    ${renderSvg("terminal", 16)}
                  </div>
                  <div>
                    <div style="font-weight:600; color:var(--fg); font-size:13px;">${cName}</div>
                    <div style="font-size:11px; color:var(--geist-gray-50); font-family:var(--font-mono);">${cId} • Scopes: ${cScope}</div>
                  </div>
                </div>

                <button type="button" class="btn danger" onclick="revokeOAuthClient('${cId}')" style="padding:5px 12px; font-size:11px; border-radius:var(--radius-full);">
                  Revoke
                </button>
              </div>
            `;
                })
                .join("")
        }
      </div>
    </div>

    <!-- Confirmation Modal (Contract Invariant: id="confirmModal" class="modal-backdrop" hidden) -->
    <div id="confirmModal" class="modal-backdrop" hidden style="position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(8px); z-index:var(--z-modal); display:none; align-items:center; justify-content:center;">
      <div class="card" style="max-width:400px; width:90%; padding:24px; box-shadow:var(--shadow-popover);">
        <h3 id="confirmModalTitle" style="font-size:16px; font-weight:700; color:var(--fg);">Confirm Revocation</h3>
        <p id="confirmModalBody" style="font-size:13px; color:var(--geist-gray-50); margin:8px 0 20px;">Are you sure you want to proceed?</p>
        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <button type="button" class="btn ghost" onclick="closeConfirmModal()">Cancel</button>
          <button type="button" id="confirmModalBtn" class="btn danger">Revoke Key</button>
        </div>
      </div>
    </div>

    <!-- Dedicated Toast Container Class (Contract Invariant) -->
    <div class="toast-container" style="display:none;"></div>

    <script>
      function filterApiKeys(q) {
        const query = q.toLowerCase();
        document.querySelectorAll('.api-key-row').forEach(row => {
          row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
        });
      }

      function filterOAuthClients(q) {
        const query = q.toLowerCase();
        document.querySelectorAll('.oauth-client-row').forEach(row => {
          row.style.display = row.textContent.toLowerCase().includes(query) ? 'flex' : 'none';
        });
      }

      function showToast(message, variant) {
        window.showToast(message, variant);
      }

      let pendingRevokeKeyId = null;
      function openRevokeKeyModal(keyId) {
        pendingRevokeKeyId = keyId;
        const modal = document.getElementById('confirmModal');
        modal.hidden = false;
        modal.style.display = 'flex';
        document.getElementById('confirmModalBtn').onclick = function() {
          fetch('/api/keys/' + encodeURIComponent(pendingRevokeKeyId), { method: 'DELETE' })
            .then(res => {
              if (res.ok) window.location.reload();
              else showToast('Revocation failed', 'error');
            });
        };
      }

      function closeConfirmModal() {
        const modal = document.getElementById('confirmModal');
        modal.hidden = true;
        modal.style.display = 'none';
      }

      function openCreateKeyModal() {
        const name = prompt("Enter a descriptive name for this API key:");
        if (!name) return;
        fetch("/api/keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: name })
        }).then(res => {
          if (res.ok) window.location.reload();
          else showToast("Failed to create API key", "error");
        });
      }

      function openRenameModal(keyId, currentName) {
        const newName = prompt("Enter new name for this API key:", currentName);
        if (!newName || newName === currentName) return;
        fetch("/api/keys/" + encodeURIComponent(keyId) + "/rename", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: newName })
        }).then(res => {
          if (res.ok) {
            const el = document.getElementById("key-name-text-" + keyId);
            if (el) el.textContent = newName;
            showToast("Key renamed", "success");
          } else {
            showToast("Rename failed", "error");
          }
        });
      }

      function revokeOAuthClient(clientId) {
        if (!confirm("Revoke authorization for this client?")) return;
        fetch("/api/oauth/clients/" + encodeURIComponent(clientId), { method: "DELETE" })
          .then(res => {
            if (res.ok) window.location.reload();
            else showToast("Revocation failed", "error");
          });
      }

      function openEditCredsModal() {
        const gh = prompt("Enter Default GitHub Personal Access Token (or leave blank):");
        const rn = prompt("Enter Default Render API Key (or leave blank):");
        if (gh === null && rn === null) return;
        fetch("/api/settings/credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ githubToken: gh, renderApiKey: rn })
        }).then(res => {
          if (res.ok) window.location.reload();
          else showToast("Failed to update credentials", "error");
        });
      }
    </script>
  `;

  return renderPageShell({
    title: "API Keys - Krix",
    activeTab: "api",
    content,
    owner: params.owner,
  });
}
