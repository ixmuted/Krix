import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  renderHeader,
  renderFooter,
  renderNotFoundPage,
  renderToolsPage,
  renderApiKeysPage,
  renderUploadPage,
  renderStatsPage,
  renderStorePage,
  renderSettingsPage,
  renderOAuthConsentPage,
  renderSvg,
  renderGoogleLogoSvg,
  getBaseStyles,
  escapeHtml,
  formatBytes,
} from "../src/website/index.js";

describe("Clean-Room Modular UI (src/website/) Quality Gates", () => {
  test("renderSvg returns valid SVG vectors at size 15 for github and render", () => {
    const gh = renderSvg("github", 15);
    const rn = renderSvg("render", 15);
    assert.match(gh, /^<svg/);
    assert.match(gh, /width="15"/);
    assert.match(rn, /^<svg/);
    assert.match(rn, /width="15"/);
  });

  test("renderHeader adheres to navigation and profile contract invariants", () => {
    const html = renderHeader("home", {
      email: "owner@quickwitty.com",
      name: "Ankit",
    });
    assert.match(html, /profile-avatar-wrap/);
    assert.match(html, /mobile-subnav/);
    assert.match(html, /mobile-subnav-scroll/);
    assert.match(html, /mobile-subnav-pill active/);
    assert.match(html, /href="\/home"/);
    assert.match(html, /href="\/upload"/);
    assert.match(html, /href="\/store"/);
    assert.match(html, /href="\/stats"/);
    assert.match(html, /href="\/tools"/);
    assert.match(html, /href="\/api"/);
    assert.match(html, /https:\/\/quickwitty\.onrender\.com/);
    assert.doesNotMatch(html, /id="themeToggleBtn"/);
    assert.doesNotMatch(html, /id="krixCommandTrigger"/);
    // Zero operation words
    assert.doesNotMatch(html, /operational/i);
  });

  test("renderNotFoundPage adheres to exact title and recovery link invariants", () => {
    const html = renderNotFoundPage({
      base: "http://localhost:3000",
      pathname: "/missing-subsystem",
    });
    assert.match(html, /<title>404 Not Found<\/title>/);
    assert.match(html, /404 Error/);
    assert.match(html, /Page Not Found/);
    assert.match(html, /\/missing-subsystem/);
    assert.match(html, /\/home/);
    assert.match(html, /\/tools/);
  });

  test("renderToolsPage adheres to exact title and empty placeholder invariants", () => {
    const html = renderToolsPage({
      base: "http://localhost:3000",
      isOwner: true,
      owner: { name: "Ankit", email: "ankit@quickwitty.com" },
      tools: [
        {
          name: "search_repositories",
          category: "GitHub",
          description: "Search repos",
        },
      ],
    });
    assert.match(html, /<title>Tools<\/title>/);
    assert.match(html, /id="toolSearchInput"/);
    assert.match(html, /placeholder=""/);
  });

  test("renderApiKeysPage adheres to credential management and DOM ID invariants", () => {
    const html = renderApiKeysPage({
      base: "http://localhost:3000",
      keys: [
        {
          id: "key_abc123",
          label: "Agent Key",
          key: "krix_live_secret_token_12345",
        },
      ],
      oauthClients: [{ clientId: "cursor_mcp", clientName: "Cursor AI" }],
      credentials: {
        githubToken: "ghp_123456789",
        renderApiKey: "rnd_987654321",
      },
    });
    assert.match(html, /key-display-scroll/);
    assert.match(html, /toggleKeyReveal/);
    assert.match(html, /oauthSearchInput/);
    assert.match(html, /filterOAuth/);
    assert.match(html, /id="providerCredentialsCard"/);
    assert.match(html, /id="githubTokenCode"/);
    assert.match(html, /id="renderTokenCode"/);
    assert.match(html, /toggleCredReveal/);
    assert.match(html, /copyCredSecret/);
    // Kebab items must NOT contain ellipses
    assert.doesNotMatch(html, /Configure\.\.\./);
    assert.doesNotMatch(html, /Rename\.\.\./);
    assert.doesNotMatch(html, /Revoke\.\.\./);
  });

  test("renderUploadPage adheres to >Keep< switch and disallows legacy misleading text", () => {
    const html = renderUploadPage("mock_nonce_123", {
      owner: { email: "owner@quickwitty.com" },
    });
    assert.match(html, />Keep</);
    assert.doesNotMatch(html, />Permanent Storage</);
    assert.doesNotMatch(html, /Exempt uploaded files from 24h auto-cleanup/);
    assert.doesNotMatch(html, /Files are saved in your sandbox at upload/);
  });

  test("renderStatsPage adheres to exact title, daily chunk nav, and N/A peak traffic fallback", () => {
    const html = renderStatsPage({
      base: "http://localhost:3000",
      isOwner: true,
      owner: { name: "Ankit", email: "ankit@quickwitty.com" },
      summary: {
        totalRequests: 0,
        peakTraffic: { peakHourUtc: null, peakDay: null },
      },
    });
    assert.match(html, /<title>Stats<\/title>/);
    assert.match(html, /statsKeySearchInput/);
    assert.match(html, /dailyChunkNav/);
    assert.match(html, /btnPrevDailyChunk/);
    assert.match(html, /btnNextDailyChunk/);
    assert.match(html, /N\/A/);
  });

  test("renderSettingsPage displays 50MB quota card for non-owners and 300MB for owner", () => {
    const userHtml = renderSettingsPage({
      base: "http://localhost:3000",
      isOwner: false,
      owner: { name: "Dev", email: "dev@example.com", role: "user" },
      keys: [],
      keySettings: {},
      userQuota: { role: "user" },
      toolsCatalog: [],
      credentialAvailability: {},
      codeGraphCount: 0,
    });
    assert.match(userHtml, /50\s*MB/);

    const ownerHtml = renderSettingsPage({
      base: "http://localhost:3000",
      isOwner: true,
      owner: { name: "Admin", email: "admin@example.com", role: "owner" },
      keys: [],
      keySettings: {},
      userQuota: { role: "owner" },
      toolsCatalog: [],
      credentialAvailability: {},
      codeGraphCount: 0,
    });
    assert.match(ownerHtml, /300\s*MB/);
  });

  test("renderOAuthConsentPage features handshake, real anime avatar, and auto-favicon", () => {
    const html = renderOAuthConsentPage({
      clientId: "gemini_desktop",
      clientName: "Google Gemini Desktop",
      redirectUri: "https://gemini.google.com/oauth/callback",
      scope: "mcp:tools mcp:sandbox",
      state: "xyz",
      codeChallenge: "challenge_123",
      codeChallengeMethod: "S256",
      owner: { name: "Ankit", email: "owner@quickwitty.com" },
      nonce: "mock_nonce",
    });
    assert.match(html, /Authorize Connection/);
    assert.match(html, /Google Gemini Desktop/);
    assert.match(html, /gemini\.google\.com/);
    assert.match(html, /\/icon-48\.png\?v=2/);
    assert.match(html, /handshake-beam/);
    // Zero operation words
    assert.doesNotMatch(html, /operational/i);
    assert.doesNotMatch(html, /operation/i);
  });
});
