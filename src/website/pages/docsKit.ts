import { escapeHtml, renderPageShell } from "../components.js";
import { renderSvg } from "../icons.js";
import { getDocsCss } from "./docsStyles.js";

export const REPO_URL = "https://github.com/ixmuted/Krix";
export const EFFECTIVE_DATE = "November 2026";

export type Tint = "clay" | "olive" | "sky" | "kraft" | "fig" | "cactus" | "slate";

export const GUIDE_TINTS: Record<string, Tint> = {
  "getting-started": "clay",
  "adding-keys": "fig",
  authentication: "fig",
  github: "slate",
  sandbox: "olive",
  render: "sky",
  "code-graph": "cactus",
  "files-and-store": "kraft",
  "security-and-quotas": "clay",
};

export function tintFor(slug: string): Tint {
  return GUIDE_TINTS[slug] || "slate";
}

export function codeBlock(label: string, code: string): string {
  const escaped = escapeHtml(code);
  return `
    <div class="doc-code">
      <div class="doc-code-head">
        <span>${escapeHtml(label)}</span>
        <button type="button" class="btn sm doc-copy-btn" data-copy="${escaped}" aria-label="Copy ${escapeHtml(label)}">${renderSvg("copy", 14)}<span>Copy</span></button>
      </div>
      <pre><code>${escaped}</code></pre>
    </div>`;
}

export function callout(
  kind: "info" | "tip" | "warn",
  title: string,
  bodyHtml: string,
): string {
  const icon = kind === "warn" ? "warning" : kind === "tip" ? "sparkles" : "info";
  return `
    <div class="doc-callout doc-callout-${kind}">
      <div class="doc-callout-icon" aria-hidden="true">${renderSvg(icon, 17)}</div>
      <div>
        <div class="doc-callout-title">${escapeHtml(title)}</div>
        <div class="doc-callout-text">${bodyHtml}</div>
      </div>
    </div>`;
}

export function readMinutes(html: string): number {
  const words = html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 210));
}

export function labelTables(html: string): string {
  return html.replace(/<table[\s\S]*?<\/table>/g, (table) => {
    const heads = Array.from(table.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)).map((m) =>
      m[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim(),
    );
    if (!heads.length) return table;
    return table.replace(/<tr>([\s\S]*?)<\/tr>/g, (row, inner: string) => {
      if (inner.includes("<th")) return row;
      let i = 0;
      const cells = inner.replace(/<td(?![^>]*data-label)([^>]*)>/g, (_m, attrs: string) => {
        const label = heads[i++] || "";
        return `<td${attrs}${label ? ` data-label="${escapeHtml(label)}"` : ""}>`;
      });
      return `<tr>${cells}</tr>`;
    });
  });
}

