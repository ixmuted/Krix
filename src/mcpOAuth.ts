import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import express, { Router, type Request, type Response } from "express";
import {
  parseOwnerCookie,
  getPublicBaseUrl,
  isAuthorizedApiKey,
} from "./googleAuth.js";
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
  codeChallengeMethod: "S256" | "plain";
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

function escapeHtml(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
    fs.mkdirSync(path.dirname(keyPath), { recursive: true });
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

  try {
    const rsa = getRsaKeyPair();
    const header = { alg: "RS256", typ: "JWT", kid: rsa.jwk.kid };
    const h64 = Buffer.from(JSON.stringify(header)).toString("base64url");
    const p64 = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
    const dataToSign = `${h64}.${p64}`;

    const signer = crypto.createSign("RSA-SHA256");
    signer.update(dataToSign);
    const sig64 = signer.sign(rsa.privateKey, "base64url");

    return `${h64}.${p64}.${sig64}`;
  } catch {
    // Fallback to HMAC
    const header = { alg: "HS256", typ: "JWT" };
    const h64 = Buffer.from(JSON.stringify(header)).toString("base64url");
    const p64 = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
    const sig = crypto
      .createHmac("sha256", getSigningSecret())
      .update(`${h64}.${p64}`)
      .digest("base64url");
    return `${h64}.${p64}.${sig}`;
  }
}

function signRefreshToken(payload: Record<string, unknown>): string {
  const header = { alg: "HS256", typ: "JWT" };
  const fullPayload = {
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 30 * 86400, // 30 days
    ...payload,
    jti: crypto.randomBytes(16).toString("hex"),
  };
  const h64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const p64 = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(`${h64}.${p64}`)
    .digest("base64url");
  return `krix_rf_${h64}.${p64}.${sig}`;
}

export function verifyAccessToken(tokenString?: string | null): {
  valid: boolean;
  payload?: any;
} {
  if (!tokenString) return { valid: false };

  let token = tokenString.trim();
  if (token.startsWith("krix_rs_")) {
    token = token.slice("krix_rs_".length);
  } else if (token.startsWith("krix_tok_")) {
    token = token.slice("krix_tok_".length);
  }

  const parts = token.split(".");
  if (parts.length === 3) {
    const [h64, p64, sig64] = parts;
    try {
      const header = JSON.parse(
        Buffer.from(h64, "base64url").toString("utf-8"),
      );
      if (header.alg === "RS256") {
        const rsa = getRsaKeyPair();
        const verifier = crypto.createVerify("RSA-SHA256");
        verifier.update(`${h64}.${p64}`);
        const isValid = verifier.verify(rsa.publicKey, sig64, "base64url");
        if (isValid) {
          const payload = JSON.parse(
            Buffer.from(p64, "base64url").toString("utf-8"),
          );
          if (
            typeof payload.exp !== "number" ||
            Date.now() / 1000 < payload.exp
          ) {
            return { valid: true, payload };
          }
        }
      } else if (header.alg === "HS256") {
        const expectedSig = crypto
          .createHmac("sha256", getSigningSecret())
          .update(`${h64}.${p64}`)
          .digest("base64url");
        if (safeEqual(sig64, expectedSig)) {
          const payload = JSON.parse(
            Buffer.from(p64, "base64url").toString("utf-8"),
          );
          if (
            typeof payload.exp !== "number" ||
            Date.now() / 1000 < payload.exp
          ) {
            return { valid: true, payload };
          }
        }
      }
    } catch {}
  }

  // Fallback: Check memory cache
  const record = issuedTokens.get(tokenString);
  if (record && Date.now() < record.expiresAt) {
    return {
      valid: true,
      payload: {
        sub: record.ownerEmail,
        client_id: record.clientId,
        scope: record.scope,
      },
    };
  }

  return { valid: false };
}

