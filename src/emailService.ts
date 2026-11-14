/**
 * Krix Email Service
 *
 * Modern, resilient email delivery system supporting dual transport:
 * 1. Gmail REST API over HTTPS via OAuth2 (works on Render free tier where SMTP ports 25/465/587 are blocked)
 * 2. Standard SMTP via Nodemailer
 *
 * Automatically sends notifications for:
 * - Account creation (first sign-in)
 * - Account deletion
 * - New logged-in IP detection
 * - OAuth client authorization / setup
 */

import nodemailer from "nodemailer";
import type { Request } from "express";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface DeviceInfo {
  deviceName: string;
  deviceType: "Desktop" | "Mobile" | "Tablet" | "Unknown";
  browser: string;
  os: string;
  icon: "laptop" | "mobile" | "tablet";
}

export interface GeoLocation {
  ip: string;
  location: string;
  isLocal: boolean;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  skipped?: boolean;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export function isGmailApiConfigured(): boolean {
  return Boolean(
    process.env.GMAIL_USER &&
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN,
  );
}

export function isSmtpConfigured(): boolean {
  return Boolean(
    (process.env.SMTP_HOST && process.env.SMTP_PORT) ||
    process.env.SMTP_URL ||
    (process.env.SMTP_USER && process.env.SMTP_PASS),
  );
}

export function isEmailConfigured(): boolean {
  return isGmailApiConfigured() || isSmtpConfigured();
}

export function getDeliveryMethod(): "gmail_api" | "smtp" | "none" {
  if (isGmailApiConfigured()) return "gmail_api";
  if (isSmtpConfigured()) return "smtp";
  return "none";
}

// Startup diagnostic check
const deliveryMethod = getDeliveryMethod();
if (deliveryMethod === "gmail_api") {
  console.log(
    `[email] Gmail REST API configured (HTTPS) — sending notifications via ${process.env.GMAIL_USER}`,
  );
} else if (deliveryMethod === "smtp") {
  console.log(
    `[email] SMTP transport configured — sending notifications via ${process.env.SMTP_HOST || "configured host"}:${process.env.SMTP_PORT || "587"}`,
  );
} else {
  console.log(
    "[email] Email notifications unconfigured. Set GMAIL_USER/GMAIL_CLIENT_ID/GMAIL_CLIENT_SECRET/GMAIL_REFRESH_TOKEN or SMTP credentials in .env to enable.",
  );
}

// ---------------------------------------------------------------------------
// Helpers: Device, IP, Geolocation & Timestamps
// ---------------------------------------------------------------------------

/**
 * Extract real client IP from incoming Express request.
 */
export function getClientIp(req: Request): string {
  const xForwardedFor = req.headers["x-forwarded-for"];
  if (typeof xForwardedFor === "string") {
    const first = xForwardedFor.split(",")[0]?.trim();
    if (first) return first.replace(/^::ffff:/, "");
  }
  const rawIp = req.ip || req.socket.remoteAddress || "127.0.0.1";
  return String(rawIp)
    .replace(/^::ffff:/, "")
    .trim();
}

/**
 * Extract User-Agent header from request.
 */
export function getUserAgent(req: Request): string {
  return (req.headers["user-agent"] as string) || "Unknown";
}

/**
 * Parses user-agent strings into structured device, OS, and browser details.
 */
export function parseDeviceInfo(userAgent = ""): DeviceInfo {
  const ua = String(userAgent || "").trim();
  if (!ua || ua === "Unknown" || ua === "Unknown Device") {
    return {
      deviceName: "Unknown Device",
      deviceType: "Unknown",
      browser: "Unknown Browser",
      os: "Unknown OS",
      icon: "laptop",
    };
  }

  let os = "Unknown OS";
  let deviceType: "Desktop" | "Mobile" | "Tablet" = "Desktop";
  let icon: "laptop" | "mobile" | "tablet" = "laptop";
  let model = "";
  let m: RegExpMatchArray | null = null;

  if (/iPhone/i.test(ua)) {
    deviceType = "Mobile";
    icon = "mobile";
    model = "iPhone";
    m = ua.match(/iPhone OS (\d+)[_.](\d+)/i);
    os = m ? `iOS ${m[1]}.${m[2]}` : "iOS";
  } else if (/iPad/i.test(ua)) {
    deviceType = "Tablet";
    icon = "tablet";
    model = "iPad";
    m = ua.match(/(?:CPU OS|OS) (\d+)[_.](\d+)/i);
    os = m ? `iPadOS ${m[1]}.${m[2]}` : "iPadOS";
  } else if (/Android/i.test(ua)) {
    m = ua.match(/Android\s([\d.]+)/i);
    os = m ? `Android ${m[1]}` : "Android";
    deviceType = /Mobile/i.test(ua) ? "Mobile" : "Tablet";
    icon = deviceType === "Mobile" ? "mobile" : "tablet";
    const modelMatch = ua.match(
      /Android\s[\d.]+;\s*([^;)]+?)(?:\s?Build\/|\))/i,
    );
    model = modelMatch ? modelMatch[1].trim() : "Android Device";
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    deviceType = "Desktop";
    icon = "laptop";
    model = "Mac";
    m = ua.match(/Mac OS X (\d+)[_.](\d+)/i);
    os = m ? `macOS ${m[1]}.${m[2]}` : "macOS";
  } else if (/Windows NT/i.test(ua)) {
    deviceType = "Desktop";
    icon = "laptop";
    model = "Windows PC";
    const winMap: Record<string, string> = {
      "10.0": "Windows 10 / 11",
      "6.3": "Windows 8.1",
      "6.2": "Windows 8",
      "6.1": "Windows 7",
    };
    m = ua.match(/Windows NT ([\d.]+)/i);
    os = m ? winMap[m[1]] || `Windows NT ${m[1]}` : "Windows";
  } else if (/CrOS/i.test(ua)) {
    deviceType = "Desktop";
    icon = "laptop";
    model = "Chromebook";
    os = "ChromeOS";
  } else if (/Linux/i.test(ua)) {
    deviceType = "Desktop";
    icon = "laptop";
    model = "Linux Workstation";
    os = "Linux";
  }

  let browser = "Web Browser";
  if (/EdgA|Edg\//i.test(ua)) browser = "Microsoft Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/SamsungBrowser/i.test(ua)) browser = "Samsung Internet";
  else if (/CriOS/i.test(ua)) browser = "Chrome (iOS)";
  else if (/FxiOS/i.test(ua)) browser = "Firefox (iOS)";
  else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = "Google Chrome";
  else if (/Firefox/i.test(ua)) browser = "Mozilla Firefox";
  else if (/Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua))
    browser = "Apple Safari";

  const deviceName = model && model !== os ? `${model} (${os})` : os;
  return { deviceName, deviceType, browser, os, icon };
}

