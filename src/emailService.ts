/**
 * Krix Email Service
 *
 * Modern, resilient email delivery system supporting dual transport:
 * 1. Gmail REST API over HTTPS via OAuth2 (works on Render free tier where SMTP ports 25/465/587 are blocked)
 * 2. Standard SMTP via Nodemailer
 *
 * Automatically sends notifications for:
 * - Account creation (first sign-in)
 * - Account deletion (30-day asynchronous grace period)
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

export interface SendAccountDeletedParams {
  email: string;
  name?: string;
  ip?: string;
  userAgent?: string;
  deletionDeadline?: number;
  gracePeriodDays?: number;
}

export interface SendAccountFinallyDeletedParams {
  email: string;
  name?: string;
  ip?: string;
  userAgent?: string;
  purgedAt?: number;
}

// ---------------------------------------------------------------------------
// Configuration & Brand Assets
// ---------------------------------------------------------------------------

export const KRIX_LOGO_URL =
  process.env.PUBLIC_BASE_URL &&
  !process.env.PUBLIC_BASE_URL.includes("example.com")
    ? `${process.env.PUBLIC_BASE_URL.replace(/\/+$/, "")}/icon-192.png`
    : "https://raw.githubusercontent.com/ixmuted/Krix/live/assets/icon-192.png";

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
// Monochrome Google-Style Email Shell & Mobile-First Info Rows
// ---------------------------------------------------------------------------

type InfoIconKey =
  | "profile"
  | "laptop"
  | "mobile"
  | "tablet"
  | "browser"
  | "globe"
  | "pin"
  | "clock"
  | "key"
  | "shield"
  | "trash"
  | "link"
  | "check";

function getPublicBaseUrl(): string {
  const raw = process.env.PUBLIC_BASE_URL;
  if (raw && !raw.includes("example.com")) {
    return raw.replace(/\/+$/, "");
  }
  return "https://krix.onrender.com";
}

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
  const baseUrl = getPublicBaseUrl();
  const fontSans =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(params.title)} - Krix</title>
</head>
<body style="margin:0; padding:0; background-color:#f8f9fa; font-family:${fontSans}; -webkit-font-smoothing:antialiased; color:#202124;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; background-color:#f8f9fa; padding:16px 8px 28px;">
    <tr>
      <td align="center" style="vertical-align:top;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:540px; width:100%; margin:0 auto; background-color:#ffffff; border:1px solid #dadce0; border-radius:8px;">
          <!-- Clean White Brand Header -->
          <tr>
            <td style="padding:18px 20px 14px; border-bottom:1px solid #e8eaed; background-color:#ffffff;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="left" style="vertical-align:middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:middle; padding-right:10px;">
                          <div role="img" aria-label="Krix" style="width:40px; height:40px; border-radius:50%; background-color:#ffffff; background-image:url('${KRIX_LOGO_URL}'); background-size:cover; background-position:center; background-repeat:no-repeat;"></div>
                        </td>
                        <td style="vertical-align:middle;">
                          <span style="font-family:${fontSans}; font-size:18px; font-weight:600; color:#202124; letter-spacing:-0.01em; line-height:1;">Krix</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="display:inline-block; padding:4px 10px; background-color:#f1f3f4; color:#202124; border:1px solid #dadce0; border-radius:9999px; font-size:11px; font-weight:600; letter-spacing:0.03em; text-transform:uppercase; font-family:${fontSans};">
                      ${escapeHtml(params.badge)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:22px 20px 20px; text-align:left; background-color:#ffffff;">
              <h1 style="margin:0 0 8px; font-size:20px; font-weight:600; color:#202124; letter-spacing:-0.01em; line-height:1.3; font-family:${fontSans};">
                ${escapeHtml(params.title)}
              </h1>
              <p style="margin:0 0 16px; font-size:14.5px; color:#3c4043; line-height:1.55; font-family:${fontSans};">
                ${escapeHtml(params.description)}
              </p>

              ${params.bodyContent}

              ${
                params.ctaText && params.ctaUrl
                  ? `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0 4px;">
                <tr>
                  <td align="left">
                    <a href="${escapeHtml(params.ctaUrl)}" style="display:inline-block; background-color:#111111; color:#ffffff !important; text-decoration:none !important; padding:12px 22px; border-radius:6px; font-size:14px; font-weight:600; line-height:1.2; font-family:${fontSans};">
                      ${escapeHtml(params.ctaText)}
                    </a>
                  </td>
                </tr>
              </table>`
                  : ""
              }
            </td>
          </tr>

          <!-- Minimal Footer -->
          <tr>
            <td style="padding:14px 20px 18px; border-top:1px solid #e8eaed; background-color:#ffffff; font-size:12px; color:#5f6368; line-height:1.55; font-family:${fontSans};">
              <p style="margin:0 0 6px;">
                <a href="${escapeHtml(baseUrl)}/help" style="color:#202124; text-decoration:underline; font-weight:500;">Help Center</a>
                &nbsp;&middot;&nbsp;
                <a href="${escapeHtml(baseUrl)}/privacy" style="color:#202124; text-decoration:underline; font-weight:500;">Privacy</a>
                &nbsp;&middot;&nbsp;
                <a href="${escapeHtml(baseUrl)}/terms" style="color:#202124; text-decoration:underline; font-weight:500;">Terms</a>
              </p>
              <p style="margin:0; font-size:11.5px; color:#5f6368;">
                Automated security notice for <strong style="color:#202124; font-weight:600;">${escapeHtml(params.footerAccount)}</strong> &middot; ${escapeHtml(params.timestamp)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Renders a mobile-safe stacked key-value detail list in crisp black & white.
 */