export function createMcpOAuthRouter(): Router {
  const router = Router();

  // ---------------------------------------------------------------------------
  // RFC 9728: Protected Resource Metadata
  // ---------------------------------------------------------------------------
  router.get(
    "/.well-known/oauth-protected-resource",
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
  // RFC 7517: JWKS (JSON Web Key Set)
  // ---------------------------------------------------------------------------
  router.get("/.well-known/jwks.json", (_req: Request, res: Response): void => {
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
        grant_types_supported: [
          "authorization_code",
          "refresh_token",
          "client_credentials",
        ],
        token_endpoint_auth_methods_supported: [
          "client_secret_post",
          "client_secret_basic",
          "none",
        ],
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
        grant_types: [
          "authorization_code",
          "refresh_token",
          "client_credentials",
        ],
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
    let redirectUri = String(req.query.redirect_uri || "").trim();
    try {
      if (redirectUri.includes("%3A") || redirectUri.includes("%2F")) {
        redirectUri = decodeURIComponent(redirectUri);
      }
    } catch {}

    const responseType = String(req.query.response_type || "code");
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

    const owner = parseOwnerCookie(req);
    if (!owner) {
      const returnTo = encodeURIComponent(req.originalUrl);
      res.redirect(`/auth/google?returnTo=${returnTo}`);
      return;
    }

    const registered = registeredClients.get(clientId);
    let clientName = registered?.clientName;
    if (!clientName) {
      if (
        clientId.toLowerCase().includes("gemini") ||
        redirectUri.toLowerCase().includes("google")
      ) {
        clientName = "Google Gemini";
      } else if (clientId) {
        clientName = `Client (${clientId.slice(0, 16)})`;
      } else {
        clientName = "MCP Client";
      }
    }

    const displayEmail = owner.email
      ? decodeURIComponent(owner.email)
      : "Owner";
    const effectiveChallenge = codeChallenge || "direct_client_auth";
    const effectiveMethod = codeChallengeMethod === "plain" ? "plain" : "S256";

    const nonce = crypto.randomBytes(16).toString("base64");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader(
      "Content-Security-Policy",
      `default-src 'none'; style-src 'nonce-${nonce}' 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src 'self' https: data:; form-action 'self' https: http:; base-uri 'self'`,
    );

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Authorize Connection - Krix</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png">
  <style nonce="${nonce}">
    :root {
      color-scheme: light dark;
      --bg: #ffffff;
      --fg: #000000;
      --accents-1: #fafafa;
      --accents-2: #eaeaea;
      --accents-3: #999999;
      --accents-4: #888888;
      --accents-5: #666666;
      --border: var(--accents-2);
      --card: #ffffff;
      --accent: #0070f3;
    }
    .dark {
      --bg: #000000;
      --fg: #ffffff;
      --accents-1: #111111;
      --accents-2: #222222;
      --accents-3: #333333;
      --accents-4: #555555;
      --accents-5: #777777;
      --border: var(--accents-2);
      --card: #0a0a0a;
      --accent: #0070f3;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: var(--bg);
      color: var(--fg);
      background-image: radial-gradient(var(--accents-2) 1px, transparent 1px);
      background-size: 24px 24px;
      font: 14px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 20px;
    }
    .card {
      width: 100%;
      max-width: 440px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
    }
    .brand-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-size: 15px;
      color: var(--fg);
    }
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--accents-1);
    }
    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    h1 { font-size: 20px; font-weight: 700; letter-spacing: -0.3px; color: var(--fg); margin-bottom: 6px; }
    p.sub { color: var(--accents-5); font-size: 13px; margin-bottom: 20px; line-height: 1.5; }
    .user-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: var(--accents-1);
      border-radius: 8px;
      border: 1px solid var(--border);
      margin-bottom: 20px;
      font-size: 13px;
    }
    .user-badge img {
      width: 24px;
      height: 24px;
      border-radius: 50%;
    }
    .scopes {
      background: var(--accents-1);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 24px;
    }
    .scopes-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--accents-5);
      margin-bottom: 10px;
    }
    .scope-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: var(--fg);
      padding: 4px 0;
    }
    .actions {
      display: flex;
      gap: 10px;
    }
    .btn {
      flex: 1;
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      padding: 10px 16px;
      border-radius: 8px;
      cursor: pointer;
      text-align: center;
      text-decoration: none;
      transition: all .15s ease;
      border: 1px solid var(--border);
    }
    .btn.primary {
      background: var(--fg);
      color: var(--bg);
      border-color: var(--fg);
    }
    .btn.primary:hover { opacity: 0.9; }
    .btn.secondary {
      background: var(--accents-1);
      color: var(--fg);
    }
    .btn.secondary:hover { background: var(--accents-2); border-color: var(--accents-4); }
    .oauth-pill {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 20px;
      border: 1px solid var(--border);
      background: var(--accents-1);
      color: #0070f3;
    }
  </style>
  <script nonce="${nonce}">
    const t = localStorage.getItem('qw-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (t === 'dark') document.documentElement.classList.add('dark');
  </script>
</head>
<body>
  <div class="card">
    <div class="brand-bar">
      <div class="brand">
        <div class="avatar">
          <img src="/icon-48.png" alt="Krix">
        </div>
        <span>Krix</span>
      </div>
      <span class="oauth-pill">OAuth</span>
    </div>

    <h1>Authorize Access</h1>
    <p class="sub"><strong>${escapeHtml(clientName)}</strong> requests access to your isolated Krix MCP execution environment.</p>

    <div class="user-badge">
      ${owner.picture ? `<img src="${escapeHtml(owner.picture)}" alt="">` : ""}
      <div>Signed in as <strong>${escapeHtml(displayEmail)}</strong></div>
    </div>

    <div class="scopes">
      <div class="scopes-title">Permissions Requested</div>
      <div class="scope-item">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
        <span>Execute sandbox tools &amp; commands</span>
      </div>
      <div class="scope-item">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
        <span>Access sandbox uploads &amp; workspace</span>
      </div>
      <div class="scope-item">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        <span>Asymmetric cryptographic token verification</span>
      </div>
    </div>

    <form method="POST" action="/oauth/authorize">
      <input type="hidden" name="client_id" value="${escapeHtml(clientId)}">
      <input type="hidden" name="redirect_uri" value="${escapeHtml(redirectUri)}">
      <input type="hidden" name="code_challenge" value="${escapeHtml(effectiveChallenge)}">
      <input type="hidden" name="code_challenge_method" value="${escapeHtml(effectiveMethod)}">
      <input type="hidden" name="scope" value="${escapeHtml(scope)}">
      <input type="hidden" name="state" value="${escapeHtml(state)}">
      <div class="actions">
        <a href="/" class="btn secondary">Cancel</a>
        <button type="submit" class="btn primary">Approve &amp; Connect</button>
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
      let redirectUri = String(req.body.redirect_uri || "").trim();
      try {
        if (redirectUri.includes("%3A") || redirectUri.includes("%2F")) {
          redirectUri = decodeURIComponent(redirectUri);
        }
      } catch {}

      if (!redirectUri) {
        res.status(400).send("redirect_uri is required.");
        return;
      }

      let targetUrl: URL;
      try {
        targetUrl = new URL(redirectUri);
      } catch (e: any) {
        console.error(
          "[oauth] invalid redirect_uri on authorize:",
          redirectUri,
          e?.message,
        );
        res.status(400).send("Invalid redirect_uri.");
        return;
      }

      const codeChallenge = String(req.body.code_challenge || "");
      const codeChallengeMethod =
        String(req.body.code_challenge_method || "S256") === "plain"
          ? "plain"
          : "S256";
      const scope = String(req.body.scope || "mcp:tools");
      const state = String(req.body.state || "");

      const code = "krix_code_" + crypto.randomBytes(24).toString("base64url");
      activeAuthCodes.set(code, {
        code,
        clientId,
        redirectUri,
        codeChallenge,
        codeChallengeMethod,
        scope,
        ownerEmail: owner.email,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      });

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

      // 1. Authorization Code Grant (PKCE)
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

        let cleanReqUri = redirectUri.trim();
        try {
          if (cleanReqUri.includes("%3A") || cleanReqUri.includes("%2F")) {
            cleanReqUri = decodeURIComponent(cleanReqUri);
          }
        } catch {}

        let cleanEntryUri = (entry.redirectUri || "").trim();
        try {
          if (cleanEntryUri.includes("%3A") || cleanEntryUri.includes("%2F")) {
            cleanEntryUri = decodeURIComponent(cleanEntryUri);
          }
        } catch {}

        if (
          cleanEntryUri &&
          cleanReqUri &&
          cleanEntryUri !== cleanReqUri &&
          entry.redirectUri !== redirectUri
        ) {
          res.status(400).json({
            error: "invalid_grant",
            error_description: "Redirect URI mismatch.",
          });
          return;
        }

        // Verify PKCE if a challenge was registered
        if (
          entry.codeChallenge &&
          entry.codeChallenge !== "direct_client_auth"
        ) {
          const passes =
            entry.codeChallengeMethod === "plain"
              ? safeEqual(verifier, entry.codeChallenge)
              : verifyPkceS256(verifier, entry.codeChallenge);
          if (!passes) {
            res.status(400).json({
              error: "invalid_grant",
              error_description: "PKCE code_verifier challenge failed.",
            });
            return;
          }
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

      // 2. Client Credentials Grant (Direct API Key / Secret support)
      if (grantType === "client_credentials") {
        let clientId = String(req.body.client_id || "");
        let clientSecret = String(req.body.client_secret || "");

        // Support HTTP Basic client authentication (RFC 6749 Section 2.3.1)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Basic ")) {
          try {
            const creds = Buffer.from(authHeader.slice(6), "base64").toString(
              "utf-8",
            );
            const colon = creds.indexOf(":");
            if (colon !== -1) {
              clientId = decodeURIComponent(creds.slice(0, colon));
              clientSecret = decodeURIComponent(creds.slice(colon + 1));
            }
          } catch {}
        }

        const mcpKey = process.env.MCP_API_KEY;
        const isMaster = mcpKey && safeEqual(clientSecret, mcpKey);
        const isDyn = isAuthorizedApiKey(clientSecret);
        const registered = registeredClients.get(clientId);
        const isRegistered = Boolean(
          registered &&
          registered.clientSecret &&
          safeEqual(clientSecret, registered.clientSecret),
        );

        if (!isMaster && !isDyn && !isRegistered) {
          res.status(401).json({
            error: "invalid_client",
            error_description:
              "Client authentication failed. Invalid client_secret.",
          });
          return;
        }

        const base = getPublicBaseUrl(req);
        const ownerEmail = process.env.OWNER_EMAIL || "owner";
        const accessToken = signAccessToken({
          sub: ownerEmail,
          client_id: clientId || "mcp_client",
          scope: "mcp:tools mcp:sandbox",
          iss: base,
          aud: `${base}/mcp`,
          exp: Math.floor(Date.now() / 1000) + 86400,
        });
        registerSecret(accessToken);

        const tokenRecord: IssuedTokenEntry = {
          token: accessToken,
          refreshToken: "",
          clientId,
          ownerEmail,
          scope: "mcp:tools mcp:sandbox",
          expiresAt: Date.now() + 86400 * 1000,
          refreshExpiresAt: 0,
        };
        issuedTokens.set(accessToken, tokenRecord);

        res.json({
          access_token: accessToken,
          token_type: "Bearer",
          expires_in: 86400,
          scope: "mcp:tools mcp:sandbox",
        });
        return;
      }

      // 3. Refresh Token Grant
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

  // ---------------------------------------------------------------------------
  // Owner Active OAuth Authorizations Management
  // ---------------------------------------------------------------------------
  router.get("/oauth/authorizations", (req: Request, res: Response): void => {
    const owner = parseOwnerCookie(req);
    if (!owner) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }
    res.json({ authorizations: listActiveOAuthAuthorizations() });
  });

  router.delete(
    "/oauth/authorizations/:clientId",
    (req: Request, res: Response): void => {
      const owner = parseOwnerCookie(req);
      if (!owner) {
        res.status(401).json({ error: "Unauthorized." });
        return;
      }
      const clientId = String(req.params.clientId || "");
      const success = revokeOAuthAuthorization(clientId);
      res.json({ success });
    },
  );

  return router;
}

