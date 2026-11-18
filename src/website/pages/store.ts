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

/** An icon tile that matches the file type (by extension). */
function fileTile(name: string, tile: number, icon: number): string {
  const hit = FILE_TYPES.find(([re]) => re.test(name));
  const iconName = hit ? hit[1] : "file-text";
  const hue = hit ? hit[2] : "#94a3b8";
  return `<span class="file-tile" style="width:${tile}px; height:${tile}px; flex-basis:${tile}px; color:${hue};">${renderSvg(iconName, icon)}</span>`;
}

function fileBadges(isPermanent: boolean, isPublic: boolean): string {
  return `<span class="badge store-visibility-badge${isPublic ? " success" : ""}">${isPublic ? "Public" : "Private"}</span> <span class="badge${isPermanent ? " success permanent-badge" : ""}">${isPermanent ? "Permanent" : "Temporary"}</span>`;
}

function truncateStoreFilename(name: string, maxChars: number): string {
  const raw = String(name || "");
  if (raw.length <= maxChars) return raw;
  return `${raw.slice(0, maxChars)}...`;
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
      title: "Files",
      activeTab: "store",
      owner: null,
      content: renderAuthRequiredCard(
        "Files",
        "You must sign in with your Google Account to access your Files.",
        "/store",
      ),
    });
  }

  const files = Array.isArray(params.files) ? params.files : [];
  const totalFiles = files.length;
  const totalBytes = files.reduce((acc, f) => acc + (Number(f.size) || 0), 0);
  const permanentCount = files.filter((f) => !!f.permanent).length;
  const expiringCount = files.filter((f) => !f.permanent).length;

  const content = `
    <div class="page-head">
      <div>
        <h1 class="page-title">Files</h1>
        <p class="page-sub">Uploaded files and the files your agent saves in its workspace.</p>
      </div>
      <div class="page-actions">
        <a href="/upload" class="btn primary">${renderSvg("upload", 16)}<span>Upload</span></a>
      </div>
    </div>

    <div class="stats" style="margin-bottom:16px;">
      <div class="stat"><div class="stat-label">Total Stored Files</div><div id="valTotalFiles" class="stat-value">${totalFiles}</div><div class="list-meta" style="margin-top:2px;">Registered repository objects</div></div>
      <div class="stat"><div class="stat-label">Storage Used</div><div id="valTotalBytes" class="stat-value">${formatBytes(totalBytes)}</div><div class="list-meta" style="margin-top:2px;">Current storage consumed</div></div>
      <div class="stat"><div class="stat-label">Permanent Files</div><div id="valPermanentFiles" class="stat-value">${permanentCount}</div><div class="list-meta" style="margin-top:2px;">Kept until you delete them</div></div>
      <div class="stat"><div class="stat-label">Expiring Files</div><div id="valExpiringFiles" class="stat-value">${expiringCount}</div><div class="list-meta" style="margin-top:2px;">Removed automatically</div></div>
    </div>

    <div class="panel flush" style="overflow:visible;">
      <div class="panel-head store-table-toolbar">
        <div class="cluster"><h2 class="panel-title">All files</h2><span class="badge" id="fileCountBadge">${files.length} items</span></div>
        <div class="cluster">
          <div class="store-view-toggle">
            <button type="button" id="viewListBtn" class="nav-pill active" onclick="setStoreView('list')" title="List view" aria-label="List view">${renderSvg("rows", 15)}</button>
            <button type="button" id="viewGridBtn" class="nav-pill" onclick="setStoreView('grid')" title="Grid view" aria-label="Grid view">${renderSvg("grid", 15)}</button>
          </div>
          <div class="search krix-pill-search">
            ${renderSvg("search", 15)}
            <input type="text" id="storeSearchInput" placeholder="Search files" aria-label="Search files" oninput="filterStoreFiles()">
          </div>
        </div>
      </div>

      <div class="store-view-body">
      <div class="table-wrap">
        <table id="storeTable">
          <thead><tr><th>Name</th><th class="hide-sm">Size</th><th class="hide-sm">Retention</th><th class="hide-sm">Visibility</th><th class="hide-sm">Uploaded</th><th style="text-align:right;"><span class="sr-only">Actions</span></th></tr></thead>
          <tbody>
            ${
              files.length === 0
                ? `<tr><td colspan="6" class="empty">No files yet. Upload files to see them here.</td></tr>`
                : files
                    .map((file, idx) => {
                      const fId = escapeHtml(file.id || `file_${idx}`);
                      const rawFileName = String(
                        file.name || file.filename || `file_${idx}`,
                      );
                      const fName = escapeHtml(rawFileName);
                      const displayFileName = escapeHtml(
                        truncateStoreFilename(rawFileName, 24),
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
                          ? `/store/download?file=${encodeURIComponent(rawFileName)}`
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
                            label: isPublic ? "Private" : "Public",
                            icon: isPublic ? "lock" : "unlock",
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
                  <tr class="store-row" data-file-id="${fId}" data-name="${fName.toLowerCase()}">
                    <td>
                      <div class="cluster" style="flex-wrap:nowrap;">
                        ${fileTile(rawFileName, 32, 16)}
                        <div style="min-width:0;">
                          <span class="store-file-name list-name mono" data-full-name="${fName}" title="${fName}" style="font-size:13px;">${displayFileName}</span>
                          <div class="meta-sm list-meta">${fSize} · ${isPermanent ? "Permanent" : "Temporary"} · <span class="store-visibility-badge">${isPublic ? "Public" : "Private"}</span></div>
                        </div>
                      </div>
                    </td>
                    <td class="text-muted mono hide-sm" style="font-size:13px;">${fSize}</td>
                    <td class="hide-sm">${isPermanent ? `<span class="badge success permanent-badge">Permanent</span>` : `<span class="badge">Temporary</span>`}</td>
                    <td class="hide-sm">${isPublic ? `<span class="badge success store-visibility-badge">Public</span>` : `<span class="badge store-visibility-badge">Private</span>`}</td>
                    <td class="text-muted hide-sm" style="font-size:13px;">${escapeHtml(String(file.createdAt || "Recent").slice(0, 16))}</td>
                    <td style="text-align:right;">${renderKebabMenu(kebabItems, menuId)}</td>
                  </tr>
                `;
                    })
                    .join("")
            }
          </tbody>
        </table>
      </div>

      <div id="storeGrid" class="store-grid" style="display:none;">
        ${
          files.length === 0
            ? `<div class="empty" style="grid-column:1 / -1;">No files yet. Upload files to see them here.</div>`
            : files
          .map((file, idx) => {
            const fId = escapeHtml(file.id || `file_${idx}`);
            const rawFileName = String(
              file.name || file.filename || `file_${idx}`,
            );
            const fName = escapeHtml(rawFileName);
            const displayFileName = escapeHtml(
              truncateStoreFilename(rawFileName, 24),
            );
            const fSize = formatBytes(file.size || 0);
            const isPermanent = !!file.permanent;
            const isPublic = !!file.isPublic;
            const isOwned = file.isOwned !== false;
            const source = file.source === "sandbox" ? "sandbox" : "store";
            const downloadUrl = file.downloadUrl
              ? file.downloadUrl
              : source === "sandbox"
                ? `/store/download?file=${encodeURIComponent(rawFileName)}`
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
                  label: isPublic ? "Private" : "Public",
                  icon: isPublic ? "lock" : "unlock",
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
              <div class="store-grid-card" data-file-id="${fId}" data-name="${fName.toLowerCase()}">
                <div class="cluster" style="justify-content:space-between; flex-wrap:nowrap; align-items:flex-start;">
                  <div class="cluster" style="min-width:0; flex-wrap:nowrap;">
                    ${fileTile(rawFileName, 36, 18)}
                    <div class="store-file-name list-name mono" data-full-name="${fName}" title="${fName}" style="font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${displayFileName}</div>
                  </div>
                  ${renderKebabMenu(kebabItems, gridMenuId)}
                </div>
                <div class="cluster" style="justify-content:space-between; margin-top:auto; padding-top:10px; border-top:1px solid var(--border-subtle); font-size:12px;">
                  <span class="text-muted">${fSize}</span>
                  <span class="cluster" style="gap:4px;">${fileBadges(isPermanent, isPublic)}</span>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
      </div>

      <div id="storePagination" class="pager" style="padding:16px 20px; border-top:1px solid var(--border-subtle);">
        <div id="pageInfo">Showing 1-${Math.min(files.length, 10)} of ${files.length} items</div>
        <div class="cluster">
          <button type="button" class="pager-btn pager-prev" id="prevPageBtn" onclick="changeStorePage(-1)" aria-label="Previous page">${renderSvg("chevron-left", 16)}<span>Previous</span></button>
          <span id="pageIndicator" class="mono" style="font-size:12px;">1</span>
          <button type="button" class="pager-btn pager-next" id="nextPageBtn" onclick="changeStorePage(1)" aria-label="Next page"><span>Next</span>${renderSvg("chevron-right", 16)}</button>
        </div>
      </div>
    </div>

    <div id="renameFileModal" class="modal-backdrop" hidden role="dialog" aria-modal="true" aria-labelledby="renameFileTitle">
      <div class="modal-card">
        <h3 class="modal-title" id="renameFileTitle">Rename file</h3>
        <input type="hidden" id="renameFileId">
        <input type="hidden" id="renameFileSource">
        <div class="modal-body">
          <div class="field"><label for="newFileNameInput">File name</label><input type="text" id="newFileNameInput" class="input mono form-input"></div>
        </div>
        <div class="modal-actions" style="margin-top:0;">
          <button type="button" class="btn" onclick="closeRenameFileModal()">Cancel</button>
          <button type="button" class="btn primary" onclick="submitRenameFile()">Save name</button>
        </div>
      </div>
    </div>

    <div id="deleteFileModal" class="modal-backdrop" hidden role="dialog" aria-modal="true" aria-labelledby="deleteFileTitle">
      <div class="modal-card">
        <h3 class="modal-title" id="deleteFileTitle">Delete file?</h3>
        <p id="deleteModalMessage" class="modal-text">This permanently deletes the file.</p>
        <input type="hidden" id="deleteFileId">
        <input type="hidden" id="deleteFileName">
        <input type="hidden" id="deleteFileSource">
        <div class="modal-actions">
          <button type="button" class="btn" onclick="closeDeleteFileModal()">Cancel</button>
          <button type="button" id="confirmDeleteFileBtn" class="btn danger" onclick="submitDeleteFile()">Delete</button>
        </div>
      </div>
    </div>

    <div id="toastContainer" class="toast-container" aria-live="polite"></div>

    <script>
      let currentStoreView = 'list';
      let currentStorePage = 1;
      function getStorePageSize() {
        return window.innerWidth <= 768 ? 10 : 24;
      }

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
        const query = (document.getElementById('storeSearchInput')?.value || '').toLowerCase().trim();
        const rows = Array.from(document.querySelectorAll('.store-row'));
        const totalItems = rows.filter(r => !query || (r.getAttribute('data-name') || '').includes(query)).length;
        const maxPage = Math.max(1, Math.ceil(totalItems / getStorePageSize()));
        const newPage = currentStorePage + delta;
        if (newPage >= 1 && newPage <= maxPage) {
          currentStorePage = newPage;
          applyStorePagination();
        }
      }

      function applyStorePagination() {
        const query = (document.getElementById('storeSearchInput')?.value || '').toLowerCase().trim();
        const rows = Array.from(document.querySelectorAll('.store-row'));
        const cards = Array.from(document.querySelectorAll('.store-grid-card'));
        const filteredRows = rows.filter(r => !query || (r.getAttribute('data-name') || '').includes(query));
        const filteredCards = cards.filter(c => !query || (c.getAttribute('data-name') || '').includes(query));
        const total = filteredRows.length;
        const pageSize = getStorePageSize();
        const maxPage = Math.max(1, Math.ceil(total / pageSize));
        currentStorePage = Math.min(Math.max(1, currentStorePage), maxPage);

        const start = (currentStorePage - 1) * pageSize;
        const end = start + pageSize;
        const pageRows = filteredRows.slice(start, end);
        const pageCards = filteredCards.slice(start, end);

        rows.forEach(r => { r.style.display = 'none'; });
        cards.forEach(c => { c.style.display = 'none'; });
        pageRows.forEach(r => { r.style.display = ''; });
        pageCards.forEach(c => { c.style.display = 'flex'; });

        const pageInfo = document.getElementById('pageInfo');
        if (pageInfo) {
          pageInfo.textContent = total === 0
            ? (query ? 'No matching items' : (window.innerWidth <= 640 ? 'Page 1 of 1' : 'Showing 0-0 of 0 items'))
            : (window.innerWidth <= 640 ? ('Page ' + currentStorePage + ' of ' + maxPage) : ('Showing ' + (start + 1) + '-' + (start + pageRows.length) + ' of ' + total + ' items'));
        }
        const indicator = document.getElementById('pageIndicator');
        if (indicator) indicator.textContent = currentStorePage + ' / ' + maxPage;

        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        if (prevBtn) prevBtn.disabled = currentStorePage <= 1 || total === 0;
        if (nextBtn) nextBtn.disabled = currentStorePage >= maxPage || total === 0;
      }

      function filterStoreFiles() {
        currentStorePage = 1;
        applyStorePagination();
      }

      function applyStoreFilenameLimits() {
        const maxChars = window.innerWidth <= 768 ? 10 : 24;
        document.querySelectorAll('.store-file-name').forEach(el => {
          const fullName = el.getAttribute('data-full-name') || '';
          el.textContent = fullName.length > maxChars
            ? fullName.slice(0, maxChars) + '...'
            : fullName;
        });
      }

      document.addEventListener('DOMContentLoaded', () => {
        applyStorePagination();
        applyStoreFilenameLimits();
      });

      window.addEventListener('resize', () => {
        applyStoreFilenameLimits();
        applyStorePagination();
      }, { passive: true });

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
              if (window.showToast) window.showToast(makePermanent ? 'File marked as permanent' : 'Retention set to temporary', 'success');
              setTimeout(() => window.location.reload(), 300);
            } else {
              if (window.showToast) window.showToast(data.error || 'Failed to update retention', 'error');
            }
          })
          .catch(err => {
            if (window.showToast) window.showToast('Network error: ' + err.message, 'error');
          });
      }

      const LOCK_ICON_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
      const UNLOCK_ICON_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>';

      function syncFileVisibilityUi(fileId, isPublic) {
        document.querySelectorAll('[data-file-id]').forEach(container => {
          if (container.getAttribute('data-file-id') !== fileId) return;
          container.querySelectorAll('.store-visibility-badge').forEach(badge => {
            badge.textContent = isPublic ? 'Public' : 'Private';
            if (badge.classList.contains('badge')) badge.classList.toggle('success', isPublic);
          });
          container.querySelectorAll('.krix-dropdown-item').forEach(btn => {
            const onclickAttr = btn.getAttribute('onclick') || '';
            if (onclickAttr.includes('toggleFilePrivacy(')) {
              btn.innerHTML = (isPublic ? LOCK_ICON_SVG : UNLOCK_ICON_SVG) + '<span>' + (isPublic ? 'Private' : 'Public') + '</span>';
            }
          });
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
              const isPublic = Boolean(data.isPublic);
              syncFileVisibilityUi(fileId, isPublic);
              document.querySelectorAll('.krix-dropdown-menu.active').forEach(m => m.classList.remove('active'));
              if (window.showToast) window.showToast('File is now ' + (isPublic ? 'public' : 'private'), 'success');
            } else {
              if (window.showToast) window.showToast(data?.error || 'Failed to update privacy', 'error');
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
    title: "Files",
    activeTab: "store",
    content,
    owner: params.owner,
  });
}
