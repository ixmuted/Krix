---
name: krix
description: Krix MCP gateway for agentic coding. Use for GitHub repo work (browse, search, edit, commit, PRs, issues, reviews), running code in an isolated sandbox, cloning/diffing/pushing with local git, sharing files with the user, managing Render services/deploys/logs/databases, and analyzing code structure with the code graph. Activate whenever the user asks to edit or fix code, review a PR or repo, debug, run tests or builds, deploy, or share output files.
---

# Krix MCP Skill

Krix is one MCP server with four tool groups. Read only the reference file for the group you need.

| Group | Use it for | Reference |
|---|---|---|
| GitHub | Repo browsing, search, surgical edits, commits, branches, PRs, issues, reviews, releases | `references/github.md` |
| Render | Services, deploys, logs, metrics, env vars, Postgres | `references/render.md` |
| Sandbox | Running code, shell, installs, local git, file sharing/downloads | `references/sandbox.md` |
| Code Graph | Callers/callees, hierarchy, dead code, complexity, architecture | `references/code-graph.md` |

## Not every tool is always available

The owner of the Krix server or API key controls which tools are on. Some may be turned off, and some need a credential before they work. Follow these rules:

- **Your tool list is the truth.** If a tool is not listed, it is disabled. Do not guess its parameters or call it.
- **Defaults:** sandbox/file tools and a core set of GitHub tools are on. Render, Code Graph, and the extended GitHub tools (issues, PR reviews, admin) are opt-in.
- **Credentials:** GitHub tools need a GitHub token, Render tools need a Render API key. Without one, those tools stay off.
- **Server limits:** the host may disable the whole sandbox category.
- **If something you need is off:** say so plainly, name the tool, and tell the user to enable it in Krix Settings (or add the credential). Then continue with what is available, e.g. use `get_file_contents` and `grep` if the code graph is off.
- **If a call fails with "unavailable" or "needs a token":** do not retry. Report it.

## Workflow

1. **Set context first** (GitHub): `set_active_context` with `owner`, `repo`, `branch` so later calls can omit them.
2. **Explore before editing:** `git_tree`, `view_file_outline`, `grep`, `get_file_contents` (read only the line ranges you need).
3. **Edit surgically:** prefer `str_replace_editor` or `patch_contents` over rewriting whole files. Use `push_files` for atomic multi-file commits.
4. **Verify:** clone into the sandbox (`git_clone`), run tests/builds with `sandbox_exec` or `sandbox_run`, check `git_diff`.
5. **Ship:** `git_commit_push` or `push_files`, then `create_pull_request`.
6. **Share results:** `sandbox_store` with `share` gives the user a private 48-hour download link.

## Important distinctions

- **`sandbox_file` vs `sandbox_store`:** `sandbox_file` reads/writes files inside the sandbox. `sandbox_store` moves files between the sandbox, the web and the user (`share`, `list`, `delete`, `download`).
- **Remote vs local git:** core GitHub tools (`str_replace_editor`, `push_files`, ...) act directly on the remote repo. `git_*` sandbox tools act on a local clone.
- **User uploads** land in `upload/` inside the sandbox.

## Safety

- Ask before destructive actions: `delete_repository`, `delete_service`, `delete_branch`, `delete_file`, `delete_env_var`, `merge_pull_request`.
- Never print tokens or secrets from env vars; mask them.
- Do not run write/delete Cypher queries unless the user asks.
