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
// Minimal Google-Style Transactional Email Shell
// ---------------------------------------------------------------------------

function getPublicBaseUrl(): string {
  const raw = process.env.PUBLIC_BASE_URL;
  if (raw && !raw.includes("example.com")) {
    return raw.replace(/\/+$/, "");
  }
  return "https://krix.onrender.com";
}

function renderDetailList(
  items: Array<{ label: string; value: string }>,
): string {
  const li = items
    .map(
      (item) =>
        `<li style="margin:0 0 8px; padding:0; line-height:1.6;"><strong style="font-weight:600;">${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</li>`,
    )
    .join("\n              ");

  return `<ul style="margin:0 0 20px; padding:0 0 0 20px; font-size:14px; color:#3c4043; line-height:1.6;">
              ${li}
            </ul>`;
}

function renderEmailShell(params: {
  title: string;
  greeting: string;
  intro: string;
  bodyHtml: string;
  closing?: string;
  ctaText?: string;
  ctaUrl?: string;
  footerAccount: string;
  timestamp: string;
}): string {
  const baseUrl = getPublicBaseUrl();
  const fontSans =
    "Roboto, 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${escapeHtml(params.title)} - Krix</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family:${fontSans}; -webkit-font-smoothing:antialiased; color:#202124;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; background-color:#ffffff; padding:24px 12px 32px;">
    <tr>
      <td align="center" style="vertical-align:top;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:516px; width:100%; margin:0 auto; background-color:#ffffff; border:1px solid #dadce0; border-radius:8px;">
          <tr>
            <td style="padding:36px 28px 32px; text-align:left; background-color:#ffffff; font-family:${fontSans}; font-size:14px; line-height:1.6; color:#3c4043;">
              <!-- Centered Krix Logo + Wordmark (light-only meta + 64px size prevents Gmail Dark Mode inversion) -->
              <div style="text-align:center; margin:0 0 24px;">
                <img src="${KRIX_LOGO_URL}" width="64" height="64" alt="Krix" style="display:block; width:64px; height:64px; margin:0 auto 10px; border-radius:50%; border:0;" />
                <span style="font-family:${fontSans}; font-size:20px; font-weight:600; color:#202124; letter-spacing:-0.02em; line-height:1;">Krix</span>
              </div>

              <p style="margin:0 0 16px; font-size:14px; line-height:1.6; color:#3c4043;">
                ${escapeHtml(params.greeting)}
              </p>

              <p style="margin:0 0 18px; font-size:14px; line-height:1.6; color:#3c4043;">
                ${escapeHtml(params.intro)}
              </p>

              ${params.bodyHtml}

              ${
                params.ctaText && params.ctaUrl
                  ? `<div style="margin:24px 0 22px; text-align:left;">
                <a href="${escapeHtml(params.ctaUrl)}" style="display:inline-block; background-color:#1a73e8; color:#ffffff !important; text-decoration:none !important; padding:10px 24px; border-radius:4px; font-size:14px; font-weight:500; line-height:1.25; font-family:${fontSans};">${escapeHtml(params.ctaText)}</a>
              </div>`
                  : ""
              }

              ${
                params.closing
                  ? `<p style="margin:0 0 18px; font-size:14px; line-height:1.6; color:#3c4043;">
                ${escapeHtml(params.closing)}
              </p>`
                  : ""
              }

              <p style="margin:20px 0 0; font-size:14px; line-height:1.6; color:#3c4043;">
                Thanks,<br />
                The Krix team
              </p>
            </td>
          </tr>
        </table>

        <!-- Quiet Footer Below Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:516px; width:100%; margin:16px auto 0;">
          <tr>
            <td style="padding:0 12px; text-align:center; font-family:${fontSans}; font-size:11.5px; line-height:1.6; color:#5f6368;">
              <p style="margin:0 0 6px;">
                You received this email to let you know about important activity on your Krix account (${escapeHtml(params.footerAccount)}).
              </p>
              <p style="margin:0 0 6px;">
                <a href="${escapeHtml(baseUrl)}/help" style="color:#1a73e8; text-decoration:none;">Help Center</a>
                &nbsp;&middot;&nbsp;
                <a href="${escapeHtml(baseUrl)}/privacy" style="color:#1a73e8; text-decoration:none;">Privacy</a>
                &nbsp;&middot;&nbsp;
                <a href="${escapeHtml(baseUrl)}/terms" style="color:#1a73e8; text-decoration:none;">Terms</a>
              </p>
              <p style="margin:0; font-size:11px; color:#70757a;">
                ${escapeHtml(params.timestamp)}
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
  const userName = params.name || params.email.split("@")[0] || "there";
  const userRole = (params.role || "user").toUpperCase();

  const details: Array<{ label: string; value: string }> = [
    { label: "Account", value: params.email },
    { label: "Role", value: userRole },
    ...(params.sandboxId ? [{ label: "Sandbox ID", value: params.sandboxId }] : []),
    { label: "Device", value: `${device.deviceName} · ${device.browser}` },
    { label: "Location", value: `${geo.location} (${geo.ip})` },
    { label: "Time", value: timeStr },
  ];

  const html = renderEmailShell({
    title: "Welcome to Krix",
    greeting: `Hi ${userName},`,
    intro:
      "Welcome to Krix. Your account is now active and your isolated workspace is ready for MCP tools and API keys.",
    bodyHtml: renderDetailList(details),
    closing:
      "If you didn't create this account, you can review your sessions and revoke access from your dashboard.",
    ctaText: "Open Krix Dashboard",
    ctaUrl: getPublicBaseUrl(),
    footerAccount: params.email,
    timestamp: timeStr,
  });

  return sendEmail({
    to: params.email,
    subject: "Welcome to Krix",
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
  const userName = params.name || params.email.split("@")[0] || "there";
  const graceDays = params.gracePeriodDays || 30;
  const deadlineMs =
    params.deletionDeadline || Date.now() + graceDays * 24 * 60 * 60 * 1000;
  const deadlineStr = formatTimestamp(deadlineMs);

  const details: Array<{ label: string; value: string }> = [
    { label: "Account", value: params.email },
    { label: "Status", value: `Scheduled for deletion (${graceDays}-day grace period)` },
    { label: "Permanent deletion date", value: deadlineStr },
    { label: "Requested from", value: `${device.deviceName} · ${geo.location} (${geo.ip})` },
    { label: "Time", value: timeStr },
  ];

  const html = renderEmailShell({
    title: "Account scheduled for deletion",
    greeting: `Hi ${userName},`,
    intro: `We received a request to delete your Krix account. Your API keys and OAuth connections have been disabled, and all account data will be permanently deleted on ${deadlineStr}.`,
    bodyHtml: renderDetailList(details),
    closing: `Changed your mind? Simply sign back in to Krix before ${deadlineStr} to cancel deletion and restore your account immediately.`,
    ctaText: "Sign in to restore account",
    ctaUrl: getPublicBaseUrl(),
    footerAccount: params.email,
    timestamp: timeStr,
  });

  return sendEmail({
    to: params.email,
    subject: `Your Krix account is scheduled for deletion (${graceDays}-day grace period)`,
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
  const userName = params.name || params.email.split("@")[0] || "there";

  const details: Array<{ label: string; value: string }> = [
    { label: "Account", value: params.email },
    { label: "Status", value: "Permanently deleted" },
    { label: "Removed data", value: "Account records, API keys, OAuth tokens, and workspace files" },
    { label: "Time", value: timeStr },
  ];

  const html = renderEmailShell({
    title: "Account permanently deleted",
    greeting: `Hi ${userName},`,
    intro:
      "The 30-day grace period for your Krix account has ended, and your account and associated data have been permanently deleted.",
    bodyHtml: renderDetailList(details),
    closing: "No further action is required. You can sign up again at any time if you decide to return.",
    footerAccount: params.email,
    timestamp: timeStr,
  });

  return sendEmail({
    to: params.email,
    subject: "Your Krix account has been permanently deleted",
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
  const userName = params.name || params.email.split("@")[0] || "there";

  const details: Array<{ label: string; value: string }> = [
    { label: "Device", value: `${device.deviceName} · ${device.browser}` },
    { label: "Approximate location", value: geo.location },
    { label: "IP address", value: geo.ip },
    ...(params.previousIp ? [{ label: "Previous IP", value: params.previousIp }] : []),
    { label: "Time", value: timeStr },
  ];

  const html = renderEmailShell({
    title: "New sign-in to your Krix account",
    greeting: `Hi ${userName},`,
    intro:
      "We noticed a new sign-in to your Krix account from an IP address we haven't seen before. If this was you, you don't need to do anything.",
    bodyHtml: renderDetailList(details),
    closing:
      "If you don't recognize this activity, review your settings and revoke any active API keys or OAuth clients right away.",
    ctaText: "Check activity",
    ctaUrl: `${getPublicBaseUrl()}/settings`,
    footerAccount: params.email,
    timestamp: timeStr,
  });

  return sendEmail({
    to: params.email,
    subject: `Security alert: New sign-in to Krix from ${geo.ip}`,
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
  const userName = params.name || params.email.split("@")[0] || "there";
  const displayName =
    params.clientName || params.clientId || "External Application";

  const details: Array<{ label: string; value: string }> = [
    { label: "Application", value: displayName },
    { label: "Client ID", value: params.clientId },
    { label: "Scope", value: params.scope || "mcp:tools" },
    ...(params.redirectUri ? [{ label: "Redirect URI", value: params.redirectUri }] : []),
    { label: "Device", value: `${device.deviceName} · ${geo.location} (${geo.ip})` },
    { label: "Time", value: timeStr },
  ];

  const html = renderEmailShell({
    title: `${displayName} was connected to your Krix account`,
    greeting: `Hi ${userName},`,
    intro: `You granted ${displayName} access to your Krix MCP account. You can review or revoke this connection at any time.`,
    bodyHtml: renderDetailList(details),
    closing:
      "If you didn't authorize this connection, open your API Keys & OAuth settings immediately to revoke it.",
    ctaText: "Manage connections",
    ctaUrl: `${getPublicBaseUrl()}/api`,
    footerAccount: params.email,
    timestamp: timeStr,
  });

  return sendEmail({
    to: params.email,
    subject: `Security alert: ${displayName} was connected to your Krix account`,
    html,
  });
}

/**
 * 5. Inactivity Check-In Email
 * Sent when a user has not signed in for 14+ days (at most once every 30 days).
 */
export async function sendInactiveUserEmail(params: {
  email: string;
  name?: string;
  daysInactive: number;
}): Promise<SendResult> {
  const timeStr = formatTimestamp();
  const userName = params.name || params.email.split("@")[0] || "there";
  const days = Math.max(1, Math.round(params.daysInactive));

  const details: Array<{ label: string; value: string }> = [
    { label: "Time away", value: `${days} days` },
    { label: "Workspace status", value: "Ready & waiting" },
    { label: "Available tools", value: "GitHub, Render, Sandbox & Code Graph" },
  ];

  const html = renderEmailShell({
    title: "Your Krix workspace is still warm",
    greeting: `Hi ${userName},`,
    intro: `It's been ${days} days since we last saw you on Krix. Your isolated sandbox, API keys, and MCP tools are ready whenever you want to build something new.`,
    bodyHtml: renderDetailList(details),
    closing:
      "Drop back in anytime to run code in your sandbox, inspect a repo, or check your connected AI clients.",
    ctaText: "Open Krix",
    ctaUrl: `${getPublicBaseUrl()}/`,
    footerAccount: params.email,
    timestamp: timeStr,
  });

  return sendEmail({
    to: params.email,
    subject: "Your Krix workspace is waiting for you",
    html,
  });
}

/**
 * 6. Welcome Back Email
 * Sent when an existing user returns after 7+ days away.
 */
export async function sendWelcomeBackEmail(params: {
  email: string;
  name?: string;
  daysAway: number;
}): Promise<SendResult> {
  const timeStr = formatTimestamp();
  const userName = params.name || params.email.split("@")[0] || "there";
  const days = Math.max(1, Math.round(params.daysAway));

  const details: Array<{ label: string; value: string }> = [
    { label: "Away for", value: `${days} days` },
    { label: "Signed back in", value: timeStr },
  ];

  const html = renderEmailShell({
    title: "Welcome back to Krix",
    greeting: `Hey ${userName},`,
    intro: `Great to see you again after ${days} days away! Your sandbox, keys, and settings are all set right where you left them.`,
    bodyHtml: renderDetailList(details),
    closing:
      "Need to reconnect an AI client or check your active tokens? Everything is one click away in your dashboard.",
    ctaText: "Go to dashboard",
    ctaUrl: `${getPublicBaseUrl()}/`,
    footerAccount: params.email,
    timestamp: timeStr,
  });

  return sendEmail({
    to: params.email,
    subject: "Welcome back to Krix!",
    html,
  });
}

/**
 * 7. First API Key Milestone Email
 * Sent once when a user creates their very first Krix API key.
 */
export async function sendFirstKeyMilestoneEmail(params: {
  email: string;
  name?: string;
  keyLabel: string;
}): Promise<SendResult> {
  const timeStr = formatTimestamp();
  const userName = params.name || params.email.split("@")[0] || "there";

  const details: Array<{ label: string; value: string }> = [
    { label: "First key", value: params.keyLabel },
    { label: "MCP endpoint", value: `${getPublicBaseUrl()}/mcp` },
    { label: "Created", value: timeStr },
  ];

  const html = renderEmailShell({
    title: "Your first Krix API key is live",
    greeting: `Nice work, ${userName}!`,
    intro: `You just created your first Krix API key ("${params.keyLabel}"). You can now connect Krix directly to your favorite MCP-compatible AI client.`,
    bodyHtml: renderDetailList(details),
    closing:
      "Tip: Add a GitHub or Render token in Settings anytime to unlock repository and deployment tools for your keys.",
    ctaText: "View API keys",
    ctaUrl: `${getPublicBaseUrl()}/api`,
    footerAccount: params.email,
    timestamp: timeStr,
  });

  return sendEmail({
    to: params.email,
    subject: "You're all set — your first Krix API key is live",
    html,
  });
}

/**
 * 8. API Key Deleted / Revoked Security Email
 * Sent when an API key is permanently deleted from a user's account.
 */
export async function sendApiKeyDeletedEmail(params: {
  email: string;
  name?: string;
  keyLabel: string;
  keyId: string;
}): Promise<SendResult> {
  const timeStr = formatTimestamp();
  const userName = params.name || params.email.split("@")[0] || "there";

  const details: Array<{ label: string; value: string }> = [
    { label: "Key name", value: params.keyLabel },
    { label: "Key ID", value: params.keyId },
    { label: "Time", value: timeStr },
  ];

  const html = renderEmailShell({
    title: "API key deleted from your Krix account",
    greeting: `Hi ${userName},`,
    intro: `Your API key "${params.keyLabel}" was permanently deleted and can no longer authenticate requests to Krix.`,
    bodyHtml: renderDetailList(details),
    closing:
      "If you didn't delete this key, check your account activity and review your remaining API keys and OAuth connections.",
    ctaText: "Manage API keys",
    ctaUrl: `${getPublicBaseUrl()}/api`,
    footerAccount: params.email,
    timestamp: timeStr,
  });

  return sendEmail({
    to: params.email,
    subject: `Security notice: API key "${params.keyLabel}" was deleted`,
    html,
  });
}
