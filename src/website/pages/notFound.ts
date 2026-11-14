// Minimalist Chrome-Free 404 Error Viewport
// Contract Invariants: Exact <title>404 Not Found</title>, "404 Error", "Page Not Found", pathname, "/home"

import { getTokensCss } from "../tokens.css.js";
import { escapeHtml } from "../components.js";
import { renderSvg } from "../icons.js";

export function renderNotFoundPage(params: {
  base: string;
  isOwner?: boolean;
  owner?: any;
  pathname: string;
}): string {
  const safePath = escapeHtml(params.pathname || "/");

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>404 Not Found</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <style>
    ${getTokensCss()}
  </style>
</head>
<body style="display:flex; align-items:center; justify-content:center; min-height:100vh; padding:24px;">
  <div style="max-width:440px; width:100%; text-align:center; display:flex; flex-direction:column; align-items:center; gap:16px;">
    <!-- 404 Status Pill -->
    <div style="display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:var(--radius-full); background:var(--error-subtle); color:var(--error); font-size:12px; font-weight:600; font-family:var(--font-mono); border:1px solid rgba(239, 68, 68, 0.2);">
      ${renderSvg("alert", 14)}
      <span>404 Error</span>
    </div>

    <!-- Minimal Headline -->
    <h1 style="font-size:28px; font-weight:700; letter-spacing:-0.03em; color:var(--fg); margin-top:4px;">
      Page Not Found
    </h1>

    <!-- Contextual Explanation -->
    <p style="font-size:13px; color:var(--geist-gray-50); line-height:1.6;">
      The requested path <code style="padding:2px 6px; background:var(--bg-surface-2); border:1px solid var(--border-subtle); border-radius:4px; font-family:var(--font-mono); color:var(--fg);">${safePath}</code> could not be found on this server.
    </p>

    <!-- Recovery Navigation Actions -->
    <div style="display:flex; gap:12px; margin-top:8px; width:100%; justify-content:center;">
      <a href="/home" class="btn primary" style="padding:8px 18px; border-radius:var(--radius-full);">
        ${renderSvg("terminal", 14)}
        <span>Back to Home (/home)</span>
      </a>
    </div>
  </div>
</body>
</html>`;
}
