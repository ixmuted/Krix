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
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>404 Not Found</title>
  <link rel="icon" type="image/svg+xml" href="/logo.svg?v=4">
  <link rel="icon" type="image/x-icon" href="/favicon.ico?v=3">
  <script>
    (function () {
      try {
        var m = localStorage.getItem('qw-theme');
        var dark = m === 'dark' || (m !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('dark', dark);
      } catch (e) {}
    })();
  </script>
  <style>
    ${getTokensCss()}
  </style>
</head>
<body>
  <div class="center-screen">
    <div class="auth-gate-card">
      <span class="badge bad">${renderSvg("alert", 14)}<span>404 Error</span></span>
      <h1 class="page-title">Page Not Found</h1>
      <p class="text-muted">There is nothing at <code class="inline-code">${safePath}</code> on this server.</p>
      <a href="/" class="btn primary">Back to home</a>
    </div>
  </div>
</body>
</html>`;
}
