import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_GITHUB_TOOLS, isDefaultGithubTool, credentialRequiredMessage } from "../src/toolDefaults.js";
import { TOOL_CATEGORY, getMissingToolCredential } from "../src/security.js";
import { getKeySettings, isToolEnabledForKey } from "../src/userSettings.js";

describe("Default GitHub tools and credential enforcement", () => {
  test("exactly the 17 requested GitHub tools are on by default", () => {
    assert.equal(DEFAULT_GITHUB_TOOLS.size, 17);
    for (const name of ["set_active_context","get_me","get_file_contents","str_replace_editor","create_or_update_file","delete_file","grep","view_file_outline","list_branches","create_branch","delete_branch","push_files","create_pull_request","search_code","search_repositories","git_tree","patch_contents"]) {
      assert.ok(isDefaultGithubTool(name), name);
    }
    assert.ok(!isDefaultGithubTool("merge_pull_request"));
  });

  test("every default tool is in the core group; issue/PR/admin tools are not", () => {
    for (const name of DEFAULT_GITHUB_TOOLS) assert.equal(TOOL_CATEGORY[name], "core", name);
    assert.equal(TOOL_CATEGORY.merge_pull_request, "github_issues_prs");
    assert.equal(TOOL_CATEGORY.create_repository, "github_admin");
  });

  test("default session enables core tools but not issue/PR/admin tools", () => {
    const keyId = "defaults-test-key";
    const sessionCats = new Set(["core", "sandbox", "files"]);
    assert.equal(isToolEnabledForKey(keyId, "get_file_contents", "core", sessionCats), true);
    assert.equal(isToolEnabledForKey(keyId, "merge_pull_request", "github_issues_prs", sessionCats), false);
    assert.equal(isToolEnabledForKey(keyId, "create_repository", "github_admin", sessionCats), false);
    assert.ok(!getKeySettings("owner-default-check").enabledCategories?.includes("github_admin"));
  });

  test("GitHub and Render tools are blocked without their credential", () => {
    assert.equal(getMissingToolCredential("get_me", { github: false, render: true }), "github");
    assert.equal(getMissingToolCredential("merge_pull_request", { github: false }), "github");
    assert.equal(getMissingToolCredential("list_services", { github: true, render: false }), "render");
    assert.equal(getMissingToolCredential("list_services", { github: true, render: true }), null);
    assert.equal(getMissingToolCredential("set_active_context", {}), null);
  });

  test("error messages name the provider and the tool", () => {
    assert.match(credentialRequiredMessage("github", "grep", "key"), /GitHub personal access token/);
    assert.match(credentialRequiredMessage("render", "list_services", "global"), /Render API key/);
    assert.match(credentialRequiredMessage("github", "grep", "runtime"), /"grep" is unavailable/);
  });
});