export function renderDocsScripts(nonce?: string): string {
  const nonceAttr = nonce ? ` nonce="${escapeHtml(nonce)}"` : "";
  return `<script${nonceAttr}>
(function () {
  var prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function flash(btn) {
    var span = btn.querySelector("span");
    if (!span) return;
    var prev = span.getAttribute("data-label") || span.textContent;
    span.setAttribute("data-label", prev);
    span.textContent = "Copied";
    setTimeout(function () { span.textContent = prev; }, 1600);
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* 1. CSP-safe copy buttons */
  document.addEventListener("click", function (ev) {
    var t = ev.target;
    var btn = t && t.closest ? t.closest(".doc-copy-btn") : null;
    if (!btn) return;
    var text = btn.getAttribute("data-copy") || "";
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { flash(btn); }, function () { fallbackCopy(text); flash(btn); });
    } else { fallbackCopy(text); flash(btn); }
  });

  /* 2. Live guide search */
  var search = document.getElementById("helpSearchInput");
  if (search) {
    var rows = Array.prototype.slice.call(document.querySelectorAll("[data-guide]"));
    var empty = document.getElementById("helpSearchEmpty");
    var count = document.getElementById("helpCategoryCount");
    var run = function () {
      var q = (search.value || "").trim().toLowerCase();
      var shown = 0;
      rows.forEach(function (row) {
        var hit = !q || (row.getAttribute("data-search") || "").toLowerCase().indexOf(q) !== -1;
        row.hidden = !hit;
        if (hit) shown++;
      });
      if (empty) empty.hidden = shown > 0;
      if (count) count.textContent = shown + " of " + rows.length + " guides";
    };
    search.addEventListener("input", run);
    document.addEventListener("keydown", function (ev) {
      var tag = (ev.target && ev.target.tagName) || "";
      if (ev.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") { ev.preventDefault(); search.focus(); }
      if (ev.key === "Escape" && document.activeElement === search) { search.value = ""; run(); search.blur(); }
    });
  }

  /* 3. Smooth animated <details> accordions (FAQ & mobile TOC) */
  if (!prefersReduced && typeof Element.prototype.animate === "function") {
    var detailsList = Array.prototype.slice.call(document.querySelectorAll("details.docs-smooth-details"));
    detailsList.forEach(function (el) {
      var summary = el.querySelector("summary");
      var body = el.querySelector(".docs-details-body");
      if (!summary || !body) return;
      var anim = null;
      var isClosing = false;
      var isExpanding = false;

      summary.addEventListener("click", function (e) {
        e.preventDefault();
        el.style.overflow = "hidden";
        if (isClosing || !el.open) {
          el.style.height = el.offsetHeight + "px";
          el.open = true;
          window.requestAnimationFrame(function () {
            isExpanding = true;
            var startH = el.offsetHeight + "px";
            var endH = (summary.offsetHeight + body.offsetHeight) + "px";
            if (anim) anim.cancel();
            anim = el.animate({ height: [startH, endH] }, { duration: 260, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
            anim.onfinish = function () {
              el.open = true;
              anim = null;
              isClosing = false;
              isExpanding = false;
              el.style.height = "";
              el.style.overflow = "";
            };
          });
        } else if (isExpanding || el.open) {
          isClosing = true;
          var startH = el.offsetHeight + "px";
          var endH = summary.offsetHeight + "px";
          if (anim) anim.cancel();
          anim = el.animate({ height: [startH, endH] }, { duration: 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
          anim.onfinish = function () {
            el.open = false;
            anim = null;
            isClosing = false;
            isExpanding = false;
            el.style.height = "";
            el.style.overflow = "";
          };
        }
      });
    });
  }

  /* 4. Smooth scroll reveal for sections, cards, and graphics */
  var revealNodes = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  if (prefersReduced || typeof IntersectionObserver === "undefined") {
    revealNodes.forEach(function (n) { n.classList.add("is-visible"); });
  } else {
    var revealIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06, rootMargin: "0px 0px -20px 0px" });
    revealNodes.forEach(function (n) { revealIo.observe(n); });
  }

  /* 5. Desktop TOC active scroll-spy & mobile TOC auto-close */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll(".docs-toc a[href^='#']"));
  if (tocLinks.length && "IntersectionObserver" in window) {
    var map = {};
    tocLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var current = null;
    var mark = function (id) {
      if (!map[id] || current === id) return;
      current = id;
      tocLinks.forEach(function (a) { a.removeAttribute("aria-current"); });
      map[id].setAttribute("aria-current", "true");
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) mark(e.target.id); });
    }, { rootMargin: "-84px 0px -65% 0px", threshold: 0 });
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
    mark(tocLinks[0].getAttribute("href").slice(1));
  }
  document.querySelectorAll(".docs-toc-m a").forEach(function (a) {
    a.addEventListener("click", function () {
      var d = a.closest("details");
      if (d) d.removeAttribute("open");
    });
  });
  var chip = document.querySelector(".docs-chips a[aria-current='page']");
  if (chip && chip.parentElement) {
    var box = chip.parentElement;
    box.scrollLeft = Math.max(0, chip.offsetLeft - 24);
  }
})();
</script>`;
}

export function renderDocsShell(params: {
  title: string;
  content: string;
  owner?: any;
  nonce?: string;
}): string {
  const nonceAttr = params.nonce ? ` nonce="${escapeHtml(params.nonce)}"` : "";
  return renderPageShell({
    title: params.title,
    activeTab: "home",
    wide: true,
    pageClass: "docs-page",
    content: labelTables(params.content) + renderDocsScripts(params.nonce),
    owner: params.owner,
    nonce: params.nonce,
    headExtra: `<style${nonceAttr}>${getDocsCss()}</style>`,
  });
}
