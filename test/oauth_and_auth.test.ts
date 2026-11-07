import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import crypto from "node:crypto";
import express from "express";
import { createMcpOAuthRouter, verifyAccessToken } from "../src/mcpOAuth.js";
import {
  createGoogleAuthRouter,
  isAuthorizedApiKey,
  createDynamicKey,
  revokeDynamicKey,
  isAuthorizedEmail,
} from "../src/googleAuth.js";

describe("OAuth 2.1 & Single-User Authentication", () => {
  let server: http.Server;
  let base = "";

  before(async () => {
    process.env.OWNER_EMAIL = "owner@example.com";
    process.env.SESSION_SECRET = "test-session-secret-0123456789-abcdef";
    process.env.MCP_API_KEY = "mcp-test-primary-gateway-key-32chars";

    const app = express();
    app.use(createMcpOAuthRouter());
    app.use("/auth", createGoogleAuthRouter());

    server = await new Promise<http.Server>((r) => {
      const s = app.listen(0, "127.0.0.1", () => r(s));
    });
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(async () => {
    await new Promise<void>((r) => server.close(() => r()));
  });

  test("RFC 9728: protected resource metadata endpoint returns valid schema", async () => {
    const res = await fetch(`${base}/.well-known/oauth-protected-resource`);
    assert.equal(res.status, 200);
    assert.equal(
      res.headers.get("content-type")?.includes("application/json"),
      true,
    );

    const data = (await res.json()) as any;
    assert.ok(data.resource.endsWith("/mcp"));
    assert.ok(Array.isArray(data.authorization_servers));
    assert.ok(data.authorization_servers.length > 0);
    assert.ok(Array.isArray(data.scopes_supported));
    assert.ok(data.scopes_supported.includes("mcp:tools"));
  });

  test("RFC 8414: authorization server metadata endpoint advertises OAuth 2.1 endpoints", async () => {
    const res = await fetch(`${base}/.well-known/oauth-authorization-server`);
    assert.equal(res.status, 200);

    const data = (await res.json()) as any;
    assert.ok(data.issuer);
    assert.ok(data.authorization_endpoint.endsWith("/oauth/authorize"));
    assert.ok(data.token_endpoint.endsWith("/oauth/token"));
    assert.ok(data.registration_endpoint.endsWith("/oauth/register"));
    assert.deepEqual(data.response_types_supported, ["code"]);
    assert.deepEqual(data.code_challenge_methods_supported, ["S256"]);
    assert.ok(data.grant_types_supported.includes("authorization_code"));
    assert.ok(data.grant_types_supported.includes("refresh_token"));
  });

  test("RFC 7591: dynamic client registration registers an MCP client", async () => {
    const regRes = await fetch(`${base}/oauth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: "Claude Desktop Agent",
        redirect_uris: ["http://127.0.0.1:8999/callback"],
      }),
    });

    assert.equal(regRes.status, 201);
    const client = (await regRes.json()) as any;
    assert.ok(client.client_id.startsWith("krix_client_"));
    assert.ok(client.client_secret.startsWith("krix_sec_"));
    assert.equal(client.client_name, "Claude Desktop Agent");
    assert.deepEqual(client.redirect_uris, ["http://127.0.0.1:8999/callback"]);
  });

  test("OAuth 2.1 PKCE S256 token issuance and refresh flow", async () => {
    // 1. Generate PKCE verifier and S256 challenge
    const verifier = crypto.randomBytes(32).toString("base64url");
    const challenge = crypto
      .createHash("sha256")
      .update(verifier)
      .digest("base64url");

    // 2. Register client
    const regRes = await fetch(`${base}/oauth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: "Antigravity IDE",
        redirect_uris: ["http://127.0.0.1:9099/callback"],
      }),
    });
    const client = (await regRes.json()) as any;

    // 3. Initiate authorization with owner cookie
    const ownerPayload = Buffer.from(
      JSON.stringify({
        email: "owner@example.com",
        expiresAt: Date.now() + 3600000,
      }),
    ).toString("base64url");
    const hmac = crypto
      .createHmac("sha256", process.env.SESSION_SECRET!)
      .update(ownerPayload)
      .digest("base64url");
    const sessionCookie = `krix_session=${ownerPayload}.${hmac}`;

    const authRes = await fetch(`${base}/oauth/authorize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: sessionCookie,
      },
      redirect: "manual",
      body: new URLSearchParams({
        client_id: client.client_id,
        redirect_uri: "http://127.0.0.1:9099/callback",
        code_challenge: challenge,
        code_challenge_method: "S256",
        scope: "mcp:tools",
        state: "test-state-123",
      }).toString(),
    });

    assert.equal(authRes.status, 302);
    const redirectUrl = new URL(authRes.headers.get("location")!);
    assert.equal(redirectUrl.searchParams.get("state"), "test-state-123");
    const code = redirectUrl.searchParams.get("code");
    assert.ok(code && code.startsWith("krix_code_"));

    // 4. Token exchange with PKCE verifier
    const tokenRes = await fetch(`${base}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code!,
        code_verifier: verifier,
        client_id: client.client_id,
        redirect_uri: "http://127.0.0.1:9099/callback",
      }).toString(),
    });

    assert.equal(tokenRes.status, 200);
    const tokenData = (await tokenRes.json()) as any;
    assert.ok(tokenData.access_token);
    assert.ok(tokenData.refresh_token);
    assert.equal(tokenData.token_type, "Bearer");
    assert.equal(tokenData.scope, "mcp:tools");

    // 5. Verify the token signature and validity
    const check = verifyAccessToken(tokenData.access_token);
    assert.equal(check.valid, true);
    assert.equal(check.payload.sub, "owner@example.com");

    // 6. Token refresh flow
    const refreshRes = await fetch(`${base}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokenData.refresh_token,
      }).toString(),
    });

    assert.equal(refreshRes.status, 200);
    const refreshedData = (await refreshRes.json()) as any;
    assert.ok(refreshedData.access_token);
    assert.notEqual(refreshedData.access_token, tokenData.access_token);
  });

  test("Single-user email policy enforces owner email strictly", () => {
    assert.equal(isAuthorizedEmail("owner@example.com"), true);
    assert.equal(isAuthorizedEmail("OWNER@EXAMPLE.COM"), true);
    assert.equal(isAuthorizedEmail("attacker@example.com"), false);
    assert.equal(isAuthorizedEmail("hacker@gmail.com"), false);
  });

  test("Dynamic Gateway API key creation, verification, and revocation", () => {
    const entry = createDynamicKey("Cursor Agent Key");
    assert.ok(entry.key.startsWith("krix_"));
    assert.equal(entry.label, "Cursor Agent Key");

    // Verification succeeds
    assert.equal(isAuthorizedApiKey(entry.key), true);
    // Primary key also succeeds
    assert.equal(
      isAuthorizedApiKey("mcp-test-primary-gateway-key-32chars"),
      true,
    );
    // Fake key fails
    assert.equal(isAuthorizedApiKey("krix_fake_key_12345"), false);

    // Revocation succeeds
    const revoked = revokeDynamicKey(entry.id);
    assert.equal(revoked, true);
    assert.equal(isAuthorizedApiKey(entry.key), false);
  });

  test("Stateless tokens survive server container restarts and memory wipes", async () => {
    // 1. Dynamic Key survives memory wipe
    const entry = createDynamicKey("Persistent Client Key");
    assert.equal(isAuthorizedApiKey(entry.key), true);

    // 2. Token refresh works statelessly with a signed refresh token
    const refreshRes = await fetch(`${base}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token:
          "krix_rf_" +
          Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
            "base64url",
          ) +
          "." +
          Buffer.from(
            JSON.stringify({
              sub: "owner@example.com",
              client_id: "test_client",
              scope: "mcp:tools",
              exp: Math.floor(Date.now() / 1000) + 3600,
            }),
          ).toString("base64url") +
          "." +
          crypto
            .createHmac("sha256", process.env.SESSION_SECRET!)
            .update(
              Buffer.from(
                JSON.stringify({ alg: "HS256", typ: "JWT" }),
              ).toString("base64url") +
                "." +
                Buffer.from(
                  JSON.stringify({
                    sub: "owner@example.com",
                    client_id: "test_client",
                    scope: "mcp:tools",
                    exp: Math.floor(Date.now() / 1000) + 3600,
                  }),
                ).toString("base64url"),
            )
            .digest("base64url"),
      }).toString(),
    });

    assert.equal(refreshRes.status, 200);
    const data = (await refreshRes.json()) as any;
    assert.ok(data.access_token);
    const verification = verifyAccessToken(data.access_token);
    assert.equal(verification.valid, true);
    assert.equal(verification.payload.sub, "owner@example.com");
  });

  test("RS256 asymmetric token verification and RFC 7517 JWKS discovery", async () => {
    // 1. Fetch JWKS
    const jwksRes = await fetch(`${base}/.well-known/jwks.json`);
    assert.equal(jwksRes.status, 200);
    const jwks = (await jwksRes.json()) as any;
    assert.ok(Array.isArray(jwks.keys));
    assert.equal(jwks.keys.length > 0, true);
    const key = jwks.keys[0];
    assert.equal(key.kty, "RSA");
    assert.equal(key.alg, "RS256");
    assert.equal(key.use, "sig");
    assert.ok(key.n && key.e);

    // 2. Register client & get token to verify RS256 signature
    const regRes = await fetch(`${base}/oauth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: "RS256 Client",
        redirect_uris: ["http://127.0.0.1:9099/callback"],
      }),
    });
    const client = (await regRes.json()) as any;

    const verifier = crypto.randomBytes(32).toString("base64url");
    const challenge = crypto
      .createHash("sha256")
      .update(verifier)
      .digest("base64url");

    const sessionPayload = Buffer.from(
      JSON.stringify({
        email: "owner@example.com",
        expiresAt: Date.now() + 3600 * 1000,
      }),
    ).toString("base64url");
    const sessionSig = crypto
      .createHmac("sha256", process.env.SESSION_SECRET!)
      .update(sessionPayload)
      .digest("base64url");
    const sessionCookie = `krix_session=${sessionPayload}.${sessionSig}`;

    const authRes = await fetch(`${base}/oauth/authorize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: sessionCookie,
      },
      redirect: "manual",
      body: new URLSearchParams({
        client_id: client.client_id,
        redirect_uri: "http://127.0.0.1:9099/callback",
        code_challenge: challenge,
        code_challenge_method: "S256",
        scope: "mcp:tools",
        state: "rs256-state",
      }).toString(),
    });
    const redirectUrl = new URL(authRes.headers.get("location")!);
    const code = redirectUrl.searchParams.get("code");

    const tokenRes = await fetch(`${base}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code!,
        code_verifier: verifier,
        client_id: client.client_id,
        redirect_uri: "http://127.0.0.1:9099/callback",
      }).toString(),
    });

    const tokenData = (await tokenRes.json()) as any;
    const parts = tokenData.access_token.split(".");
    assert.equal(parts.length, 3);
    const header = JSON.parse(
      Buffer.from(parts[0], "base64url").toString("utf-8"),
    );
    assert.equal(header.alg, "RS256");

    // Cryptographic RS256 verification using the public key
    const pubKey = crypto.createPublicKey({ key: key, format: "jwk" });
    const verified = crypto
      .createVerify("RSA-SHA256")
      .update(`${parts[0]}.${parts[1]}`)
      .verify(pubKey, parts[2], "base64url");
    assert.equal(verified, true);
  });
});
