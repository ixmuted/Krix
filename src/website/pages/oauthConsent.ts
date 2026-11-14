// OAuth 2.1 PKCE Authorization Consent Screen
// Visual Peer-to-Peer Handshake, Real Anime Avatar, Auto-Favicon Domain Resolver, and Scope Disclosures

import { getTokensCss } from "../tokens.css.js";
import { renderSvg, getAppLogoSvg } from "../icons.js";
import { escapeHtml } from "../components.js";

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
  const ownerEmail = escapeHtml(params.owner?.email || "owner@quickwitty.com");
  const ownerName = escapeHtml(
    params.owner?.name || ownerEmail.split("@")[0] || "User",
  );

  let domain = "external.app";
  try {
    const url = new URL(params.redirectUri);
    domain = url.hostname;
  } catch {}

  // Determine client icon using the same mechanism as the active authorizations table
  const clientWebsite =
    (params as any).clientUri ||
    (params as any).logoUri ||
    params.redirectUri ||
    domain;
  const clientIconSvg = getAppLogoSvg(
    params.clientName || safeName,
    32,
    clientWebsite,
  );

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
    .handshake-beam {
      animation: pulse-beam 2s ease-in-out infinite;
    }
  </style>
</head>
<body style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:32px 16px;">
  <!-- Ambient Radial Glow Mesh -->
  <div class="ambient-hero-mesh"></div>

  <div class="card spotlight-card card-top-border" style="max-width:480px; width:100%; padding:36px 32px; box-shadow:var(--shadow-popover); position:relative; z-index:1;">
    <!-- Peer-to-Peer Visual Handshake Lockup -->
    <div style="display:flex; align-items:center; justify-content:center; gap:20px; margin-bottom:28px;">
      <!-- Client Logo Card -->
      <div style="width:64px; height:64px; border-radius:var(--radius-xl); background:var(--bg-surface-1); border:1px solid var(--border-subtle); display:flex; align-items:center; justify-content:center; color:var(--fg); box-shadow:var(--shadow-md);">
        ${clientIconSvg}
      </div>

      <!-- Illuminated Laser Pulse Beam -->
      <div class="handshake-beam" style="display:flex; align-items:center; gap:4px; color:var(--success);">
        <span style="width:24px; height:2px; background:linear-gradient(90deg, var(--border-subtle), var(--success));"></span>
        <span class="status-dot-available"></span>
        <span style="width:24px; height:2px; background:linear-gradient(90deg, var(--success), var(--border-subtle));"></span>
      </div>

      <!-- Real Krix Anime Avatar Card -->
      <div style="width:64px; height:64px; border-radius:var(--radius-xl); background:var(--bg-surface-1); border:1px solid var(--border-subtle); overflow:hidden; display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-md);">
        <img src="/icon-48.png?v=2" alt="Krix" style="width:100%; height:100%; object-fit:cover;">
      </div>
    </div>

    <!-- Authorization Headline & Details -->
    <div style="text-align:center; display:flex; flex-direction:column; gap:8px; margin-bottom:24px;">
      <h1 style="font-size:22px; font-weight:700; letter-spacing:-0.02em; color:var(--fg);">
        Authorize Connection
      </h1>
      <p style="font-size:13px; color:var(--geist-gray-50); line-height:1.5;">
        <strong style="color:var(--fg);">${safeName}</strong> is requesting permission to connect to your Krix MCP Gateway.
      </p>

      <!-- Auto-Resolved Domain Badge Pill -->
      <div style="display:inline-flex; align-items:center; justify-content:center; gap:6px; margin-top:4px;">
        <span style="display:inline-flex; align-items:center; gap:6px; padding:3px 10px; border-radius:var(--radius-full); background:var(--bg-surface-2); border:1px solid var(--border-subtle); font-size:11px; font-family:var(--font-mono); color:var(--geist-gray-50);">
          <img src="https://www.google.com/s2/favicons?domain=${escapeHtml(domain)}&sz=32" alt="" style="width:12px; height:12px; border-radius:2px;" onerror="this.style.display='none'">
          <span>${escapeHtml(domain)}</span>
        </span>
      </div>
    </div>

    <!-- Signed-in Account Pill -->
    <div style="display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:var(--radius-md); background:var(--bg-surface-1); border:1px solid var(--border-subtle); margin-bottom:20px; font-size:12px;">
      <span class="status-dot-available" style="width:6px; height:6px;"></span>
      <span style="color:var(--geist-gray-50);">Signed in as:</span>
      <span style="color:var(--fg); font-weight:500;">${ownerName} (${ownerEmail})</span>
    </div>

    <!-- Requested Scope Disclosures -->
    <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:28px;">
      <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:var(--geist-gray-50);">Requested Scopes</div>
      
      <div style="display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:var(--radius-md); background:var(--bg-surface-1); border:1px solid var(--border-subtle);">
        ${renderSvg("terminal", 16)}
        <div style="flex:1;">
          <div style="font-size:12px; font-weight:600; color:var(--fg);">mcp:tools</div>
          <div style="font-size:11px; color:var(--geist-gray-50);">Execute repository navigation and coding sandbox tools</div>
        </div>
      </div>

      <div style="display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:var(--radius-md); background:var(--bg-surface-1); border:1px solid var(--border-subtle);">
        ${renderSvg("cpu", 16)}
        <div style="flex:1;">
          <div style="font-size:12px; font-weight:600; color:var(--fg);">mcp:sandbox</div>
          <div style="font-size:11px; color:var(--geist-gray-50);">Run isolated build scripts and test executions</div>
        </div>
      </div>

      <div style="display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:var(--radius-md); background:var(--bg-surface-1); border:1px solid var(--border-subtle);">
        ${renderSvg("folder", 16)}
        <div style="flex:1;">
          <div style="font-size:12px; font-weight:600; color:var(--fg);">mcp:store</div>
          <div style="font-size:11px; color:var(--geist-gray-50);">Access persistent file repository datasets</div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <form method="POST" action="/oauth/authorize" style="display:flex; flex-direction:column; gap:10px;">
      <input type="hidden" name="client_id" value="${safeClientId}">
      <input type="hidden" name="redirect_uri" value="${safeRedirect}">
      <input type="hidden" name="scope" value="${safeScope}">
      <input type="hidden" name="state" value="${safeState}">
      <input type="hidden" name="code_challenge" value="${safeChallenge}">
      <input type="hidden" name="code_challenge_method" value="${safeMethod}">

      <button type="submit" class="btn primary deploy-btn" style="width:100%; padding:11px; font-size:13px; border-radius:var(--radius-full);">
        Authorize Connection
      </button>

      <a href="${cancelUrl}" class="btn ghost" style="width:100%; padding:10px; font-size:13px; text-align:center;">
        Cancel
      </a>
    </form>

    <div style="text-align:center; margin-top:20px; display:flex; flex-direction:column; gap:8px;">
      <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap;">
        <a href="/privacy" target="_blank" class="btn ghost" style="padding:6px 14px; font-size:12px; border-radius:var(--radius-full); text-decoration:none;">Privacy Policy</a>
        <a href="/terms" target="_blank" class="btn ghost" style="padding:6px 14px; font-size:12px; border-radius:var(--radius-full); text-decoration:none;">Terms of Service</a>
      </div>
      <span style="font-size:11px; color:var(--geist-gray-50);">
        By connecting, you agree to Krix's <a href="/terms" target="_blank" style="color:var(--fg); text-decoration:underline;">Terms of Service</a> and <a href="/privacy" target="_blank" style="color:var(--fg); text-decoration:underline;">Privacy Policy</a>.
      </span>
      <span style="font-size:11px; color:var(--geist-gray-50);">
        You can revoke access anytime in Credentials &amp; Settings.
      </span>
    </div>
  </div>
</body>
</html>`;
}