/**
 * Resolves IP geolocation via ip-api with a short timeout and private IP filtering.
 */
export async function getIpGeoLocation(ip = ""): Promise<GeoLocation> {
  const cleanIp = String(ip || "")
    .replace(/^::ffff:/, "")
    .replace(/^\[|\]$/g, "")
    .trim();

  const isLocal =
    !cleanIp ||
    cleanIp === "127.0.0.1" ||
    cleanIp === "::1" ||
    cleanIp === "localhost" ||
    cleanIp.startsWith("10.") ||
    cleanIp.startsWith("192.168.") ||
    cleanIp.startsWith("172.16.") ||
    cleanIp.startsWith("172.31.");

  if (isLocal) {
    return {
      ip: cleanIp || "127.0.0.1",
      location: "Local / Private Network",
      isLocal: true,
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`http://ip-api.com/json/${cleanIp}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as any;
      if (data && data.status === "success") {
        const parts = [data.city, data.regionName, data.country].filter(
          Boolean,
        );
        return {
          ip: cleanIp,
          location: parts.join(", ") || "Location Verified",
          isLocal: false,
        };
      }
    }
  } catch {
    // Graceful fallback on network timeout or private IP lookup failure
  }

  return {
    ip: cleanIp,
    location: "Location Unavailable",
    isLocal: false,
  };
}

/**
 * Formats a timestamp cleanly with time zone for security audit clarity.
 */
export function formatTimestamp(date: number | Date = new Date()): string {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

/**
 * RFC 2047 subject encoder ensuring UTF-8 subject headers never get mangled.
 */
export function encodeRfc2047Subject(text: string): string {
  return `=?UTF-8?B?${Buffer.from(text, "utf8").toString("base64")}?=`;
}

/**
 * HTML escaper preventing injection in rendered emails.
 */
export function escapeHtml(str = ""): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------------------------------------------------------------------
// SVG Glyphs for High-DPI Email Clients
// ---------------------------------------------------------------------------

const ICONS = {
  krixLogo: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  profile: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  laptop: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
  mobile: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/></svg>`,
  tablet: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="18" r="0.5"/></svg>`,
  browser: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="6.5" x2="8.01" y2="6.5"/></svg>`,
  globe: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  pin: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  clock: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  key: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-2-2l-2 2m2-2l-7 7m0 0a5 5 0 1 0 7 7l7-7-7-7z"/><circle cx="7" cy="17" r="2"/></svg>`,
  shield: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  trash: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>`,
  link: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  check: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
};

// ---------------------------------------------------------------------------
// Modern Geist-Inspired Email Shell & Component Templates
// ---------------------------------------------------------------------------

function renderEmailShell(params: {
  badge: string;
  badgeTone?: "default" | "amber" | "red" | "emerald";
  title: string;
  description: string;
  bodyContent: string;
  footerAccount: string;
  timestamp: string;
  ctaText?: string;
  ctaUrl?: string;
}): string {
  const badgeBg =
    params.badgeTone === "amber"
      ? "#fffbeb"
      : params.badgeTone === "red"
        ? "#fef2f2"
        : params.badgeTone === "emerald"
          ? "#f0fdf4"
          : "#18181b";
  const badgeBorder =
    params.badgeTone === "amber"
      ? "#fde68a"
      : params.badgeTone === "red"
        ? "#fecaca"
        : params.badgeTone === "emerald"
          ? "#bbf7d0"
          : "#27272a";
  const badgeColor =
    params.badgeTone === "amber"
      ? "#b45309"
      : params.badgeTone === "red"
        ? "#dc2626"
        : params.badgeTone === "emerald"
          ? "#15803d"
          : "#e4e4e7";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>${escapeHtml(params.title)} - Krix</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 40px 16px 48px;
      -webkit-font-smoothing: antialiased;
      color: #0f172a;
      line-height: 1.5;
    }
    .wrapper { max-width: 580px; margin: 0 auto; }
    .card {
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.03);
    }
    .krix-header {
      background: #09090b;
      padding: 24px 32px;
      border-bottom: 1px solid #27272a;
    }
    .krix-header-table { width: 100%; border-collapse: collapse; }
    .krix-brand { display: inline-flex; align-items: center; gap: 10px; }
    .krix-logo-chip {
      display: inline-block;
      vertical-align: middle;
      width: 32px;
      height: 32px;
      background: #18181b;
      border: 1px solid #3f3f46;
      border-radius: 8px;
      text-align: center;
      line-height: 32px;
    }
    .krix-logo-chip svg { display: inline-block; vertical-align: middle; }
    .krix-brand-title {
      color: #ffffff;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      vertical-align: middle;
      display: inline-block;
      margin-left: 8px;
    }
    .krix-badge {
      display: inline-block;
      padding: 4px 12px;
      background: ${badgeBg};
      border: 1px solid ${badgeBorder};
      color: ${badgeColor};
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .krix-body { padding: 32px; }
    .krix-heading {
      font-size: 20px;
      font-weight: 700;
      color: #09090b;
      letter-spacing: -0.01em;
      margin-bottom: 8px;
    }
    .krix-desc {
      font-size: 14.5px;
      color: #52525b;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .info-table {
      width: 100%;
      background: #fafafa;
      border: 1px solid #e4e4e7;
      border-radius: 12px;
      border-collapse: separate;
      border-spacing: 0;
      margin: 20px 0;
      overflow: hidden;
    }
    .info-row td {
      padding: 12px 16px;
      border-bottom: 1px solid #f4f4f5;
      font-size: 13.5px;
      vertical-align: middle;
    }
    .info-row:last-child td { border-bottom: none; }
    .info-icon-cell { width: 34px; padding-right: 0 !important; }
    .info-icon-box {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      background: #ffffff;
      border: 1px solid #e4e4e7;
      text-align: center;
      line-height: 26px;
    }
    .info-icon-box svg { display: inline-block; vertical-align: middle; }
    .info-label {
      width: 130px;
      color: #71717a;
      font-weight: 600;
      font-size: 12.5px;
    }
    .info-value {
      color: #18181b;
      font-weight: 500;
      word-break: break-all;
    }
    .pill-val {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      background: #f4f4f5;
      color: #09090b;
      border: 1px solid #e4e4e7;
      padding: 3px 8px;
      border-radius: 9999px;
      display: inline-block;
    }
    .alert-banner {
      border-radius: 10px;
      padding: 14px 16px;
      margin: 20px 0;
      font-size: 13.5px;
      line-height: 1.55;
    }
    .alert-amber {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-left: 4px solid #f59e0b;
      color: #92400e;
    }
    .alert-red {
      background: #fef2f2;
      border: 1px solid #fee2e2;
      border-left: 4px solid #ef4444;
      color: #991b1b;
    }
    .alert-emerald {
      background: #f0fdf4;
      border: 1px solid #dcfce7;
      border-left: 4px solid #10b981;
      color: #166534;
    }
    .cta-wrap { text-align: center; margin: 28px 0 10px; }
    .cta-btn {
      display: inline-block;
      background: #09090b;
      color: #ffffff !important;
      text-decoration: none !important;
      padding: 12px 28px;
      border-radius: 9999px;
      font-size: 13.5px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .krix-footer {
      padding: 20px 32px;
      background: #fafafa;
      border-top: 1px solid #e4e4e7;
      font-size: 12px;
      color: #71717a;
      line-height: 1.6;
    }
    @media (max-width: 600px) {
      body { padding: 20px 12px 32px; }
      .krix-header { padding: 18px 20px; }
      .krix-body { padding: 22px 20px; }
      .krix-footer { padding: 16px 20px; }
      .info-label { width: 105px; font-size: 12px; }
      .info-row td { padding: 10px 12px; font-size: 13px; }
    }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="krix-header">
      <table class="krix-header-table" role="presentation">
        <tr>
          <td>
            <div class="krix-brand">
              <span class="krix-logo-chip">${ICONS.krixLogo}</span>
              <span class="krix-brand-title">KRIX</span>
            </div>
          </td>
          <td align="right">
            <span class="krix-badge">${escapeHtml(params.badge)}</span>
          </td>
        </tr>
      </table>
    </div>
    <div class="krix-body">
      <h1 class="krix-heading">${escapeHtml(params.title)}</h1>
      <p class="krix-desc">${escapeHtml(params.description)}</p>
      ${params.bodyContent}
      ${
        params.ctaText && params.ctaUrl
          ? `
      <div class="cta-wrap">
        <a href="${escapeHtml(params.ctaUrl)}" class="cta-btn">${escapeHtml(params.ctaText)}</a>
      </div>`
          : ""
      }
    </div>
    <div class="krix-footer">
      <p>Recipient: <strong>${escapeHtml(params.footerAccount)}</strong> &nbsp;&middot;&nbsp; Recorded: <strong>${escapeHtml(params.timestamp)}</strong></p>
      <p style="margin-top:4px; font-size:11.5px; color:#a1a1aa;">This is an automated security and account notification from your Krix instance.</p>
    </div>
  </div>
</div>
</body>
</html>`;
}

function renderInfoTable(
  rows: Array<{
    icon: keyof typeof ICONS;
    label: string;
    value: string;
    isPill?: boolean;
  }>,
): string {
  const renderedRows = rows
    .map(
      (r) => `
    <tr class="info-row">
      <td class="info-icon-cell"><div class="info-icon-box">${ICONS[r.icon] || ICONS.profile}</div></td>
      <td class="info-label">${escapeHtml(r.label)}</td>
      <td class="info-value">${
        r.isPill
          ? `<span class="pill-val">${escapeHtml(r.value)}</span>`
          : escapeHtml(r.value)
      }</td>
    </tr>`,
    )
    .join("");

  return `<table class="info-table" role="presentation">${renderedRows}</table>`;
}

// ---------------------------------------------------------------------------
// Core Send Implementation: Gmail REST API + Nodemailer SMTP
// ---------------------------------------------------------------------------

async function getGmailAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID || "",
      client_secret: process.env.GMAIL_CLIENT_SECRET || "",
      refresh_token: process.env.GMAIL_REFRESH_TOKEN || "",
      grant_type: "refresh_token",
    }).toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Gmail OAuth token refresh failed (${res.status}): ${errText}`,
    );
  }

  const data = (await res.json()) as any;
  if (!data.access_token) {
    throw new Error("No access_token returned by Google OAuth token refresh.");
  }
  return data.access_token;
}

/**
 * Dispatches an email via the configured method.
 */
export async function sendEmail(opts: EmailOptions): Promise<SendResult> {
  const method = getDeliveryMethod();

  if (method === "none") {
    console.log(
      `[email] Skipped sending to ${opts.to} ("${opts.subject}"): no email credentials configured.`,
    );
    return { success: false, skipped: true, error: "Unconfigured" };
  }

  // 1. Gmail REST API over HTTPS
  if (method === "gmail_api") {
    try {
      const accessToken = await getGmailAccessToken();
      const sender = process.env.GMAIL_USER || "";
      const bodyBase64 = Buffer.from(opts.html, "utf8").toString("base64");

      const mimeLines = [
        `To: ${opts.to}`,
        `From: Krix <${sender}>`,
        `Subject: ${encodeRfc2047Subject(opts.subject)}`,
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=utf-8",
        "Content-Transfer-Encoding: base64",
        "",
        bodyBase64,
      ];

      const rawMime = mimeLines.join("\r\n");
      const base64urlRaw = Buffer.from(rawMime)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const gmailRes = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw: base64urlRaw }),
        },
      );

      if (!gmailRes.ok) {
        const errorText = await gmailRes.text();
        console.error(
          `[email] Gmail REST API error (${gmailRes.status}):`,
          errorText,
        );
        return { success: false, error: errorText };
      }

      const resData = (await gmailRes.json()) as any;
      console.log(
        `[email] Sent successfully via Gmail API to ${opts.to} (ID: ${resData.id || "ok"})`,
      );
      return { success: true, messageId: resData.id };
    } catch (err: any) {
      console.error(
        `[email] Failed to send via Gmail API to ${opts.to}:`,
        err?.message,
      );
      return { success: false, error: err?.message };
    }
  }

  // 2. Standard SMTP Transport
  try {
    const port = Number(process.env.SMTP_PORT) || 587;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "localhost",
      port,
      secure: process.env.SMTP_SECURE === "true" || port === 465,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
    });

    const info = await transporter.sendMail({
      from:
        process.env.EMAIL_FROM ||
        process.env.SMTP_FROM ||
        `"Krix" <${process.env.SMTP_USER || "no-reply@krix.local"}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });

    console.log(
      `[email] Sent successfully via SMTP to ${opts.to} (ID: ${info.messageId})`,
    );
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(
      `[email] Failed to send via SMTP to ${opts.to}:`,
      err?.message,
    );
    return { success: false, error: err?.message };
  }
}

