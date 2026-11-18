// Universal Authentication Required Viewport / Card
// Contract Invariants: Lock icon, Google Sign In button, returnTo preservation, title & message with "MCP API key"

import { renderGoogleLogoSvg, renderSvg } from "../icons.js";
import { escapeHtml } from "../components.js";

export function renderAuthRequiredCard(
  title: string = "Authentication Required",
  messageOrReturnTo: string = "/home",
  optionalReturnTo?: string,
): string {
  let message =
    "You must sign in as the verified service owner or authenticate with your MCP API key to access this section.";
  let returnTo = "/home";

  if (optionalReturnTo !== undefined) {
    message = messageOrReturnTo;
    returnTo = optionalReturnTo;
  } else if (messageOrReturnTo.startsWith("/")) {
    returnTo = messageOrReturnTo;
    message = `You must sign in as the verified service owner or authenticate with your MCP API key to access the ${escapeHtml(title)} page.`;
  } else {
    message = messageOrReturnTo;
  }

  const safeReturn = encodeURIComponent(returnTo);
  const loginUrl = `/auth/google?returnTo=${safeReturn}`;

  return `
    <div class="auth-gate auth-required-viewport">
      <div class="auth-gate-card auth-required-card">
        <span class="badge">${renderSvg("lock", 13)}<span>Authentication Required</span></span>
        <h2>${escapeHtml(title)}</h2>
        <p class="text-muted">${escapeHtml(message)}</p>
        <a href="${loginUrl}" class="btn primary">
          ${renderGoogleLogoSvg(16)}
          <span>Sign in with Google</span>
        </a>
      </div>
    </div>
  `;
}
