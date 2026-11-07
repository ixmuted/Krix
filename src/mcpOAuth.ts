import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import express, { Router, type Request, type Response } from "express";
import { parseOwnerCookie, getPublicBaseUrl } from "./googleAuth.js";
import { safeEqual, registerSecret } from "./security.js";

export interface OAuthClient {
  clientId: string;
  clientSecret?: string;
  clientName: string;
  redirectUris: string[];
  createdAt: number;
}

export interface AuthCodeEntry {
  code: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
  scope: string;
  ownerEmail: string;
  expiresAt: number;
}

export interface IssuedTokenEntry {
  token: string;
  refreshToken: string;
  clientId: string;
  ownerEmail: string;
  scope: string;
  expiresAt: number;
  refreshExpiresAt: number;
}

const registeredClients = new Map<string, OAuthClient>();
const activeAuthCodes = new Map<string, AuthCodeEntry>();
const issuedTokens = new Map<string, IssuedTokenEntry>();
const refreshTokens = new Map<string, IssuedTokenEntry>();

function getSigningSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.MCP_API_KEY ||
    "krix-default-oauth-signing-secret"
  );
}

function base64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function verifyPkceS256(verifier: string, challenge: string): boolean {
  const hash = crypto.createHash("sha256").update(verifier).digest();
  const calculated = base64url(hash);
  return safeEqual(calculated, challenge);
}

interface RsaKeyPair {
  privateKey: string;
  publicKey: string;
  jwk: {
    kty: "RSA";
    n: string;
    e: string;
    alg: "RS256";
    use: "sig";
    kid: string;
  };
}

let cachedRsaKey: RsaKeyPair | null = null;

export function getRsaKeyPair(): RsaKeyPair {
  if (cachedRsaKey) return cachedRsaKey;

  const keyPath = path.resolve(process.cwd(), "data", ".krix_rsa_key.json");

  // 1. Try environment variables
  if (process.env.RSA_PRIVATE_KEY && process.env.RSA_PUBLIC_KEY) {
    try {
      const pubObj = crypto.createPublicKey(process.env.RSA_PUBLIC_KEY);
      const exportedJwk = pubObj.export({ format: "jwk" }) as any;
      cachedRsaKey = {
        privateKey: process.env.RSA_PRIVATE_KEY,
        publicKey: process.env.RSA_PUBLIC_KEY,
        jwk: {
          kty: "RSA",
          n: exportedJwk.n,
          e: exportedJwk.e,
          alg: "RS256",
          use: "sig",
          kid: "krix-rsa-1",
        },
      };
      return cachedRsaKey;
    } catch {}
  }

  // 2. Try persistent cache file on disk
  if (fs.existsSync(keyPath)) {
    try {
      const raw = fs.readFileSync(keyPath, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.privateKey && parsed.publicKey && parsed.jwk) {
        cachedRsaKey = parsed;
        return cachedRsaKey!;
      }
    } catch {}
  }

  // 3. Generate 2048-bit RSA key pair
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  const pubObj = crypto.createPublicKey(publicKey);
  const exportedJwk = pubObj.export({ format: "jwk" }) as any;
  cachedRsaKey = {
    privateKey,
    publicKey,
    jwk: {
      kty: "RSA",
      n: exportedJwk.n,
      e: exportedJwk.e,
      alg: "RS256",
      use: "sig",
      kid: "krix-rsa-1",
    },
  };

  try {
    fs.writeFileSync(keyPath, JSON.stringify(cachedRsaKey, null, 2), "utf-8");
  } catch {}

  return cachedRsaKey;
}

function signAccessToken(payload: Record<string, unknown>): string {
  const fullPayload = {
    iat: Math.floor(Date.now() / 1000),
    ...payload,
    jti: crypto.randomBytes(16).toString("hex"),
  };
  const rsa = getRsaKeyPair();
  const head = base64url(
    Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT", kid: rsa.jwk.kid })),
  );
  const body = base64url(Buffer.from(JSON.stringify(fullPayload)));
  const sig = crypto
    .createSign("RSA-SHA256")
    .update(`${head}.${body}`)
    .sign(rsa.privateKey, "base64url");
  return `${head}.${body}.${sig}`;
}

function signRefreshToken(payload: Record<string, unknown>): string {
  const fullPayload = {
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 30 * 86400, // 30 days
    ...payload,
    jti: crypto.randomBytes(16).toString("hex"),
    typ: "refresh",
  };
  const head = base64url(
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })),
  );
  const body = base64url(Buffer.from(JSON.stringify(fullPayload)));
  const sig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(`${head}.${body}`)
    .digest("base64url");
  return `krix_rf_${head}.${body}.${sig}`;
}