// ---------------------------------------------------------------------------
// High-Level Notification Triggers
// ---------------------------------------------------------------------------

/**
 * 1. Account Created Notification
 * Sent when a user authenticates with Google for the first time.
 */
export async function sendAccountCreatedEmail(params: {
  email: string;
  name?: string;
  ip?: string;
  userAgent?: string;
  role?: string;
  sandboxId?: string;
}): Promise<SendResult> {
  const device = parseDeviceInfo(params.userAgent);
  const geo = await getIpGeoLocation(params.ip);
  const timeStr = formatTimestamp();
  const userName = params.name || params.email.split("@")[0] || "Developer";
  const userRole = (params.role || "user").toUpperCase();

  const bodyContent = `
    <div class="alert-banner alert-emerald">
      <strong>Your Krix account is active.</strong> Your isolated sandbox environment has been provisioned and is ready for model tool execution.
    </div>
    ${renderInfoTable([
      { icon: "profile", label: "Account Email", value: params.email },
      { icon: "shield", label: "Assigned Role", value: userRole, isPill: true },
      ...(params.sandboxId
        ? [
            {
              icon: "key" as const,
              label: "Sandbox ID",
              value: params.sandboxId,
              isPill: true,
            },
          ]
        : []),
      { icon: device.icon, label: "Client Device", value: device.deviceName },
      { icon: "browser", label: "Browser Engine", value: device.browser },
      { icon: "globe", label: "IP Address", value: geo.ip, isPill: true },
      { icon: "pin", label: "Sign-In Location", value: geo.location },
      { icon: "clock", label: "Registered At", value: timeStr },
    ])}
    <p style="font-size:13.5px; color:#52525b; line-height:1.6; margin-top:16px;">
      You can now create dynamic MCP API keys, connect clients (Gemini, Claude, Cursor), and execute tools within your isolated workspace.
    </p>`;

  const html = renderEmailShell({
    badge: "Welcome",
    badgeTone: "emerald",
    title: `Welcome to Krix, ${userName}`,
    description:
      "Your developer account has been registered and provisioned successfully.",
    bodyContent,
    footerAccount: params.email,
    timestamp: timeStr,
    ctaText: "Open Krix Dashboard",
    ctaUrl: process.env.PUBLIC_BASE_URL || "https://krix.onrender.com",
  });

  return sendEmail({
    to: params.email,
    subject: "Welcome to Krix — Account Created Successfully",
    html,
  });
}

