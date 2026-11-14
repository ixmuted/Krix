// FileStore Repository Page
// Contract Invariants: "Total Stored Files", "Storage Used", "Permanent Files", "Expiring Files",
// id="valTotalFiles", id="valTotalBytes", id="valPermanentFiles", id="valExpiringFiles",
// "Cloud Store", "Sandbox", "Permanent", "Copy URL", "Download File", "openDeleteFileModal",
// "togglePermanent", "kebab-btn", "kebab-dropdown", "Revert", "Keep", "Authentication Required", "returnTo=%2Fstore"

import {
  renderPageShell,
  escapeHtml,
  formatBytes,
  renderKebabMenu,
} from "../components.js";
import { renderAuthRequiredCard } from "./authCard.js";
import { renderSvg } from "../icons.js";

const FILE_TYPES: Array<[RegExp, string, string]> = [
  [/\.(png|jpe?g|gif|webp|svg|bmp|ico|avif|heic)$/i, "file-image", "#a78bfa"],
  [/\.(zip|tar|gz|tgz|bz2|xz|7z|rar)$/i, "file-archive", "#f0b429"],
  [/\.(csv|tsv|xlsx?|parquet|ods)$/i, "file-sheet", "#34c38f"],
  [/\.(mp3|wav|flac|ogg|m4a|aac)$/i, "file-audio", "#f472b6"],
  [/\.(mp4|mov|mkv|webm|avi)$/i, "file-video", "#fb7185"],
  [/\.(pdf)$/i, "file-text", "#ef6b5f"],
  [
    /\.(js|jsx|ts|tsx|py|rb|go|rs|java|c|h|cpp|cs|php|sh|sql|json|ya?ml|toml|html|css|md|xml|ipynb)$/i,
    "file-code",
    "#5b8def",
  ],
];

/** A tinted tile with an icon that matches the file type (by extension). */
function fileTile(name: string, tile: number, icon: number): string {
  const hit = FILE_TYPES.find(([re]) => re.test(name));
  const iconName = hit ? hit[1] : "file-text";
  const hue = hit ? hit[2] : "#94a3b8";
  return `<span style="display:inline-flex; align-items:center; justify-content:center; width:${tile}px; height:${tile}px; flex:0 0 ${tile}px; border-radius:${Math.round(tile / 3.2)}px; color:${hue}; background:color-mix(in srgb, ${hue} 14%, transparent); border:1px solid color-mix(in srgb, ${hue} 28%, transparent);">${renderSvg(iconName, icon)}</span>`;
}

function statIconTile(iconName: string): string {
  return `<span style="display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:9px; color:var(--fg); background:var(--bg-surface-2); border:1px solid var(--border-subtle);">${renderSvg(iconName, 16)}</span>`;
}

