import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import crypto from "node:crypto";
import express from "express";
import {
  createMcpOAuthRouter,
  resetOAuthStateForTesting,
  listActiveOAuthAuthorizations,
  renameOAuthClient,
} from "../src/mcpOAuth.js";
import {
  createDynamicKey,
  renameDynamicKey,
  revokeDynamicKey,
} from "../src/googleAuth.js";

describe("OAuth multi-account separation & name limits", () => {
  let server: http.Server;
  let base = "";
  let cookie = "";
  const REDIRECT = "https://gemini.google.com/mcp/oauth/callback";

  before(async () => {
    resetOAuthStateForTesting();
    process.env.OWNER_EMAIL = "owner@example.com";
    process.env.SESSION_SECRET = "test-session-secret-0123456789-abcdef";
    const app = express();
    app.use(createMcpOAuthRouter());
    server = await new Promise<http.Server>((r) => {
      const s = app.listen(0, "127.0.0.1", () => r(s));
    });
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const payload = Buffer.from(
      JSON.stringify({
        email: "owner@example.com",
        expiresAt: Date.now() + 3600000,
      }),
    ).toString("base64url");
    const hmac = crypto
      .createHmac("sha256", process.env.SESSION_SECRET!)
      .update(payload)
      .digest("base64url");
    cookie = `krix_session=${payload}.${hmac}`;
  });

  after(async () => {
    await new Promise<void>((r) => server.close(() => r()));
  });

  async function connect(clientName: string) {
    const reg = await fetch(`${base}/oauth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: clientName,
        redirect_uris: [REDIRECT],
      }),
    });
    const client = (await reg.json()) as any;
    const verifier = crypto.randomBytes(32).toString("base64url");
    const challenge = crypto
      .createHash("sha256")
      .update(verifier)
      .digest("base64url");
    const auth = await fetch(`${base}/oauth/authorize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookie,
      },
      redirect: "manual",
      body: new URLSearchParams({
        client_id: client.client_id,
        redirect_uri: REDIRECT,
        code_challenge: challenge,
        code_challenge_method: "S256",
        scope: "mcp:tools",
        state: "s",
      }).toString(),
    });
    const code = new URL(auth.headers.get("location")!).searchParams.get(
      "code",
    )!;
    const tok = await fetch(`${base}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        code_verifier: verifier,
        client_id: client.client_id,
        redirect_uri: REDIRECT,
      }).toString(),
    });
    assert.equal(tok.status, 200);
    return client as any;
  }

  test("two Gemini accounts sharing a redirect URI stay separate, with a counter", async () => {
    const a = await connect("Google Gemini");
    const b = await connect("Google Gemini");
    assert.notEqual(a.client_id, b.client_id);
    assert.equal(a.client_name, "Google Gemini");
    assert.equal(b.client_name, "Google Gemini 2");

    const rows = listActiveOAuthAuthorizations();
    assert.equal(rows.length, 2, "both authorizations must be listed");
    assert.deepEqual(rows.map((r) => r.clientName).sort(), [
      "Google Gemini",
      "Google Gemini 2",
    ]);

    // Revoking one must not take the other with it.
    const del = await fetch(`${base}/oauth/authorizations/${a.client_id}`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    assert.equal(del.status, 200);
    const left = listActiveOAuthAuthorizations();
    assert.equal(left.length, 1);
    assert.equal(left[0].clientId, b.client_id);
  });

  test("registered client names are capped at 16 characters", async () => {
    const reg = await fetch(`${base}/oauth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: "An Extremely Long Client Name",
        redirect_uris: ["http://127.0.0.1:7001/cb"],
      }),
    });
    const client = (await reg.json()) as any;
    assert.ok(client.client_name.length <= 16);
  });

  test("OAuth rename enforces 4–16 characters and uniqueness", async () => {
    const x = await connect("Cursor");
    const y = await connect("Windsurf");
    assert.throws(() => renameOAuthClient(x.client_id, "abc"), /at least 4/);
    assert.throws(
      () => renameOAuthClient(x.client_id, "a".repeat(17)),
      /at most 16/,
    );
    assert.throws(
      () => renameOAuthClient(x.client_id, "windsurf"),
      /already exists/,
    );
    assert.equal(renameOAuthClient(y.client_id, "Work Laptop").clientName, "Work Laptop");
    assert.equal(renameOAuthClient(y.client_id, "a".repeat(16)).clientName.length, 16);

    const res = await fetch(`${base}/oauth/authorizations/${x.client_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "ab" }),
    });
    assert.equal(res.status, 400);
  });

  test("API key create/rename enforce 4–16 characters", () => {
    assert.throws(() => createDynamicKey("abc"), /at least 4/);
    assert.throws(() => createDynamicKey("x".repeat(17)), /at most 16/);
    const key = createDynamicKey("N-" + Date.now().toString(36));
    try {
      assert.throws(() => renameDynamicKey(key.id, "abc"), /at least 4/);
      assert.throws(
        () => renameDynamicKey(key.id, "x".repeat(17)),
        /at most 16/,
      );
      assert.equal(renameDynamicKey(key.id, "x".repeat(16)).label.length, 16);
    } finally {
      revokeDynamicKey(key.id);
    }
  });
});