/**
 * 2. Account Deleted Notification
 * Sent when a user initiates account deletion from the Danger Zone.
 */
export async function sendAccountDeletedEmail(params: {
  email: string;
  name?: string;
  ip?: string;
  userAgent?: string;
}): Promise<SendResult> {
  const device = parseDeviceInfo(params.userAgent);
  const geo = await getIpGeoLocation(params.ip);
  const timeStr = formatTimestamp();
  const userName = params.name || params.email.split("@")[0] || "User";

  const bodyContent = `
    <div class="alert-banner alert-red">
      <strong>Account and Credentials Purged.</strong> All dynamic API keys, active MCP sessions, and associated telemetry have been permanently deleted.
    </div>
    ${renderInfoTable([
      { icon: "profile", label: "Deleted Account", value: params.email },
      {
        icon: "trash",
        label: "Deletion Status",
        value: "Permanently Purged",
        isPill: true,
      },
      { icon: device.icon, label: "Action Device", value: device.deviceName },
      { icon: "globe", label: "Origin IP", value: geo.ip, isPill: true },
      { icon: "pin", label: "Origin Location", value: geo.location },
      { icon: "clock", label: "Executed At", value: timeStr },
    ])}
    <p style="font-size:13.5px; color:#71717a; line-height:1.6; margin-top:16px;">
      If you did not authorize this deletion, please check your primary identity provider immediately and verify your Google account security.
    </p>`;

  const html = renderEmailShell({
    badge: "Account Deleted",
    badgeTone: "red",
    title: "Krix Account Deletion Notice",
    description: `The Krix account for ${userName} (${params.email}) has been permanently deleted.`,
    bodyContent,
    footerAccount: params.email,
    timestamp: timeStr,
  });

  return sendEmail({
    to: params.email,
    subject: "Krix Security Notice: Account Permanently Deleted",
    html,
  });
}

