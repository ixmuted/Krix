// High-Performance Vanilla JS Runtime for Krix (<15KB, Zero Dependencies)
// Powers Cursor Spotlight, Toast Notifications, Spring Morphing, Dropdowns, and Command Palette

export function getClientScripts(): string {
  return `
(function() {
  // 1. Dynamic Cursor Spotlight Tracking
  function initSpotlight() {
    document.addEventListener('mousemove', function(e) {
      const cards = document.querySelectorAll('.spotlight-card');
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', x + 'px');
        card.style.setProperty('--mouse-y', y + 'px');
      }
    }, { passive: true });
  }

  // 2. Redesigned Custom Toast Notification Engine
  window.showToast = function(message, variant, duration) {
    variant = variant || 'default';
    duration = duration || 3200;

    let container = document.getElementById('krixToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'krixToastContainer';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'krix-toast';

    let iconSvg = '';
    if (variant === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
    } else if (variant === 'error') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';
    }

    toast.innerHTML = 
      '<div class="krix-toast-icon">' + iconSvg + '</div>' +
      '<div class="krix-toast-text">' + message + '</div>' +
      '<button type="button" class="krix-toast-close" aria-label="Dismiss">&times;</button>' +
      '<div class="krix-toast-bar" style="width: 100%;"></div>';

    container.appendChild(toast);

    const progressBar = toast.querySelector('.krix-toast-bar');
    if (progressBar) {
      progressBar.style.transition = 'width ' + duration + 'ms linear';
      requestAnimationFrame(function() {
        progressBar.style.width = '0%';
      });
    }

    function removeToast() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px) scale(0.95)';
      toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 200);
    }

    const closeBtn = toast.querySelector('.krix-toast-close');
    if (closeBtn) closeBtn.addEventListener('click', removeToast);

    const timeout = setTimeout(removeToast, duration);
    toast.addEventListener('mouseenter', function() { clearTimeout(timeout); });
  };

  // 3. Stateful Clipboard Copy with Spring Checkmark Morph
  window.copyToClipboard = function(text, btnElement) {
    if (!navigator.clipboard) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } else {
      navigator.clipboard.writeText(text);
    }

    if (btnElement) {
      const originalHtml = btnElement.innerHTML;
      btnElement.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
      btnElement.style.transform = 'scale(1.12)';
      btnElement.style.transition = 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

      setTimeout(function() {
        btnElement.innerHTML = originalHtml;
        btnElement.style.transform = 'scale(1)';
      }, 2000);
    }

    window.showToast('Copied to clipboard', 'success', 2400);
  };

  // 4. Secret Mask/Reveal Eye Toggle with Rotational Easing
  window.toggleSecretReveal = function(elementId, btnElement) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const isMasked = el.getAttribute('data-masked') === 'true';
    if (isMasked) {
      el.textContent = el.getAttribute('data-raw') || el.textContent;
      el.setAttribute('data-masked', 'false');
      if (btnElement) {
        btnElement.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>';
      }
    } else {
      el.textContent = el.getAttribute('data-masked-val') || '••••••••••••••••';
      el.setAttribute('data-masked', 'true');
      if (btnElement) {
        btnElement.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
      }
    }
  };

  // 5. Redesigned Custom Dropdowns & Kebab Menus with Viewport Boundary Flipping
  window.toggleKebabMenu = function(e, menuId) {
    e.stopPropagation();
    const menu = document.getElementById(menuId);
    if (!menu) return;

    // Close all other open menus
    const openMenus = document.querySelectorAll('.krix-dropdown-menu.active');
    for (let i = 0; i < openMenus.length; i++) {
      if (openMenus[i] !== menu) openMenus[i].classList.remove('active');
    }

    menu.classList.toggle('active');

    if (menu.classList.contains('active')) {
      const rect = menu.getBoundingClientRect();
      if (rect.bottom > window.innerHeight - 20) {
        menu.classList.add('drop-up');
      } else {
        menu.classList.remove('drop-up');
      }
    }
  };

  document.addEventListener('click', function(e) {
    if (!e.target.closest('.krix-dropdown')) {
      const openMenus = document.querySelectorAll('.krix-dropdown-menu.active');
      for (let i = 0; i < openMenus.length; i++) {
        openMenus[i].classList.remove('active');
      }
    }
  });

  // 6. Command Palette (⌘K) Keyboard Engine
  window.toggleCommandPalette = function(show) {
    const palette = document.getElementById('krixCommandPalette');
    if (!palette) return;

    if (show === undefined) {
      palette.classList.toggle('active');
    } else if (show) {
      palette.classList.add('active');
    } else {
      palette.classList.remove('active');
    }

    if (palette.classList.contains('active')) {
      const input = palette.querySelector('.krix-palette-input');
      if (input) {
        input.value = '';
        input.focus();
        filterPalette('');
      }
    }
  };

  function filterPalette(query) {
    const items = document.querySelectorAll('.krix-palette-item');
    const q = query.toLowerCase().trim();
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(q) ? 'flex' : 'none';
    }
  }

  document.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      window.toggleCommandPalette();
    } else if (e.key === 'Escape') {
      window.toggleCommandPalette(false);
    }
  });

  // 7. Circular Scroll-Progress FAB
  function initScrollProgress() {
    const fab = document.getElementById('scrollProgressFab');
    const progressCircle = document.getElementById('scrollProgressCircle');
    if (!fab || !progressCircle) return;

    const circumference = 2 * Math.PI * 16;
    progressCircle.style.strokeDasharray = circumference;

    window.addEventListener('scroll', function() {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollY > 120) {
        fab.classList.add('visible');
      } else {
        fab.classList.remove('visible');
      }

      if (docHeight > 0) {
        const percent = Math.min(1, Math.max(0, scrollY / docHeight));
        progressCircle.style.strokeDashoffset = circumference - percent * circumference;
      }
    }, { passive: true });

    fab.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // DOM Ready Initializer
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initSpotlight();
      initScrollProgress();
    });
  } else {
    initSpotlight();
    initScrollProgress();
  }
})();
`;
}
