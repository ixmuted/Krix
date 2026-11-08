import type { Request, Response, NextFunction } from "express";
import type { Db } from "mongodb";
import crypto from "node:crypto";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const BROWSER_MANAGEMENT_PREFIXES = ["/api/", "/settings/api/", "/store/", "/upload/"];

function expectedOrigin(req: Request): string {
  const configured = process.env.PUBLIC_BASE_URL?.trim();
  if (configured) return new URL(configured).origin;
  return `${req.protocol}://${req.get("host") || "localhost"}`;
}

/** Same-origin guard for cookie-authenticated browser management endpoints. */
export function browserOriginGuard(req: Request, res: Response, next: NextFunction): void {
  if (!MUTATING_METHODS.has(req.method)) return next();
  if (!BROWSER_MANAGEMENT_PREFIXES.some((prefix) => req.path.startsWith(prefix))) return next();

  // API clients using bearer/API-key authentication are not browser-cookie flows.
  const hasCookie = Boolean(req.headers.cookie);
  if (!hasCookie) return next();

  const originHeader = req.get("origin");
  const refererHeader = req.get("referer");
  let suppliedOrigin = "";
  try {
    if (originHeader) suppliedOrigin = new URL(originHeader).origin;
    else if (refererHeader) suppliedOrigin = new URL(refererHeader).origin;
  } catch {
    res.status(403).json({ error: "Invalid request origin." });
    return;
  }

  // Browsers send Origin on state-changing fetches; Referer is a fallback for older clients.
  if (!suppliedOrigin || suppliedOrigin !== expectedOrigin(req)) {
    res.status(403).json({ error: "Cross-origin request blocked." });
    return;
  }
  next();
}

/** Append-only-by-convention event sink. Use a MongoDB role that cannot update/delete this collection. */
export function createSecurityAuditMiddleware(getDb: () => Db | null) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!MUTATING_METHODS.has(req.method) || !BROWSER_MANAGEMENT_PREFIXES.some((p) => req.path.startsWith(p))) {
      next();
      return;
    }
    const startedAt = Date.now();
    res.once("finish", () => {
      const db = getDb();
      if (!db) return;
      const actor = (req as any).owner?.email || (req as any).clientAuth?.email || "unknown";
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      // Never persist request bodies, cookies, authorization headers, or secret values.
      void db.collection("security_audit").insertOne({
        timestamp: new Date(),
        actor: String(actor).toLowerCase().slice(0, 254),
        method: req.method,
        route: req.route?.path ? String(req.route.path) : req.path.slice(0, 180),
        status: res.statusCode,
        durationMs: Math.max(0, Date.now() - startedAt),
        ipHash: requireHash(ip),
        userAgent: String(req.get("user-agent") || "").slice(0, 240),
      }).catch((error) => {
        // Do not leak request data or database details into logs.
        console.error("[security-audit] event persistence failed:", error?.name || "database error");
      });
    });
    next();
  };
}

function requireHash(value: string): string {
  // IP addresses are pseudonymized; use a dedicated secret to prevent easy reversal.
  const pepper = process.env.AUDIT_HASH_SECRET;
  if (!pepper || pepper.length < 32) return "unavailable";
  return crypto.createHmac("sha256", pepper).update(value).digest("hex");
}

export function validateProductionSecurityConfig(): void {
  if (process.env.NODE_ENV !== "production") return;
  const errors: string[] = [];
  try {
    const publicUrl = new URL(process.env.PUBLIC_BASE_URL || "");
    if (publicUrl.protocol !== "https:" || publicUrl.username || publicUrl.password) {
      errors.push("PUBLIC_BASE_URL must be the canonical HTTPS origin without credentials.");
    }
  } catch {
    errors.push("PUBLIC_BASE_URL must be a valid canonical HTTPS URL.");
  }
  const looksLikePlaceholder = (value: string | undefined) => !value || /your_|replace_|change_me|example|placeholder/i.test(value);
  if (looksLikePlaceholder(process.env.MCP_API_KEY) || Buffer.byteLength(process.env.MCP_API_KEY || "") < 32) {
    errors.push("MCP_API_KEY must be at least 32 bytes and must not be a placeholder.");
  }
  if (looksLikePlaceholder(process.env.SESSION_SECRET) || Buffer.byteLength(process.env.SESSION_SECRET || "") < 32) {
    errors.push("SESSION_SECRET must contain at least 32 bytes of high-entropy random data and must not be a placeholder.");
  }
  if (looksLikePlaceholder(process.env.AUDIT_HASH_SECRET) || Buffer.byteLength(process.env.AUDIT_HASH_SECRET || "") < 32) {
    errors.push("AUDIT_HASH_SECRET must contain at least 32 bytes of independent random data and must not be a placeholder.");
  }
  if (looksLikePlaceholder(process.env.KEY_ENCRYPTION_SECRET) || Buffer.byteLength(process.env.KEY_ENCRYPTION_SECRET || "") < 32) {
    errors.push("KEY_ENCRYPTION_SECRET must contain at least 32 bytes of independent random data for encrypted API keys and provider credentials.");
  }
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET === process.env.MCP_API_KEY) {
    errors.push("SESSION_SECRET must be independent from MCP_API_KEY.");
  }
  if (process.env.KEY_ENCRYPTION_SECRET && (process.env.KEY_ENCRYPTION_SECRET === process.env.SESSION_SECRET || process.env.KEY_ENCRYPTION_SECRET === process.env.MCP_API_KEY || process.env.KEY_ENCRYPTION_SECRET === process.env.AUDIT_HASH_SECRET)) {
    errors.push("KEY_ENCRYPTION_SECRET must be independent from all other application secrets.");
  }
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET === process.env.AUDIT_HASH_SECRET) {
    errors.push("AUDIT_HASH_SECRET must be independent from SESSION_SECRET.");
  }
  if (!(process.env.MONGODB_URI || process.env.MONGO_URL || process.env.DATABASE_URL)) {
    errors.push("MongoDB is required in production for durable multi-user state.");
  }
  if (errors.length) throw new Error(`Unsafe production configuration:\n- ${errors.join("\n- ")}`);
}
