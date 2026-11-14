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

  let primarySrc = "";
  let fallbackSrc = "";

  if (q.includes("gemini") || (origin && origin.includes("gemini"))) {
    primarySrc =
      "https://www.gstatic.com/lamda/images/gemini_sparkle_4g_512_lt_f94943af3be039176192d.png";
    fallbackSrc =
      "https://www.google.com/s2/favicons?domain_url=https://gemini.google.com&sz=64";
  } else if (
    q.includes("claude") ||
    q.includes("anthropic") ||
    (origin && (origin.includes("claude") || origin.includes("anthropic")))
  ) {
    primarySrc = "https://claude.ai/favicon.ico";
    fallbackSrc =
      "https://www.google.com/s2/favicons?domain_url=https://claude.ai&sz=64";
  } else if (params.logoUri) {
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

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Authorize Connection - Krix</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <style nonce="${escapeHtml(params.nonce || "")}">
    ${getTokensCss()}
    @keyframes pulse-beam {
      0%, 100% { opacity: 0.4; transform: scaleX(0.9); }
      50% { opacity: 1; transform: scaleX(1.1); }
    }
    .oauth-page-body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      box-sizing: border-box;
    }
    .oauth-card {
      max-width: 480px;
      width: 100%;
      padding: 36px 32px;
      box-shadow: var(--shadow-popover);
      position: relative;
      z-index: 1;
      box-sizing: border-box;
    }
    .oauth-handshake {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      margin-bottom: 28px;
    }
    .oauth-logo-card {
      width: 64px;
      height: 64px;
      border-radius: var(--radius-xl);
      background: var(--bg-surface-1);
      border: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--fg);
      box-shadow: var(--shadow-md);
      overflow: hidden;
    }
    .oauth-logo-card img.client-logo-img {
      width: 36px;
      height: 36px;
      object-fit: contain;
    }
    .oauth-avatar-card {
      width: 64px;
      height: 64px;
      border-radius: var(--radius-xl);
      background: var(--bg-surface-1);
      border: 1px solid var(--border-subtle);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-md);
    }
    .oauth-avatar-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .handshake-beam {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--success);
      animation: pulse-beam 2s ease-in-out infinite;
    }
    .beam-segment {
      width: 24px;
      height: 2px;
      background: linear-gradient(90deg, var(--border-subtle), var(--success));
    }
    .beam-segment.right {
      background: linear-gradient(90deg, var(--success), var(--border-subtle));
    }
    .oauth-header {
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 24px;
    }
    .oauth-header h1 {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--fg);
      margin: 0;
    }
    .oauth-header p {
      font-size: 13px;
      color: var(--geist-gray-50);
      line-height: 1.5;
      margin: 0;
    }
    .oauth-domain-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 4px;
    }
    .domain-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: var(--radius-full);
      background: var(--bg-surface-2);
      border: 1px solid var(--border-subtle);
      font-size: 11px;
      font-family: var(--font-mono);
      color: var(--geist-gray-50);
    }
    .domain-pill img {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }
    .oauth-user-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      background: var(--bg-surface-1);
      border: 1px solid var(--border-subtle);
      margin-bottom: 20px;
      font-size: 12px;
    }
    .oauth-user-badge strong {
      color: var(--fg);
      font-weight: 500;
    }
    .oauth-scopes {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 28px;
    }
    .scopes-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--geist-gray-50);
    }
    .scope-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      background: var(--bg-surface-1);
      border: 1px solid var(--border-subtle);
    }
    .scope-row-text {
      flex: 1;
    }
    .scope-row-name {
      font-size: 12px;
      font-weight: 600;
      color: var(--fg);
    }
    .scope-row-desc {
      font-size: 11px;
      color: var(--geist-gray-50);
    }
    .oauth-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .oauth-submit-btn {
      width: 100%;
      padding: 11px;
      font-size: 13px;
      border-radius: var(--radius-full);
      box-sizing: border-box;
      justify-content: center;
    }
    .oauth-cancel-btn {
      width: 100%;
      padding: 10px;
      font-size: 13px;
      text-align: center;
      box-sizing: border-box;
      justify-content: center;
      text-decoration: none;
    }
    .oauth-legal {
      text-align: center;
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .oauth-legal-buttons {
      display: flex;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .oauth-legal-btn {
      padding: 6px 14px;
      font-size: 12px;
      border-radius: var(--radius-full);
      text-decoration: none;
    }
    .oauth-legal-text {
      font-size: 11px;
      color: var(--geist-gray-50);
    }
    .oauth-legal-text a {
      color: var(--fg);
      text-decoration: underline;
    }
    .hidden {
      display: none !important;
    }
    img:not([src]),
    img[src=""],
    img.hidden {
      display: none !important;
    }
    .app-logo-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
    }
  </style>
</head>
<body class="oauth-page-body">
  <div class="ambient-hero-mesh"></div>

  <div class="card spotlight-card card-top-border oauth-card">
    <div class="oauth-handshake">
      <div class="oauth-logo-card">
        ${clientLogoHtml}
      </div>

      <div class="handshake-beam">
        <span class="beam-segment"></span>
        <span class="status-dot-available"></span>
        <span class="beam-segment right"></span>
      </div>

      <div class="oauth-avatar-card">
        <img src="/icon-48.png?v=2" alt="Krix">
      </div>
    </div>

    <div class="oauth-header">
      <h1>Authorize Access</h1>
      <p>
        Authorize Connection: <strong class="client-name-highlight">${safeName}</strong> is requesting permission to connect to your Krix MCP Gateway.
      </p>

      <div class="oauth-domain-badge">
        <span class="domain-pill">
          <img src="https://www.google.com/s2/favicons?domain=${escapeHtml(domain)}&amp;sz=32" alt="" onerror="this.classList.add('hidden')">
          <span>${escapeHtml(domain)}</span>
        </span>
      </div>
    </div>

    <div class="oauth-user-badge">
      <span class="status-dot-available"></span>
      <span class="user-badge-label">Signed in as:</span>
      <strong>${ownerName} (${ownerEmail})</strong>
    </div>

    <div class="oauth-scopes">
      <div class="scopes-title">Requested Scopes</div>
      
      <div class="scope-row">
        ${renderSvg("terminal", 16)}
        <div class="scope-row-text">
          <div class="scope-row-name">mcp:tools</div>
          <div class="scope-row-desc">Execute repository navigation and coding sandbox tools</div>
        </div>
      </div>

      <div class="scope-row">
        ${renderSvg("cpu", 16)}
        <div class="scope-row-text">
          <div class="scope-row-name">mcp:sandbox</div>
          <div class="scope-row-desc">Run isolated build scripts and test executions</div>
        </div>
      </div>

      <div class="scope-row">
        ${renderSvg("folder", 16)}
        <div class="scope-row-text">
          <div class="scope-row-name">mcp:store</div>
          <div class="scope-row-desc">Access persistent file repository datasets</div>
        </div>
      </div>
    </div>

    <form method="POST" action="/oauth/authorize" class="oauth-form">
      <input type="hidden" name="client_id" value="${safeClientId}">
      <input type="hidden" name="redirect_uri" value="${safeRedirect}">
      <input type="hidden" name="scope" value="${safeScope}">
      <input type="hidden" name="state" value="${safeState}">
      <input type="hidden" name="code_challenge" value="${safeChallenge}">
      <input type="hidden" name="code_challenge_method" value="${safeMethod}">

      <button type="submit" class="btn primary deploy-btn oauth-submit-btn">
        Authorize Connection
      </button>

      <a href="${cancelUrl}" class="btn ghost oauth-cancel-btn">
        Cancel
      </a>
    </form>

    <div class="oauth-legal">
      <div class="oauth-legal-buttons">
        <a href="/privacy" target="_blank" class="btn ghost oauth-legal-btn">Privacy Policy</a>
        <a href="/terms" target="_blank" class="btn ghost oauth-legal-btn">Terms of Service</a>
      </div>
      <span class="oauth-legal-text">
        By connecting, you agree to Krix's <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a>.
      </span>
      <span class="oauth-legal-text">
        You can revoke access anytime in Credentials &amp; Settings.
      </span>
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
