// Key-Specific Scoping & Tool Permissions Configuration Page
// Route: /api/settings?key=<id>

import { renderPageShell, escapeHtml } from "../components.js";
import { renderSvg } from "../icons.js";

export function renderApiKeySettingsPage(params: {
  base: string;
  isOwner?: boolean;
  owner?: any;
  key: any;
  toolsCatalog: any[];
  keySettings: any;
}): string {
  const key = params.key || {};
  const keyId = escapeHtml(key.id || "");
  const keyName = escapeHtml(
    key.label || key.name || `Key ${keyId.slice(0, 4)}`,
  );
  const tools = Array.isArray(params.toolsCatalog) ? params.toolsCatalog : [];
  const settings = params.keySettings || {};
  const enabledTools = Array.isArray(settings.enabledTools)
    ? settings.enabledTools
    : [];

  const content = `
    <!-- Top Header Deck -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; flex-wrap:wrap; gap:16px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px;">
          <a href="/api" style="font-size:12px; color:var(--geist-gray-50); display:flex; align-items:center; gap:4px;">
            &larr; <span>Back to API Keys</span>
          </a>
        </div>
        <h1 style="font-size:24px; font-weight:700; letter-spacing:-0.03em; color:var(--fg); margin-top:8px;">
          Configure Key: ${keyName}
        </h1>
        <p style="font-size:13px; color:var(--geist-gray-50); margin-top:2px; font-family:var(--font-mono);">
          Key ID: ${keyId}
        </p>
      </div>

      <button type="button" class="btn primary deploy-btn" onclick="saveKeySettings()" style="border-radius:var(--radius-full); padding:9px 20px;">
        Save Changes
      </button>
    </div>

    <!-- Key Credential Overrides Card -->
    <div class="card spotlight-card card-top-border" style="padding:24px; margin-bottom:24px;">
      <h2 style="font-size:16px; font-weight:600; color:var(--fg); margin-bottom:6px;">Credential Overrides</h2>
      <p style="font-size:12px; color:var(--geist-gray-50); margin-bottom:16px;">
        Override global profile credentials specifically for requests authenticated by this key.
      </p>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">
        <div>
          <label style="display:block; font-size:12px; font-weight:600; color:var(--fg); margin-bottom:6px;">Custom GitHub Token</label>
          <input type="password" id="customGithubToken" placeholder="Leave blank to inherit profile default" value="${escapeHtml(settings.githubToken || "")}" style="width:100%; padding:9px 12px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md); font-size:13px; color:var(--fg); font-family:var(--font-mono);">
        </div>

        <div>
          <label style="display:block; font-size:12px; font-weight:600; color:var(--fg); margin-bottom:6px;">Custom Render API Key</label>
          <input type="password" id="customRenderKey" placeholder="Leave blank to inherit profile default" value="${escapeHtml(settings.renderApiKey || "")}" style="width:100%; padding:9px 12px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md); font-size:13px; color:var(--fg); font-family:var(--font-mono);">
        </div>
      </div>
    </div>

    <!-- Tool Permission Matrix Card -->
    <div class="card spotlight-card" style="padding:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
        <div>
          <h2 style="font-size:16px; font-weight:600; color:var(--fg);">Tool Permission Matrix</h2>
          <p style="font-size:12px; color:var(--geist-gray-50); margin-top:2px;">Enable or restrict specific tools for this key token</p>
        </div>

        <input type="text" placeholder="Filter tools" oninput="filterToolPermissions(this.value)" style="padding:6px 14px; font-size:12px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-full); width:200px; color:var(--fg);">
      </div>

      <div style="max-height:440px; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">
        ${
          tools.length === 0
            ? `<div style="text-align:center; padding:32px; color:var(--geist-gray-50);">No tools available.</div>`
            : tools
                .map((tool) => {
                  const tName = escapeHtml(tool.name);
                  const isChecked =
                    enabledTools.length === 0 ||
                    enabledTools.includes(tool.name);
                  return `
              <div class="perm-tool-row" style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-radius:var(--radius-md); background:var(--bg-surface-1); border:1px solid var(--border-subtle);">
                <div>
                  <div style="font-size:13px; font-weight:600; font-family:var(--font-mono); color:var(--fg);">${tName}</div>
                  <div style="font-size:11px; color:var(--geist-gray-50);">${escapeHtml(tool.category || "General")}</div>
                </div>

                <label style="cursor:pointer;">
                  <input type="checkbox" class="tool-perm-check" value="${tName}" ${isChecked ? "checked" : ""} style="width:16px; height:16px; accent-color:var(--success);">
                </label>
              </div>
            `;
                })
                .join("")
        }
      </div>
    </div>

    <script>
      function filterToolPermissions(q) {
        const query = q.toLowerCase();
        document.querySelectorAll('.perm-tool-row').forEach(row => {
          row.style.display = row.textContent.toLowerCase().includes(query) ? 'flex' : 'none';
        });
      }

      function saveKeySettings() {
        const gh = document.getElementById('customGithubToken').value;
        const rn = document.getElementById('customRenderKey').value;
        const checks = document.querySelectorAll('.tool-perm-check:checked');
        const enabled = Array.from(checks).map(c => c.value);

        fetch('/api/keys/${keyId}/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            githubToken: gh,
            renderApiKey: rn,
            enabledTools: enabled
          })
        }).then(res => {
          if (res.ok) window.showToast('Settings saved successfully', 'success');
          else window.showToast('Failed to save settings', 'error');
        });
      }
    </script>
  `;

  return renderPageShell({
    title: `Configure ${keyName} - Krix`,
    activeTab: "api",
    content,
    owner: params.owner,
  });
}