/**
 * 3. New Logged-In IP Notification
 * Sent when a user authenticates from an IP address not previously recorded.
 */
export async function sendNewLoginIpEmail(params: {
  email: string;
  name?: string;
  ip: string;
  userAgent?: string;
  previousIp?: string;
}): Promise<SendResult> {
  const device = parseDeviceInfo(params.userAgent);
  const geo = await getIpGeoLocation(params.ip);
  const timeStr = formatTimestamp();

  const bodyContent = `
    <div class="alert-banner alert-amber">
      <strong>New sign-in detected.</strong> Your account was just accessed from an IP address that has not been seen on your account previously.
    </div>
    ${renderInfoTable([
      { icon: "profile", label: "Account Email", value: params.email },
      { icon: "globe", label: "New IP Address", value: geo.ip, isPill: true },
      { icon: "pin", label: "Approx. Location", value: geo.location },
      { icon: device.icon, label: "Client Device", value: device.deviceName },
      { icon: "browser", label: "Browser Engine", value: device.browser },
      ...(params.previousIp
        ? [
            {
              icon: "shield" as const,
              label: "Previous Known IP",
              value: params.previousIp,
              isPill: true,
            },
          ]
        : []),
      { icon: "clock", label: "Login Timestamp", value: timeStr },
    ])}
    <p style="font-size:13.5px; color:#52525b; line-height:1.6; margin-top:16px;">
      If this was you logging in from a new network or VPN, no action is needed. If you did not recognize this login, sign in to revoke your API keys and secure your Google account.
    </p>`;

  const html = renderEmailShell({
    badge: "Security Alert",
    badgeTone: "amber",
    title: "Security Notice: New Login IP Detected",
    description:
      "We noticed a sign-in to your Krix account from a new network address.",
    bodyContent,
    footerAccount: params.email,
    timestamp: timeStr,
    ctaText: "Review Account Security",
    ctaUrl: process.env.PUBLIC_BASE_URL || "https://krix.onrender.com/settings",
  });

  return sendEmail({
    to: params.email,
    subject: `Security Alert: New Sign-in to Krix from ${geo.ip}`,
    html,
  });
}