function renderInfoTable(
  rows: Array<{
    icon?: InfoIconKey;
    label: string;
    value: string;
    isPill?: boolean;
  }>,
): string {
  const fontSans =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
  const fontMono =
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

  const renderedRows = rows
    .map(
      (r, idx) => `
    <tr>
      <td style="padding:9px 14px; ${idx === rows.length - 1 ? "" : "border-bottom:1px solid #e8eaed;"} text-align:left; vertical-align:top;">
        <div style="font-family:${fontSans}; font-size:11px; font-weight:600; color:#5f6368; text-transform:uppercase; letter-spacing:0.04em; line-height:1.3; margin-bottom:3px;">
          ${escapeHtml(r.label)}
        </div>
        <div style="font-family:${r.isPill ? fontMono : fontSans}; font-size:${r.isPill ? "13px" : "14px"}; color:#202124; line-height:1.45; word-break:break-word; overflow-wrap:anywhere;">
          ${
            r.isPill
              ? `<span style="display:inline-block; background-color:#f1f3f4; color:#202124; border:1px solid #dadce0; padding:2px 8px; border-radius:4px; font-size:12.5px;">${escapeHtml(r.value)}</span>`
              : escapeHtml(r.value)
          }
        </div>
      </td>
    </tr>`,
    )
    .join("");

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; border-collapse:collapse; background-color:#f8f9fa; border:1px solid #dadce0; border-radius:8px; margin:14px 0;">
    ${renderedRows}
  </table>`;
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
    <div style="background-color:#f8f9fa; border:1px solid #dadce0; border-left:3px solid #111111; border-radius:6px; padding:12px 14px; margin:12px 0 14px; font-size:14px; line-height:1.55; color:#202124; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <strong>Account Active:</strong> Your isolated sandbox environment has been provisioned and is ready for MCP tool execution.
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
    <p style="font-size:13.5px; color:#3c4043; line-height:1.6; margin:16px 0 0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      You can now create dynamic MCP API keys, connect assistants (Gemini, Claude, Cursor), and execute tools within your isolated workspace.
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
    ctaUrl: getPublicBaseUrl(),
  });

  return sendEmail({
    to: params.email,
    subject: "Welcome to Krix — Account Created Successfully",
    html,
  });
}

/**
 * 2. Account Scheduled Deletion Notification (30-Day Asynchronous Grace Period)
 * Sent when a user initiates account deletion from the Danger Zone.
 */
export async function sendAccountDeletedEmail(
  params: SendAccountDeletedParams,
): Promise<SendResult> {
  const device = parseDeviceInfo(params.userAgent);
  const geo = await getIpGeoLocation(params.ip);
  const timeStr = formatTimestamp();
  const userName = params.name || params.email.split("@")[0] || "User";
  const graceDays = params.gracePeriodDays || 30;
  const deadlineMs =
    params.deletionDeadline || Date.now() + graceDays * 24 * 60 * 60 * 1000;
  const deadlineStr = formatTimestamp(deadlineMs);

  const bodyContent = `
    <div style="background-color:#f8f9fa; border:1px solid #dadce0; border-left:3px solid #111111; border-radius:6px; padding:12px 14px; margin:12px 0 14px; font-size:14px; line-height:1.55; color:#202124; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <strong>${graceDays}-Day Deletion Grace Period Active:</strong> We received a request to delete your Krix account. Your API keys and OAuth connections are now disabled, and your account will be permanently deleted on <strong>${deadlineStr}</strong>.
    </div>
    ${renderInfoTable([
      { icon: "profile", label: "Account Email", value: params.email },
      {
        icon: "trash",
        label: "Deletion Status",
        value: `Scheduled (${graceDays} Days)`,
        isPill: true,
      },
      {
        icon: "clock",
        label: "Permanent Deletion",
        value: deadlineStr,
      },
      { icon: device.icon, label: "Action Device", value: device.deviceName },
      { icon: "globe", label: "Origin IP", value: geo.ip, isPill: true },
      { icon: "pin", label: "Origin Location", value: geo.location },
      { icon: "clock", label: "Scheduled At", value: timeStr },
    ])}
    <p style="font-size:13.5px; color:#3c4043; line-height:1.6; margin:16px 0 0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <strong>Changed your mind?</strong> You have ${graceDays} days to restore your account. Simply sign back in to the Krix dashboard before <strong>${deadlineStr}</strong> and your account will be immediately restored.
    </p>`;

  const html = renderEmailShell({
    badge: "Scheduled Deletion",
    badgeTone: "amber",
    title: "Krix Account Scheduled for Deletion",
    description: `A deletion request was recorded for ${userName} (${params.email}) with an asynchronous ${graceDays}-day recovery window.`,
    bodyContent,
    footerAccount: params.email,
    timestamp: timeStr,
    ctaText: "Sign In to Cancel Deletion & Restore Account",
    ctaUrl: getPublicBaseUrl(),
  });

  return sendEmail({
    to: params.email,
    subject: `Krix Security Notice: Account Scheduled for Deletion (${graceDays}-Day Grace Period)`,
    html,
  });
}

/**
 * 2b. Account Finally Deleted Notification (Permanent Purge Confirmation)
 * Sent when the 30-day grace period has elapsed and the account is permanently expunged.
 */
export async function sendAccountFinallyDeletedEmail(
  params: SendAccountFinallyDeletedParams,
): Promise<SendResult> {
  const timeStr = formatTimestamp(params.purgedAt || Date.now());
  const userName = params.name || params.email.split("@")[0] || "User";

  const bodyContent = `
    <div style="background-color:#f8f9fa; border:1px solid #dadce0; border-left:3px solid #111111; border-radius:6px; padding:12px 14px; margin:12px 0 14px; font-size:14px; line-height:1.55; color:#202124; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <strong>Account Permanently Deleted:</strong> The 30-day grace period for your account has ended. All account records, tokens, credentials, and persistent workspaces have been permanently purged.
    </div>
    ${renderInfoTable([
      { icon: "profile", label: "Account Email", value: params.email },
      {
        icon: "trash",
        label: "Deletion Status",
        value: "Permanently Purged",
        isPill: true,
      },
      {
        icon: "shield",
        label: "Data Purged",
        value: "Tokens, Workspaces, Files",
      },
      { icon: "clock", label: "Purged At", value: timeStr },
    ])}
    <p style="font-size:13.5px; color:#3c4043; line-height:1.6; margin:16px 0 0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      All personal data, active OAuth authorizations, dynamic API keys, and isolated sandbox environments associated with your account have been irrevocably deleted in accordance with our security policies.
    </p>`;

  const html = renderEmailShell({
    badge: "Account Deleted",
    badgeTone: "red",
    title: "Krix Account Permanently Deleted",
    description: `The 30-day grace period has ended and all records for ${userName} (${params.email}) have been permanently purged.`,
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
    <div style="background-color:#f8f9fa; border:1px solid #dadce0; border-left:3px solid #111111; border-radius:6px; padding:12px 14px; margin:12px 0 14px; font-size:14px; line-height:1.55; color:#202124; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
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
    <p style="font-size:13.5px; color:#3c4043; line-height:1.6; margin:16px 0 0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
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
    ctaUrl: `${getPublicBaseUrl()}/settings`,
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
    <div style="background-color:#f8f9fa; border:1px solid #dadce0; border-left:3px solid #111111; border-radius:6px; padding:12px 14px; margin:12px 0 14px; font-size:14px; line-height:1.55; color:#202124; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <strong>OAuth Client Authorized:</strong> An external tool or assistant has been granted access to your Krix MCP endpoint.
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
    <p style="font-size:13.5px; color:#3c4043; line-height:1.6; margin:16px 0 0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
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
      `${getPublicBaseUrl()}/api`,
  });

  return sendEmail({
    to: params.email,
    subject: `Krix Authorization: Connected to ${displayName}`,
    html,
  });
}
