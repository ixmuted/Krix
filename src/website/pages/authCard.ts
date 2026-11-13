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
    <div style="min-height:50vh; display:flex; align-items:center; justify-content:center; padding:32px 16px;">
      <div class="card spotlight-card card-top-border" style="max-width:440px; width:100%; padding:36px 32px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:20px; box-shadow:var(--shadow-lg);">
        <!-- Shield/Lock Icon Avatar Halo -->
        <div style="width:52px; height:52px; border-radius:50%; background:var(--bg-surface-2); border:1px solid var(--border-subtle); display:flex; align-items:center; justify-content:center; color:var(--fg);">
          ${renderSvg("shield", 22)}
        </div>

        <!-- Typography -->
        <div style="display:flex; flex-direction:column; gap:8px;">
          <h2 style="font-size:20px; font-weight:700; letter-spacing:-0.02em; color:var(--fg);">
            ${escapeHtml(title)}
          </h2>
          <p style="font-size:13px; color:var(--geist-gray-50); line-height:1.5;">
            ${escapeHtml(message)}
          </p>
        </div>

        <!-- Sign in Action -->
        <a href="${loginUrl}" class="btn primary deploy-btn" style="width:100%; padding:10px 20px; font-size:13px; border-radius:var(--radius-full); gap:10px;">
          ${renderGoogleLogoSvg(18)}
          <span>Sign in with Google</span>
        </a>

        <!-- Security Clarification Footnote -->
        <span style="font-size:11px; color:var(--geist-gray-50); display:flex; align-items:center; gap:5px;">
          ${renderSvg("lock", 12)}
          <span>Single-User Access Control</span>
        </span>
      </div>
    </div>
  `;
}
