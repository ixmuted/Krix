// FileStore Repository Page
// Contract Invariants: Files table, download links, permanent storage badges, dynamic counters

import { renderPageShell, escapeHtml, formatBytes } from "../components.js";
import { renderSvg } from "../icons.js";

export function renderStorePage(params: {
  base: string;
  isOwner?: boolean;
  owner?: any;
  files?: any[];
  stats?: any;
  usage?: any;
}): string {
  const files = Array.isArray(params.files) ? params.files : [];
  const stats = params.stats || {};
  const totalFiles = files.length;
  const totalBytes = stats.totalBytes || 0;

  const content = `
    <!-- Top Header Deck -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; flex-wrap:wrap; gap:16px;">
      <div>
        <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:var(--geist-gray-50);">DATASETS & ARTIFACTS</div>
        <h1 style="font-size:24px; font-weight:700; letter-spacing:-0.03em; color:var(--fg); margin-top:4px;">FileStore Repository</h1>
        <p style="font-size:13px; color:var(--geist-gray-50); margin-top:2px;">
          Persistent datasets, uploaded artifacts, and agent sandbox workspace files.
        </p>
      </div>

      <a href="/upload" class="btn primary deploy-btn" style="border-radius:var(--radius-full); gap:8px;">
        ${renderSvg("upload", 15)}
        <span>Upload Files</span>
      </a>
    </div>

    <!-- Storage Telemetry Chips -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:24px;">
      <div class="card spotlight-card card-top-border" style="padding:16px 20px;">
        <div style="font-size:11px; color:var(--geist-gray-50); font-weight:600; text-transform:uppercase;">Total Files</div>
        <div id="fileCountBadge" style="font-size:22px; font-weight:700; font-family:var(--font-mono); color:var(--fg); margin-top:4px;">${totalFiles}</div>
      </div>
      <div class="card spotlight-card card-top-border" style="padding:16px 20px;">
        <div style="font-size:11px; color:var(--geist-gray-50); font-weight:600; text-transform:uppercase;">Storage Consumed</div>
        <div id="storageConsumedBadge" style="font-size:22px; font-weight:700; font-family:var(--font-mono); color:var(--fg); margin-top:4px;">${formatBytes(totalBytes)}</div>
      </div>
    </div>

    <!-- Files Table Card -->
    <div class="card spotlight-card" style="padding:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h2 style="font-size:16px; font-weight:600; color:var(--fg);">Repository Files</h2>
        <span style="font-size:12px; color:var(--geist-gray-50); font-family:var(--font-mono);">${totalFiles} Objects</span>
      </div>

      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:13px; text-align:left;">
          <thead>
            <tr style="border-bottom:1px solid var(--border-subtle); color:var(--geist-gray-50); font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">
              <th style="padding:10px 12px; font-weight:600;">Filename</th>
              <th style="padding:10px 12px; font-weight:600;">Size</th>
              <th style="padding:10px 12px; font-weight:600;">Retention</th>
              <th style="padding:10px 12px; font-weight:600;">Uploaded</th>
              <th style="padding:10px 12px; font-weight:600; text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              files.length === 0
                ? `<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--geist-gray-50);">FileStore repository is empty. Use the Ingestion Workbench to upload datasets.</td></tr>`
                : files
                    .map((file, idx) => {
                      const fName = escapeHtml(
                        file.name || file.filename || `file_${idx}`,
                      );
                      const fSize = formatBytes(file.size || 0);
                      const isPermanent = !!file.permanent;
                      const downloadUrl = `/store/download/${encodeURIComponent(fName)}`;

                      return `
                  <tr style="border-bottom:1px solid var(--border-subtle);">
                    <td style="padding:12px;">
                      <div style="display:flex; align-items:center; gap:8px;">
                        ${renderSvg("file-text", 16, "text-muted")}
                        <span style="font-weight:600; font-family:var(--font-mono); color:var(--fg);">${fName}</span>
                      </div>
                    </td>
                    <td style="padding:12px; font-family:var(--font-mono); color:var(--geist-gray-50);">${fSize}</td>
                    <td style="padding:12px;">
                      ${
                        isPermanent
                          ? `<span class="badge permanent-badge" style="display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:var(--radius-full); font-size:11px; background:var(--success-subtle); color:var(--success); font-weight:500;">Permanent</span>`
                          : `<span class="badge" style="display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:var(--radius-full); font-size:11px; background:var(--bg-surface-2); color:var(--geist-gray-50); font-weight:500;">24h Ephemeral</span>`
                      }
                    </td>
                    <td style="padding:12px; font-size:11px; color:var(--geist-gray-50); font-family:var(--font-mono);">${escapeHtml(file.createdAt || "Recent")}</td>
                    <td style="padding:12px; text-align:right;">
                      <div style="display:inline-flex; align-items:center; gap:6px;">
                        <a href="${downloadUrl}" class="btn ghost" style="padding:4px 8px; font-size:12px;" download title="Download File">
                          ${renderSvg("download", 14)}
                          <span>Download</span>
                        </a>
                        <button type="button" class="btn ghost danger" onclick="deleteStoreFile('${fName}')" style="padding:4px;" title="Delete File">
                          ${renderSvg("trash", 14)}
                        </button>
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

    <script>
      function deleteStoreFile(filename) {
        if (!confirm("Permanently delete " + filename + "?")) return;
        fetch("/store/" + encodeURIComponent(filename), { method: "DELETE" })
          .then(res => {
            if (res.ok) window.location.reload();
            else window.showToast("Delete failed", "error");
          });
      }
    </script>
  `;

  return renderPageShell({
    title: "Store - Krix",
    activeTab: "store",
    content,
    owner: params.owner,
  });
}
