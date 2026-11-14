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
          <div class="drop-zone" id="drop" tabindex="0" role="button" aria-label="Drop files to upload" style="border:2px dashed var(--border-medium); border-radius:var(--radius-md); padding:36px 20px; text-align:center; cursor:pointer; transition:border-color .2s, background .2s;">
            <div style="width:56px; height:56px; margin:0 auto 14px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:var(--bg-surface-2); border:1px solid var(--border-subtle); color:var(--fg);">
              ${renderSvg("upload", 26)}
            </div>
            <div style="font-size:14px; font-weight:600; color:var(--fg); margin-bottom:4px;">
              Drag and drop files here, or click to browse
            </div>
            <div style="font-size:12px; color:var(--geist-gray-50);">
              Up to ${maxFiles} files &middot; ${maxFileMb} MB each &middot; ${maxTotalMb} MB total
            </div>
            <button type="button" id="browseBtn" class="btn" style="margin-top:16px; border-radius:var(--radius-full); gap:6px;">
              ${renderSvg("upload", 14)}
              <span>Choose files</span>
            </button>
          </div>
          <input id="picker" type="file" multiple hidden>
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
              style="border:none; background:transparent; font-size:12px; color:var(--fg); outline:none; width:100%;"
            >
          </div>

          <!-- Files List -->
          <ul id="list" style="list-style:none; padding:0; margin:0; max-height:360px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;"></ul>
          <div id="emptyFilesMsg" style="text-align:center; padding:32px 16px; color:var(--geist-gray-50); font-size:13px;">
            No files yet. Drop files on the left or choose them to begin.
          </div>

          <a href="/store" id="viewStoreLink" class="btn" style="display:none; margin-top:12px; border-radius:var(--radius-full); gap:6px;">
            ${renderSvg("folder", 14)}
            <span>View in Store</span>
          </a>
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
          <button type="button" class="btn" id="modalCancelBtn">Cancel</button>
          <button type="button" id="modalConfirmBtn" class="btn" style="background:var(--error); color:#fff; border-color:var(--error);">Delete</button>
        </div>
      </div>
    </div>

    <style ${nonceAttr}>
      .drop-zone:hover, .drop-zone.dragover { border-color: var(--accent) !important; background: var(--bg-surface-1); }
      .up-row { border:1px solid var(--border-subtle); background:var(--bg-surface-1); border-radius:var(--radius-md); padding:10px 12px; display:flex; flex-direction:column; gap:6px; }
      .up-row-top { display:flex; justify-content:space-between; align-items:center; gap:10px; min-width:0; }
      .up-name { font-size:13px; font-weight:600; color:var(--fg); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; }
      .up-meta { font-size:11px; color:var(--geist-gray-50); white-space:nowrap; }
      .up-bar { height:4px; border-radius:999px; background:var(--bg-surface-2); overflow:hidden; }
      .up-bar > span { display:block; height:100%; width:0; background:var(--accent); transition:width .15s linear; }
      .up-row.done .up-bar > span { background:var(--success, #2ea043); }
      .up-row.error .up-bar > span { background:var(--error); }
      .up-row.error .up-meta { color:var(--error); }
    </style>
    <script ${nonceAttr}>
      (function () {
        var MAX_FILES = ${maxFiles};
        var MAX_FILE_BYTES = ${maxFileMb} * 1024 * 1024;
        var drop = document.getElementById('drop');
        var picker = document.getElementById('picker');
        var browseBtn = document.getElementById('browseBtn');
        var list = document.getElementById('list');
        var emptyMsg = document.getElementById('emptyFilesMsg');
        var errBox = document.getElementById('upErr');
        var storeLink = document.getElementById('viewStoreLink');
        var token = null;
        var uploading = false;
        var count = 0;
        var bytes = 0;

        function toast(msg, type) { if (window.showToast) window.showToast(msg, type); }
        function fmt(n) {
          if (n < 1024) return n + ' B';
          if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
          return (n / 1048576).toFixed(1) + ' MB';
        }
        function updateSummary() {
          var label = count + (count === 1 ? ' file' : ' files');
          var el;
          el = document.getElementById('valUploadCount'); if (el) el.textContent = label;
          el = document.getElementById('valUploadSub'); if (el) el.textContent = fmt(bytes) + ' in sandbox';
          el = document.getElementById('filesCountBadge'); if (el) el.textContent = label;
          if (emptyMsg) emptyMsg.style.display = list.children.length ? 'none' : '';
          if (storeLink) storeLink.style.display = count ? 'inline-flex' : 'none';
        }
        function makeRow(name, size) {
          var li = document.createElement('li');
          li.className = 'up-row';
          var top = document.createElement('div'); top.className = 'up-row-top';
          var n = document.createElement('span'); n.className = 'up-name'; n.textContent = name; n.title = name;
          var m = document.createElement('span'); m.className = 'up-meta'; m.textContent = fmt(size) + ' - waiting';
          top.appendChild(n); top.appendChild(m);
          var bar = document.createElement('div'); bar.className = 'up-bar';
          var fill = document.createElement('span'); bar.appendChild(fill);
          li.appendChild(top); li.appendChild(bar);
          list.insertBefore(li, list.firstChild);
          return { li: li, meta: m, fill: fill };
        }
        function setRow(row, state, text, pct) {
          row.li.className = 'up-row ' + state;
          row.meta.textContent = text;
          if (typeof pct === 'number') row.fill.style.width = pct + '%';
        }

        function openSession() {
          return fetch('/upload/api/session', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: '{}'
          }).then(function (r) {
            return r.json().catch(function () { return {}; }).then(function (d) {
              if (!r.ok) throw new Error(d.error || 'Could not open an upload session (HTTP ' + r.status + ')');
              token = d.token;
              return d;
            });
          });
        }

        function sendFile(file, row, keep) {
          return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/upload/api/files');
            xhr.setRequestHeader('x-upload-token', token);
            xhr.setRequestHeader('x-filename', encodeURIComponent(file.name));
            xhr.setRequestHeader('x-permanent', keep ? 'true' : 'false');
            xhr.setRequestHeader('Content-Type', 'application/octet-stream');
            xhr.upload.onprogress = function (e) {
              if (e.lengthComputable) setRow(row, '', fmt(file.size) + ' - ' + Math.round(e.loaded / e.total * 100) + '%', e.loaded / e.total * 100);
            };
            xhr.onerror = function () { reject(new Error('Network error')); };
            xhr.onload = function () {
              var data = {};
              try { data = JSON.parse(xhr.responseText || '{}'); } catch (e) {}
              if (xhr.status >= 200 && xhr.status < 300) resolve(data);
              else { var err = new Error(data.error || ('Upload failed (HTTP ' + xhr.status + ')')); err.status = xhr.status; reject(err); }
            };
            xhr.send(file);
          });
        }

        async function uploadOne(file, row, keep) {
          if (file.size === 0) { setRow(row, 'error', 'Empty file', 100); return false; }
          if (file.size > MAX_FILE_BYTES) { setRow(row, 'error', 'Larger than ' + fmt(MAX_FILE_BYTES), 100); return false; }
          try {
            if (!token) await openSession();
            var data;
            try { data = await sendFile(file, row, keep); }
            catch (e) {
              if (e.status === 401) { await openSession(); data = await sendFile(file, row, keep); }
              else throw e;
            }
            setRow(row, 'done', fmt(file.size) + ' - uploaded' + (keep ? ' - kept' : ''), 100);
            count += 1; bytes += file.size;
            return true;
          } catch (e) {
            setRow(row, 'error', e.message || 'Upload failed', 100);
            if (errBox) errBox.textContent = e.message || 'Upload failed';
            return false;
          }
        }

        async function handleFiles(fileList) {
          var files = Array.prototype.slice.call(fileList || []);
          if (!files.length) return;
          if (uploading) { toast('An upload is already running. Wait for it to finish.', 'info'); return; }
          if (errBox) errBox.textContent = '';
          uploading = true;
          drop.style.opacity = '.7';
          var keepEl = document.getElementById('permSave');
          var keep = Boolean(keepEl && keepEl.checked);
          var rows = files.map(function (f) { return makeRow(f.name, f.size); });
          updateSummary();
          var ok = 0;
          for (var i = 0; i < files.length; i++) {
            if (await uploadOne(files[i], rows[i], keep)) ok += 1;
            updateSummary();
          }
          uploading = false;
          drop.style.opacity = '';
          if (ok === files.length) toast(ok + (ok === 1 ? ' file uploaded' : ' files uploaded'), 'success');
          else if (ok > 0) toast(ok + ' of ' + files.length + ' files uploaded', 'info');
          else toast('Upload failed', 'error');
        }

        drop.addEventListener('click', function (e) {
          if (e.target.closest && e.target.closest('#browseBtn')) return;
          picker.click();
        });
        browseBtn.addEventListener('click', function (e) { e.stopPropagation(); picker.click(); });
        drop.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); picker.click(); }
        });
        ['dragenter', 'dragover'].forEach(function (t) {
          drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('dragover'); });
        });
        ['dragleave', 'dragend'].forEach(function (t) {
          drop.addEventListener(t, function () { drop.classList.remove('dragover'); });
        });
        drop.addEventListener('drop', function (e) {
          e.preventDefault();
          drop.classList.remove('dragover');
          handleFiles(e.dataTransfer && e.dataTransfer.files);
        });
        picker.addEventListener('change', function () {
          var chosen = Array.prototype.slice.call(picker.files || []);
          picker.value = '';
          handleFiles(chosen);
        });

        var filter = document.getElementById('fileFilter');
        if (filter) filter.addEventListener('input', function () {
          var q = filter.value.toLowerCase();
          Array.prototype.forEach.call(list.children, function (li) {
            li.style.display = li.textContent.toLowerCase().indexOf(q) !== -1 ? '' : 'none';
          });
        });

        var cancel = document.getElementById('modalCancelBtn');
        if (cancel) cancel.addEventListener('click', function () {
          var m = document.getElementById('confirmModal');
          if (m) { m.hidden = true; m.style.display = 'none'; }
        });

        // Show files already in the upload folder (opens a session; failure is not fatal).
        openSession().then(function (d) {
          (d.files || []).forEach(function (f) {
            var row = makeRow(f.name, f.size);
            setRow(row, 'done', fmt(f.size) + (f.permanent ? ' - kept' : ''), 100);
            count += 1; bytes += f.size;
          });
          updateSummary();
        }).catch(function (e) {
          if (errBox) errBox.textContent = e.message || '';
        });

        window.addEventListener('pagehide', function () {
          if (token && navigator.sendBeacon) {
            navigator.sendBeacon('/upload/api/end', new Blob([JSON.stringify({ token: token })], { type: 'application/json' }));
          }
        });
      })();
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
