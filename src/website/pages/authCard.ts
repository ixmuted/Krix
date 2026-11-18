// Universal Authentication Required Viewport / Card

import { renderGoogleLogoSvg, renderSvg } from "../icons.js";
import { escapeHtml } from "../components.js";

export function renderAuthRequiredCard(
  title: string = "Authentication Required",
  messageOrReturnTo: string = "/",
  optionalReturnTo?: string,
): string {
  let message =
    "You must sign in with your Google Account to access this section.";
  let returnTo = "/";

  if (optionalReturnTo !== undefined) {
    message = messageOrReturnTo;
    returnTo = optionalReturnTo;
  } else if (messageOrReturnTo.startsWith("/")) {
    returnTo = messageOrReturnTo;
    message = `You must sign in with your Google Account to access the ${escapeHtml(title)} page.`;
  } else {
    message = messageOrReturnTo;
  }

  const safeReturn = encodeURIComponent(returnTo);
  const loginUrl = `/auth/google?returnTo=${safeReturn}`;
  const heading =
    title === "Authentication Required" ? "Sign in to continue" : title;

  return `
    <div class="auth-gate auth-required-viewport">
      <div class="auth-gate-card auth-required-card">
        <h2>${escapeHtml(heading)}</h2>
        <p class="text-muted">${escapeHtml(message)}</p>
        <div class="auth-required-box">
          <span class="badge">${renderSvg("lock", 13)}<span>Authentication Required</span></span>
          <a href="${loginUrl}" class="btn primary">
            ${renderGoogleLogoSvg(16)}
            <span>Sign in with Google</span>
          </a>
        </div>
      </div>
    </div>
  `;
}