export function verifyAccessToken(token: string): {
  valid: boolean;
  payload?: any;
  reason?: string;
} {
  // Check active in-memory tokens first
  const known = issuedTokens.get(token);
  if (known) {
    if (Date.now() > known.expiresAt) {
      issuedTokens.delete(token);
      return { valid: false, reason: "Token expired" };
    }
    return {
      valid: true,
      payload: {
        sub: known.ownerEmail,
        scope: known.scope,
        client_id: known.clientId,
      },
    };
  }

  // Stateless JWT verification
  const parts = token.split(".");
  if (parts.length !== 3)
    return { valid: false, reason: "Malformed token structure" };
  const [head, body, sig] = parts;

  let parsedHead: any = {};
  try {
    parsedHead = JSON.parse(Buffer.from(head, "base64url").toString("utf-8"));
  } catch {
    return { valid: false, reason: "Invalid token header" };
  }

  // 1. Asymmetric RS256 verification
  if (parsedHead.alg === "RS256") {
    try {
      const rsa = getRsaKeyPair();
      const valid = crypto
        .createVerify("RSA-SHA256")
        .update(`${head}.${body}`)
        .verify(rsa.publicKey, sig, "base64url");
      if (!valid) return { valid: false, reason: "Invalid RS256 signature" };

      const payload = JSON.parse(
        Buffer.from(body, "base64url").toString("utf-8"),
      );
      if (typeof payload.exp === "number" && Date.now() / 1000 > payload.exp) {
        return { valid: false, reason: "Token expired" };
      }
      return { valid: true, payload };
    } catch {
      return { valid: false, reason: "RS256 verification failed" };
    }
  }

  // 2. Symmetric HS256 verification (fallback)
  const expectedSig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(`${head}.${body}`)
    .digest("base64url");
  if (!safeEqual(sig, expectedSig))
    return { valid: false, reason: "Invalid signature" };

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf-8"),
    );
    if (typeof payload.exp === "number" && Date.now() / 1000 > payload.exp) {
      return { valid: false, reason: "Token expired" };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false, reason: "Unparseable token payload" };
  }
}