export interface ActiveOAuthInfo {
  clientId: string;
  clientName: string;
  scope: string;
  ownerEmail: string;
  createdAt: number;
  lastUsedAt?: number;
}

export function listActiveOAuthAuthorizations(): ActiveOAuthInfo[] {
  const result = new Map<string, ActiveOAuthInfo>();
  for (const client of registeredClients.values()) {
    result.set(client.clientId, {
      clientId: client.clientId,
      clientName: client.clientName || client.clientId,
      scope: "mcp:tools mcp:sandbox",
      ownerEmail: process.env.OWNER_EMAIL || "owner",
      createdAt: client.createdAt,
    });
  }
  for (const entry of issuedTokens.values()) {
    if (Date.now() < entry.expiresAt) {
      const existing = result.get(entry.clientId);
      if (existing) {
        existing.lastUsedAt = Math.max(
          existing.lastUsedAt || 0,
          entry.expiresAt - 86400 * 1000,
        );
      } else {
        result.set(entry.clientId, {
          clientId: entry.clientId,
          clientName: entry.clientId.toLowerCase().includes("gemini")
            ? "Google Gemini"
            : `Client (${entry.clientId.slice(0, 16)})`,
          scope: entry.scope,
          ownerEmail: entry.ownerEmail,
          createdAt: entry.expiresAt - 86400 * 1000,
          lastUsedAt: Date.now(),
        });
      }
    }
  }
  return Array.from(result.values());
}

export function revokeOAuthAuthorization(clientId: string): boolean {
  let found = false;
  if (registeredClients.has(clientId)) {
    registeredClients.delete(clientId);
    found = true;
  }
  for (const [token, entry] of issuedTokens.entries()) {
    if (entry.clientId === clientId) {
      issuedTokens.delete(token);
      found = true;
    }
  }
  for (const [token, entry] of refreshTokens.entries()) {
    if (entry.clientId === clientId) {
      refreshTokens.delete(token);
      found = true;
    }
  }
  return found;
}
