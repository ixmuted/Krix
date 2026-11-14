import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  parseDeviceInfo,
  getIpGeoLocation,
  formatTimestamp,
  encodeRfc2047Subject,
  escapeHtml,
  isGmailApiConfigured,
  isSmtpConfigured,
  isEmailConfigured,
  getDeliveryMethod,
  sendEmail,
  sendAccountCreatedEmail,
  sendAccountDeletedEmail,
  sendNewLoginIpEmail,
  sendOAuthClientSetupEmail,
} from "../src/emailService.js";
import {
  getOrCreateUser,
  deleteUserAccount,
  type UserAccount,
} from "../src/userSettings.js";

describe("Email Service & User Security Tracking", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_CLIENT_ID;
    delete process.env.GMAIL_CLIENT_SECRET;
    delete process.env.GMAIL_REFRESH_TOKEN;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("Device Parsing", () => {
    it("identifies macOS desktop Chrome user agent", () => {
      const ua =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
      const info = parseDeviceInfo(ua);
      assert.equal(info.deviceType, "Desktop");
      assert.equal(info.browser, "Google Chrome");
      assert.equal(info.icon, "laptop");
      assert.ok(info.os.includes("macOS"));
    });

    it("identifies Windows desktop Edge user agent", () => {
      const ua =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";
      const info = parseDeviceInfo(ua);
      assert.equal(info.deviceType, "Desktop");
      assert.equal(info.browser, "Microsoft Edge");
      assert.equal(info.icon, "laptop");
      assert.equal(info.os, "Windows 10 / 11");
    });

    it("identifies iPhone mobile Safari user agent", () => {
      const ua =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1";
      const info = parseDeviceInfo(ua);
      assert.equal(info.deviceType, "Mobile");
      assert.equal(info.browser, "Apple Safari");
      assert.equal(info.icon, "mobile");
      assert.equal(info.os, "iOS 17.1");
    });

    it("identifies iPad tablet Safari user agent", () => {
      const ua =
        "Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";
      const info = parseDeviceInfo(ua);
      assert.equal(info.deviceType, "Tablet");
      assert.equal(info.icon, "tablet");
      assert.equal(info.os, "iPadOS 16.6");
    });

    it("gracefully falls back for empty or unknown user agent", () => {
      const info = parseDeviceInfo("");
      assert.equal(info.deviceType, "Unknown");
      assert.equal(info.deviceName, "Unknown Device");
      assert.equal(info.icon, "laptop");
    });
  });

  describe("IP Geolocation & Formatting", () => {
    it("identifies local and loopback IP addresses", async () => {
      const localLoopback = await getIpGeoLocation("127.0.0.1");
      assert.equal(localLoopback.isLocal, true);
      assert.equal(localLoopback.location, "Local / Private Network");

      const ipv6Loopback = await getIpGeoLocation("::1");
      assert.equal(ipv6Loopback.isLocal, true);

      const privateLan = await getIpGeoLocation("192.168.1.100");
      assert.equal(privateLan.isLocal, true);

      const v6Mapped = await getIpGeoLocation("::ffff:10.0.0.5");
      assert.equal(v6Mapped.isLocal, true);
    });

    it("formats timestamps cleanly with time zone", () => {
      const ts = formatTimestamp(new Date("2026-11-14T10:00:00Z"));
      assert.ok(typeof ts === "string");
      assert.ok(ts.includes("2026"));
      assert.ok(ts.includes("Nov"));
    });

    it("encodes RFC 2047 subjects safely", () => {
      const encoded = encodeRfc2047Subject(
        "Security Alert: Sign-in from 1.2.3.4",
      );
      assert.ok(encoded.startsWith("=?UTF-8?B?"));
      assert.ok(encoded.endsWith("?="));
    });

    it("escapes HTML special characters", () => {
      const escaped = escapeHtml(
        "<script>alert(\"xss & 'injection'\")</script>",
      );
      assert.ok(!escaped.includes("<script>"));
      assert.ok(escaped.includes("&lt;script&gt;"));
      assert.ok(escaped.includes("&quot;"));
      assert.ok(escaped.includes("&amp;"));
    });
  });

  describe("Configuration & Graceful Degradation", () => {
    it("reports unconfigured when no email env vars are present", () => {
      assert.equal(isGmailApiConfigured(), false);
      assert.equal(isSmtpConfigured(), false);
      assert.equal(isEmailConfigured(), false);
      assert.equal(getDeliveryMethod(), "none");
    });

    it("detects Gmail API configuration", () => {
      process.env.GMAIL_USER = "test@gmail.com";
      process.env.GMAIL_CLIENT_ID = "test-client-id";
      process.env.GMAIL_CLIENT_SECRET = "test-client-secret";
      process.env.GMAIL_REFRESH_TOKEN = "test-refresh-token";

      assert.equal(isGmailApiConfigured(), true);
      assert.equal(isEmailConfigured(), true);
      assert.equal(getDeliveryMethod(), "gmail_api");
    });

    it("detects SMTP configuration", () => {
      process.env.SMTP_HOST = "smtp.example.com";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "user";
      process.env.SMTP_PASS = "pass";

      assert.equal(isSmtpConfigured(), true);
      assert.equal(isEmailConfigured(), true);
      assert.equal(getDeliveryMethod(), "smtp");
    });

    it("safely skips email without throwing when unconfigured", async () => {
      const res = await sendEmail({
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Hello</p>",
      });

      assert.equal(res.success, false);
      assert.equal(res.skipped, true);
    });
  });

  describe("Notification Triggers & Templates", () => {
    it("sends account created email with expected structure and data", async () => {
      const result = await sendAccountCreatedEmail({
        email: "alice@example.com",
        name: "Alice Developer",
        ip: "127.0.0.1",
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        role: "user",
        sandboxId: "sbx_test123",
      });
      // In unconfigured state, returns skipped=true safely
      assert.equal(result.skipped, true);
    });

    it("sends account deleted email safely", async () => {
      const result = await sendAccountDeletedEmail({
        email: "alice@example.com",
        name: "Alice",
        ip: "127.0.0.1",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      });
      assert.equal(result.skipped, true);
    });

    it("sends new login IP alert email safely", async () => {
      const result = await sendNewLoginIpEmail({
        email: "alice@example.com",
        name: "Alice",
        ip: "203.0.113.42",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        previousIp: "198.51.100.1",
      });
      assert.equal(result.skipped, true);
    });

    it("sends OAuth client authorization email safely", async () => {
      const result = await sendOAuthClientSetupEmail({
        email: "alice@example.com",
        name: "Alice",
        clientId: "client_gemini_cli",
        clientName: "Google Gemini CLI",
        redirectUri: "http://localhost:8085/callback",
        scope: "mcp:tools",
        ip: "127.0.0.1",
      });
      assert.equal(result.skipped, true);
    });
  });

  describe("User IP Tracking & Account Deletion", () => {
    const testEmail = "test_ip_track@example.com";

    afterEach(() => {
      deleteUserAccount(testEmail);
    });

    it("tracks initial login and detects subsequent login from new IP", () => {
      // 1. Initial registration / login from IP A
      const firstLogin = getOrCreateUser(testEmail, "192.168.1.10");
      assert.equal(firstLogin.isNewUser, true);
      assert.equal(firstLogin.isNewIp, false); // initial user creation is not a new IP alert
      assert.equal(firstLogin.lastLoginIp, "192.168.1.10");
      assert.deepEqual(firstLogin.knownIps, ["192.168.1.10"]);

      // 2. Subsequent login from same IP A
      const secondLogin = getOrCreateUser(testEmail, "192.168.1.10");
      assert.equal(secondLogin.isNewUser, false);
      assert.equal(secondLogin.isNewIp, false); // same IP
      assert.deepEqual(secondLogin.knownIps, ["192.168.1.10"]);

      // 3. Subsequent login from brand new IP B
      const thirdLogin = getOrCreateUser(testEmail, "203.0.113.50");
      assert.equal(thirdLogin.isNewUser, false);
      assert.equal(thirdLogin.isNewIp, true); // NEW IP DETECTED!
      assert.equal(thirdLogin.lastLoginIp, "203.0.113.50");
      assert.deepEqual(thirdLogin.knownIps, ["192.168.1.10", "203.0.113.50"]);

      // 4. Login from IP A again (already known)
      const fourthLogin = getOrCreateUser(testEmail, "192.168.1.10");
      assert.equal(fourthLogin.isNewUser, false);
      assert.equal(fourthLogin.isNewIp, false); // already in knownIps
    });

    it("deletes user account cleanly", () => {
      getOrCreateUser(testEmail, "127.0.0.1");
      const deleted = deleteUserAccount(testEmail);
      assert.equal(deleted, true);

      // Deleting again returns false as it no longer exists
      const deletedAgain = deleteUserAccount(testEmail);
      assert.equal(deletedAgain, false);
    });
  });
});
