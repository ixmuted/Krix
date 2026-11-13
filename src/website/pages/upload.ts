// Web Ingestion Workbench Page
// Contract Invariants: "Drag and drop files here, or click to browse", "drop-zone", "Search files", "Permanent Storage", "switch-wrap", ">Keep<", "toastContainer", id="confirmModal" class="modal-backdrop" hidden

import {
  renderPageShell,
  renderAuthRequiredCard,
  escapeHtml,
} from "../components.js";
import { renderSvg } from "../icons.js";

export function renderUploadPage(nonce: string = "", info?: any): string {
  const isOwner = Boolean(info?.owner);
  const nonceAttr = nonce ? `nonce="${escapeHtml(nonce)}"` : "";

  if (!isOwner) {
    return renderPageShell({
      title: "Upload",
      activeTab: "upload",
      owner: null,
      nonce,
      content: renderAuthRequiredCard(
        "Upload",
        "You must sign in as the verified service owner or authenticate with your MCP API key to access the Upload page.",
        "/upload",
      ),
    });
  }

  const maxFileMb = info?.maxFileMb ?? 25;
  const maxTotalMb = info?.maxTotalMb ?? 100;
  const maxFiles = info?.maxFiles ?? 20;

  const content = `
    <!-- Top Header Deck -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; flex-wrap:wrap; gap:16px;">
      <div>
        <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:var(--geist-gray-50);">INGESTION PIPELINE</div>
        <h1 style="font-size:24px; font-weight:700; letter-spacing:-0.03em; color:var(--fg); margin-top:4px;">Sandbox uploads</h1>
        <p style="font-size:13px; color:var(--geist-gray-50); margin-top:2px;">
          Upload workspace files, datasets and scripts directly to your isolated sandbox environment.
        </p>
      </div>

      <div style="display:flex; gap:10px;">
        <a href="/store" class="btn" style="border-radius:var(--radius-full); gap:6px;">
          ${renderSvg("folder", 14)}
          <span>View Store</span>
        </a>
      </div>
    </div>

    <!-- Summary Metrics Cards -->
    <div class="grid-4" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:24px;">
      <div class="card spotlight-card card-top-border" style="padding:18px;">
        <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:var(--geist-gray-50);">Session Status</div>
        <div style="font-size:16px; font-weight:700; color:var(--fg); margin-top:6px; display:flex; align-items:center; gap:8px;">
          <span class="status-dot-available"></span>
          <span>Active Sandbox</span>
        </div>
        <div style="font-size:11px; color:var(--geist-gray-50); margin-top:4px;">Folder: <code style="font-family:var(--font-mono);">upload/</code></div>
      </div>

      <div class="card spotlight-card card-top-border" style="padding:18px;">
        <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:var(--geist-gray-50);">Files Uploaded</div>
        <div id="valUploadCount" style="font-size:16px; font-weight:700; color:var(--fg); margin-top:6px;">0 files</div>
        <div id="valUploadSub" style="font-size:11px; color:var(--geist-gray-50); margin-top:4px;">Session active</div>
      </div>

      <div class="card spotlight-card card-top-border" style="padding:18px;">
        <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:var(--geist-gray-50);">Single File Limit</div>
        <div style="font-size:16px; font-weight:700; color:var(--fg); margin-top:6px;">${maxFileMb} MB</div>
        <div style="font-size:11px; color:var(--geist-gray-50); margin-top:4px;">Max per file</div>
      </div>

      <div class="card spotlight-card card-top-border" style="padding:18px;">
        <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:var(--geist-gray-50);">Storage Quota</div>
        <div style="font-size:16px; font-weight:700; color:var(--fg); margin-top:6px;">${maxTotalMb} MB</div>
        <div style="font-size:11px; color:var(--geist-gray-50); margin-top:4px;">Up to ${maxFiles} files</div>
      </div>
    </div>

    <!-- Active Upload & File Management Grid -->
    <div id="session">
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(340px, 1fr)); gap:20px;">
        <!-- Left: Upload Dropzone Card -->
        <div class="card spotlight-card" style="padding:24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h2 style="font-size:15px; font-weight:600; color:var(--fg);">Upload Workspace Files</h2>
            <span class="badge">${maxFileMb} MB per file</span>
          </div>

          <!-- Keep Storage Toggle Switch (Permanent Storage contract) -->
          <div class="switch-wrap" data-feature="Permanent Storage" style="display:flex; align-items:center; justify-content:space-between; gap:14px; padding:12px 16px; border-radius:var(--radius-md); border:1px solid var(--border-subtle); background:var(--bg-surface-1); margin-bottom:16px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="color:var(--accent); display:flex;">
                ${renderSvg("shield", 18)}
              </div>
              <div>
                <div style="font-weight:600; font-size:13px; color:var(--fg);">Keep</div>
              </div>
            </div>
            <label class="switch krix-switch" title="Keep (Permanent Storage)">
              <input type="checkbox" id="permSave" aria-label="Permanent Storage">
              <span class="krix-slider"></span>
            </label>
          </div>

          <!-- Drag & Drop Zone (Contract Invariants: drop-zone class and exact text) -->
          <div class="drop-zone" id="drop" tabindex="0" role="button" aria-label="Drop files to upload" onclick="document.getElementById('picker').click()" style="border:2px dashed var(--border-medium); border-radius:var(--radius-md); padding:36px 20px; text-align:center; background:var(--bg-surface-1); cursor:pointer; transition:all 0.2s ease;">
            <div style="margin-bottom:12px; display:flex; justify-content:center; color:var(--fg);">
              ${renderSvg("upload", 32)}
            </div>
            <div style="font-size:14px; font-weight:600; color:var(--fg); margin-bottom:4px;">
              Drag and drop files here, or click to browse
            </div>
            <div style="font-size:12px; color:var(--geist-gray-50);">
              Up to ${maxFiles} files &middot; ${maxFileMb} MB each &middot; ${maxTotalMb} MB total
            </div>
          </div>
          <input id="picker" type="file" multiple hidden onchange="handleFileSelect(this.files)">
        </div>

        <!-- Right: Uploaded Files Manager Card -->
        <div class="card spotlight-card" style="padding:24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <h2 style="font-size:15px; font-weight:600; color:var(--fg);">Sandbox Files</h2>
              <span class="badge" id="filesCountBadge">0 files</span>
            </div>
            <span id="usage" style="font-size:12px; color:var(--geist-gray-50);"></span>
          </div>

          <!-- Search Input (Contract Invariant: Search files) -->
          <div style="display:flex; align-items:center; gap:8px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:8px 12px; margin-bottom:14px;">
            ${renderSvg("search", 15, "text-muted")}
            <input
              type="text"
              id="fileFilter"
              class="search-input"
              placeholder="Search files"
              oninput="renderFileList()"
              style="border:none; background:transparent; font-size:12px; color:var(--fg); outline:none; width:100%;"
            >
          </div>

          <!-- Files List -->
          <ul id="list" style="list-style:none; padding:0; margin:0; max-height:360px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;"></ul>
          <div id="emptyFilesMsg" style="text-align:center; padding:32px 16px; color:var(--geist-gray-50); font-size:13px;">
            No files uploaded in this session yet. Drag and drop above to begin.
          </div>

          <div class="err" id="upErr" role="alert" style="color:var(--error); font-size:12px; margin-top:8px;"></div>
        </div>
      </div>
    </div>

    <!-- Custom Toast Container (Contract Invariant: toastContainer) -->
    <div id="toastContainer" class="toast-container" aria-live="polite"></div>

    <!-- Custom Confirmation Modal (Contract Invariant: id="confirmModal" class="modal-backdrop" hidden) -->
    <div id="confirmModal" class="modal-backdrop" hidden role="dialog" aria-modal="true" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); z-index:var(--z-modal); display:none; align-items:center; justify-content:center;">
      <div class="modal-card card spotlight-card" style="max-width:400px; width:90%; padding:24px;">
        <h3 id="modalTitle" style="font-size:16px; font-weight:700; margin-bottom:8px; color:var(--fg);">Confirm Action</h3>
        <p id="modalDesc" style="font-size:13px; color:var(--geist-gray-50); margin-bottom:20px; line-height:1.5;"></p>
        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button type="button" class="btn" onclick="closeConfirmModal()">Cancel</button>
          <button type="button" id="modalConfirmBtn" class="btn" style="background:var(--error); color:#fff; border-color:var(--error);">Delete</button>
        </div>
      </div>
    </div>

    <script ${nonceAttr}>
      function closeConfirmModal() {
        const m = document.getElementById('confirmModal');
        if (m) {
          m.hidden = true;
          m.style.display = 'none';
        }
      }

      async function handleFileSelect(files) {
        if (!files || files.length === 0) return;
        const keep = document.getElementById('permSave')?.checked;
        const total = files.length;

        for (let i = 0; i < total; i++) {
          const file = files[i];
          if (window.showToast) {
            window.showToast('Uploading ' + (i + 1) + ' of ' + total + ': ' + file.name, 'info');
          }
          const formData = new FormData();
          formData.append('files', file);
          if (keep) formData.append('keep', 'true');

          try {
            const res = await fetch('/upload', {
              method: 'POST',
              body: formData
            });
            if (!res.ok) {
              if (window.showToast) window.showToast('Upload failed for ' + file.name, 'error');
              return;
            }
          } catch (err) {
            if (window.showToast) window.showToast('Upload failed: ' + err.message, 'error');
            return;
          }
        }

        if (window.showToast) window.showToast('All ' + total + ' file(s) uploaded successfully', 'success');
        setTimeout(() => { window.location.href = '/store'; }, 800);
      }

      function renderFileList() {
        const q = (document.getElementById('fileFilter')?.value || '').toLowerCase();
        document.querySelectorAll('#list li').forEach(item => {
          item.style.display = item.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
      }
    </script>
  `;

  return renderPageShell({
    title: "Upload",
    activeTab: "upload",
    owner: info?.owner,
    nonce,
    content,
  });
}