export function renderStorePage(params: {
  base: string;
  isOwner?: boolean;
  owner?: any;
  files?: any[];
  stats?: any;
  usage?: any;
}): string {
  const isOwner = Boolean(params.isOwner);

  if (!isOwner) {
    return renderPageShell({
      title: "Store",
      activeTab: "store",
      owner: null,
      content: renderAuthRequiredCard(
        "Store",
        "You must sign in as the verified service owner or authenticate with your MCP API key to access the FileStore repository.",
        "/store",
      ),
    });
  }

  const files = Array.isArray(params.files) ? params.files : [];
  const usage = params.usage || {};
  const totalFiles =
    typeof usage.count === "number" ? usage.count : files.length;
  const totalBytes =
    typeof usage.bytes === "number"
      ? usage.bytes
      : files.reduce((acc, f) => acc + (f.size || 0), 0);
  const permanentCount =
    typeof usage.permanentCount === "number"
      ? usage.permanentCount
      : files.filter((f) => !!f.permanent).length;
  const expiringCount =
    typeof usage.expiredCount === "number"
      ? usage.expiredCount
      : files.filter((f) => !f.permanent).length;

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

      <div style="display:flex; gap:10px;">
        <a href="/upload" class="btn primary deploy-btn" style="border-radius:var(--radius-full); gap:8px;">
          ${renderSvg("upload", 15)}
          <span>Upload Files</span>
        </a>
      </div>
    </div>

    <!-- Storage Telemetry Metrics Cards -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:16px; margin-bottom:24px;">
      <div class="card spotlight-card card-top-border" style="padding:18px 20px;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;"><div style="font-size:11px; color:var(--geist-gray-50); font-weight:600; text-transform:uppercase; letter-spacing:0.05em;">Total Stored Files</div>${statIconTile("folder")}</div>
        <div id="valTotalFiles" style="font-size:22px; font-weight:700; font-family:var(--font-mono); color:var(--fg); margin-top:6px;">${totalFiles}</div>
        <div style="font-size:11px; color:var(--geist-gray-50); margin-top:4px;">Registered repository objects</div>
      </div>

      <div class="card spotlight-card card-top-border" style="padding:18px 20px;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;"><div style="font-size:11px; color:var(--geist-gray-50); font-weight:600; text-transform:uppercase; letter-spacing:0.05em;">Storage Used</div>${statIconTile("database")}</div>
        <div id="valTotalBytes" style="font-size:22px; font-weight:700; font-family:var(--font-mono); color:var(--fg); margin-top:6px;">${formatBytes(totalBytes)}</div>
        <div style="font-size:11px; color:var(--geist-gray-50); margin-top:4px;">Current storage consumed</div>
      </div>

      <div class="card spotlight-card card-top-border" style="padding:18px 20px;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;"><div style="font-size:11px; color:var(--geist-gray-50); font-weight:600; text-transform:uppercase; letter-spacing:0.05em;">Permanent Files</div>${statIconTile("shield-check")}</div>
        <div id="valPermanentFiles" style="font-size:22px; font-weight:700; font-family:var(--font-mono); color:var(--fg); margin-top:6px;">${permanentCount}</div>
        <div style="font-size:11px; color:var(--geist-gray-50); margin-top:4px;">Protected from auto-cleanup</div>
      </div>

      <div class="card spotlight-card card-top-border" style="padding:18px 20px;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;"><div style="font-size:11px; color:var(--geist-gray-50); font-weight:600; text-transform:uppercase; letter-spacing:0.05em;">Expiring Files</div>${statIconTile("clock")}</div>
        <div id="valExpiringFiles" style="font-size:22px; font-weight:700; font-family:var(--font-mono); color:var(--fg); margin-top:6px;">${expiringCount}</div>
        <div style="font-size:11px; color:var(--geist-gray-50); margin-top:4px;">24h ephemeral lifecycle</div>
      </div>
    </div>

    <!-- Files Table Card -->
    <div class="card spotlight-card" style="padding:24px;">
      <div class="store-table-toolbar" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <h2 style="font-size:16px; font-weight:600; color:var(--fg);">Repository Objects</h2>
          <span class="badge" id="fileCountBadge">${files.length} items</span>
        </div>

        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <!-- List vs Grid View Toggle (Pure SVGs, No words) -->
          <div class="store-view-toggle" style="display:inline-flex; align-items:center; justify-content:center; height:34px; min-height:34px; background:var(--bg-surface-1); border:1px solid var(--border-medium); border-radius:var(--radius-full); padding:3px; gap:2px; box-sizing:border-box;">
            <button type="button" id="viewListBtn" class="nav-pill active" onclick="setStoreView('list')" title="List View" style="padding:4px 10px; height:26px; font-size:11px; border-radius:var(--radius-full); display:inline-flex; align-items:center; justify-content:center;">
              ${renderSvg("rows", 14)}
            </button>
            <button type="button" id="viewGridBtn" class="nav-pill" onclick="setStoreView('grid')" title="Grid View" style="padding:4px 10px; height:26px; font-size:11px; border-radius:var(--radius-full); display:inline-flex; align-items:center; justify-content:center;">
              ${renderSvg("grid", 14)}
            </button>
          </div>

          <div class="krix-pill-search search-bar-responsive" style="display:flex; align-items:center; gap:8px; background:var(--bg-surface-1); border:1px solid var(--border-medium); border-radius:var(--radius-full); padding:0 14px; height:34px; min-height:34px; min-width:0; flex:1 1 240px; max-width:100%; box-sizing:border-box;">
            ${renderSvg("search", 14, "text-muted")}
            <input
              type="text"
              id="storeSearchInput"
              placeholder="Search repository files"
              oninput="filterStoreFiles()"
              style="border:none; background:transparent; font-size:12px; color:var(--fg); outline:none; width:100%;"
            >
          </div>
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table id="storeTable" style="width:100%; border-collapse:collapse; font-size:13px; text-align:left;">
          <thead>
            <tr style="border-bottom:1px solid var(--border-subtle); color:var(--geist-gray-50); font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">
              <th style="padding:10px 12px; font-weight:600;">Filename</th>
              <th style="padding:10px 12px; font-weight:600;">Source</th>
              <th style="padding:10px 12px; font-weight:600;">Size</th>
              <th style="padding:10px 12px; font-weight:600;">Retention</th>
              <th style="padding:10px 12px; font-weight:600;">Visibility</th>
              <th style="padding:10px 12px; font-weight:600;">Uploaded</th>
              <th style="padding:10px 12px; font-weight:600; text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              files.length === 0
                ? `<tr><td colspan="7" style="text-align:center; padding:44px 20px; color:var(--geist-gray-50);">FileStore repository is empty. Use the Ingestion Workbench to upload datasets.</td></tr>`
                : files
                    .map((file, idx) => {
                      const fId = escapeHtml(file.id || `file_${idx}`);
                      const fName = escapeHtml(
                        file.name || file.filename || `file_${idx}`,
                      );
                      const fSize = formatBytes(file.size || 0);
                      const isPermanent = !!file.permanent;
                      const isPublic = !!file.isPublic;
                      const isOwned = file.isOwned !== false;
                      const source =
                        file.source === "sandbox" ? "sandbox" : "store";
                      const downloadUrl = file.downloadUrl
                        ? file.downloadUrl
                        : source === "sandbox"
                          ? `/store/download?file=${encodeURIComponent(fName)}`
                          : `/store/download/${encodeURIComponent(fId)}`;
                      const menuId = `menu_${fId.replace(/[^a-zA-Z0-9_-]/g, "_")}_${idx}`;

                      const kebabItems: Array<{
                        label: string;
                        icon: string;
                        onclick?: string;
                        href?: string;
                        danger?: boolean;
                      }> = [
                        {
                          label: "Copy URL",
                          icon: "copy",
                          onclick: `copyStoreUrl('${escapeHtml(downloadUrl)}')`,
                        },
                        {
                          label: "Download File",
                          icon: "download",
                          href: downloadUrl,
                        },
                      ];

                      if (isOwned) {
                        kebabItems.push(
                          isPermanent
                            ? {
                                label: "Revert",
                                icon: "clock",
                                onclick: `togglePermanent('${fId}', false)`,
                              }
                            : {
                                label: "Keep",
                                icon: "shield",
                                onclick: `togglePermanent('${fId}', true)`,
                              },
                          {
                            label: "Toggle Privacy",
                            icon: "lock",
                            onclick: `toggleFilePrivacy('${fId}')`,
                          },
                          {
                            label: "Rename",
                            icon: "edit",
                            onclick: `openRenameFileModal('${fId}', '${fName}', '${source}')`,
                          },
                          {
                            label: "Delete",
                            icon: "trash",
                            onclick: `openDeleteFileModal('${fId}', '${fName}', '${source}')`,
                            danger: true,
                          },
                        );
                      }

                      return `
                  <tr class="store-row" data-name="${fName.toLowerCase()}" style="border-bottom:1px solid var(--border-subtle);">
                    <td style="padding:12px;">
                      <div style="display:flex; align-items:center; gap:8px;">
                        ${fileTile(fName, 30, 16)}
                        <span style="font-weight:600; font-family:var(--font-mono); color:var(--fg);">${fName}</span>
                      </div>
                    </td>
                    <td style="padding:12px;">
                      ${
                        source === "sandbox"
                          ? `<span class="badge" style="display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:var(--radius-full); font-size:11px; background:var(--bg-surface-2); color:var(--geist-gray-50); font-weight:500;">Sandbox</span>`
                          : `<span class="badge" style="display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:var(--radius-full); font-size:11px; background:var(--accent-subtle); color:var(--accent); font-weight:500;">Cloud Store</span>`
                      }
                    </td>
                    <td style="padding:12px; font-family:var(--font-mono); color:var(--geist-gray-50); font-size:12px;">${fSize}</td>
                    <td style="padding:12px;">
                      ${
                        isPermanent
                          ? `<span class="badge permanent-badge" style="display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:var(--radius-full); font-size:11px; background:var(--success-subtle); color:var(--success); font-weight:500;">Permanent</span>`
                          : `<span class="badge" style="display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:var(--radius-full); font-size:11px; background:var(--bg-surface-2); color:var(--geist-gray-50); font-weight:500;">24h Ephemeral</span>`
                      }
                    </td>
                    <td style="padding:12px;">
                      ${
                        isPublic
                          ? `<span class="badge" style="display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:var(--radius-full); font-size:11px; background:var(--success-subtle); color:var(--success); font-weight:500;">Public</span>`
                          : `<span class="badge" style="display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:var(--radius-full); font-size:11px; background:var(--bg-surface-2); color:var(--geist-gray-50); font-weight:500;">Private</span>`
                      }
                    </td>
                    <td style="padding:12px; font-size:11px; color:var(--geist-gray-50); font-family:var(--font-mono);">${escapeHtml(String(file.createdAt || "Recent").slice(0, 16))}</td>
                    <td style="padding:12px; text-align:right;">
                      <div style="display:inline-flex; align-items:center; gap:6px;">
                        <button type="button" class="btn ghost" onclick="copyStoreUrl('${escapeHtml(downloadUrl)}')" style="padding:4px 8px; font-size:12px;" title="Copy URL">
                          ${renderSvg("copy", 14)}
                          <span>Copy URL</span>
                        </button>
                        <a href="${downloadUrl}" class="btn ghost" style="padding:4px 8px; font-size:12px;" download title="Download File">
                          ${renderSvg("download", 14)}
                          <span>Download</span>
                        </a>
                        ${renderKebabMenu(kebabItems, menuId)}
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

      <!-- Grid View Alternative (Pure SVG Toggled) -->
      <div id="storeGrid" style="display:none; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:14px; margin-top:14px;">
        ${files
          .map((file, idx) => {
            const fId = escapeHtml(file.id || `file_${idx}`);
            const fName = escapeHtml(
              file.name || file.filename || `file_${idx}`,
            );
            const fSize = formatBytes(file.size || 0);
            const isPermanent = !!file.permanent;
            const isPublic = !!file.isPublic;
            const isOwned = file.isOwned !== false;
            const source = file.source === "sandbox" ? "sandbox" : "store";
            const downloadUrl = file.downloadUrl
              ? file.downloadUrl
              : source === "sandbox"
                ? `/store/download?file=${encodeURIComponent(fName)}`
                : `/store/download/${encodeURIComponent(fId)}`;
            const gridMenuId = `grid_menu_${fId.replace(/[^a-zA-Z0-9_-]/g, "_")}_${idx}`;
            const kebabItems: Array<{
              label: string;
              icon: string;
              onclick?: string;
              href?: string;
              danger?: boolean;
            }> = [
              {
                label: "Copy URL",
                icon: "copy",
                onclick: `copyStoreUrl('${escapeHtml(downloadUrl)}')`,
              },
              { label: "Download File", icon: "download", href: downloadUrl },
            ];

            if (isOwned) {
              kebabItems.push(
                isPermanent
                  ? {
                      label: "Revert",
                      icon: "clock",
                      onclick: `togglePermanent('${fId}', false)`,
                    }
                  : {
                      label: "Keep",
                      icon: "shield",
                      onclick: `togglePermanent('${fId}', true)`,
                    },
                {
                  label: "Toggle Privacy",
                  icon: "lock",
                  onclick: `toggleFilePrivacy('${fId}')`,
                },
                {
                  label: "Rename",
                  icon: "edit",
                  onclick: `openRenameFileModal('${fId}', '${fName}', '${source}')`,
                },
                {
                  label: "Delete",
                  icon: "trash",
                  onclick: `openDeleteFileModal('${fId}', '${fName}', '${source}')`,
                  danger: true,
                },
              );
            }
            return `
              <div class="store-grid-card card spotlight-card" data-name="${fName.toLowerCase()}" style="padding:16px; display:flex; flex-direction:column; gap:10px; border-radius:var(--radius-md); background:var(--bg-surface-1); border:1px solid var(--border-subtle); position:relative; overflow:visible;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                  <div style="display:flex; align-items:center; gap:8px; min-width:0; flex:1;">
                    ${fileTile(fName, 34, 17)}
                    <div style="font-weight:600; font-family:var(--font-mono); font-size:13px; color:var(--fg); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" title="${fName}">${fName}</div>
                  </div>
                  ${renderKebabMenu(kebabItems, gridMenuId)}
                </div>
                <div style="display:flex; align-items:center; justify-content:space-between; font-size:11px; color:var(--geist-gray-50); font-family:var(--font-mono); margin-top:auto; padding-top:6px; border-top:1px solid var(--border-subtle); gap:6px;">
                  <span>${fSize}</span>
                  <div style="display:inline-flex; align-items:center; gap:6px;">
                    <span class="badge" style="padding:1px 6px; font-size:10px; border-radius:var(--radius-full); ${isPublic ? "background:var(--success-subtle); color:var(--success);" : "background:var(--bg-surface-2); color:var(--geist-gray-50);"}">${isPublic ? "Public" : "Private"}</span>
                    <span class="badge" style="padding:1px 6px; font-size:10px; border-radius:var(--radius-full); ${isPermanent ? "background:var(--success-subtle); color:var(--success);" : "background:var(--bg-surface-2); color:var(--geist-gray-50);"}">${isPermanent ? "Permanent" : "24h Ephemeral"}</span>
                  </div>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>

      <!-- Pagination Bar -->
      <div id="storePagination" style="display:flex; justify-content:space-between; align-items:center; padding:16px 4px 0; border-top:1px solid var(--border-subtle); margin-top:16px; font-size:12px; color:var(--geist-gray-50); flex-wrap:wrap; gap:10px;">
        <div id="pageInfo">Showing 1-${Math.min(files.length, 10)} of ${files.length} items</div>
        <div style="display:flex; align-items:center; gap:6px;">
          <button type="button" class="pager-btn pager-prev" id="prevPageBtn" onclick="changeStorePage(-1)" aria-label="Previous page">${renderSvg("chevron-left", 16)}<span>Previous</span></button>
          <span id="pageIndicator" style="font-family:var(--font-mono); font-size:11px; padding:0 6px;">1</span>
          <button type="button" class="pager-btn pager-next" id="nextPageBtn" onclick="changeStorePage(1)" aria-label="Next page"><span>Next</span>${renderSvg("chevron-right", 16)}</button>
        </div>
      </div>
    </div>

    <!-- Rename File Modal Dialog -->
    <div id="renameFileModal" class="modal-backdrop" hidden role="dialog" aria-modal="true" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); z-index:var(--z-modal); display:none; align-items:center; justify-content:center;">
      <div class="modal-card card spotlight-card" style="max-width:420px; width:92%; padding:24px;">
        <h3 style="font-size:16px; font-weight:700; color:var(--fg); margin-bottom:8px;">Rename File</h3>
        <p style="font-size:13px; color:var(--geist-gray-50); margin-bottom:16px;">Enter a new name for this object in your repository.</p>
        <input type="hidden" id="renameFileId">
        <input type="hidden" id="renameFileSource">
        <div style="margin-bottom:20px;">
          <label for="newFileNameInput" style="display:block; font-size:12px; font-weight:600; color:var(--geist-gray-50); margin-bottom:6px;">File Name</label>
          <input type="text" id="newFileNameInput" class="form-input" style="width:100%; padding:8px 12px; border-radius:var(--radius-md); border:1px solid var(--border-medium); background:var(--bg-surface-1); color:var(--fg); font-family:var(--font-mono); font-size:13px; outline:none;">
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button type="button" class="btn" onclick="closeRenameFileModal()">Cancel</button>
          <button type="button" class="btn primary" onclick="submitRenameFile()">Save Name</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal Dialog -->
    <div id="deleteFileModal" class="modal-backdrop" hidden role="dialog" aria-modal="true" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); z-index:var(--z-modal); display:none; align-items:center; justify-content:center;">
      <div class="modal-card card spotlight-card" style="max-width:400px; width:92%; padding:24px;">
        <h3 style="font-size:16px; font-weight:700; color:var(--fg); margin-bottom:8px;">Delete File</h3>
        <p id="deleteModalMessage" style="font-size:13px; color:var(--geist-gray-50); margin-bottom:20px; line-height:1.5;">Are you sure you want to permanently delete this file?</p>
        <input type="hidden" id="deleteFileId">
        <input type="hidden" id="deleteFileName">
        <input type="hidden" id="deleteFileSource">
        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button type="button" class="btn" onclick="closeDeleteFileModal()">Cancel</button>
          <button type="button" id="confirmDeleteFileBtn" class="btn" onclick="submitDeleteFile()" style="background:var(--error); color:#fff; border-color:var(--error);">Delete</button>
        </div>
      </div>
    </div>

    <!-- Toast Notification Container -->
    <div id="toastContainer" class="toast-container" aria-live="polite"></div>

    <script>
      let currentStoreView = 'list';
      let currentStorePage = 1;
      const storePageSize = 10;

      function setStoreView(mode) {
        currentStoreView = mode;
        const table = document.getElementById('storeTable');
        const grid = document.getElementById('storeGrid');
        const listBtn = document.getElementById('viewListBtn');
        const gridBtn = document.getElementById('viewGridBtn');

        if (mode === 'grid') {
          if (table) table.parentElement.style.display = 'none';
          if (grid) grid.style.display = 'grid';
          listBtn?.classList.remove('active');
          gridBtn?.classList.add('active');
        } else {
          if (table) table.parentElement.style.display = '';
          if (grid) grid.style.display = 'none';
          listBtn?.classList.add('active');
          gridBtn?.classList.remove('active');
        }
        applyStorePagination();
      }

      function changeStorePage(delta) {
        const totalItems = document.querySelectorAll('.store-row').length;
        const maxPage = Math.max(1, Math.ceil(totalItems / storePageSize));
        const newPage = currentStorePage + delta;
        if (newPage >= 1 && newPage <= maxPage) {
          currentStorePage = newPage;
          applyStorePagination();
        }
      }

      function applyStorePagination() {
        const rows = Array.from(document.querySelectorAll('.store-row'));
        const cards = Array.from(document.querySelectorAll('.store-grid-card'));
        const total = rows.length;
        const maxPage = Math.max(1, Math.ceil(total / storePageSize));
        if (currentStorePage > maxPage) currentStorePage = maxPage;

        const start = (currentStorePage - 1) * storePageSize;
        const end = start + storePageSize;

        rows.forEach((r, idx) => {
          r.style.display = (idx >= start && idx < end) ? '' : 'none';
        });
        cards.forEach((c, idx) => {
          c.style.display = (idx >= start && idx < end) ? 'flex' : 'none';
        });

        const pageInfo = document.getElementById('pageInfo');
        if (pageInfo) {
          pageInfo.textContent = 'Showing ' + (total === 0 ? 0 : start + 1) + '-' + Math.min(end, total) + ' of ' + total + ' items';
        }
        const indicator = document.getElementById('pageIndicator');
        if (indicator) indicator.textContent = currentStorePage + ' / ' + maxPage;

        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        if (prevBtn) prevBtn.disabled = currentStorePage <= 1;
        if (nextBtn) nextBtn.disabled = currentStorePage >= maxPage;
      }

      function filterStoreFiles() {
        const query = (document.getElementById('storeSearchInput')?.value || '').toLowerCase();
        document.querySelectorAll('.store-row').forEach(row => {
          const name = row.getAttribute('data-name') || '';
          row.style.display = name.includes(query) ? '' : 'none';
        });
        document.querySelectorAll('.store-grid-card').forEach(card => {
          const name = card.getAttribute('data-name') || '';
          card.style.display = name.includes(query) ? 'flex' : 'none';
        });
      }

      document.addEventListener('DOMContentLoaded', () => {
        applyStorePagination();
      });

      function copyStoreUrl(url) {
        const fullUrl = url.startsWith('http') ? url : window.location.origin + url;
        navigator.clipboard.writeText(fullUrl).then(() => {
          if (window.showToast) window.showToast('Download link copied to clipboard', 'success');
        }).catch(() => {
          if (window.showToast) window.showToast('Failed to copy download link', 'error');
        });
      }

      function togglePermanent(fileId, makePermanent) {
        const endpoint = makePermanent
          ? '/store/permanent/' + encodeURIComponent(fileId)
          : '/store/revert-permanent/' + encodeURIComponent(fileId);

        fetch(endpoint, { method: 'POST' })
          .then(res => res.json())
          .then(data => {
            if (data && data.success) {
              if (window.showToast) window.showToast(makePermanent ? 'File marked as permanent' : 'Retention reverted to 24h', 'success');
              setTimeout(() => window.location.reload(), 500);
            } else {
              if (window.showToast) window.showToast(data.error || 'Failed to update retention', 'error');
            }
          })
          .catch(err => {
            if (window.showToast) window.showToast('Network error: ' + err.message, 'error');
          });
      }

      function toggleFilePrivacy(fileId) {
        fetch('/store/files/' + encodeURIComponent(fileId) + '/privacy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
          .then(res => res.json())
          .then(data => {
            if (data && data.success) {
              const status = data.isPublic ? 'public' : 'private';
              if (window.showToast) window.showToast('File is now ' + status, 'success');
              setTimeout(() => window.location.reload(), 500);
            } else {
              if (window.showToast) window.showToast('Failed to update privacy', 'error');
            }
          })
          .catch(err => {
            if (window.showToast) window.showToast('Network error: ' + err.message, 'error');
          });
      }

      function openRenameFileModal(id, currentName, source) {
        document.getElementById('renameFileId').value = id;
        document.getElementById('renameFileSource').value = source || 'store';
        const input = document.getElementById('newFileNameInput');
        if (input) input.value = currentName;
        const modal = document.getElementById('renameFileModal');
        if (modal) {
          modal.hidden = false;
          modal.style.display = 'flex';
          setTimeout(() => input?.focus(), 50);
        }
      }

      function closeRenameFileModal() {
        const modal = document.getElementById('renameFileModal');
        if (modal) {
          modal.hidden = true;
          modal.style.display = 'none';
        }
      }

      function submitRenameFile() {
        const id = document.getElementById('renameFileId')?.value;
        const source = document.getElementById('renameFileSource')?.value;
        const newName = document.getElementById('newFileNameInput')?.value?.trim();
        if (!newName) {
          if (window.showToast) window.showToast('File name cannot be empty', 'error');
          return;
        }

        const endpoint = source === 'sandbox'
          ? '/upload/rename'
          : '/store/files/' + encodeURIComponent(id) + '/rename';

        const body = source === 'sandbox'
          ? JSON.stringify({ oldName: id, newName: newName })
          : JSON.stringify({ name: newName });

        fetch(endpoint, {
          method: source === 'sandbox' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: body
        })
          .then(res => res.json())
          .then(data => {
            if (data && data.success) {
              if (window.showToast) window.showToast('File renamed successfully', 'success');
              closeRenameFileModal();
              setTimeout(() => window.location.reload(), 500);
            } else {
              if (window.showToast) window.showToast(data.error || 'Failed to rename file', 'error');
            }
          })
          .catch(err => {
            if (window.showToast) window.showToast('Network error: ' + err.message, 'error');
          });
      }

      function openDeleteFileModal(id, name, source) {
        document.getElementById('deleteFileId').value = id;
        document.getElementById('deleteFileName').value = name;
        document.getElementById('deleteFileSource').value = source || 'store';
        const msg = document.getElementById('deleteModalMessage');
        if (msg) msg.textContent = 'Are you sure you want to permanently delete ' + name + '?';
        const modal = document.getElementById('deleteFileModal');
        if (modal) {
          modal.hidden = false;
          modal.style.display = 'flex';
        }
      }

      function closeDeleteFileModal() {
        const modal = document.getElementById('deleteFileModal');
        if (modal) {
          modal.hidden = true;
          modal.style.display = 'none';
        }
      }

      function submitDeleteFile() {
        const id = document.getElementById('deleteFileId')?.value;
        const name = document.getElementById('deleteFileName')?.value;
        const source = document.getElementById('deleteFileSource')?.value;

        const endpoint = source === 'sandbox'
          ? '/store/sandbox-file?name=' + encodeURIComponent(name)
          : '/store/files/' + encodeURIComponent(id);

        fetch(endpoint, { method: 'DELETE' })
          .then(res => res.json())
          .then(data => {
            if (data && data.success) {
              if (window.showToast) window.showToast('File deleted successfully', 'success');
              closeDeleteFileModal();
              setTimeout(() => window.location.reload(), 500);
            } else {
              if (window.showToast) window.showToast(data.error || 'Failed to delete file', 'error');
            }
          })
          .catch(err => {
            if (window.showToast) window.showToast('Network error: ' + err.message, 'error');
          });
      }
    </script>
  `;

  return renderPageShell({
    title: "Krix",
    activeTab: "store",
    content,
    owner: params.owner,
  });
}
