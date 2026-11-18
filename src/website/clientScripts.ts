// Small shared runtime: toasts, copy, menus, dropdowns, sidebar and the jump-to palette.
// No pointer tracking and no scroll listeners.

export function getClientScripts(): string {
  return `
(function() {
  var root = document.documentElement;

  // ----- Sidebar -----
  window.toggleSidebar = function() {
    var collapsed = root.classList.toggle('sb-collapsed');
    try { localStorage.setItem('krix-sidebar', collapsed ? 'collapsed' : 'expanded'); } catch (e) {}
  };
  function syncScrollLock() {
    var navOpen = root.classList.contains('nav-open');
    var profileMenu = document.getElementById('headerProfileMenu');
    var profileOpen = !!(profileMenu && profileMenu.classList.contains('active'));
    root.classList.toggle('scroll-locked', navOpen || profileOpen);
  }
  window.toggleNav = function(open) {
    var next = open === undefined ? !root.classList.contains('nav-open') : !!open;
    root.classList.toggle('nav-open', next);
    if (!next) closeMenus(null);
    syncScrollLock();
    var btn = document.getElementById('topbarNavToggle');
    if (btn) {
      btn.setAttribute('aria-expanded', next ? 'true' : 'false');
      btn.setAttribute('aria-label', next ? 'Close menu' : 'Open menu');
    }
  };
  document.addEventListener('click', function(e) {
    var link = e.target.closest && e.target.closest('.sidebar a.sb-link');
    if (link) { window.toggleNav(false); return; }
    if (root.classList.contains('nav-open') && e.target.closest && !e.target.closest('#appSidebar, #topbarNavToggle')) {
      window.toggleNav(false);
    }
  });

  // ----- Toasts (Claude / Anthropic-inspired editorial notification cards) -----
  var TOAST_ICONS = {
    success: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
    error: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>',
    info: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
  };
  var TOAST_CLOSE_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
  window.showToast = function(message, variant, duration) {
    variant = variant || 'default';
    duration = duration || 3400;
    var container = document.getElementById('krixToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'krixToastContainer';
      document.body.appendChild(container);
    }
    var kind = variant === 'error' ? 'error' : (variant === 'success' ? 'success' : 'info');
    var toast = document.createElement('div');
    toast.className = 'krix-toast ' + kind;
    toast.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    var icon = document.createElement('span');
    icon.className = 'krix-toast-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = TOAST_ICONS[kind] || TOAST_ICONS.info;
    var text = document.createElement('span');
    text.className = 'krix-toast-text';
    text.textContent = message;
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'krix-toast-close';
    close.setAttribute('aria-label', 'Dismiss');
    close.innerHTML = TOAST_CLOSE_SVG;
    toast.appendChild(icon);
    toast.appendChild(text);
    toast.appendChild(close);
    container.appendChild(toast);
    var timer;
    function remove() {
      clearTimeout(timer);
      toast.classList.add('leaving');
      setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 160);
    }
    close.addEventListener('click', remove);
    timer = setTimeout(remove, duration);
  };

  // ----- Clipboard -----
  var CHECK = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  window.copyToClipboard = function(text, btn) {
    function done() {
      if (btn) {
        var original = btn.innerHTML;
        btn.innerHTML = CHECK;
        setTimeout(function() { btn.innerHTML = original; }, 1600);
      }
      window.showToast('Copied to clipboard', 'success', 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function() { window.showToast('Copy failed', 'error'); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { window.showToast('Copy failed', 'error'); }
      document.body.removeChild(ta);
    }
  };

  // ----- Secret reveal -----
  var EYE = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
  var EYE_OFF = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>';
  window.toggleSecretReveal = function(elementId, btn) {
    var el = document.getElementById(elementId);
    if (!el) return;
    var masked = el.getAttribute('data-masked') === 'true';
    if (masked) {
      el.textContent = el.getAttribute('data-raw') || el.textContent;
      el.setAttribute('data-masked', 'false');
      if (btn) btn.innerHTML = EYE_OFF;
    } else {
      el.textContent = el.getAttribute('data-masked-val') || '\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022';
      el.setAttribute('data-masked', 'true');
      if (btn) btn.innerHTML = EYE;
    }
  };

  // ----- Menus (flip to stay inside the viewport) -----
  function resetMenu(menu) {
    menu.classList.remove('active');
    menu.style.position = menu.style.top = menu.style.left = menu.style.right = menu.style.bottom = '';
    menu.style.maxHeight = menu.style.overflowY = menu.style.zIndex = '';
    if (menu.__portalAnchor && menu.__portalAnchor.parentNode) {
      menu.__portalAnchor.parentNode.insertBefore(menu, menu.__portalAnchor);
      menu.__portalAnchor.parentNode.removeChild(menu.__portalAnchor);
      menu.__portalAnchor = null;
    }
    syncScrollLock();
  }
  function closeMenus(except) {
    var open = document.querySelectorAll('.krix-dropdown-menu.active');
    for (var i = 0; i < open.length; i++) if (open[i] !== except) resetMenu(open[i]);
    syncScrollLock();
  }
  window.toggleKebabMenu = function(e, menuId) {
    e.stopPropagation();
    var menu = document.getElementById(menuId);
    if (!menu) return;
    var trigger = e.currentTarget || menu.parentElement;
    var wasOpen = menu.classList.contains('active');
    closeMenus(null);
    if (wasOpen) return;
    if (menu.id === 'headerProfileMenu' && menu.parentNode !== document.body) {
      menu.__portalAnchor = document.createComment('profile-menu-anchor');
      menu.parentNode.insertBefore(menu.__portalAnchor, menu);
      document.body.appendChild(menu);
    }
    menu.classList.add('active');
    menu.style.position = 'fixed';
    menu.style.zIndex = '650';
    syncScrollLock();
    menu.style.right = 'auto';
    menu.style.bottom = 'auto';
    menu.style.maxHeight = Math.max(140, window.innerHeight - 16) + 'px';
    menu.style.overflowY = 'auto';
    var t = trigger.getBoundingClientRect();
    var m = menu.getBoundingClientRect();
    var below = window.innerHeight - t.bottom - 12;
    var top = (m.height > below && t.top - 12 > m.height) ? t.top - m.height - 6 : t.bottom + 6;
    top = Math.max(8, Math.min(window.innerHeight - m.height - 8, top));
    var left = menu.classList.contains('sb-menu') ? t.left : t.right - m.width;
    left = Math.max(8, Math.min(left, window.innerWidth - m.width - 8));
    menu.style.top = Math.round(top) + 'px';
    menu.style.left = Math.round(left) + 'px';
  };
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.krix-dropdown, .sb-foot, #headerProfileMenu')) closeMenus(null);
  });
  window.addEventListener('resize', function() { closeMenus(null); }, { passive: true });

  // ----- Jump-to palette -----
  window.filterPalette = function(query) {
    var items = document.querySelectorAll('.krix-palette-item');
    var q = String(query || '').toLowerCase().trim();
    var first = null;
    for (var i = 0; i < items.length; i++) {
      var match = items[i].textContent.toLowerCase().indexOf(q) !== -1;
      items[i].style.display = match ? 'flex' : 'none';
      items[i].classList.remove('selected');
      if (match && !first) first = items[i];
    }
    if (first) first.classList.add('selected');
  };
  window.toggleCommandPalette = function(show) {
    var palette = document.getElementById('krixCommandPalette');
    if (!palette) return;
    var open = show === undefined ? !palette.classList.contains('active') : !!show;
    palette.classList.toggle('active', open);
    if (open) {
      var input = palette.querySelector('.krix-palette-input');
      input.value = '';
      window.filterPalette('');
      var isTouchOrMobile = window.innerWidth <= 860 || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
      if (!isTouchOrMobile) input.focus();
    }
  };
  function paletteMove(dir) {
    var visible = Array.prototype.filter.call(document.querySelectorAll('.krix-palette-item'), function(i) { return i.style.display !== 'none'; });
    if (!visible.length) return;
    var idx = visible.findIndex(function(i) { return i.classList.contains('selected'); });
    visible.forEach(function(i) { i.classList.remove('selected'); });
    var next = visible[(idx + dir + visible.length) % visible.length];
    next.classList.add('selected');
    next.scrollIntoView({ block: 'nearest' });
  }
  document.addEventListener('keydown', function(e) {
    var palette = document.getElementById('krixCommandPalette');
    var paletteOpen = palette && palette.classList.contains('active');
    var activeEl = document.activeElement;
    var isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT' || activeEl.isContentEditable);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      window.toggleCommandPalette();
    } else if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping && !paletteOpen) {
      e.preventDefault();
      window.toggleCommandPalette(true);
    } else if (e.key === 'Escape') {
      if (paletteOpen) window.toggleCommandPalette(false);
      closeMenus(null);
      root.classList.remove('nav-open');
      var so = document.getElementById('headerSignOutModal');
      if (so) so.style.display = 'none';
    } else if (paletteOpen && e.key === 'ArrowDown') { e.preventDefault(); paletteMove(1); }
    else if (paletteOpen && e.key === 'ArrowUp') { e.preventDefault(); paletteMove(-1); }
    else if (paletteOpen && e.key === 'Enter') {
      var sel = palette.querySelector('.krix-palette-item.selected');
      if (sel) window.location.href = sel.getAttribute('href');
    }
  });

  // ----- Custom select -----
  function closeSelects(except) {
    document.querySelectorAll('.krix-custom-dropdown.open').forEach(function(d) {
      if (d === except) return;
      d.classList.remove('open');
      var p = d.querySelector('.krix-dropdown-popover'); if (p) p.hidden = true;
      var t = d.querySelector('.krix-dropdown-trigger'); if (t) t.setAttribute('aria-expanded', 'false');
    });
  }
  window.toggleCustomDropdown = function(id) {
    var wrapper = document.getElementById(id + '_wrapper');
    var popover = document.getElementById(id + '_popover');
    var trigger = document.getElementById(id + '_trigger');
    if (!wrapper || !popover) return;
    var wasOpen = wrapper.classList.contains('open');
    closeSelects(wrapper);
    wrapper.classList.toggle('open', !wasOpen);
    popover.hidden = wasOpen;
    if (trigger) trigger.setAttribute('aria-expanded', wasOpen ? 'false' : 'true');
  };
  window.selectCustomDropdownOption = function(id, value, label) {
    var wrapper = document.getElementById(id + '_wrapper');
    var popover = document.getElementById(id + '_popover');
    var labelEl = document.getElementById(id + '_label');
    var native = document.getElementById(id);
    var trigger = document.getElementById(id + '_trigger');
    if (labelEl) labelEl.textContent = label;
    if (wrapper) wrapper.classList.remove('open');
    if (popover) {
      popover.hidden = true;
      popover.querySelectorAll('.krix-dropdown-option').forEach(function(opt) {
        var match = opt.getAttribute('data-value') === value;
        opt.classList.toggle('selected', match);
        opt.setAttribute('aria-selected', match ? 'true' : 'false');
      });
    }
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    if (native) {
      native.value = value;
      native.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.krix-custom-dropdown')) closeSelects(null);
  });

  // ----- App logo fallback chain -----
  function isLogoImg(el) {
    return el && el.tagName === 'IMG' && (el.classList.contains('oauth-app-favicon') || el.classList.contains('client-logo-img'));
  }
  function advanceLogo(img) {
    var list = img.dataset.fallbackSrcs ? img.dataset.fallbackSrcs.split('|').filter(Boolean) : [];
    var next = list.length ? decodeURIComponent(list.shift()) : '';
    img.dataset.fallbackSrcs = list.join('|');
    if (!next && img.dataset.fallbackSrc) { next = img.dataset.fallbackSrc; img.dataset.fallbackSrc = ''; }
    if (next && img.src !== next) { img.src = next; return; }
    img.style.display = 'none';
    img.classList.add('hidden');
    var sib = img.nextElementSibling;
    if (sib) { sib.classList.remove('hidden'); sib.style.display = 'inline-flex'; }
  }
  window.addEventListener('error', function(e) { if (isLogoImg(e.target)) advanceLogo(e.target); }, true);
  window.addEventListener('load', function() {
    document.querySelectorAll('img.oauth-app-favicon, img.client-logo-img').forEach(function(im) {
      if (im.complete && im.naturalWidth === 0 && im.getAttribute('src')) advanceLogo(im);
    });
  });

  // ----- Cookie consent banner -----
  (function() {
    var banner = document.getElementById('krixCookieBanner');
    if (!banner) return;
    var accepted = false;
    try { accepted = Boolean(localStorage.getItem('krix-cookie-consent')); } catch (e) {}
    if (!accepted && document.cookie.indexOf('krix_consent=') !== -1) accepted = true;
    if (!accepted) banner.hidden = false;
  })();
  window.acceptCookieConsent = function(choice) {
    var val = choice === 'essential' ? 'essential' : 'accepted';
    try { localStorage.setItem('krix-cookie-consent', val); } catch (e) {}
    document.cookie = 'krix_consent=' + val + '; Max-Age=31536000; Path=/; SameSite=Lax';
    var banner = document.getElementById('krixCookieBanner');
    if (banner) banner.hidden = true;
  };
})();
`;
}
