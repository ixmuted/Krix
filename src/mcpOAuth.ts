import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import express, { Router, type Request, type Response } from "express";
import { statsTracker } from "./stats.js";
import {
  parseOwnerCookie,
  getPublicBaseUrl,
  isAuthorizedApiKey,
  getMongoDb,
  ensureMongoAuth,
} from "./googleAuth.js";
import { safeEqual, registerSecret } from "./security.js";
import { getKeySettings } from "./userSettings.js";
import { renderSvg } from "./website/icons.js";
import { renderOAuthConsentPage } from "./website/pages/oauthConsent.js";
import {
  getClientIp,
  getUserAgent,
  sendOAuthClientSetupEmail,
} from "./emailService.js";

export interface OAuthClient {
  clientId: string;
  clientSecret?: string;
  clientName: string;
  redirectUris: string[];
  clientUri?: string;
  logoUri?: string;
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
const revokedClientIds = new Set<string>();
const revokedTokenIds = new Set<string>();

const OAUTH_FILE = path.resolve(process.cwd(), "data", ".krix_oauth.json");

function saveOAuthToDisk(): void {
  try {
    fs.mkdirSync(path.dirname(OAUTH_FILE), { recursive: true });
    const payload = {
      clients: Array.from(registeredClients.entries()),
      tokens: Array.from(issuedTokens.entries()),
      revokedClientIds: Array.from(revokedClientIds),
      revokedTokenIds: Array.from(revokedTokenIds),
    };
    fs.writeFileSync(OAUTH_FILE, JSON.stringify(payload, null, 2), "utf-8");
  } catch {}
}

export function loadOAuthFromDisk(): void {
  try {
    if (fs.existsSync(OAUTH_FILE)) {
      const data = JSON.parse(fs.readFileSync(OAUTH_FILE, "utf-8"));
      if (Array.isArray(data.clients)) {
        const sorted = [...data.clients]
          .sort((a, b) => (b[1]?.createdAt || 0) - (a[1]?.createdAt || 0))
          .slice(0, 20);
        for (const [id, client] of sorted) {
          registeredClients.set(id, client);
        }
      }
      if (Array.isArray(data.revokedClientIds)) {
        for (const id of data.revokedClientIds)
          if (typeof id === "string") revokedClientIds.add(id);
      }
      if (Array.isArray(data.revokedTokenIds)) {
        for (const id of data.revokedTokenIds)
          if (typeof id === "string") revokedTokenIds.add(id);
      }
      if (Array.isArray(data.tokens)) {
        for (const [tok, entry] of data.tokens) {
          if (Date.now() < entry.expiresAt) {
            issuedTokens.set(tok, entry);
            if (entry.refreshToken) {
              refreshTokens.set(entry.refreshToken, entry);
            }
          }
        }
      }
    }
  } catch {}
}
loadOAuthFromDisk();

export async function loadOAuthFromMongo(): Promise<void> {
  await ensureMongoAuth().catch(() => {});
  const db = getMongoDb();
  if (!db) {
    if (
      process.env.MONGODB_URI ||
      process.env.MONGO_URL ||
      process.env.DATABASE_URL
    ) {
      throw new Error(
        "MongoDB is configured but unavailable; OAuth client was not persisted.",
      );
    }
    return;
  }
  try {
    const col = db.collection("oauth_clients");
    const docs = await col.find({}).toArray();
    for (const d of docs) {
      const clientId =
        d.clientId || d.client_id || (d._id ? String(d._id) : "");
      if (d.revoked) {
        if (clientId) {
          registeredClients.delete(clientId);
          revokedClientIds.add(clientId);
        }
      } else if (clientId) {
        registeredClients.set(clientId, {
          clientId,
          clientSecret: d.clientSecret || d.client_secret || "",
          clientName:
            d.clientName ||
            d.client_name ||
            d.name ||
            (clientId.toLowerCase().includes("gemini")
              ? "Google Gemini"
              : clientId),
          redirectUris: d.redirectUris || d.redirect_uris || [],
          createdAt: d.createdAt || Date.now(),
        });
      }
    }

    const tokCol = db.collection("oauth_tokens");
    const tokDocs = await tokCol.find({}).toArray();
    for (const td of tokDocs) {
      const token = td.token || td.access_token || td.accessToken;
      const clientId = td.clientId || td.client_id;
      if (td.revoked) {
        if (token) issuedTokens.delete(token);
        const revokedRefresh = td.refreshToken || td.refresh_token;
        if (revokedRefresh) refreshTokens.delete(revokedRefresh);
      } else if (token && clientId) {
        const entry: IssuedTokenEntry = {
          token,
          refreshToken: td.refreshToken || td.refresh_token || "",
          clientId,
          ownerEmail:
            td.ownerEmail ||
            td.email ||
            td.owner_email ||
            process.env.OWNER_EMAIL ||
            "owner",
          scope: td.scope || "mcp:tools mcp:sandbox",
          expiresAt: td.expiresAt || Date.now() + 86400 * 1000,
          refreshExpiresAt:
            td.refreshExpiresAt || Date.now() + 30 * 86400 * 1000,
        };
        issuedTokens.set(token, entry);
        if (entry.refreshToken) {
          refreshTokens.set(entry.refreshToken, entry);
        }
      }
    }
  } catch (err: any) {
    console.error("[mongo-oauth] loadOAuthFromMongo error:", err?.message);
    throw err;
  }
}
loadOAuthFromMongo().catch((err) => {
  if (
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    process.env.DATABASE_URL
  ) {
    console.error("[mongo-oauth] initial restore failed:", err?.message || err);
  }
});

export async function syncOAuthClientToMongo(
  client: OAuthClient,
): Promise<void> {
  await ensureMongoAuth().catch(() => {});
  revokedClientIds.delete(client.clientId);
  const db = getMongoDb();
  if (!db) {
    if (
      process.env.MONGODB_URI ||
      process.env.MONGO_URL ||
      process.env.DATABASE_URL
    ) {
      throw new Error(
        "MongoDB is configured but unavailable; OAuth client was not persisted.",
      );
    }
    return;
  }
  try {
    const col = db.collection("oauth_clients");
    await col.updateOne(
      { clientId: client.clientId },
      { $set: { ...client, revoked: false, updatedAt: Date.now() } },
      { upsert: true },
    );
  } catch (err: any) {
    console.error("[mongo-oauth] syncOAuthClientToMongo error:", err?.message);
    throw err;
  }
}

export async function revokeOAuthClientInMongo(
  clientId: string,
): Promise<boolean> {
  await ensureMongoAuth().catch(() => {});
  const db = getMongoDb();
  if (!db) {
    if (
      process.env.MONGODB_URI ||
      process.env.MONGO_URL ||
      process.env.DATABASE_URL
    ) {
      throw new Error(
        "MongoDB unavailable; cannot confirm OAuth client revocation.",
      );
    }
    return false;
  }
  try {
    const col = db.collection("oauth_clients");
    const result = await col.updateOne(
      { clientId },
      { $set: { revoked: true, revokedAt: Date.now() } },
    );
    return result.matchedCount > 0 || result.upsertedCount > 0;
  } catch (err: any) {
    console.error(
      "[mongo-oauth] revokeOAuthClientInMongo error:",
      err?.message,
    );
    throw err;
  }
}

export async function syncOAuthTokenToMongo(
  token: string,
  entry: IssuedTokenEntry,
): Promise<void> {
  await ensureMongoAuth().catch(() => {});
  const db = getMongoDb();
  if (!db) {
    if (
      process.env.MONGODB_URI ||
      process.env.MONGO_URL ||
      process.env.DATABASE_URL
    ) {
      throw new Error(
        "MongoDB is configured but unavailable; OAuth token was not persisted.",
      );
    }
    return;
  }
  try {
    const col = db.collection("oauth_tokens");
    await col.updateOne(
      { token },
      { $set: { ...entry, revoked: false, updatedAt: Date.now() } },
      { upsert: true },
    );
  } catch (err: any) {
    console.error("[mongo-oauth] syncOAuthTokenToMongo error:", err?.message);
    throw err;
  }
}

export async function recordIssuedToken(
  entry: IssuedTokenEntry,
): Promise<void> {
  // Ensure newly authorized OAuth clients inherit global default tool settings
  if (entry.clientId) {
    getKeySettings(entry.clientId);
  }
  // Persist first; do not issue credentials that cannot be restored after restart.
  await syncOAuthTokenToMongo(entry.token, entry);
  issuedTokens.set(entry.token, entry);
  if (entry.refreshToken) refreshTokens.set(entry.refreshToken, entry);
  for (const raw of [entry.token, entry.refreshToken]) {
    if (!raw) continue;
    try {
      const normalized = raw.startsWith("krix_rf_")
        ? raw.slice("krix_rf_".length)
        : raw.startsWith("krix_rs_")
          ? raw.slice("krix_rs_".length)
          : raw.startsWith("krix_tok_")
            ? raw.slice("krix_tok_".length)
            : raw;
      const payload = JSON.parse(
        Buffer.from(normalized.split(".")[1], "base64url").toString("utf8"),
      );
      if (payload.jti) revokedTokenIds.delete(String(payload.jti));
    } catch {}
  }
  revokedClientIds.delete(entry.clientId);
  saveOAuthToDisk();
}

export async function revokeOAuthTokenInMongo(
  clientId: string,
): Promise<boolean> {
  await ensureMongoAuth().catch(() => {});
  const db = getMongoDb();
  if (!db) {
    if (
      process.env.MONGODB_URI ||
      process.env.MONGO_URL ||
      process.env.DATABASE_URL
    ) {
      throw new Error(
        "MongoDB unavailable; cannot confirm OAuth token revocation.",
      );
    }
    return false;
  }
  try {
    const col = db.collection("oauth_tokens");
    const result = await col.updateMany(
      { clientId },
      { $set: { revoked: true, revokedAt: Date.now() } },
    );
    return result.matchedCount > 0;
  } catch (err: any) {
    console.error("[mongo-oauth] revokeOAuthTokenInMongo error:", err?.message);
    throw err;
  }
}

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

export async function verifyAccessToken(tokenString?: string | null): Promise<{
  valid: boolean;
  payload?: any;
}> {
  if (!tokenString) return { valid: false };

  let token = tokenString.trim();
  if (token.startsWith("krix_rs_")) token = token.slice("krix_rs_".length);
  else if (token.startsWith("krix_tok_"))
    token = token.slice("krix_tok_".length);

  const parts = token.split(".");
  if (parts.length !== 3) return { valid: false };

  try {
    const [h64, p64, sig64] = parts;
    const header = JSON.parse(Buffer.from(h64, "base64url").toString("utf-8"));
    let signatureValid = false;
    if (header.alg === "RS256") {
      const rsa = getRsaKeyPair();
      const verifier = crypto.createVerify("RSA-SHA256");
      verifier.update(`${h64}.${p64}`);
      signatureValid = verifier.verify(rsa.publicKey, sig64, "base64url");
    } else if (header.alg === "HS256") {
      const expectedSig = crypto
        .createHmac("sha256", getSigningSecret())
        .update(`${h64}.${p64}`)
        .digest("base64url");
      signatureValid = safeEqual(sig64, expectedSig);
    }
    if (!signatureValid) return { valid: false };

    const payload = JSON.parse(Buffer.from(p64, "base64url").toString("utf-8"));
    if (typeof payload.exp !== "number" || Date.now() / 1000 >= payload.exp) {
      return { valid: false };
    }
    // Require a token identifier and a matching issued-token record. A valid
    // signature alone is never sufficient after revocation.
    if (typeof payload.jti !== "string" || !payload.jti)
      return { valid: false };
    if (
      revokedTokenIds.has(payload.jti) ||
      revokedClientIds.has(String(payload.client_id || ""))
    ) {
      return { valid: false };
    }

    const memoryEntry =
      issuedTokens.get(tokenString) || issuedTokens.get(token);

    await ensureMongoAuth().catch(() => {});
    const db = getMongoDb();
    if (db) {
      const tokenDoc = await db.collection("oauth_tokens").findOne({
        token: { $in: [tokenString, token] },
        revoked: { $ne: true },
      });
      if (!tokenDoc) return { valid: false };
      const clientId =
        tokenDoc.clientId || tokenDoc.client_id || payload.client_id;
      if (!clientId) return { valid: false };
      const clientDoc = await db
        .collection("oauth_clients")
        .findOne({ clientId });
      if (!clientDoc || clientDoc.revoked === true) return { valid: false };
      return { valid: true, payload };
    }

    // Without MongoDB, only accept tokens present in the process's persisted
    // local cache. This keeps local development functional but avoids trusting
    // arbitrary self-signed/old JWTs.
    if (
      process.env.MONGODB_URI ||
      process.env.MONGO_URL ||
      process.env.DATABASE_URL
    ) {
      return { valid: false };
    }
    if (!memoryEntry || Date.now() >= memoryEntry.expiresAt)
      return { valid: false };
    if (
      revokedClientIds.has(memoryEntry.clientId) ||
      !registeredClients.has(memoryEntry.clientId)
    )
      return { valid: false };
    return { valid: true, payload };
  } catch (error: any) {
    console.error(
      "[oauth] access-token verification failed:",
      error?.message || error,
    );
    return { valid: false };
  }
}

async function revokeOAuthTokenRecord(token: string): Promise<void> {
  const normalized =
    token.startsWith("krix_rs_") || token.startsWith("krix_tok_")
      ? token.slice(token.indexOf("_", 5) + 1)
      : token;
  const accessEntry = issuedTokens.get(token) || issuedTokens.get(normalized);
  const refreshEntry = refreshTokens.get(token);
  const family = accessEntry || refreshEntry;
  for (const raw of [token, family?.token, family?.refreshToken]) {
    if (!raw) continue;
    try {
      const stripped = raw.startsWith("krix_rf_")
        ? raw.slice("krix_rf_".length)
        : raw.startsWith("krix_rs_")
          ? raw.slice("krix_rs_".length)
          : raw.startsWith("krix_tok_")
            ? raw.slice("krix_tok_".length)
            : raw;
      const payload = JSON.parse(
        Buffer.from(stripped.split(".")[1], "base64url").toString("utf8"),
      );
      if (payload.jti) revokedTokenIds.add(String(payload.jti));
    } catch {}
  }

  if (family) {
    issuedTokens.delete(family.token);
    if (family.refreshToken) refreshTokens.delete(family.refreshToken);
    if (family.token) issuedTokens.delete(family.token);
  }
  issuedTokens.delete(token);
  refreshTokens.delete(token);
  saveOAuthToDisk();

  await ensureMongoAuth().catch(() => {});
  const db = getMongoDb();
  if (db) {
    await db.collection("oauth_tokens").updateMany(
      {
        $or: [{ token: { $in: [token, normalized] } }, { refreshToken: token }],
      },
      {
        $set: { revoked: true, revokedAt: Date.now(), updatedAt: Date.now() },
      },
    );
  } else if (
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    process.env.DATABASE_URL
  ) {
    throw new Error(
      "MongoDB unavailable; token revocation could not be persisted.",
    );
  }
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
        resource_name: "Krix",
        resource: `${base}/mcp`,
        authorization_servers: [base],
        scopes_supported: ["mcp:tools", "mcp:sandbox", "mcp:admin"],
        bearer_methods_supported: ["header"],
        resource_documentation: `${base}`,
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
        service_documentation: `${base}`,
        ui_locales_supported: ["en"],
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
      if (registeredClients.size >= 20) {
        res.status(400).json({
          error: "invalid_request",
          error_description:
            "Maximum limit of 20 OAuth client authorizations reached. Delete an existing authorization to connect a new client.",
        });
        return;
      }
      let clientName =
        typeof body.client_name === "string" && body.client_name.trim()
          ? body.client_name.trim().slice(0, 100)
          : "";
      const rawUris = Array.isArray(body.redirect_uris)
        ? body.redirect_uris
        : [];
      const redirectUris = rawUris.filter(
        (u: unknown): u is string => typeof u === "string",
      );

      // Auto-detect human-friendly provider name if generic or missing
      if (
        !clientName ||
        clientName === "MCP Client" ||
        clientName.startsWith("Client (")
      ) {
        const urisStr = redirectUris.join(" ").toLowerCase();
        if (urisStr.includes("google") || urisStr.includes("gemini")) {
          clientName = "Google Gemini";
        } else if (urisStr.includes("openai") || urisStr.includes("chatgpt")) {
          clientName = "ChatGPT";
        } else if (
          urisStr.includes("anthropic") ||
          urisStr.includes("claude")
        ) {
          clientName = "Claude";
        } else if (urisStr.includes("cursor")) {
          clientName = "Cursor";
        } else {
          clientName = "OAuth Client";
        }
      }

      // Check if this client is already registered (re-registration / reconnect)
      // Matching by non-empty redirect_uris or existing client with matching name
      for (const existing of registeredClients.values()) {
        const hasMatchingUri =
          redirectUris.length > 0 &&
          existing.redirectUris.some((u) => redirectUris.includes(u));
        const hasMatchingName =
          clientName &&
          clientName !== "OAuth Client" &&
          existing.clientName.toLowerCase() === clientName.toLowerCase();

        if (hasMatchingUri || (hasMatchingName && redirectUris.length === 0)) {
          // Re-use existing client registration to prevent duplicate client rows
          if (clientName && clientName !== "OAuth Client") {
            existing.clientName = clientName;
          }
          if (redirectUris.length > 0) {
            existing.redirectUris = Array.from(
              new Set([...existing.redirectUris, ...redirectUris]),
            );
          }
          saveOAuthToDisk();
          syncOAuthClientToMongo(existing).catch(() => {});
          res.status(200).json({
            client_id: existing.clientId,
            client_secret: existing.clientSecret,
            client_name: existing.clientName,
            redirect_uris: existing.redirectUris,
            grant_types: [
              "authorization_code",
              "refresh_token",
              "client_credentials",
            ],
            response_types: ["code"],
            token_endpoint_auth_method: "client_secret_post",
          });
          return;
        }
      }

      const clientId = "krix_client_" + crypto.randomBytes(16).toString("hex");
      const clientSecret = "krix_sec_" + crypto.randomBytes(32).toString("hex");
      registerSecret(clientSecret);

      const clientUri =
        typeof body.client_uri === "string" && body.client_uri.trim()
          ? body.client_uri.trim()
          : undefined;
      const logoUri =
        typeof body.logo_uri === "string" && body.logo_uri.trim()
          ? body.logo_uri.trim()
          : undefined;

      const client: OAuthClient = {
        clientId,
        clientSecret,
        clientName,
        redirectUris,
        clientUri,
        logoUri,
        createdAt: Date.now(),
      };
      registeredClients.set(clientId, client);
      getKeySettings(clientId);
      saveOAuthToDisk();
      syncOAuthClientToMongo(client).catch((error) =>
        console.error(
          "[mongo-oauth] client rename persistence failed:",
          error?.message || error,
        ),
      );

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

    let domain = "";
    try {
      const u = new URL(redirectUri);
      domain = u.hostname;
    } catch {}
    const clientRecord = getOAuthClient(clientId);
    const clientWebsite =
      clientRecord?.logoUri ||
      clientRecord?.clientUri ||
      (Array.isArray(clientRecord?.redirectUris)
        ? clientRecord?.redirectUris.find(
            (u: string) => !u.includes("localhost") && !u.includes("127.0.0.1"),
          )
        : undefined) ||
      (domain && !domain.includes("localhost") && !domain.includes("127.0.0.1")
        ? `https://${domain}`
        : undefined);

    const q = (clientName || clientId || "").toLowerCase();
    const matchedHost = q.includes("gemini")
      ? "https://gemini.google.com"
      : q.includes("claude")
        ? "https://claude.ai"
        : q.includes("chatgpt") || q.includes("openai")
          ? "https://chatgpt.com"
          : q.includes("cursor")
            ? "https://cursor.com"
            : q.includes("windsurf")
              ? "https://windsurf.com"
              : q.includes("github")
                ? "https://github.com"
                : undefined;
    const resolvedOrigin = clientWebsite || matchedHost;
    const faviconProxyUrl = resolvedOrigin
      ? `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(resolvedOrigin)}&sz=64`
      : "";

    const cancelUrl = redirectUri
      ? `${redirectUri}${redirectUri.includes("?") ? "&" : "?"}error=access_denied&state=${encodeURIComponent(state || "")}`
      : "/";

    const nonce = crypto.randomBytes(16).toString("base64");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader(
      "Content-Security-Policy",
      `default-src 'none'; style-src 'nonce-${nonce}' 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src 'self' https: data:; form-action 'self' https: http:; base-uri 'self'`,
    );

    res.send(
      renderOAuthConsentPage({
        clientId,
        clientName,
        redirectUri,
        scope,
        state,
        codeChallenge: effectiveChallenge,
        codeChallengeMethod: effectiveMethod,
        owner,
        nonce,
        clientUri: clientWebsite,
        logoUri: clientRecord?.logoUri,
      } as any),
    );
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

      const registered = registeredClients.get(clientId);
      const clientName = registered?.clientName || clientId;
      const clientIp = getClientIp(req);
      const userAgent = getUserAgent(req);

      sendOAuthClientSetupEmail({
        email: owner.email,
        name: owner.name,
        clientId,
        clientName,
        redirectUri,
        scope,
        ip: clientIp,
        userAgent,
      }).catch((err) =>
        console.error("[email] sendOAuthClientSetupEmail error:", err?.message),
      );

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
    async (req: Request, res: Response): Promise<void> => {
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

        try {
          await recordIssuedToken(tokenRecord);
        } catch (error: any) {
          res.status(503).json({
            error: "temporarily_unavailable",
            error_description:
              "OAuth token storage is unavailable; no token was issued.",
          });
          return;
        }

        const effectiveClientId = clientId || entry.clientId;
        if (effectiveClientId) {
          let clientRecord = registeredClients.get(effectiveClientId);
          if (!clientRecord) {
            const clientName =
              effectiveClientId.toLowerCase().includes("gemini") ||
              (entry.redirectUri &&
                entry.redirectUri.toLowerCase().includes("google"))
                ? "Google Gemini"
                : `Client (${effectiveClientId.slice(0, 16)})`;

            clientRecord = {
              clientId: effectiveClientId,
              clientSecret: "",
              clientName,
              redirectUris: entry.redirectUri ? [entry.redirectUri] : [],
              createdAt: Date.now(),
            };
            registeredClients.set(effectiveClientId, clientRecord);
          } else if (
            entry.redirectUri &&
            !clientRecord.redirectUris.includes(entry.redirectUri)
          ) {
            clientRecord.redirectUris.push(entry.redirectUri);
          }
          saveOAuthToDisk();
          try {
            await syncOAuthClientToMongo(clientRecord);
          } catch (error: any) {
            res.status(503).json({
              error: "temporarily_unavailable",
              error_description: "OAuth client storage is unavailable.",
            });
            return;
          }
        }

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
        try {
          await recordIssuedToken(tokenRecord);
        } catch (error: any) {
          res.status(503).json({
            error: "temporarily_unavailable",
            error_description:
              "OAuth token storage is unavailable; no token was issued.",
          });
          return;
        }

        if (clientId) {
          const clientName = clientId.toLowerCase().includes("gemini")
            ? "Google Gemini"
            : `Client (${clientId.slice(0, 16)})`;

          const clientRecord: OAuthClient = {
            clientId,
            clientSecret: "",
            clientName,
            redirectUris: [],
            createdAt: Date.now(),
          };
          registeredClients.set(clientId, clientRecord);
          saveOAuthToDisk();
          try {
            await syncOAuthClientToMongo(clientRecord);
          } catch (error: any) {
            res.status(503).json({
              error: "temporarily_unavailable",
              error_description: "OAuth client storage is unavailable.",
            });
            return;
          }
        }

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
                  Date.now() / 1000 < payload.exp &&
                  typeof payload.jti === "string" &&
                  !revokedTokenIds.has(payload.jti) &&
                  !revokedClientIds.has(String(payload.client_id || ""))
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

        await ensureMongoAuth().catch(() => {});
        const oauthDb = getMongoDb();
        if (
          process.env.MONGODB_URI ||
          process.env.MONGO_URL ||
          process.env.DATABASE_URL
        ) {
          if (!oauthDb) {
            res.status(503).json({
              error: "temporarily_unavailable",
              error_description: "OAuth authorization storage is unavailable.",
            });
            return;
          }
          try {
            const storedGrant = await oauthDb
              .collection("oauth_tokens")
              .findOne({
                refreshToken: rawRefresh,
                revoked: { $ne: true },
              });
            const activeClient = await oauthDb
              .collection("oauth_clients")
              .findOne({
                clientId: record.clientId,
                revoked: { $ne: true },
              });
            if (
              !storedGrant ||
              !activeClient ||
              revokedClientIds.has(record.clientId)
            ) {
              res.status(400).json({
                error: "invalid_grant",
                error_description:
                  "Refresh token has been revoked or its client is no longer authorized.",
              });
              return;
            }
          } catch (error: any) {
            console.error(
              "[oauth] refresh authorization lookup failed:",
              error?.message || error,
            );
            res.status(503).json({
              error: "temporarily_unavailable",
              error_description: "OAuth authorization storage is unavailable.",
            });
            return;
          }
        } else {
          if (revokedClientIds.has(record.clientId)) {
            res.status(400).json({
              error: "invalid_grant",
              error_description:
                "This OAuth client authorization has been revoked.",
            });
            return;
          }
          // A valid server-signed refresh token can restore its client record in
          // local-development mode when no database is configured.
          if (!registeredClients.has(record.clientId)) {
            registeredClients.set(record.clientId, {
              clientId: record.clientId,
              clientSecret: "",
              clientName: record.clientId.toLowerCase().includes("gemini")
                ? "Google Gemini"
                : `Client (${record.clientId.slice(0, 16)})`,
              redirectUris: [],
              createdAt: Date.now(),
            });
            saveOAuthToDisk();
          }
        }

        // Rotate tokens
        if (record.token) {
          try {
            await revokeOAuthTokenRecord(record.token);
          } catch (error: any) {
            res.status(503).json({
              error: "temporarily_unavailable",
              error_description:
                "Could not safely rotate the refresh token. Retry later.",
            });
            return;
          }
        }
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

        try {
          await recordIssuedToken(updated);
        } catch (error: any) {
          res.status(503).json({
            error: "temporarily_unavailable",
            error_description:
              "OAuth token storage is unavailable; token rotation was not completed.",
          });
          return;
        }

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
    async (req: Request, res: Response): Promise<void> => {
      const token = String(req.body.token || "").trim();
      try {
        if (token) await revokeOAuthTokenRecord(token);
        // RFC 7009 intentionally returns 200 for unknown tokens too.
        res.status(200).json({ revoked: true });
      } catch (error: any) {
        console.error(
          "[oauth] token revocation persistence failed:",
          error?.message || error,
        );
        res.status(503).json({
          error: "temporarily_unavailable",
          error_description:
            "Revocation could not be persisted. Retry the request.",
        });
      }
    },
  );

  // ---------------------------------------------------------------------------
  // Owner Active OAuth Authorizations Management
  // ---------------------------------------------------------------------------
  router.get(
    "/oauth/authorizations",
    async (req: Request, res: Response): Promise<void> => {
      const owner = parseOwnerCookie(req);
      if (!owner) {
        res.status(401).json({ error: "Unauthorized." });
        return;
      }
      try {
        await loadOAuthFromMongo();
        res.json({ authorizations: listActiveOAuthAuthorizations() });
      } catch (error: any) {
        res
          .status(503)
          .json({ error: "OAuth authorization storage is unavailable." });
      }
    },
  );

  router.delete(
    "/oauth/authorizations/:clientId",
    async (req: Request, res: Response): Promise<void> => {
      const owner = parseOwnerCookie(req);
      if (!owner) {
        res.status(401).json({ error: "Unauthorized." });
        return;
      }
      const clientId = String(req.params.clientId || "");
      if (!clientId) {
        res.status(400).json({ success: false, error: "Missing client id." });
        return;
      }
      // Non-admin owners may only revoke authorizations that belong to them.
      const adminEmail = String(process.env.OWNER_EMAIL || "")
        .trim()
        .toLowerCase();
      if (String(owner.email || "").toLowerCase() !== adminEmail) {
        const mine = Array.from(issuedTokens.values()).some(
          (t) =>
            t.clientId === clientId &&
            String(t.ownerEmail || "").toLowerCase() ===
              String(owner.email || "").toLowerCase(),
        );
        if (!mine) {
          res.status(403).json({
            success: false,
            error: "You can only revoke your own OAuth authorizations.",
          });
          return;
        }
      }
      try {
        // The list view merges clients that share a display name, so revoke the whole
        // group; otherwise a duplicate would reappear right after deleting.
        let success = false;
        for (const id of findClientIdsSharingName(clientId)) {
          if (await revokeOAuthAuthorization(id)) success = true;
        }
        if (!success) {
          res.status(404).json({
            success: false,
            error: "This authorization no longer exists. Refresh the page.",
          });
          return;
        }
        res.json({ success });
      } catch (error: any) {
        console.error(
          "[oauth] authorization revocation failed:",
          error?.message || error,
        );
        res.status(503).json({
          success: false,
          error:
            "Revocation could not be persisted. Retry when MongoDB is available.",
        });
      }
    },
  );

  router.patch(
    "/oauth/authorizations/:clientId",
    express.json({ limit: "32kb" }),
    (req: Request, res: Response): void => {
      const owner = parseOwnerCookie(req);
      if (!owner) {
        res.status(401).json({ error: "Unauthorized." });
        return;
      }
      const clientId = String(req.params.clientId || "");
      const newName =
        typeof req.body?.name === "string" ? req.body.name.trim() : "";
      if (!newName || newName.length < 2) {
        res.status(400).json({
          error: "Client name must be at least 2 characters long.",
        });
        return;
      }
      try {
        const client = renameOAuthClient(clientId, newName);
        res.json({ success: true, clientId, clientName: client.clientName });
      } catch (err: any) {
        res.status(400).json({
          error: err.message || "Failed to rename OAuth client.",
        });
      }
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
  redirectUris?: string[];
  clientUri?: string;
  logoUri?: string;
}

export function getOAuthClient(clientId: string): OAuthClient | undefined {
  return registeredClients.get(clientId);
}

export function listActiveOAuthAuthorizations(): ActiveOAuthInfo[] {
  // An OAuth client registration alone is not an active authorization.
  // Show only clients that still have a live access or refresh-token grant.
  const result = new Map<string, ActiveOAuthInfo>();
  const now = Date.now();
  for (const entry of issuedTokens.values()) {
    if (revokedClientIds.has(entry.clientId)) continue;
    const accessLive = entry.expiresAt > now;
    const refreshLive = entry.refreshExpiresAt > now;
    if (!accessLive && !refreshLive) continue;

    const client = registeredClients.get(entry.clientId);
    const existing = result.get(entry.clientId);
    const info: ActiveOAuthInfo = {
      clientId: entry.clientId,
      clientName:
        client?.clientName ||
        (entry.clientId.toLowerCase().includes("gemini")
          ? "Google Gemini"
          : `Client (${entry.clientId.slice(0, 16)})`),
      scope: entry.scope || "mcp:tools",
      ownerEmail: entry.ownerEmail || process.env.OWNER_EMAIL || "owner",
      createdAt: client?.createdAt || entry.expiresAt - 86400 * 1000,
      lastUsedAt: entry.expiresAt - 86400 * 1000,
      redirectUris: client?.redirectUris,
      clientUri: client?.clientUri,
      logoUri: client?.logoUri,
    };
    if (!existing || (info.lastUsedAt || 0) > (existing.lastUsedAt || 0)) {
      result.set(entry.clientId, info);
    }
  }

  const deduplicated = new Map<string, ActiveOAuthInfo>();
  for (const item of result.values()) {
    const normKey = (item.clientName || item.clientId).trim().toLowerCase();
    const existing = deduplicated.get(normKey);
    if (!existing || (item.lastUsedAt || 0) > (existing.lastUsedAt || 0)) {
      deduplicated.set(normKey, item);
    }
  }
  return Array.from(deduplicated.values());
}

function displayNameForClient(clientId: string): string {
  const client = registeredClients.get(clientId);
  return (
    client?.clientName ||
    (clientId.toLowerCase().includes("gemini")
      ? "Google Gemini"
      : `Client (${clientId.slice(0, 16)})`)
  )
    .trim()
    .toLowerCase();
}

/** Every client id with live tokens that the authorizations list shows under the same name. */
export function findClientIdsSharingName(clientId: string): string[] {
  const target = displayNameForClient(clientId);
  const ids = new Set<string>([clientId]);
  for (const entry of issuedTokens.values()) {
    if (displayNameForClient(entry.clientId) === target)
      ids.add(entry.clientId);
  }
  return Array.from(ids);
}

export async function revokeOAuthAuthorization(
  clientId: string,
): Promise<boolean> {
  let found = false;
  if (registeredClients.has(clientId)) {
    registeredClients.delete(clientId);
    found = true;
  }
  revokedClientIds.add(clientId);
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
  saveOAuthToDisk();
  // Always write a tombstone, even if the in-memory cache was cold after a restart.
  const clientPersisted = await revokeOAuthClientInMongo(clientId);
  const tokensPersisted = await revokeOAuthTokenInMongo(clientId);
  return found || clientPersisted || tokensPersisted;
}

export function renameOAuthClient(
  clientId: string,
  newName: string,
): OAuthClient {
  const cleanName = (newName || "").trim();
  if (cleanName.length < 2) {
    throw new Error("Client name must be at least 2 characters long.");
  }
  let client = registeredClients.get(clientId);
  if (!client) {
    for (const entry of issuedTokens.values()) {
      if (entry.clientId === clientId) {
        client = {
          clientId,
          clientSecret: "",
          clientName: cleanName,
          redirectUris: [],
          createdAt: Date.now(),
        };
        registeredClients.set(clientId, client);
        break;
      }
    }
  }
  if (!client) {
    throw new Error("OAuth client authorization not found.");
  }
  client.clientName = cleanName;
  saveOAuthToDisk();
  syncOAuthClientToMongo(client).catch((error) =>
    console.error(
      "[mongo-oauth] client rename persistence failed:",
      error?.message || error,
    ),
  );
  return client;
}

export function resetOAuthStateForTesting(): void {
  registeredClients.clear();
  activeAuthCodes.clear();
  issuedTokens.clear();
  refreshTokens.clear();
  revokedClientIds.clear();
  revokedTokenIds.clear();
}
