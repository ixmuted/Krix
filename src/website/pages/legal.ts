import { escapeHtml } from "../components.js";
import { renderSvg } from "../icons.js";
import { EFFECTIVE_DATE, REPO_URL, readMinutes, renderDocsShell } from "./docsKit.js";
import type { Tint } from "./docsKit.js";
import { PRIVACY_FACTS, PRIVACY_SECTIONS } from "./legalPrivacy.js";
import { TERMS_FACTS, TERMS_SECTIONS } from "./legalTerms.js";

export interface LegalSection {
  id: string;
  title: string;
  html: string;
}

export interface LegalFact {
  icon: string;
  tint: Tint;
  title: string;
  text: string;
}

interface LegalDoc {
  kind: "privacy" | "terms";
  title: string;
  lede: string;
  icon: string;
  tint: Tint;
  facts: LegalFact[];
  sections: LegalSection[];
  other: { href: string; title: string; dir: string };
}

function renderTabs(active: "privacy" | "terms"): string {
  const tab = (href: string, icon: string, label: string, on: boolean) =>
    `<a href="${href}"${on ? ' aria-current="page"' : ""}>${renderSvg(icon, 15)}<span>${label}</span></a>`;
  return `<nav class="legal-tabs" aria-label="Legal documents">
      ${tab("/privacy", "shield", "Privacy Policy", active === "privacy")}
      ${tab("/terms", "file-text", "Terms of Service", active === "terms")}
      ${tab("/help/security-and-quotas", "shield-check", "Security and quotas", false)}
    </nav>`;
}

function renderLegal(doc: LegalDoc, params: { owner?: any; nonce?: string }): string {
  const minutes = readMinutes(doc.sections.map((s) => s.html).join(" "));
  const tocLinks = doc.sections
    .map((s, i) => `<a href="#${s.id}">${i + 1}. ${escapeHtml(s.title)}</a>`)
    .join("");

  const facts = doc.facts
    .map(
      (f) => `
      <div class="legal-fact" data-tint="${f.tint}" role="listitem">
        <span class="tile">${renderSvg(f.icon, 20)}</span>
        <h3>${escapeHtml(f.title)}</h3>
        <p>${escapeHtml(f.text)}</p>
      </div>`,
    )
    .join("");

  const sections = doc.sections
    .map(
      (s, i) => `
      <section id="${s.id}" class="legal-sec">
        <div class="legal-num" aria-hidden="true">${i + 1}</div>
        <div class="legal-text">
          <h2>${escapeHtml(s.title)}</h2>
          ${s.html}
        </div>
      </section>`,
    )
    .join("");

  const content = `
    <nav class="docs-crumbs" aria-label="Breadcrumb">
      <a href="/help">Help Center</a>
      ${renderSvg("chevron-right", 14)}
      <span aria-current="page">${escapeHtml(doc.title)}</span>
    </nav>

    <header class="docs-head" data-tint="${doc.tint}">
      <span class="tile lg" aria-hidden="true">${renderSvg(doc.icon, 26)}</span>
      <div class="docs-head-body">
        <h1>${escapeHtml(doc.title)}</h1>
        <p class="docs-head-sub">${escapeHtml(doc.lede)}</p>
        <div class="docs-head-meta">
          <span class="docs-pill">Legal</span>
          <span>Effective ${EFFECTIVE_DATE}</span>
          <span>${minutes} min read</span>
        </div>
        ${renderTabs(doc.kind)}
      </div>
    </header>

    <p class="legal-facts-title">In plain English</p>
    <div class="legal-facts" role="list">${facts}</div>

    <div class="docs-grid legal">
      <nav class="docs-toc" aria-label="Contents">
        <div class="docs-toc-label">Contents</div>
        ${tocLinks}
      </nav>

      <article class="legal-body">
        <details class="docs-toc-m">
          <summary><span>Contents</span>${renderSvg("chevron-down", 16)}</summary>
          <nav aria-label="Contents">${tocLinks}</nav>
        </details>
        ${sections}
        <div class="legal-contact">
          <div>
            <strong>Questions about this document?</strong>
            <span class="d">Open an issue on the Krix repository. Security reports are welcome there too.</span>
          </div>
          <a href="${REPO_URL}/issues" target="_blank" rel="noopener noreferrer" class="btn sm">${renderSvg("github", 14)}<span>Open an issue</span></a>
        </div>
        <nav class="doc-pager" aria-label="Related documents">
          <a href="/help" class="doc-pager-card"><span class="doc-pager-dir">${renderSvg("chevron-left", 14)} Back</span><span class="doc-pager-title">Help Center</span></a>
          <a href="${doc.other.href}" class="doc-pager-card doc-pager-next"><span class="doc-pager-dir">${escapeHtml(doc.other.dir)} ${renderSvg("chevron-right", 14)}</span><span class="doc-pager-title">${escapeHtml(doc.other.title)}</span></a>
        </nav>
      </article>
    </div>
  `;

  return renderDocsShell({
    title: `${doc.title} - Krix`,
    content,
    owner: params.owner,
    nonce: params.nonce,
  });
}

export function renderPrivacyPage(params: { owner?: any; nonce?: string }): string {
  return renderLegal(
    {
      kind: "privacy",
      title: "Privacy Policy",
      lede: "What Krix collects, how it is encrypted and isolated, how long it is kept, and how you can delete it.",
      icon: "shield",
      tint: "clay",
      facts: PRIVACY_FACTS,
      sections: PRIVACY_SECTIONS,
      other: { href: "/terms", title: "Terms of Service", dir: "Next" },
    },
    params,
  );
}

export function renderTermsPage(params: { owner?: any; nonce?: string }): string {
  return renderLegal(
    {
      kind: "terms",
      title: "Terms of Service",
      lede: "The rules for using the Krix dashboard, MCP gateway, OAuth endpoints, sandbox and file store.",
      icon: "file-text",
      tint: "kraft",
      facts: TERMS_FACTS,
      sections: TERMS_SECTIONS,
      other: { href: "/privacy", title: "Privacy Policy", dir: "Also read" },
    },
    params,
  );
}
