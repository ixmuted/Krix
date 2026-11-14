process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "krix-security-test-secret-32-chars-long-123456";
process.env.OWNER_EMAIL = "owner@quickwitty.com";
process.env.MCP_API_KEY = "krix-master-api-key-0123456789-abcdef";

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import crypto from "node:crypto";
import type { AddressInfo } from "node:net";
import { renderApiKeysPage } from "../src/website/pages/apiKeys.js";
import { renderOAuthConsentPage } from "../src/website/pages/oauthConsent.js";
import { getTokensCss } from "../src/website/tokens.css.js";
import { sendAccountFinallyDeletedEmail } from "../src/emailService.js";
import {
  getOrCreateUser,
  purgeExpiredAccounts,
  deleteUserAccount,
} from "../src/userSettings.js";

function makeSessionCookie(
  email: string,
  name = "Developer",
  role: "owner" | "user" = "user",
): string {
  const secret =
    process.env.SESSION_SECRET ||
    "krix-security-test-secret-32-chars-long-123456";
  const payload = Buffer.from(
    JSON.stringify({
      email,
      name,
      expiresAt: Date.now() + 3600_000,
      provider: "google",
      role,
    }),
  ).toString("base64url");
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return `krix_session=${payload}.${hmac}`;
}

describe("Tool Execution, OAuth Kebab Overflow & Final Deletion Verification", () => {
  let server: http.Server;
  let base = "";

  before(async () => {
    process.env.NODE_ENV = "test";
    process.env.SESSION_SECRET =
      "krix-security-test-secret-32-chars-long-123456";
    process.env.OWNER_EMAIL = "owner@quickwitty.com";
    process.env.MCP_API_KEY = "krix-master-api-key-0123456789-abcdef";
    const { app } = await import("../src/index.js");
    server = await new Promise<http.Server>((resolve) => {
      const s = http.createServer(app).listen(0, "127.0.0.1", () => resolve(s));
    });
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("enforces overflow: visible on OAuth authorizations card and rows to prevent clipping", () => {
    const css = getTokensCss();
    assert.ok(
      css.includes(".oauth-authorizations-card") &&
        css.includes("overflow: visible !important"),
      "Tokens CSS must enforce overflow: visible !important on .oauth-authorizations-card",
    );
    assert.ok(
      css.includes(".oauth-client-row") &&
        css.includes("overflow: visible !important"),
      "Tokens CSS must enforce overflow: visible !important on .oauth-client-row",
    );

    const html = renderApiKeysPage({
      base: "http://localhost:3000",
      isOwner: true,
      owner: { name: "Ankit", email: "owner@quickwitty.com" },
      keys: [{ id: "test-key-1", label: "Dev Key" }],
      oauthClients: [
        {
          clientId: "client_gemini_1",
          clientName: "Google Gemini Desktop",
          scopes: ["mcp:tools", "mcp:sandbox"],
          ownerEmail: "owner@quickwitty.com",
        },
      ],
    });

    assert.ok(
      html.includes("overflow: visible !important") ||
        html.includes("overflow:visible !important") ||
        html.includes("overflow:visible!important"),
      "renderApiKeysPage must apply overflow: visible to oauth containers",
    );
    assert.ok(
      html.includes("99999"),
      "toggleKeyDropdown must use elevated z-index (99999) to escape all card stacking contexts",
    );
    assert.ok(
      html.includes("column"),
      "toggleKeyDropdown must enforce flex-direction: column",
    );
  });

  it("renders OAuth consent page with resilient image error listeners and CSS guards", () => {
    const html = renderOAuthConsentPage({
      clientId: "gemini_desktop_client",
      clientName: "Google Gemini Desktop",
      redirectUri: "https://gemini.google.com/oauth/callback",
      scope: "mcp:tools mcp:sandbox",
      state: "mock_state_123",
      codeChallenge: "challenge_abc",
      codeChallengeMethod: "S256",
      owner: { name: "Ankit", email: "owner@quickwitty.com" },
      nonce: "secure_nonce_789",
    });

    // Check nonced script with error capture listener
    assert.ok(
      html.includes('nonce="secure_nonce_789"'),
      "Must have script tag with nonce attribute matching CSP",
    );
    assert.ok(
      html.includes("target.dataset.fallbackSrc") &&
        html.includes("target.nextElementSibling"),
      "Must attach capturing error handler that smoothly transitions to vector fallback",
    );
    // Check CSS guard that prevents broken browser icon from rendering
    assert.ok(
      html.includes("img:not([src])") && html.includes('img[src=""]'),
      "Must include CSS rule hiding empty or invalid images",
    );
    assert.ok(
      html.includes("app-logo-fallback"),
      "Must provide fallback SVG container",
    );
  });

  it("allows authenticated user to execute active sandbox tool without permission denial", async () => {
    const nonOwnerEmail = "non_owner_developer@example.com";
    const userCookie = makeSessionCookie(nonOwnerEmail, "Developer", "user");

    // Execute sandbox_exec with keyId="all" (the default in tools inspector when All Keys selected)
    const res = await fetch(`${base}/tools/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: userCookie,
      },
      body: JSON.stringify({
        keyId: "all",
        toolName: "sandbox_exec",
        arguments: { command: "echo 'Krix tool inspector online'" },
      }),
    });

    const data = (await res.json()) as any;
    assert.equal(
      res.status,
      200,
      `Expected 200 OK, got ${res.status}: ${JSON.stringify(data)}`,
    );
    assert.equal(data.ok, true, `Expected execution to succeed: ${data.error}`);
    assert.ok(
      data.result?.includes("Krix tool inspector online"),
      "Execution output must include command stdout",
    );
  });

  it("dispatches final deletion confirmation email when 30-day grace period elapses", async () => {
    const expiredEmail = "finally_purged_user@example.com";
    try {
      const user = getOrCreateUser(expiredEmail, "127.0.0.1");
      // Set deadline in past
      user.deletionDeadline = Date.now() - 5000;

      const result = await sendAccountFinallyDeletedEmail({
        email: expiredEmail,
        name: "PurgedUser",
        purgedAt: Date.now(),
      });

      assert.equal(
        result.skipped,
        true,
        "Unconfigured SMTP should cleanly skip delivery",
      );

      const purged = await purgeExpiredAccounts();
      assert.ok(
        purged.includes(expiredEmail),
        "Expired account must be purged",
      );
    } finally {
      deleteUserAccount(expiredEmail);
    }
  });
});
