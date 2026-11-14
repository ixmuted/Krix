// Single source of truth for which GitHub tools are on by default, and for the
// user-facing error shown when a tool needs a provider credential that is missing.
// Kept dependency-free so both the server and the website pages can import it.

/** The only GitHub tools enabled by default. Every other GitHub tool is opt-in. */
export const DEFAULT_GITHUB_TOOLS: ReadonlySet<string> = new Set([
  "set_active_context",
  "get_me",
  "get_file_contents",
  "str_replace_editor",
  "create_or_update_file",
  "delete_file",
  "grep",
  "view_file_outline",
  "list_branches",
  "create_branch",
  "delete_branch",
  "push_files",
  "create_pull_request",
  "search_code",
  "search_repositories",
  "git_tree",
  "patch_contents",
]);

export function isDefaultGithubTool(toolName: string): boolean {
  return DEFAULT_GITHUB_TOOLS.has(toolName);
}

export type CredentialProvider = "github" | "render";
export type CredentialScope = "key" | "global" | "runtime";

const PROVIDER_LABEL: Record<CredentialProvider, string> = {
  github: "GitHub personal access token",
  render: "Render API key",
};

/**
 * Builds the error shown when a tool needs a credential that is not configured.
 * `key`     -> toggling a tool for one API key (add the key's own credential)
 * `global`  -> toggling from workspace settings (add the workspace credential)
 * `runtime` -> a tool call reached the server while the credential is missing
 */
export function credentialRequiredMessage(
  provider: CredentialProvider,
  toolName?: string,
  scope: CredentialScope = "key",
): string {
  const label = PROVIDER_LABEL[provider];
  const subject = toolName ? `"${toolName}"` : "This tool";
  if (scope === "runtime") {
    return `${subject} is unavailable: no ${label} is configured for this key. Add one in API Keys → Info, or in Settings, then reconnect.`;
  }
  if (scope === "global") {
    return `${subject} needs a ${label}. Add one under Settings → Provider Credentials before enabling it.`;
  }
  return `${subject} needs a ${label}. Add one under Settings → Workspace Credentials or provide an override for this API key before enabling it.`;
}
