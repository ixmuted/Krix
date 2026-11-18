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
        "You must sign in with your Google Account to access the Upload page.",
        "/upload",
      ),
    });
  }

  const maxFileMb = info?.maxFileMb ?? 25;
  const maxTotalMb = info?.maxTotalMb ?? 100;
  const maxFiles = info?.maxFiles ?? 20;
  const storageQuotaMb: number | undefined = info?.storageQuotaMb;
  const storageUsedMb: number = info?.storageUsedMb ?? 0;
  const storageFreeMb =
    storageQuotaMb !== undefined
      ? Math.max(0, Math.round((storageQuotaMb - storageUsedMb) * 10) / 10)
      : undefined;
  const storageRoleLabel =
    info?.storageRole === "owner" ? "Owner tier" : "Standard tier";
  const quotaValue = `${storageQuotaMb ?? maxTotalMb} MB`;
  const quotaSub =
    storageFreeMb !== undefined
      ? `${storageFreeMb} MB free &middot; ${storageRoleLabel}`
      : `Up to ${maxFiles} files`;

  const content = `
    <div class="page-head">
      <div>
        <h1 class="page-title">Upload</h1>
        <p class="page-sub">Send files, datasets and scripts to your isolated sandbox.</p>
      </div>
      <div class="page-actions">
        <a href="/store" class="btn primary">${renderSvg("files", 16)}<span>Store</span></a>
      </div>
    </div>

    <div class="stats" style="margin-bottom:16px;">
      <div class="stat">
        <div class="stat-label">Folder</div>
        <div class="stat-value sm"><code id="valSessionFolder" class="inline-code">N/A</code></div>
        <div class="list-meta" style="margin-top:4px;">Sandbox directory</div>
      </div>
      <div class="stat">
        <div class="stat-label">Files Uploaded</div>
        <div id="valUploadCount" class="stat-value sm">0 files</div>
        <div id="valUploadSub" class="list-meta" style="margin-top:4px;">Session active</div>
      </div>
      <div class="stat">
        <div class="stat-label">Single File Limit</div>
        <div class="stat-value sm">${maxFileMb} MB</div>
        <div class="list-meta" style="margin-top:4px;">Max per file</div>
      </div>
      <div class="stat">
        <div class="stat-label">Storage Quota</div>
        <div class="stat-value sm">${quotaValue}</div>
        <div class="list-meta" style="margin-top:4px;">${quotaSub}</div>
      </div>
    </div>

    <div id="session" class="upload-grid">
      <div class="panel" style="margin:0;">
        <div class="panel-head" style="padding-bottom:14px; margin-bottom:14px; border-bottom:1px solid var(--border-subtle);">
          <h2 class="panel-title">Add files</h2>
          <span class="badge">${maxFileMb} MB per file</span>
        </div>

        <div class="switch-wrap upload-retention-box" data-feature="Permanent Storage" style="margin-bottom:14px; padding-bottom:14px; border-bottom:1px solid var(--border-subtle);">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
            <label for="permSave" class="row-title" style="cursor:pointer;">Permanent</label>
            <label class="switch krix-switch" title="Permanent Storage">
              <input type="checkbox" id="permSave" aria-label="Permanent">
              <span class="krix-slider"></span>
            </label>
          </div>
          <div class="row-desc" style="margin-top:4px;">Store permanently instead of deleting after 24 hours.</div>
        </div>

        <div class="drop-zone dropzone" id="drop" tabindex="0" role="button" aria-label="Drop files to upload">
          <div style="display:flex; justify-content:center; margin-bottom:10px; color:var(--fg);">${renderSvg("upload", 28)}</div>
          <div class="row-title">Drag and drop files here, or click to browse</div>
          <button type="button" id="browseBtn" class="btn" style="margin-top:16px;">Choose files</button>
        </div>
        <input id="picker" type="file" multiple hidden>
      </div>

      <div class="panel" style="margin:0;">
        <div class="panel-head">
          <div class="cluster"><h2 class="panel-title">Sandbox files</h2><span class="badge" id="filesCountBadge">0 files</span></div>
          <span id="usage" class="text-muted" style="font-size:13px;"></span>
        </div>
        <div class="search block" style="margin-bottom:12px;">
          ${renderSvg("search", 15)}
          <input type="text" id="fileFilter" class="search-input" placeholder="Search files" aria-label="Search files">
        </div>
        <ul id="list" class="up-list"></ul>
        <div id="emptyFilesMsg" class="empty">No files yet. Drop files on the left or choose them to begin.</div>
        <a href="/store" id="viewStoreLink" class="btn primary" style="display:none; margin-top:12px;">${renderSvg("files", 16)}<span>View in files</span></a>
        <div class="err" id="upErr" role="alert" style="color:var(--error); font-size:13px; margin-top:8px;"></div>
      </div>
    </div>

    <div id="toastContainer" class="toast-container" aria-live="polite"></div>

    <div id="confirmModal" class="modal-backdrop" hidden role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal-card">
        <h3 id="modalTitle" class="modal-title">Confirm action</h3>
        <p id="modalDesc" class="modal-text"></p>
        <div class="modal-actions">
          <button type="button" class="btn" id="modalCancelBtn">Cancel</button>
          <button type="button" id="modalConfirmBtn" class="btn danger">Delete</button>
        </div>
      </div>
    </div>

    <style ${nonceAttr}>
      .upload-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: stretch; }
      .upload-grid > .panel { height: 100%; display: flex; flex-direction: column; }
      @media (max-width: 768px) { .upload-grid { grid-template-columns: 1fr; } }
      .up-list { list-style: none; max-height: 380px; overflow-y: auto; display: flex; flex-direction: column; }
      .up-row { border-bottom: 1px solid var(--border-subtle); padding: 10px 2px; display: flex; flex-direction: column; gap: 6px; }
      .up-row:last-child { border-bottom: 0; }
      .up-row-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; min-width: 0; }
      .up-name { font-size: 14px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
      .up-meta { font-size: 12px; color: var(--fg-3); white-space: nowrap; }
      .up-bar { height: 4px; border-radius: 999px; background: var(--bg-surface-3); overflow: hidden; }
      .up-bar > span { display: block; height: 100%; width: 0; background: var(--accent); transition: width .15s linear; }
      .up-row.done .up-bar > span { background: #166534; }
      .up-row.error .up-bar > span { background: var(--error); }
      .up-row.error .up-meta { color: var(--error); }
    </style>
    <script ${nonceAttr}>
      (function () {
        var MAX_FILES = ${maxFiles};
        var MAX_FILE_BYTES = ${maxFileMb} * 1024 * 1024;
        var MAX_TOTAL_BYTES = ${maxTotalMb} * 1024 * 1024;
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

        function setSessionUi(active) {
          var fld = document.getElementById('valSessionFolder');
          if (fld) fld.textContent = active ? 'upload/' : 'N/A';
        }
        function openSession() {
          return fetch('/upload/api/session', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: '{}'
          }).then(function (r) {
            return r.json().catch(function () { return {}; }).then(function (d) {
              if (!r.ok) {
                setSessionUi(false);
                throw new Error(d.error || 'Could not open an upload session (HTTP ' + r.status + ')');
              }
              token = d.token;
              setSessionUi(true);
              return d;
            });
          }).catch(function (err) {
            setSessionUi(false);
            throw err;
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
          if (file.size === 0) {
            setRow(row, 'error', 'Empty file', 100);
            toast('"' + file.name + '" is empty and cannot be uploaded.', 'error', 4200);
            return false;
          }
          if (file.size > MAX_FILE_BYTES) {
            setRow(row, 'error', 'Exceeds ' + fmt(MAX_FILE_BYTES) + ' limit', 100);
            toast('"' + file.name + '" exceeds the ' + fmt(MAX_FILE_BYTES) + ' per-file upload limit.', 'error', 4500);
            return false;
          }
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
          if (uploading) { toast('An upload is already in progress. Please wait for it to finish.', 'info'); return; }
          if (files.length > MAX_FILES) {
            toast('Batch limit exceeded: you can upload up to ' + MAX_FILES + ' files at once (max ' + fmt(MAX_FILE_BYTES) + ' each, ' + fmt(MAX_TOTAL_BYTES) + ' per session).', 'error', 4800);
            return;
          }
          var batchBytes = files.reduce(function (acc, f) { return acc + (f.size || 0); }, 0);
          if (bytes + batchBytes > MAX_TOTAL_BYTES) {
            toast('Session quota exceeded: total uploads in this session cannot exceed ' + fmt(MAX_TOTAL_BYTES) + '.', 'error', 4800);
            return;
          }
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
