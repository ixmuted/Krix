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

const FORBIDDEN_INTERNAL_SECURITY = [
  "aes-256-gcm",
  "hmac-sha256",
  "key_encryption_secret",
  "audit_hash_secret",
  "owner_email",
  "mcp_api_key",
  "mongodb_uri",
  "enable_sandbox",
  "allow_query_api_key",
  "command_restriction_level",
  "network_restriction_level",
];

describe("Help Center & Subpages", () => {
  test("renderHelpPage matches homepage UI, uses files icon, clean search placeholder, and omits internal security details", () => {
    const html = renderHelpPage({
      base: "https://krix.example.com",
      nonce: "test_nonce_123",
    });

    assert.ok(html.includes('class="hm"'));
    assert.ok(html.includes("Krix documentation."));
    assert.ok(html.includes('placeholder="Search guides"'));
    assert.ok(html.includes("Streamable HTTP Transport"));
    assert.ok(html.includes("https://krix.example.com/mcp"));
    assert.ok(html.includes("Add your keys in three steps"));
    assert.ok(html.includes('nonce="test_nonce_123"'));
    assert.ok(html.includes('data-copy="https://krix.example.com/mcp"'));

    const filesCat = getHelpCategory("files-and-store");
    assert.equal(filesCat?.icon, "files");

    const lower = html.toLowerCase();
    for (const brand of FORBIDDEN_CLIENT_BRANDS) {
      assert.ok(
        !lower.includes(brand),
        `Help hub must not mention third-party AI brand '${brand}'`,
      );
    }
    for (const secret of FORBIDDEN_INTERNAL_SECURITY) {
      assert.ok(
        !lower.includes(secret),
        `Help hub must not expose internal security detail '${secret}'`,
      );
    }

    for (const cat of HELP_CATEGORIES) {
      assert.ok(
        html.includes(`href="/help/${cat.slug}"`),
        `Help hub must link to /help/${cat.slug}`,
      );
    }
  });

  test("renderHelpCategoryPage renders detailed tool references, omits internal security details, and returns null for unknown slug", () => {
    assert.ok(HELP_CATEGORIES.length >= 8);
    assert.ok(getHelpCategory("adding-keys"), "Must include adding-keys guide");

    for (const cat of HELP_CATEGORIES) {
      const html = renderHelpCategoryPage({
        slug: cat.slug,
        base: "https://krix.example.com",
        nonce: "test_nonce_456",
      });
      assert.ok(html, `Expected HTML for /help/${cat.slug}`);
      assert.ok(html!.includes(cat.title));
      assert.ok(html!.includes('aria-label="Breadcrumb"'));
      assert.ok(html!.includes('nonce="test_nonce_456"'));

      const lower = html!.toLowerCase();
      for (const brand of FORBIDDEN_CLIENT_BRANDS) {
        assert.ok(
          !lower.includes(brand),
          `/help/${cat.slug} must not mention third-party AI brand '${brand}'`,
        );
      }
      for (const secret of FORBIDDEN_INTERNAL_SECURITY) {
        assert.ok(
          !lower.includes(secret),
          `/help/${cat.slug} must not expose internal security detail '${secret}'`,
        );
      }
    }

    const ghHtml = renderHelpCategoryPage({ slug: "github", base: "https://krix.example.com" })!;
    assert.ok(ghHtml.includes("str_replace_editor"));
    assert.ok(ghHtml.includes("pull_request_review_write"));

    const renderHtml = renderHelpCategoryPage({ slug: "render", base: "https://krix.example.com" })!;
    assert.ok(renderHtml.includes("query_render_postgres"));
    assert.ok(renderHtml.includes("trigger_deploy"));

    const sbxHtml = renderHelpCategoryPage({ slug: "sandbox", base: "https://krix.example.com" })!;
    assert.ok(sbxHtml.includes("sandbox_install"));
    assert.ok(sbxHtml.includes("git_commit_push"));

    const cgHtml = renderHelpCategoryPage({ slug: "code-graph", base: "https://krix.example.com" })!;
    assert.ok(cgHtml.includes("analyze_code_relationships"));
    assert.ok(cgHtml.includes("find_dead_code"));

    assert.equal(
      renderHelpCategoryPage({ slug: "does-not-exist", base: "https://krix.example.com" }),
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
    assert.ok(!html.includes("Server manifest"));
  });

  test("renderTermsPage renders original Terms of Service with Effective Date", () => {
    const html = renderTermsPage({ nonce: "tos_nonce" });
    assert.ok(html.includes("Effective Date: November 2026"));
    assert.ok(html.includes("Terms of Service"));
    assert.ok(html.includes("1. Acceptance of Terms"));
    assert.ok(!html.includes("Server manifest"));
  });
});
