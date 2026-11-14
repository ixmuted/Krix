// Barrel Re-Export for Krix Modular Website Architecture (src/website/)
// Full drop-in replacement for legacy views.ts with 100% test contract preservation

export { renderHeader, renderFooter } from "./shell.js";
export {
  renderPageShell,
  escapeHtml,
  formatBytes,
  getBaseStyles,
  renderKebabMenu,
  renderCommandPaletteModal,
  renderScrollProgressFab,
} from "./components.js";
export { getTokensCss } from "./tokens.css.js";
export { getClientScripts } from "./clientScripts.js";
export {
  renderSvg,
  renderGoogleLogoSvg,
  getCanonicalLogoUrl,
} from "./icons.js";

export { renderHomePage } from "./pages/home.js";
export { renderApiKeysPage } from "./pages/apiKeys.js";
export { renderApiKeySettingsPage } from "./pages/apiKeySettings.js";
export { renderToolsPage } from "./pages/tools.js";
export { renderStatsPage } from "./pages/stats.js";
export { renderStorePage } from "./pages/store.js";
export { renderUploadPage } from "./pages/upload.js";
export { renderSettingsPage } from "./pages/settings.js";
export { renderNotFoundPage } from "./pages/notFound.js";
export { renderOAuthConsentPage } from "./pages/oauthConsent.js";
export { renderAuthRequiredCard } from "./pages/authCard.js";
export { renderPrivacyPage, renderTermsPage } from "./pages/legal.js";
export { renderHelpPage } from "./pages/help.js";

export interface StoredFileInfo {
  id: string;
  name: string;
  size: number;
  contentType: string;
  createdAt: Date | string | number;
  expiresAt: Date | string | null;
  source: "store" | "sandbox";
  downloadUrl: string;
  permanent: boolean;
  shareUrl?: string;
  isPublic?: boolean;
  isOwned?: boolean;
}

export interface PageInfo {
  ttlMinutes: number;
  retentionMinutes: number;
  maxFileMb: number;
  maxTotalMb: number;
  maxFiles: number;
  owner?: any;
}

export function renderRecaptchaScript(nonce?: string): string {
  const siteKey =
    process.env.RECAPTCHA_SITE_KEY ||
    process.env.GOOGLE_RECAPTCHA_SITE_KEY ||
    "6Ld_sample_krix_recaptcha_key";
  return `
    <script src="https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}"${nonce ? ` nonce="${nonce}"` : ""}></script>
    <script${nonce ? ` nonce="${nonce}"` : ""}>
      if (typeof grecaptcha !== 'undefined') {
        grecaptcha.ready(function() {
          // Google reCAPTCHA v3 active
        });
      }
    </script>
  `;
}
