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

/**
 * Tools that are ON out of the box (before anyone toggles anything):
 *   - every sandbox / file tool,
 *   - `sandbox_status` and the default GitHub set (see DEFAULT_GITHUB_TOOLS).
 * Everything else (issues/PRs, GitHub admin, Render, code graph, web search) is opt-in.
 *
 * "Default on" is only the starting point. A tool whose provider credential (GitHub token /
 * Render key) is missing stays OFF and cannot be switched on, whatever this says; the
 * credential check is applied separately by the caller.
 */
export function isDefaultOnTool(toolName: string, category: string): boolean {
  if (category === "sandbox" || category === "files") return true;
  if (toolName === "sandbox_status") return true;
  return DEFAULT_GITHUB_TOOLS.has(toolName);
}

export type ToolStateReason =
  | "key-on" // switched on for this key
  | "key-off" // switched off for this key
  | "global-on" // switched on in workspace settings
  | "global-off" // switched off in workspace settings
  | "default-on"
  | "default-off"
  | "needs-github" // no GitHub token for this key or workspace
  | "needs-render" // no Render key for this key or workspace
  | "sandbox-unavailable"; // the server does not allow sandbox / file tools

export interface ToolStateInput {
  toolName: string;
  /** Internal category: core, sandbox, files, codegraph, render, github_issues_prs, github_admin. */
  category: string;
  /** Provider this tool cannot work without, or null. */
  requires: CredentialProvider | null;
  credentials: { github?: boolean; render?: boolean };
  /** False when the deployment forbids this tool's category (e.g. sandbox on a shared host). */
  categoryAllowed: boolean;
  keyEnabled?: readonly string[];
  keyDisabled?: readonly string[];
  /** Workspace (global) overrides, inherited by every key that has no override of its own. */
  globalEnabled?: readonly string[];
  globalDisabled?: readonly string[];
}

/**
 * The one place that decides whether a tool is on. The server (tools/list, tools/call, OAuth
 * scopes) and the Settings pages both use it so they can never disagree.
 * Order: hard blocks -> this key's own override -> workspace override -> default.
 */
export function resolveToolState(i: ToolStateInput): {
  enabled: boolean;
  reason: ToolStateReason;
} {
  if (!i.categoryAllowed) return { enabled: false, reason: "sandbox-unavailable" };
  if (i.requires === "github" && !i.credentials.github)
    return { enabled: false, reason: "needs-github" };
  if (i.requires === "render" && !i.credentials.render)
    return { enabled: false, reason: "needs-render" };
  if (i.keyDisabled?.includes(i.toolName)) return { enabled: false, reason: "key-off" };
  if (i.keyEnabled?.includes(i.toolName)) return { enabled: true, reason: "key-on" };
  if (i.globalDisabled?.includes(i.toolName))
    return { enabled: false, reason: "global-off" };
  if (i.globalEnabled?.includes(i.toolName))
    return { enabled: true, reason: "global-on" };
  return isDefaultOnTool(i.toolName, i.category)
    ? { enabled: true, reason: "default-on" }
    : { enabled: false, reason: "default-off" };
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
    return `${subject} is unavailable: no ${label} is configured for this key. Add one in API Keys (Info), or in Settings, then reconnect.`;
  }
  if (scope === "global") {
    return `${subject} needs a ${label}. Add one under Settings (Provider Credentials) before enabling it.`;
  }
  return `${subject} needs a ${label}. Add one under Settings (Workspace Credentials) or provide an override for this API key before enabling it.`;
}

/**
 * Reasons that mean "this tool cannot be on right now whatever the user toggles". The Settings
 * pages lock the switch and show the label instead of letting a click look like it worked.
 * Returns "" for every reason where the user is free to choose.
 */
export function blockedToolReasonLabel(reason: string | undefined): string {
  switch (reason) {
    case "needs-github":
      return "Needs a GitHub token";
    case "needs-render":
      return "Needs a Render API key";
    case "sandbox-unavailable":
      return "Disabled by the server";
    default:
      return "";
  }
}

/**
 * Message returned when someone tries to switch on a tool whose whole category the server
 * forbids. `reason` is the server's own explanation (for sandbox: sandboxPolicy().reason).
 */
export function categoryUnavailableMessage(
  toolName: string,
  category: string,
  reason?: string,
): string {
  if (category === "sandbox") {
    return `"${toolName}" cannot be enabled: ${reason || "sandbox tools are switched off on this server (set ENABLE_SANDBOX=true and run the isolated Docker image)."}`;
  }
  if (category === "files") {
    return `"${toolName}" cannot be enabled: file sharing is switched off on this server (ENABLE_FILE_SHARING=false).`;
  }
  return `"${toolName}" cannot be enabled: this tool group is switched off on this server.`;
}
