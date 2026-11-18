// OAuth 2.1 PKCE Authorization Consent Screen
// Visual Peer-to-Peer Handshake, Real Anime Avatar, Auto-Favicon Domain Resolver, and Scope Disclosures

import { getTokensCss } from "../tokens.css.js";
import { renderSvg, SVG_ICONS } from "../icons.js";
import { escapeHtml } from "../components.js";

function resolveFallbackIcon(name: string): string {
  const q = (name || "").toLowerCase();
  for (const key of Object.keys(SVG_ICONS)) {
    if (q.includes(key)) return key;
  }
  return "layers";
}

function safeWebsiteOrigin(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  try {
    const parsed = new URL(
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`,
    );
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:")
      return undefined;
    if (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname.endsWith(".local")
    ) {
      return undefined;
    }
    return parsed.origin;
  } catch {
    return undefined;
  }
}


export function renderOAuthConsentPage(params: {
  clientId: string;
  clientName: string;
  redirectUri: string;
  scope: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  owner: any;
  nonce: string;
  clientUri?: string;
  logoUri?: string;
}): string {
  const safeName = escapeHtml(params.clientName || "External Client");
  const safeScope = escapeHtml(
    params.scope || "mcp:tools mcp:sandbox mcp:store",
  );
  const safeState = escapeHtml(params.state || "");
  const safeChallenge = escapeHtml(params.codeChallenge || "");
  const safeMethod = escapeHtml(params.codeChallengeMethod || "S256");
  const safeRedirect = escapeHtml(params.redirectUri || "");
  const safeClientId = escapeHtml(params.clientId || "");
  const rawEmail = params.owner?.email
    ? decodeURIComponent(params.owner.email)
    : "owner@quickwitty.com";
  const ownerEmail = escapeHtml(rawEmail);
  const ownerName = escapeHtml(
    params.owner?.name || rawEmail.split("@")[0] || "User",
  );

  let domain = "external.app";
  try {
    const url = new URL(params.redirectUri);
    domain = url.hostname;
  } catch {}

  const q = (params.clientName || params.clientId || "").toLowerCase();
  const fallbackIconName = resolveFallbackIcon(
    params.clientName || params.clientId,
  );
  const fallbackSvg = renderSvg(fallbackIconName, 32);

  const websiteUrl = params.logoUri || params.clientUri || params.redirectUri;
  const origin =
    safeWebsiteOrigin(websiteUrl) ||
    (domain && !domain.includes("localhost") ? `https://${domain}` : undefined);

  // Detect well-known clients from every signal we have (name, id, redirect
  // host, logo/client URI). Gemini registers with Google-hosted URIs, so a
  // name-only check misses it and a remote favicon lookup returns a broken image.
  const signals = [
    q,
    domain.toLowerCase(),
    (params.logoUri || "").toLowerCase(),
    (params.clientUri || "").toLowerCase(),
  ].join(" ");
  const isGemini = /gemini|bard|google\.com|googleusercontent|gstatic|googleapis/.test(
    signals,
  );
  const isClaude = !isGemini && /claude|anthropic/.test(signals);

  let primarySrc = "";
  let fallbackSrc = "";

  if (isGemini) {
    primarySrc =
      "https://www.google.com/s2/favicons?domain=gemini.google.com&sz=128";
    fallbackSrc =
      "https://www.gstatic.com/lamda/images/gemini_sparkle_4g_512_lt_f94943af3be039176192d.png";
  } else if (isClaude) {
    primarySrc =
      "https://www.google.com/s2/favicons?domain=claude.ai&sz=128";
    fallbackSrc = "https://claude.ai/favicon.ico";
  } else if (params.logoUri && safeWebsiteOrigin(params.logoUri)) {
    primarySrc = params.logoUri;
    fallbackSrc = origin
      ? `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(origin)}&sz=64`
      : "";
  } else if (origin) {
    primarySrc = `${origin}/favicon.ico`;
    fallbackSrc = `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(origin)}&sz=64`;
  }

  const safePrimary = escapeHtml(primarySrc);
  const safeFallback = escapeHtml(fallbackSrc);

  const clientLogoHtml = safePrimary
    ? `<img class="client-logo-img" src="${safePrimary}" data-fallback-src="${safeFallback}" alt="${safeName}" loading="lazy" referrerpolicy="no-referrer" onerror="if(this.dataset.fallbackSrc &amp;&amp; this.src!==this.dataset.fallbackSrc){this.src=this.dataset.fallbackSrc;this.dataset.fallbackSrc='';}else{this.classList.add('hidden');if(this.nextElementSibling){this.nextElementSibling.classList.remove('hidden');}}"><div class="app-logo-fallback hidden">${fallbackSvg}</div>`
    : `<div class="app-logo-fallback">${fallbackSvg}</div>`;

  const cancelUrl = `${params.redirectUri}${params.redirectUri.includes("?") ? "&" : "?"}error=access_denied&state=${encodeURIComponent(params.state || "")}`;

  const scopeRow = (icon: string, name: string, desc: string) => `
      <div class="scope-row">
        ${renderSvg(icon, 18)}
        <div>
          <div class="scope-row-name">${name}</div>
          <div class="scope-row-desc">${desc}</div>
        </div>
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Authorize Connection - Krix</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico?v=3">
  <script nonce="${escapeHtml(params.nonce || "")}">
    function toggleOAuthScopes() {
      var list = document.getElementById("oauthScopesList");
      var btn = document.getElementById("toggleScopesBtn");
      if (!list || !btn) return;
      var willShow = list.hidden;
      list.hidden = !willShow;
      btn.setAttribute("aria-expanded", willShow ? "true" : "false");
      btn.setAttribute("title", willShow ? "Hide permissions" : "Show permissions");
    }
    document.addEventListener("DOMContentLoaded", function() {
      var scopesBtn = document.getElementById("toggleScopesBtn");
      if (scopesBtn) scopesBtn.addEventListener("click", toggleOAuthScopes);
    });
    (function () {
      try {
        var m = localStorage.getItem('qw-theme');
        var dark = m === 'dark' || (m !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('dark', dark);
      } catch (e) {}
    })();
  </script>
  <style nonce="${escapeHtml(params.nonce || "")}">
    ${getTokensCss()}
    .oauth-card { max-width: 460px; width: 100%; padding: 32px 28px; border-radius: 20px; box-shadow: var(--shadow-md); }
    .oauth-handshake { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 24px; }
    .oauth-logo-card, .oauth-avatar-card { width: 60px; height: 60px; border-radius: var(--radius-xl); background: var(--bg-surface-2); border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: center; overflow: hidden; color: var(--fg); }
    .oauth-logo-card img.client-logo-img { width: 34px; height: 34px; object-fit: contain; }
    .oauth-avatar-card img { width: 100%; height: 100%; object-fit: cover; }
    .handshake-beam { display: flex; align-items: center; gap: 6px; color: var(--fg-3); }
    .beam-segment { width: 20px; height: 1.5px; background: var(--border-medium); }
    .oauth-header { text-align: center; display: flex; flex-direction: column; gap: 8px; margin-bottom: 22px; }
    .oauth-header h1 { font-family: var(--font-serif); font-size: 26px; font-weight: 400; letter-spacing: -0.01em; }
    .oauth-header p { font-size: 14px; color: var(--fg-3); }
    .oauth-header strong { color: var(--fg); font-weight: 500; }
    .oauth-domain-badge { display: flex; justify-content: center; margin-top: 2px; }
    .domain-pill { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: var(--radius-full); background: var(--bg-surface-2); font-size: 12px; font-family: var(--font-mono); color: var(--fg-3); }
    .domain-pill img { width: 12px; height: 12px; border-radius: 2px; }
    .oauth-user-badge { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; border-radius: var(--radius-lg); background: var(--bg-surface-1); border: 1px solid var(--border-subtle); margin-bottom: 20px; font-size: 13px; }
    .oauth-user-details { display: flex; flex-direction: column; gap: 3px; overflow-x: auto; white-space: nowrap; }
    .oauth-user-line { white-space: nowrap; color: var(--fg-3); }
    .oauth-user-line strong { font-weight: 500; color: var(--fg); }
    .oauth-scopes { display: flex; flex-direction: column; margin-bottom: 24px; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); background: var(--bg-surface-1); overflow: hidden; }
    .scopes-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 11px 14px; }
    .scopes-title { font-size: 13px; font-weight: 500; color: var(--fg); }
    .scopes-expand-btn { height: 28px; min-width: 34px; padding: 0 8px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); background: var(--bg-surface-0); color: var(--fg-2); display: inline-flex; align-items: center; justify-content: center; }
    .scopes-expand-btn:hover { background: var(--hover); color: var(--fg); }
    .oauth-scopes-list { display: flex; flex-direction: column; }
    .scope-row { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-top: 1px solid var(--border-subtle); color: var(--fg-3); }
    .scope-row-name { font-size: 13px; font-weight: 500; font-family: var(--font-mono); color: var(--fg); }
    .scope-row-desc { font-size: 13px; color: var(--fg-3); }
    .oauth-form { display: flex; flex-direction: column; gap: 8px; }
    .oauth-submit-btn, .oauth-cancel-btn { width: 100%; height: 42px; }
    .oauth-legal { text-align: center; margin-top: 18px; display: flex; flex-direction: column; gap: 6px; }
    .oauth-legal-text { font-size: 12px; color: var(--fg-3); }
    .oauth-legal-text a { color: var(--fg); text-decoration: underline; }
    .hidden { display: none !important; }
    img:not([src]), img[src=""], img.hidden { display: none !important; }
    .app-logo-fallback { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; }
  </style>
</head>
<body class="surface-app">
  <div class="center-screen">
  <div class="panel oauth-card">
    <div class="oauth-handshake">
      <div class="oauth-logo-card">${clientLogoHtml}</div>
      <div class="handshake-beam" aria-hidden="true">
        <span class="beam-segment"></span>${renderSvg("link", 16)}<span class="beam-segment"></span>
      </div>
      <div class="oauth-avatar-card">
        <img src="/icon-512.png?v=3" srcset="/icon-128.png?v=3 1x, /icon-512.png?v=3 2x" width="60" height="60" alt="Krix">
      </div>
    </div>

    <div class="oauth-header">
      <h1>Authorize Access</h1>
      <p>Authorize Connection: <strong class="client-name-highlight">${safeName}</strong> is asking to connect to your Krix account.</p>
      <div class="oauth-domain-badge">
        <span class="domain-pill">
          <img src="https://www.google.com/s2/favicons?domain=${escapeHtml(domain)}&amp;sz=32" alt="" onerror="this.classList.add('hidden')">
          <span>${escapeHtml(domain)}</span>
        </span>
      </div>
    </div>

    <div class="oauth-user-badge">
      <span class="user-badge-label text-muted">Signed in as</span>
      <div class="oauth-user-details">
        <div class="oauth-user-line">Name: <strong>${ownerName}</strong></div>
        <div class="oauth-user-line">Email: <strong>${ownerEmail}</strong></div>
      </div>
    </div>

    <div class="oauth-scopes">
      <div class="scopes-head">
        <span class="scopes-title">This app will be able to</span>
        <button type="button" id="toggleScopesBtn" class="scopes-expand-btn" aria-expanded="false" aria-controls="oauthScopesList" title="Show permissions">${renderSvg("more-horizontal", 16)}</button>
      </div>
      <div id="oauthScopesList" class="oauth-scopes-list" hidden>
        ${scopeRow("terminal", "mcp:tools", "Use repository and coding sandbox tools")}
        ${scopeRow("cpu", "mcp:sandbox", "Run build scripts and tests in an isolated sandbox")}
        ${scopeRow("folder", "mcp:store", "Read and write your stored files")}
      </div>
    </div>

    <form method="POST" action="/oauth/authorize" class="oauth-form">
      <input type="hidden" name="client_id" value="${safeClientId}">
      <input type="hidden" name="redirect_uri" value="${safeRedirect}">
      <input type="hidden" name="scope" value="${safeScope}">
      <input type="hidden" name="state" value="${safeState}">
      <input type="hidden" name="code_challenge" value="${safeChallenge}">
      <input type="hidden" name="code_challenge_method" value="${safeMethod}">
      <button type="submit" class="btn primary oauth-submit-btn">Authorize Connection</button>
      <a href="${cancelUrl}" class="btn oauth-cancel-btn">Cancel</a>
    </form>

    <div class="oauth-legal">
      <span class="oauth-legal-text">By connecting, you agree to Krix’s <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a>.</span>
      <span class="oauth-legal-text">You can revoke access any time in API keys.</span>
    </div>
  </div>
  </div>

  <script nonce="${escapeHtml(params.nonce || "")}">
    window.addEventListener('error', function(e) {
      var target = e.target;
      if (target && target.tagName === 'IMG') {
        if (target.dataset.fallbackSrc && target.src !== target.dataset.fallbackSrc) {
          target.src = target.dataset.fallbackSrc;
          target.dataset.fallbackSrc = '';
        } else {
          target.style.display = 'none';
          target.classList.add('hidden');
          if (target.nextElementSibling) {
            target.nextElementSibling.classList.remove('hidden');
            target.nextElementSibling.style.display = 'inline-flex';
          }
        }
      }
    }, true);
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('img').forEach(function(img) {
        if (img.complete && img.naturalWidth === 0) {
          img.style.display = 'none';
          img.classList.add('hidden');
          if (img.nextElementSibling) {
            img.nextElementSibling.classList.remove('hidden');
            img.nextElementSibling.style.display = 'inline-flex';
          }
        }
      });
    });
  </script>
</body>
</html>`;
}