/**
 * 4. OAuth Client Setup / Authorization Notification
 * Sent when an OAuth application is authorized or configured.
 */
export async function sendOAuthClientSetupEmail(params: {
  email: string;
  name?: string;
  clientId: string;
  clientName?: string;
  redirectUri?: string;
  scope?: string;
  ip?: string;
  userAgent?: string;
}): Promise<SendResult> {
  const device = parseDeviceInfo(params.userAgent);
  const geo = await getIpGeoLocation(params.ip);
  const timeStr = formatTimestamp();
  const displayName =
    params.clientName || params.clientId || "External Application";

  const bodyContent = `
    <div class="alert-banner alert-emerald">
      <strong>OAuth Client Authorized.</strong> An external tool or assistant has been granted access to your Krix MCP endpoint.
    </div>
    ${renderInfoTable([
      { icon: "profile", label: "Authorized By", value: params.email },
      { icon: "link", label: "Application Name", value: displayName },
      { icon: "key", label: "Client ID", value: params.clientId, isPill: true },
      {
        icon: "shield",
        label: "Granted Scope",
        value: params.scope || "mcp:tools",
        isPill: true,
      },
      ...(params.redirectUri
        ? [
            {
              icon: "globe" as const,
              label: "Redirect URI",
              value: params.redirectUri,
            },
          ]
        : []),
      { icon: device.icon, label: "Client Device", value: device.deviceName },
      { icon: "globe", label: "Authorize IP", value: geo.ip, isPill: true },
      { icon: "clock", label: "Authorized At", value: timeStr },
    ])}
    <p style="font-size:13.5px; color:#52525b; line-height:1.6; margin-top:16px;">
      You can manage, rename, or revoke this authorization at any time in the <strong>API Keys &amp; OAuth</strong> settings page.
    </p>`;

  const html = renderEmailShell({
    badge: "OAuth Authorized",
    badgeTone: "emerald",
    title: `OAuth Client Authorized: ${displayName}`,
    description:
      "An external tool or model client was successfully authorized on your Krix instance.",
    bodyContent,
    footerAccount: params.email,
    timestamp: timeStr,
    ctaText: "Manage OAuth Clients",
    ctaUrl:
      process.env.PUBLIC_BASE_URL ||
      "https://krix.onrender.com/settings/api-keys",
  });

  return sendEmail({
    to: params.email,
    subject: `Krix Authorization: Connected to ${displayName}`,
    html,
  });
}
