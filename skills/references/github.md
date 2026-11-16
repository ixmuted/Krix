# GitHub Tools Reference

Covers all GitHub tools in Krix: **Part 1** is the core agentic set (17 tools) and **Part 2** is the extended GitHub MCP set (issues, PRs, reviews, releases, teams, admin, Copilot).

> **Availability:** Not every tool listed here is always on. The server owner (or the key's settings) can switch tools off, and tools that need a credential stay off until one is configured. If a tool is not in your tool list, it is disabled: do not call it, and tell the user which setting enables it.

**Default-on GitHub tools** (everything else in this file is opt-in): `set_active_context`, `get_me`, `get_file_contents`, `str_replace_editor`, `create_or_update_file`, `delete_file`, `grep`, `view_file_outline`, `list_branches`, `create_branch`, `delete_branch`, `push_files`, `create_pull_request`, `search_code`, `search_repositories`, `git_tree`, `patch_contents`. All GitHub tools additionally require a GitHub personal access token to be configured.

---

# Part 1: Core Agentic Tools (17)

---

## Tool Index (Part 1)

1. [`set_active_context`](#1-set_active_context)
2. [`get_me`](#2-get_me)
3. [`search_repositories`](#3-search_repositories)
4. [`list_branches`](#4-list_branches)
5. [`create_branch`](#5-create_branch)
6. [`delete_branch`](#6-delete_branch)
7. [`git_tree`](#7-git_tree)
8. [`view_file_outline`](#8-view_file_outline)
9. [`grep`](#9-grep)
10. [`search_code`](#10-search_code)
11. [`get_file_contents`](#11-get_file_contents)
12. [`str_replace_editor`](#12-str_replace_editor)
13. [`patch_contents`](#13-patch_contents)
14. [`create_or_update_file`](#14-create_or_update_file)
15. [`delete_file`](#15-delete_file)
16. [`push_files`](#16-push_files)
17. [`create_pull_request`](#17-create_pull_request)

---

## 1. `set_active_context`

### Purpose & Overview
Sets session-level default configuration for repository metadata (`owner`, `repo`, `branch`) and local sandbox configuration (`cwd`, `env`). Subsequent tool calls automatically inherit these context parameters without requiring explicit arguments every time.

### Schema & Parameters
- `owner` (string, optional): Default repository owner (username or org).
- `repo` (string, optional): Default repository name.
- `branch` (string, optional): Default target branch (e.g. `main`, `dev`, `feature/xyz`).
- `cwd` (string, optional): Default working directory path for sandbox execution.
- `env` (object, optional): Persistent environment variables merged into sandbox execution sessions.

### Usage Example
```json
{
  "owner": "octocat",
  "repo": "hello-world",
  "branch": "main",
  "cwd": "hello-world",
  "env": {
    "NODE_ENV": "development"
  }
}
```

### Best Practices & Rules
- Call `set_active_context` as the very first step when starting work on a repository.
- Avoid repeating `owner` and `repo` in subsequent tool calls once the context is established.

---

## 2. `get_me`

### Purpose & Overview
Retrieves authenticated GitHub user profile metadata (username, ID, avatar, scopes, name).

### Schema & Parameters
- Takes no parameters (`{}`).

### Usage Example
```json
{}
```

---

## 3. `search_repositories`

### Purpose & Overview
Searches GitHub repositories for the authenticated user or organization with regex filtering, exact match ranking, and pagination.

### Schema & Parameters
- `query` (string, required): Repository search query or keyword.
- `owner` (string, optional): Filter repositories by specific user or org.
- `page` (number, optional, default: 1): Page number.
- `perPage` (number, optional, default: 10): Results per page (max 100).
- `exact` (boolean, optional, default: false): When true, returns only the single exact match.
- `regexFilter` (string, optional): Regex pattern to filter repository names.

### Usage Example
```json
{
  "query": "krix",
  "exact": true
}
```

---

## 4. `list_branches`

### Purpose & Overview
Lists branches in the active or specified repository.

### Schema & Parameters
- `owner` (string, optional): Repository owner (falls back to active context).
- `repo` (string, optional): Repository name (falls back to active context).

### Usage Example
```json
{}
```

---

## 5. `create_branch`

### Purpose & Overview
Creates a new remote branch in the repository pointing to a specified commit SHA or base branch ref.

### Schema & Parameters
- `branch` (string, required): Name of the new branch to create.
- `fromBranch` (string, optional): Source branch to branch from (e.g. `main`).
- `refSha` (string, optional): Specific commit SHA to point the branch to.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{
  "branch": "feature/fix-auth",
  "fromBranch": "main"
}
```

---

## 6. `delete_branch`

### Purpose & Overview
Deletes a remote branch from the repository.

### Schema & Parameters
- `branch` (string, required): Branch name to delete.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{
  "branch": "feature/fix-auth"
}
```

---

## 7. `git_tree`

### Purpose & Overview
Recursively inspects the file tree of a repository commit or branch. Supports path substring filtering (`q`), depth offsets, and limit windowing for token efficiency.

### Schema & Parameters
- `path` (string, optional): Target sub-path or prefix directory.
- `recursive` (boolean, optional, default: true): Whether to recursively traverse directory subtrees.
- `tree_sha` (string, optional): Tree SHA or branch name (defaults to active branch).
- `offset` (number, optional, default: 0): Index offset for paginating large trees.
- `limit` (number, optional, default: 200): Maximum entries to return.
- `q` (string, optional): Substring filter for file paths.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.
- `branch` (string, optional): Branch name.

### Usage Example
```json
{
  "recursive": true,
  "q": "src/",
  "limit": 50
}
```

---

## 8. `view_file_outline`

### Purpose & Overview
Extracts high-level AST symbol structures (classes, interfaces, functions, methods, exported constants) from source files (TypeScript, JavaScript, Python, Go, Java, Rust, C/C++). Allows understanding file architecture without reading hundreds of lines of code.

### Schema & Parameters
- `path` (string, required): Repository-relative path to the source file.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.
- `branch` (string, optional): Branch name.

### Usage Example
```json
{
  "path": "src/security.ts"
}
```

---

## 9. `grep`

### Purpose & Overview
High-performance regex/substring pattern search across repository files. Supports file extension filtering, path globs, context lines (`before`/`after`), case sensitivity, and result windowing.

### Schema & Parameters
- `pattern` (string, required): Regex or substring pattern to search for.
- `path` (string, optional): Directory sub-path to restrict the search.
- `glob` (string, optional): Glob pattern (e.g. `**/*.tsx`).
- `type` (string, optional): File extension filter (e.g. `ts`, `py`, `json`).
- `ignoreCase` (boolean, optional, default: true): Case insensitive search.
- `maxResults` (number, optional, default: 30): Max search results.
- `context` (number, optional, default: 2): Lines of context before and after each match.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.
- `branch` (string, optional): Branch name.

### Usage Example
```json
{
  "pattern": "sandbox_store",
  "type": "ts",
  "context": 3
}
```

---

## 10. `search_code`

### Purpose & Overview
Searches code across GitHub repositories using GitHub's native code search syntax.

### Schema & Parameters
- `query` (string, required): GitHub code search query string.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.
- `page` (number, optional, default: 1): Results page.
- `perPage` (number, optional, default: 10): Results per page (max 100).

### Usage Example
```json
{
  "query": "registerTool filename:sandboxTools.ts"
}
```

---

## 11. `get_file_contents`

### Purpose & Overview
Fetches remote file contents with line-number prefixes. Supports token-efficient windowing (`startLine` to `endLine`) to inspect specific functions or sections without consuming context on entire files.

### Schema & Parameters
- `path` (string, required): Repository-relative path to the file.
- `startLine` (number, optional, default: 1): 1-indexed starting line number.
- `endLine` (number, optional): 1-indexed ending line number (max 500 lines per call).
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.
- `branch` (string, optional): Branch name.

### Usage Example
```json
{
  "path": "src/security.ts",
  "startLine": 160,
  "endLine": 200
}
```

### Best Practices & Rules
- Always provide `startLine` and `endLine` when reading large files.
- Prefixes lines with `<line>: ` for easy referencing when preparing surgical replacements.

---

## 12. `str_replace_editor`

### Purpose & Overview
Performs exact string block replacement in a remote file and commits the change. If the `old_str` does not match, it calculates **Levenshtein Distance Similarity** and returns line-numbered context hints showing the closest matching lines with similarity percentages. Supports Base64 for binary or tricky character sequences.

### Schema & Parameters
- `path` (string, required): Repository-relative path to the file.
- `old_str` (string, optional): Exact string chunk to find and replace.
- `new_str` (string, optional): Replacement string chunk.
- `old_str_b64` (string, optional): Base64-encoded `old_str`.
- `new_str_b64` (string, optional): Base64-encoded `new_str`.
- `message` (string, optional): Git commit message.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.
- `branch` (string, optional): Target branch.

### Usage Example
```json
{
  "path": "src/fileShare.ts",
  "old_str": "reg('sandbox_files', {",
  "new_str": "reg('sandbox_store', {",
  "message": "refactor: rename sandbox_files tool to sandbox_store"
}
```

### Best Practices & Rules
- Include 2-3 unique lines of surrounding context inside `old_str` to guarantee a unique match.
- Use `old_str_b64` and `new_str_b64` when dealing with multi-line blocks containing tricky escaping or special characters.

---

## 13. `patch_contents`

### Purpose & Overview
Replaces a specific 1-indexed line number range (`startLine` to `endLine`) with new content in a remote file and commits the changes. Eliminates string-matching fragility for dense refactors.

### Schema & Parameters
- `path` (string, required): Repository-relative path to the file.
- `startLine` (number, required): 1-indexed start line (inclusive).
- `endLine` (number, required): 1-indexed end line (inclusive).
- `newContent` (string, required): New text content to insert in place of the line range.
- `message` (string, optional): Git commit message.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.
- `branch` (string, optional): Target branch.

### Usage Example
```json
{
  "path": "src/security.ts",
  "startLine": 170,
  "endLine": 170,
  "newContent": "  'sandbox_store': PermissionLevel.MUTATING,",
  "message": "fix: update sandbox_store permission level"
}
```

---

## 14. `create_or_update_file`

### Purpose & Overview
Creates a new file or completely replaces the content of an existing file in the remote repository. Supports plain UTF-8 text or Base64 encoding.

### Schema & Parameters
- `path` (string, required): File path in repository.
- `content` (string, optional): UTF-8 text content.
- `content_b64` (string, optional): Base64-encoded file content (for binaries, images, or large files).
- `message` (string, optional): Git commit message.
- `sha` (string, optional): Blob SHA of existing file (required if updating an existing file to guard against race conditions).
- `branch` (string, optional): Target branch.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{
  "path": "docs/architecture.md",
  "content": "# Architecture Overview\n...",
  "message": "docs: add initial architecture document"
}
```

---

## 15. `delete_file`

### Purpose & Overview
Deletes a file from the remote repository branch.

### Schema & Parameters
- `path` (string, required): File path to delete.
- `message` (string, optional): Git commit message.
- `sha` (string, optional): Blob SHA of the file to verify prior state.
- `branch` (string, optional): Target branch.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{
  "path": "legacy-config.json",
  "message": "chore: remove deprecated legacy configuration"
}
```

---

## 16. `push_files`

### Purpose & Overview
Commits and pushes multiple file modifications, creations, and deletions in a single atomic commit. Ensures multi-file refactors do not break the repository between commits.

### Schema & Parameters
- `files` (array of objects, required): List of file operations:
  - `path` (string, required): File path.
  - `content` (string, optional): Plain UTF-8 text content.
  - `content_b64` (string, optional): Base64 file content.
  - `delete` (boolean, optional): Set to `true` to delete the file.
- `message` (string, required): Git commit message for the batch commit.
- `branch` (string, optional): Target branch.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{
  "message": "refactor: update sandbox store tool definitions and types",
  "files": [
    {
      "path": "src/fileShare.ts",
      "content": "..."
    },
    {
      "path": "src/security.ts",
      "content": "..."
    }
  ]
}
```

### Best Practices & Rules
- Always use `push_files` when updating multiple dependent files simultaneously (e.g. updating an interface and its implementation).

---

## 17. `create_pull_request`

### Purpose & Overview
Opens a new GitHub Pull Request between a head branch and base branch.

### Schema & Parameters
- `title` (string, required): Pull Request title.
- `head` (string, required): Name of branch containing changes.
- `base` (string, optional, default: `main`): Branch to merge into.
- `body` (string, optional): Pull Request description (Markdown).
- `draft` (boolean, optional, default: false): Create as draft PR.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{
  "title": "feat: rename sandbox_files to sandbox_store and overhaul documentation",
  "head": "gem",
  "base": "main",
  "body": "## Summary\n- Renamed `sandbox_files` to `sandbox_store` to resolve naming ambiguity with `sandbox_file`.\n- Refactored skill directory, references, and README."
}
```


---

# Part 2: Extended GitHub MCP Tools

---

## Tool Index (Part 2)

### A. Issues & Sub-Issues
1. [`list_issues`](#1-list_issues)
2. [`issue_read`](#2-issue_read)
3. [`issue_write`](#3-issue_write)
4. [`sub_issue_write`](#4-sub_issue_write)
5. [`add_issue_comment`](#5-add_issue_comment)
6. [`search_issues`](#6-search_issues)

### B. Pull Requests & Code Reviews
7. [`list_pull_requests`](#7-list_pull_requests)
8. [`pull_request_read`](#8-pull_request_read)
9. [`update_pull_request`](#9-update_pull_request)
10. [`update_pull_request_branch`](#10-update_pull_request_branch)
11. [`merge_pull_request`](#11-merge_pull_request)
12. [`pull_request_review_write`](#12-pull_request_review_write)
13. [`add_comment_to_pending_review`](#13-add_comment_to_pending_review)
14. [`add_reply_to_pull_request_comment`](#14-add_reply_to_pull_request_comment)
15. [`search_pull_requests`](#15-search_pull_requests)

### C. Commits, Releases, Tags & Labels
16. [`get_commit`](#16-get_commit)
17. [`search_commits`](#17-search_commits)
18. [`list_commits`](#18-list_commits)
19. [`get_label`](#19-get_label)
20. [`list_issue_fields`](#20-list_issue_fields)
21. [`list_issue_types`](#21-list_issue_types)
22. [`get_release`](#22-get_release)
23. [`list_releases`](#23-list_releases)
24. [`get_tag`](#24-get_tag)
25. [`list_tags`](#25-list_tags)

### D. Organization Teams & Collaborators
26. [`get_teams`](#26-get_teams)
27. [`get_team_members`](#27-get_team_members)
28. [`list_repository_collaborators`](#28-list_repository_collaborators)
29. [`search_users`](#29-search_users)

### E. Administration, Security & Copilot
30. [`create_repository`](#30-create_repository)
31. [`fork_repository`](#31-fork_repository)
32. [`run_secret_scanning`](#32-run_secret_scanning)
33. [`request_copilot_review`](#33-request_copilot_review)
34. [`assign_copilot_to_issue`](#34-assign_copilot_to_issue)

---

## Directives for Using GitHub MCP

When interacting with GitHub Issues, Pull Requests, Reviews, and Repository Settings:
1. **Use GitHub MCP Tools**: Use these tools whenever addressing user requests involving GitHub issues, reviewing code changes on PRs, commenting on diffs, checking out release tags, or managing collaborators.
2. **Context Fallback**: All tools automatically fall back to the `owner` and `repo` configured via `set_active_context`.
3. **Atomic Reviews**: For code reviews, initiate review threads via `add_comment_to_pending_review` or submit overall review evaluations (`APPROVE`, `REQUEST_CHANGES`, `COMMENT`) via `pull_request_review_write`.

---

## 1. `list_issues`

### Purpose & Overview
Lists repository issues with filtering by state, labels, assignee, milestone, or creator.

### Schema & Parameters
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.
- `state` (enum, optional, default: `open`): `open` | `closed` | `all`.
- `labels` (string, optional): Comma-separated list of label names.
- `assignee` (string, optional): Filter by assigned username.
- `creator` (string, optional): Filter by author username.
- `page` (number, optional, default: 1): Page number.
- `perPage` (number, optional, default: 30): Results per page (max 100).

### Usage Example
```json
{
  "state": "open",
  "labels": "bug,backend"
}
```

---

## 2. `issue_read`

### Purpose & Overview
Retrieves full details for a specific issue, including description body, status, labels, assignees, and comment thread.

### Schema & Parameters
- `issueNumber` (number, required): Issue number.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{
  "issueNumber": 42
}
```

---

## 3. `issue_write`

### Purpose & Overview
Creates a new issue or updates an existing issue's title, body, state, labels, or assignees.

### Schema & Parameters
- `action` (enum, required): `create` | `update`.
- `issueNumber` (number, optional): Issue number (required when `action` is `update`).
- `title` (string, optional): Issue title (required when `action` is `create`).
- `body` (string, optional): Issue markdown content.
- `state` (enum, optional): `open` | `closed`.
- `labels` (array of strings, optional): Array of label names.
- `assignees` (array of strings, optional): Array of usernames to assign.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{
  "action": "create",
  "title": "fix(auth): handle expired refresh tokens gracefully",
  "body": "When a refresh token expires, the server should return 401 instead of crashing.",
  "labels": ["bug", "auth"]
}
```

---

## 4. `sub_issue_write`

### Purpose & Overview
Adds or removes a sub-issue relationship between parent and child issues.

### Schema & Parameters
- `parentIssueNumber` (number, required): Parent issue number.
- `subIssueId` (number, required): Sub-issue ID or number.
- `action` (enum, required): `add` | `remove`.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{
  "parentIssueNumber": 10,
  "subIssueId": 12,
  "action": "add"
}
```

---

## 5. `add_issue_comment`

### Purpose & Overview
Adds a markdown comment to an existing issue or pull request.

### Schema & Parameters
- `issueNumber` (number, required): Issue or PR number.
- `body` (string, required): Markdown comment content.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{
  "issueNumber": 42,
  "body": "Fix has been implemented in PR #43."
}
```

---

## 6. `search_issues`

### Purpose & Overview
Searches GitHub issues using GitHub's issue search syntax (e.g. `is:open label:bug`).

### Schema & Parameters
- `query` (string, required): GitHub issue search query.
- `page` (number, optional, default: 1): Results page.
- `perPage` (number, optional, default: 10): Results per page.

### Usage Example
```json
{
  "query": "repo:imanki-t/krix is:issue is:open label:security"
}
```

---

## 7. `list_pull_requests`

### Purpose & Overview
Lists repository pull requests filtered by state (`open`, `closed`, `all`), base branch, or head branch.

### Schema & Parameters
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.
- `state` (enum, optional, default: `open`): `open` | `closed` | `all`.
- `head` (string, optional): Filter by user:branch.
- `base` (string, optional): Filter by base branch (e.g. `main`).
- `page` (number, optional, default: 1): Page number.
- `perPage` (number, optional, default: 30): Results per page.

### Usage Example
```json
{
  "state": "open",
  "base": "main"
}
```

---

## 8. `pull_request_read`

### Purpose & Overview
Retrieves full metadata for a Pull Request, including mergeability status, commits count, changed files count, diff stats, reviews, and base/head branches.

### Schema & Parameters
- `pullNumber` (number, required): Pull Request number.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{
  "pullNumber": 15
}
```

---

## 9. `update_pull_request`

### Purpose & Overview
Updates Pull Request metadata (title, body description, target base branch, or open/closed state).

### Schema & Parameters
- `pullNumber` (number, required): Pull Request number.
- `title` (string, optional): Updated title.
- `body` (string, optional): Updated body description.
- `state` (enum, optional): `open` | `closed`.
- `base` (string, optional): New base branch.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{
  "pullNumber": 15,
  "title": "feat: rename sandbox_files to sandbox_store and clean skill directory",
  "state": "open"
}
```

---

## 10. `update_pull_request_branch`

### Purpose & Overview
Updates the PR head branch with the latest changes from the base branch (equivalent to clicking "Update branch" in GitHub UI).

### Schema & Parameters
- `pullNumber` (number, required): Pull Request number.
- `expectedHeadSha` (string, optional): Verify head commit SHA before updating.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{
  "pullNumber": 15
}
```

---

## 11. `merge_pull_request`

### Purpose & Overview
Merges a Pull Request into its base branch using merge, squash, or rebase strategy.

### Schema & Parameters
- `pullNumber` (number, required): Pull Request number.
- `commitTitle` (string, optional): Title for the merge commit.
- `commitMessage` (string, optional): Detailed commit message.
- `mergeMethod` (enum, optional, default: `squash`): `merge` | `squash` | `rebase`.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{
  "pullNumber": 15,
  "mergeMethod": "squash",
  "commitTitle": "feat: sandbox store refactor (#15)"
}
```

---

## 12. `pull_request_review_write`

### Purpose & Overview
Submits an overall review evaluation on a Pull Request.

### Schema & Parameters
- `pullNumber` (number, required): Pull Request number.
- `event` (enum, required): `APPROVE` | `REQUEST_CHANGES` | `COMMENT`.
- `body` (string, optional): Review summary comment.
- `comments` (array of objects, optional): Line-level review comments.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{
  "pullNumber": 15,
  "event": "APPROVE",
  "body": "LGTM! All references updated and tests pass cleanly."
}
```

---

## 13. `add_comment_to_pending_review`

### Purpose & Overview
Adds a line-specific diff comment to a pending review on a Pull Request.

### Schema & Parameters
- `pullNumber` (number, required): Pull Request number.
- `body` (string, required): Comment text.
- `path` (string, required): Relative path of the file being commented on.
- `position` (number, required): Line index position in the diff.
- `commitId` (string, required): The SHA of the commit being reviewed.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{
  "pullNumber": 15,
  "path": "src/fileShare.ts",
  "position": 12,
  "commitId": "dfab442c885c184f979ad6a5f14bc698b46eade7",
  "body": "Great rename from sandbox_files to sandbox_store!"
}
```

---

## 14. `add_reply_to_pull_request_comment`

### Purpose & Overview
Replies to an existing PR review comment thread.

### Schema & Parameters
- `pullNumber` (number, required): Pull Request number.
- `commentId` (number, required): ID of the comment being replied to.
- `body` (string, required): Reply comment text.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{
  "pullNumber": 15,
  "commentId": 98765432,
  "body": "Addressed in latest commit."
}
```

---

## 15. `search_pull_requests`

### Purpose & Overview
Searches pull requests across GitHub using GitHub search syntax.

### Schema & Parameters
- `query` (string, required): GitHub PR search query (e.g. `is:pr is:open review:required`).
- `page` (number, optional, default: 1): Page number.
- `perPage` (number, optional, default: 10): Results per page.

### Usage Example
```json
{
  "query": "repo:imanki-t/krix is:pr is:open"
}
```

---

## 16. `get_commit`

### Purpose & Overview
Retrieves full details for a commit by SHA, including author, commit message, stats, and changed file patches.

### Schema & Parameters
- `commitSha` (string, required): 40-character commit SHA.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{
  "commitSha": "dfab442c885c184f979ad6a5f14bc698b46eade7"
}
```

---

## 17. `search_commits`

### Purpose & Overview
Searches commit messages across repositories.

### Schema & Parameters
- `query` (string, required): Commit search query.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.
- `page` (number, optional, default: 1): Page number.
- `perPage` (number, optional, default: 10): Results per page.

### Usage Example
```json
{
  "query": "repo:imanki-t/krix sandbox_store"
}
```

---

## 18. `list_commits`

### Purpose & Overview
Lists commits on a repository branch, with optional filtering by path, author, or date range.

### Schema & Parameters
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.
- `branch` (string, optional): Target branch.
- `path` (string, optional): Only commits containing this file path.
- `author` (string, optional): Filter by GitHub username.
- `since` (string, optional): ISO-8601 start timestamp.
- `until` (string, optional): ISO-8601 end timestamp.
- `page` (number, optional, default: 1): Page number.
- `perPage` (number, optional, default: 30): Results per page.

### Usage Example
```json
{
  "branch": "gem",
  "perPage": 5
}
```

---

## 19. `get_label`

### Purpose & Overview
Retrieves details for a specific repository issue label (name, color, description).

### Schema & Parameters
- `name` (string, required): Label name.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{
  "name": "bug"
}
```

---

## 20. `list_issue_fields`

### Purpose & Overview
Lists custom issue fields configured in a repository or organization.

### Schema & Parameters
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{}
```

---

## 21. `list_issue_types`

### Purpose & Overview
Lists supported issue types for an organization (e.g. Bug, Feature, Task).

### Schema & Parameters
- `org` (string, required): GitHub organization name.

### Usage Example
```json
{
  "org": "my-org"
}
```

---

## 22. `get_release`

### Purpose & Overview
Fetches details of a release by release tag name (or latest published release).

### Schema & Parameters
- `tag` (string, optional): Release tag (e.g. `v1.1.0`). If omitted, returns latest release.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{
  "tag": "v1.1.0"
}
```

---

## 23. `list_releases`

### Purpose & Overview
Lists published releases for the repository.

### Schema & Parameters
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.
- `page` (number, optional, default: 1): Page number.
- `perPage` (number, optional, default: 10): Results per page.

### Usage Example
```json
{}
```

---

## 24. `get_tag`

### Purpose & Overview
Fetches git tag object metadata by tag SHA or name.

### Schema & Parameters
- `tag` (string, required): Tag SHA or ref.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{
  "tag": "v1.0.0"
}
```

---

## 25. `list_tags`

### Purpose & Overview
Lists git tags in the repository.

### Schema & Parameters
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.
- `page` (number, optional, default: 1): Page number.
- `perPage` (number, optional, default: 30): Results per page.

### Usage Example
```json
{}
```

---

## 26. `get_teams`

### Purpose & Overview
Lists organization teams for the authenticated user.

### Schema & Parameters
- `org` (string, required): Organization name.

### Usage Example
```json
{
  "org": "my-org"
}
```

---

## 27. `get_team_members`

### Purpose & Overview
Lists usernames of members in an organization team.

### Schema & Parameters
- `org` (string, required): Organization name.
- `teamSlug` (string, required): Team slug identifier.

### Usage Example
```json
{
  "org": "my-org",
  "teamSlug": "core-engineers"
}
```

---

## 28. `list_repository_collaborators`

### Purpose & Overview
Lists collaborators on the repository and their permission levels (`admin`, `write`, `read`).

### Schema & Parameters
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.
- `affiliation` (enum, optional, default: `all`): `all` | `outside` | `direct`.

### Usage Example
```json
{}
```

---

## 29. `search_users`

### Purpose & Overview
Searches GitHub users by username, email, or profile query.

### Schema & Parameters
- `query` (string, required): Search query.
- `page` (number, optional, default: 1): Page number.
- `perPage` (number, optional, default: 10): Results per page.

### Usage Example
```json
{
  "query": "octocat"
}
```

---

## 30. `create_repository`

### Purpose & Overview
Creates a new GitHub repository under the authenticated account or organization.

### Schema & Parameters
- `name` (string, required): Repository name.
- `description` (string, optional): Repository description.
- `private` (boolean, optional, default: true): Whether repository should be private.
- `autoInit` (boolean, optional, default: true): Initialize with README.

### Usage Example
```json
{
  "name": "new-microservice",
  "description": "Backend service for authentication",
  "private": true
}
```

---

## 31. `fork_repository`

### Purpose & Overview
Forks a repository to the authenticated user account or an organization.

### Schema & Parameters
- `owner` (string, required): Repository owner to fork.
- `repo` (string, required): Repository name to fork.
- `organization` (string, optional): Target organization for the fork.

### Usage Example
```json
{
  "owner": "torvalds",
  "repo": "linux"
}
```

---

## 32. `run_secret_scanning`

### Purpose & Overview
Checks repository files and commit history for exposed secrets, tokens, and private keys.

### Schema & Parameters
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.
- `state` (enum, optional, default: `open`): `open` | `resolved`.
- `secretType` (string, optional): Specific secret type filter.
- `page` (number, optional, default: 1): Page number.
- `perPage` (number, optional, default: 30): Results per page.

### Usage Example
```json
{}
```

---

## 33. `request_copilot_review`

### Purpose & Overview
Requests an automated GitHub Copilot code review on a Pull Request.

### Schema & Parameters
- `pullNumber` (number, required): Pull Request number.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{
  "pullNumber": 15
}
```

---

## 34. `assign_copilot_to_issue`

### Purpose & Overview
Assigns GitHub Copilot coding agent to investigate and work on an issue.

### Schema & Parameters
- `issueNumber` (number, required): Issue number.
- `owner` (string, optional): Repository owner.
- `repo` (string, optional): Repository name.

### Usage Example
```json
{
  "issueNumber": 42
}
```
