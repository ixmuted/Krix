import assert from "node:assert/strict";
import test, { describe } from "node:test";
import {
  HELP_CATEGORIES,
  getHelpCategory,
  renderHelpPage,
  renderHelpCategoryPage,
  renderPrivacyPage,
  renderTermsPage,
} from "../src/website/index.js";

const FORBIDDEN_CLIENT_BRANDS = [
  "cursor",
  "claude",
  "gemini",
  "chatgpt",
  "openai",
  "windsurf",
  "copilot",
  "vs code",
  "vscode",
  "anthropic",
];

describe("Help Center & Subpages", () => {
  test("renderHelpPage renders Anthropic-styled hub with key setup guide, all category links, and zero client brand names", () => {
    const html = renderHelpPage({
      base: "https://krix.example.com",
      nonce: "test_nonce_123",
    });

    assert.ok(html.includes("Krix Documentation &amp; Help Center"));
    assert.ok(html.includes("https://krix.example.com/mcp"));
    assert.ok(html.includes("Adding Krix keys &amp; provider tokens"));
    assert.ok(html.includes('id="helpSearchInput"'));
    assert.ok(html.includes('nonce="test_nonce_123"'));
    assert.ok(html.includes('data-copy="https://krix.example.com/mcp"'));

    const lower = html.toLowerCase();
    for (const brand of FORBIDDEN_CLIENT_BRANDS) {
      assert.ok(
        !lower.includes(brand),
        `Help hub must not mention third-party AI brand '${brand}'`,
      );
    }

    for (const cat of HELP_CATEGORIES) {
      assert.ok(
        html.includes(`href="/help/${cat.slug}"`),
        `Help hub must link to /help/${cat.slug}`,
      );
      assert.ok(
        html.includes(cat.title),
        `Help hub must display category title: ${cat.title}`,
      );
    }
  });

  test("renderHelpCategoryPage renders every category slug cleanly, excludes brand names, and returns null for unknown slug", () => {
    assert.ok(HELP_CATEGORIES.length >= 8);
    assert.ok(getHelpCategory("adding-keys"), "Must include adding-keys guide");

    for (const cat of HELP_CATEGORIES) {
      assert.equal(getHelpCategory(cat.slug)?.slug, cat.slug);
      const html = renderHelpCategoryPage({
        slug: cat.slug,
        base: "https://krix.example.com",
        nonce: "test_nonce_456",
      });
      assert.ok(html, `Expected HTML for /help/${cat.slug}`);
      assert.ok(html!.includes(cat.title));
      assert.ok(html!.includes('aria-label="Breadcrumb"'));
      assert.ok(html!.includes('href="/help"'));
      assert.ok(html!.includes('nonce="test_nonce_456"'));

      const lower = html!.toLowerCase();
      for (const brand of FORBIDDEN_CLIENT_BRANDS) {
        assert.ok(
          !lower.includes(brand),
          `/help/${cat.slug} must not mention third-party AI brand '${brand}'`,
        );
      }
    }

    assert.equal(
      renderHelpCategoryPage({
        slug: "does-not-exist",
        base: "https://krix.example.com",
      }),
      null,
    );
  });
});

describe("Privacy Policy & Terms of Service", () => {
  test("renderPrivacyPage renders original Privacy Policy with Effective Date", () => {
    const html = renderPrivacyPage({ nonce: "priv_nonce" });
    assert.ok(html.includes("Effective Date: November 2026"));
    assert.ok(html.includes("Privacy Policy"));
    assert.ok(html.includes("1. Overview"));
    assert.ok(html.includes("AES-256-GCM"));
    assert.ok(!html.includes("Server manifest"));
  });

  test("renderTermsPage renders original Terms of Service with Effective Date", () => {
    const html = renderTermsPage({ nonce: "tos_nonce" });
    assert.ok(html.includes("Effective Date: November 2026"));
    assert.ok(html.includes("Terms of Service"));
    assert.ok(html.includes("1. Acceptance of Terms"));
    assert.ok(html.includes("OAuth 2.1"));
    assert.ok(!html.includes("Server manifest"));
  });
});