export function createMcpOAuthRouter(): Router {
  const router = Router();

  // ---------------------------------------------------------------------------
  // RFC 9728: Protected Resource Metadata
  // ---------------------------------------------------------------------------
  router.get(
    [
      "/.well-known/oauth-protected-resource",
      "/.well-known/oauth-protected-resource/mcp",
    ],
    (req: Request, res: Response): void => {
      const base = getPublicBaseUrl(req);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.json({
        resource: `${base}/mcp`,
        authorization_servers: [base],
        scopes_supported: ["mcp:tools", "mcp:sandbox", "mcp:admin"],
        bearer_methods_supported: ["header"],
      });
    },
  );

  // ---------------------------------------------------------------------------
  // RFC 7517: JSON Web Key Set (JWKS)
  // ---------------------------------------------------------------------------
  router.get("/.well-known/jwks.json", (req: Request, res: Response): void => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.json({
      keys: [getRsaKeyPair().jwk],
    });
  });

  // ---------------------------------------------------------------------------
  // RFC 8414: Authorization Server Metadata
  // ---------------------------------------------------------------------------
  router.get(
    "/.well-known/oauth-authorization-server",
    (req: Request, res: Response): void => {
      const base = getPublicBaseUrl(req);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.json({
        issuer: base,
        authorization_endpoint: `${base}/oauth/authorize`,
        token_endpoint: `${base}/oauth/token`,
        registration_endpoint: `${base}/oauth/register`,
        revocation_endpoint: `${base}/oauth/revoke`,
        jwks_uri: `${base}/.well-known/jwks.json`,
        response_types_supported: ["code"],
        code_challenge_methods_supported: ["S256"],
        grant_types_supported: ["authorization_code", "refresh_token"],
        token_endpoint_auth_methods_supported: ["client_secret_post", "none"],
        token_endpoint_auth_signing_alg_values_supported: ["RS256", "HS256"],
        scopes_supported: ["mcp:tools", "mcp:sandbox", "mcp:admin"],
      });
    },
  );

  // ---------------------------------------------------------------------------
  // RFC 7591: Dynamic Client Registration
  // ---------------------------------------------------------------------------
  router.post(
    "/oauth/register",
    express.json({ limit: "32kb" }),
    (req: Request, res: Response): void => {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const clientName =
        typeof body.client_name === "string"
          ? body.client_name.slice(0, 100)
          : "MCP Client";
      const rawUris = Array.isArray(body.redirect_uris)
        ? body.redirect_uris
        : [];
      const redirectUris = rawUris.filter(
        (u: unknown): u is string => typeof u === "string",
      );

      const clientId = "krix_client_" + crypto.randomBytes(16).toString("hex");
      const clientSecret = "krix_sec_" + crypto.randomBytes(32).toString("hex");
      registerSecret(clientSecret);

      const client: OAuthClient = {
        clientId,
        clientSecret,
        clientName,
        redirectUris,
        createdAt: Date.now(),
      };
      registeredClients.set(clientId, client);

      res.status(201).json({
        client_id: clientId,
        client_secret: clientSecret,
        client_name: clientName,
        redirect_uris: redirectUris,
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: "client_secret_post",
      });
    },
  );

  // ---------------------------------------------------------------------------
  // OAuth 2.1 Authorization Endpoint (GET displays consent, POST issues code)
  // ---------------------------------------------------------------------------
  router.get("/oauth/authorize", (req: Request, res: Response): void => {
    const clientId = String(req.query.client_id || "");
    const redirectUri = String(req.query.redirect_uri || "");
    const responseType = String(req.query.response_type || "");
    const codeChallenge = String(req.query.code_challenge || "");
    const codeChallengeMethod = String(
      req.query.code_challenge_method || "S256",
    );
    const scope = String(req.query.scope || "mcp:tools");
    const state = String(req.query.state || "");

    if (responseType !== "code") {
      res.status(400).send("Unsupported response_type. Must be 'code'.");
      return;
    }
    if (!codeChallenge) {
      res
        .status(400)
        .send("OAuth 2.1 requires PKCE: 'code_challenge' is required.");
      return;
    }
    if (codeChallengeMethod !== "S256") {
      res.status(400).send("OAuth 2.1 requires code_challenge_method='S256'.");
      return;
    }

    const owner = parseOwnerCookie(req);
    if (!owner) {
      const returnTo = encodeURIComponent(req.originalUrl);
      res.redirect(`/auth/google?returnTo=${returnTo}`);
      return;
    }

    const registered = registeredClients.get(clientId);
    const clientName =
      registered?.clientName ||
      (clientId ? `Client (${clientId.slice(0, 16)})` : "MCP Client");

    const nonce = crypto.randomBytes(16).toString("base64");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader(
      "Content-Security-Policy",
      `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; img-src 'self' https:; form-action 'self'`,
    );
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Authorize MCP Client - Krix</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style nonce="${nonce}">
    :root { color-scheme: dark; --bg:#090d13; --card:#121820; --line:#242c38; --fg:#c9d1d9; --dim:#7d8590; --hi:#f0f6fc; --ok:#238636; --accent:#58a6ff; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); color: var(--fg); font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 16px; }
    .card { width: 100%; max-width: 440px; background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08); }
    .head { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .icon { width: 44px; height: 44px; border-radius: 10px; background: #161b22; display: flex; align-items: center; justify-content: center; border: 1px solid var(--line); }
    h1 { font-size: 19px; color: var(--hi); font-weight: 600; }
    p.sub { color: var(--dim); font-size: 13px; margin-bottom: 20px; }
    .scope-box { background: rgba(88,166,255,0.05); border: 1px solid rgba(88,166,255,0.2); border-radius: 8px; padding: 14px; margin-bottom: 24px; }
    .scope-box h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--accent); margin-bottom: 6px; }
    .scope-box ul { list-style: none; }
    .scope-box li { font-size: 13px; color: var(--hi); display: flex; align-items: center; gap: 8px; padding: 3px 0; }
    .scope-box li::before { content: "✓"; color: #3fb950; font-weight: bold; }
    .user-info { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #0d1117; border-radius: 8px; border: 1px solid var(--line); margin-bottom: 24px; font-size: 13px; }
    .user-info img { width: 28px; height: 28px; border-radius: 50%; }
    .actions { display: flex; gap: 10px; }
    button { flex: 1; padding: 10px 16px; border-radius: 8px; font: inherit; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all .15s ease; }
    button.primary { background: var(--ok); color: #fff; }
    button.primary:hover { background: #2ea043; }
    button.secondary { background: transparent; border-color: var(--line); color: var(--dim); }
    button.secondary:hover { background: #21262d; color: var(--hi); }
  </style>
</head>
<body>
  <div class="card">
    <div class="head">
      <div class="icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>
      <div>
        <h1>Authorize Access</h1>
        <p class="sub">${encodeURIComponent(clientName)} requests access</p>
      </div>
    </div>

    <div class="user-info">
      ${owner.picture ? `<img src="${encodeURI(owner.picture)}" alt="">` : ""}
      <div>Signed in as <strong>${encodeURIComponent(owner.email)}</strong></div>
    </div>

    <div class="scope-box">
      <h3>Permissions Requested</h3>
      <ul>
        <li>Execute sandbox tools & code</li>
        <li>Access sandbox uploads & workspace</li>
        <li>GitHub & Render management</li>
      </ul>
    </div>

    <form method="POST" action="/oauth/authorize">
      <input type="hidden" name="client_id" value="${encodeURIComponent(clientId)}">
      <input type="hidden" name="redirect_uri" value="${encodeURIComponent(redirectUri)}">
      <input type="hidden" name="code_challenge" value="${encodeURIComponent(codeChallenge)}">
      <input type="hidden" name="code_challenge_method" value="S256">
      <input type="hidden" name="scope" value="${encodeURIComponent(scope)}">
      <input type="hidden" name="state" value="${encodeURIComponent(state)}">
      <div class="actions">
        <a href="/" style="text-decoration:none; flex:1;"><button type="button" class="secondary">Cancel</button></a>
        <button type="submit" class="primary">Approve &amp; Connect</button>
      </div>
    </form>
  </div>
</body>
</html>`);
  });

  router.post(
    "/oauth/authorize",
    express.urlencoded({ extended: false }),
    (req: Request, res: Response): void => {
      const owner = parseOwnerCookie(req);
      if (!owner) {
        res.status(401).send("Unauthorized. Sign in with Google.");
        return;
      }

      const clientId = String(req.body.client_id || "");
      const redirectUri = String(req.body.redirect_uri || "");
      const codeChallenge = String(req.body.code_challenge || "");
      const codeChallengeMethod = String(
        req.body.code_challenge_method || "S256",
      );
      const scope = String(req.body.scope || "mcp:tools");
      const state = String(req.body.state || "");

      if (!codeChallenge || codeChallengeMethod !== "S256") {
        res.status(400).send("Invalid PKCE parameters.");
        return;
      }

      const code = "krix_code_" + crypto.randomBytes(24).toString("base64url");
      activeAuthCodes.set(code, {
        code,
        clientId,
        redirectUri,
        codeChallenge,
        codeChallengeMethod: "S256",
        scope,
        ownerEmail: owner.email,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      });

      const targetUrl = new URL(redirectUri);
      targetUrl.searchParams.set("code", code);
      if (state) targetUrl.searchParams.set("state", state);

      res.redirect(targetUrl.toString());
    },
  );

  // ---------------------------------------------------------------------------
  // OAuth 2.1 Token Endpoint
  // ---------------------------------------------------------------------------
  router.post(
    "/oauth/token",
    express.urlencoded({ extended: false }),
    express.json({ limit: "16kb" }),
    (req: Request, res: Response): void => {
      const grantType = req.body.grant_type;

      if (grantType === "authorization_code") {
        const code = String(req.body.code || "");
        const verifier = String(req.body.code_verifier || "");
        const clientId = String(req.body.client_id || "");
        const redirectUri = String(req.body.redirect_uri || "");

        const entry = activeAuthCodes.get(code);
        if (!entry) {
          res.status(400).json({
            error: "invalid_grant",
            error_description: "Authorization code is invalid or expired.",
          });
          return;
        }

        activeAuthCodes.delete(code); // single-use

        if (Date.now() > entry.expiresAt) {
          res.status(400).json({
            error: "invalid_grant",
            error_description: "Authorization code expired.",
          });
          return;
        }

        if (
          entry.redirectUri &&
          redirectUri &&
          entry.redirectUri !== redirectUri
        ) {
          res.status(400).json({
            error: "invalid_grant",
            error_description: "Redirect URI mismatch.",
          });
          return;
        }

        // Verify PKCE S256
        if (!verifier || !verifyPkceS256(verifier, entry.codeChallenge)) {
          res.status(400).json({
            error: "invalid_grant",
            error_description: "PKCE code_verifier challenge failed.",
          });
          return;
        }

        const base = getPublicBaseUrl(req);
        const accessToken = signAccessToken({
          sub: entry.ownerEmail,
          client_id: clientId || entry.clientId,
          scope: entry.scope,
          iss: base,
          aud: `${base}/mcp`,
          exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
        });
        registerSecret(accessToken);

        const refreshToken = signRefreshToken({
          sub: entry.ownerEmail,
          client_id: clientId || entry.clientId,
          scope: entry.scope,
          iss: base,
          aud: `${base}/mcp`,
        });
        registerSecret(refreshToken);

        const tokenRecord: IssuedTokenEntry = {
          token: accessToken,
          refreshToken,
          clientId: clientId || entry.clientId,
          ownerEmail: entry.ownerEmail,
          scope: entry.scope,
          expiresAt: Date.now() + 86400 * 1000,
          refreshExpiresAt: Date.now() + 30 * 86400 * 1000,
        };

        issuedTokens.set(accessToken, tokenRecord);
        refreshTokens.set(refreshToken, tokenRecord);

        res.json({
          access_token: accessToken,
          token_type: "Bearer",
          expires_in: 86400,
          refresh_token: refreshToken,
          scope: entry.scope,
        });
        return;
      }

      if (grantType === "refresh_token") {
        const rawRefresh = String(req.body.refresh_token || "");
        let record = refreshTokens.get(rawRefresh);
        if (!record && rawRefresh.startsWith("krix_rf_")) {
          const parts = rawRefresh.slice("krix_rf_".length).split(".");
          if (parts.length === 3) {
            const [h, b, sig] = parts;
            const expectedSig = crypto
              .createHmac("sha256", getSigningSecret())
              .update(`${h}.${b}`)
              .digest("base64url");
            if (safeEqual(sig, expectedSig)) {
              try {
                const payload = JSON.parse(
                  Buffer.from(b, "base64url").toString("utf-8"),
                );
                if (
                  typeof payload.exp === "number" &&
                  Date.now() / 1000 < payload.exp
                ) {
                  record = {
                    token: "",
                    refreshToken: rawRefresh,
                    clientId: payload.client_id || "mcp_client",
                    ownerEmail:
                      payload.sub || process.env.OWNER_EMAIL || "owner",
                    scope: payload.scope || "mcp:tools",
                    expiresAt: Date.now() + 86400 * 1000,
                    refreshExpiresAt: payload.exp * 1000,
                  };
                }
              } catch {}
            }
          }
        }

        if (!record || Date.now() > record.refreshExpiresAt) {
          res.status(400).json({
            error: "invalid_grant",
            error_description: "Refresh token invalid or expired.",
          });
          return;
        }

        // Rotate tokens
        issuedTokens.delete(record.token);
        refreshTokens.delete(rawRefresh);

        const base = getPublicBaseUrl(req);
        const newAccess = signAccessToken({
          sub: record.ownerEmail,
          client_id: record.clientId,
          scope: record.scope,
          iss: base,
          aud: `${base}/mcp`,
          exp: Math.floor(Date.now() / 1000) + 86400,
        });
        const newRefresh = signRefreshToken({
          sub: record.ownerEmail,
          client_id: record.clientId,
          scope: record.scope,
          iss: base,
          aud: `${base}/mcp`,
        });
        registerSecret(newAccess);
        registerSecret(newRefresh);

        const updated: IssuedTokenEntry = {
          ...record,
          token: newAccess,
          refreshToken: newRefresh,
          expiresAt: Date.now() + 86400 * 1000,
          refreshExpiresAt: Date.now() + 30 * 86400 * 1000,
        };

        issuedTokens.set(newAccess, updated);
        refreshTokens.set(newRefresh, updated);

        res.json({
          access_token: newAccess,
          token_type: "Bearer",
          expires_in: 86400,
          refresh_token: newRefresh,
          scope: record.scope,
        });
        return;
      }

      res.status(400).json({
        error: "unsupported_grant_type",
        error_description: `Grant type '${grantType}' not supported.`,
      });
    },
  );

  // ---------------------------------------------------------------------------
  // Token Revocation Endpoint
  // ---------------------------------------------------------------------------
  router.post(
    "/oauth/revoke",
    express.urlencoded({ extended: false }),
    express.json({ limit: "8kb" }),
    (req: Request, res: Response): void => {
      const token = String(req.body.token || "");
      if (token) {
        issuedTokens.delete(token);
        refreshTokens.delete(token);
      }
      res.status(200).json({ revoked: true });
    },
  );

  return router;
}
