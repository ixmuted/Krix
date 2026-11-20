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

describe("Help Center & Subpages", () => {
  test("renderHelpPage renders Anthropic-styled hub with all category links and live search", () => {
    const html = renderHelpPage({
      base: "https://krix.example.com",
      nonce: "test_nonce_123",
    });

    assert.ok(html.includes("Krix Documentation &amp; Help Center"));
    assert.ok(html.includes("https://krix.example.com/mcp"));
    assert.ok(html.includes('id="helpSearchInput"'));
    assert.ok(html.includes('nonce="test_nonce_123"'));
    assert.ok(html.includes('data-copy="https://krix.example.com/mcp"'));
    assert.ok(
      !html.includes("window.copyToClipboard("),
      "Help hub should bind copy buttons via CSP-safe data-copy listeners instead of inline onclick",
    );

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

  test("renderHelpCategoryPage renders every category slug cleanly and returns null for unknown slug", () => {
    assert.ok(HELP_CATEGORIES.length >= 8);

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
  test("renderPrivacyPage accurately covers encryption, retention, redaction, and deletion", () => {
    const html = renderPrivacyPage({ nonce: "priv_nonce" });
    assert.ok(html.includes("Privacy Policy"));
    assert.ok(html.includes("AES-256-GCM"));
    assert.ok(html.includes("HMAC-SHA256"));
    assert.ok(html.includes("30-day grace period"));
    assert.ok(html.includes("GridFS"));
    assert.ok(html.includes("reCAPTCHA v3"));
    assert.ok(html.includes('href="/terms"'));
  });

  test("renderTermsPage accurately covers Streamable HTTP, OAuth 2.1, quotas, MIT license, and liability", () => {
    const html = renderTermsPage({ nonce: "tos_nonce" });
    assert.ok(html.includes("Terms of Service"));
    assert.ok(html.includes("/mcp"));
    assert.ok(html.includes("OAuth 2.1"));
    assert.ok(html.includes("50 MB"));
    assert.ok(html.includes("MIT License"));
    assert.ok(html.includes("30-day grace period"));
    assert.ok(html.includes('href="/privacy"'));
  });
});
