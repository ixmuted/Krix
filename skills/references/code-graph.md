# Code Graph Tools Reference

Structural code analysis through a CodeGraphContext (`cgc`) graph database: index a repo once, then query callers, callees, hierarchy, complexity, dead code and architecture instead of grepping. Also includes one `web_search` tool.

> **Availability:** Not every tool listed here is always on. All Code Graph tools are **opt-in** (off by default) and depend on the `cgc` CLI being installed on the server. If a tool is not in your tool list, it is disabled: do not call it, and tell the user it can be enabled in Settings. If a call returns `{"success": false, "error": ...}`, the `cgc` binary or graph backend is likely missing or misconfigured; report the error rather than retrying.

## Core Workflow

1. `add_code_to_graph` with the repo's local path (e.g. a cloned repo in the sandbox) to index it.
2. `list_indexed_repositories` / `get_repository_stats` to confirm it indexed.
3. Query: `find_code` to locate symbols, `analyze_code_relationships` for structure, complexity tools for refactor targets.
4. Re-index (or `watch_directory`) after files change, since the graph does not update on its own.

Use the graph for "who calls this", "what breaks if I change this", "what is dead", and "what is most complex". Use `grep` / `search_code` for plain text matches.

## Tool Index

### A. Indexing & Jobs
- `add_code_to_graph`, `add_package_to_graph`, `check_job_status`, `list_jobs`, `watch_directory`, `list_watched_paths`, `unwatch_directory`, `delete_repository`

### B. Search & Relationships
- `find_code`, `analyze_code_relationships`, `execute_cypher_query`, `visualize_graph_query`

### C. Complexity & Dead Code
- `find_dead_code`, `calculate_cyclomatic_complexity`, `find_most_complex_functions`

### D. Repository, Context & Bundles
- `list_indexed_repositories`, `get_repository_stats`, `list_graphs`, `discover_codegraph_contexts`, `switch_context`, `load_bundle`, `search_registry_bundles`

### E. Architecture & Reports
- `generate_report`, `simulate_metrics`, `simulate_architectural_change`, `analyze_architectural_evolution`

### F. Framework-Specific & Web
- `find_java_spring_endpoints`, `find_java_spring_beans`, `find_datasource_nodes`, `web_search`

---

## A. Indexing & Jobs

### `add_code_to_graph`
Scans a local folder and adds its code to the graph.
- `repo_path` (string, required): path to the repository root.
- `is_dependency` (boolean, default false): mark the code as a dependency.
- `graph_name` (string, optional): target graph/context.

### `add_package_to_graph`
Adds a package by name for a given language.
- `package_name` (string, required)
- `language` (enum, required): programming language of the package.
- `is_dependency` (boolean, default true), `graph_name` (optional).

### `check_job_status`
- `job_id` (string, required): job ID from an earlier call.
Note: reports graph stats; treat "completed" as a hint and confirm with `get_repository_stats`.

### `list_jobs`
- `limit` (int, default 10).

### `watch_directory` / `unwatch_directory` / `list_watched_paths`
Keep the graph updated with live filesystem changes.
- `watch_directory`: `repo_path` (required). `unwatch_directory`: `repo_path` (required). `list_watched_paths`: no params.

### `delete_repository`
**Destructive and irreversible.** Removes a repository and its nodes from the graph.
- `repo_name` (string, required), `graph_name` (optional).
- Only call after the user explicitly confirms.

## B. Search & Relationships

### `find_code`
Search for code elements by name or pattern in the indexed graph.
- `query` (string, required): symbol name or search term.
- `context`, `graph_name`, `repo_path` (optional).
- `limit` (int, default 20).

### `analyze_code_relationships`
- `query_type` (enum, required): `find_callers`, `find_callees`, `find_all_callers`, `find_all_callees`, `find_importers`, `who_modifies`, `class_hierarchy`, `overrides`, `dead_code`, `call_chain`, `module_deps`, `variable_scope`, `find_complexity`, `find_functions_by_argument`, `find_functions_by_decorator`.
- `target` (string, required): function, class or symbol.
- `depth` (int 1-20, optional), `context`, `graph_name`, `repo_path` (optional).

```json
{ "query_type": "find_callers", "target": "registerSandboxTools" }
```

### `execute_cypher_query`
Runs a custom Cypher query.
- `cypher_query` (string, required), `graph_name` (optional).
- Not marked read-only: do not run write/delete Cypher unless the user asks.

### `visualize_graph_query`
Returns an interactive visualization URL for a Cypher query.
- `cypher_query` (string, required), `graph_name` (optional).

## C. Complexity & Dead Code

### `find_dead_code`
Unused functions and unreachable paths. Optional: `context`, `graph_name`, `repo_path`.
Treat results as candidates: exported APIs, dynamic calls and framework entry points can look unused.

### `calculate_cyclomatic_complexity`
- `function_name` (string, required); optional `path`, `graph_name`, `repo_path`.

### `find_most_complex_functions`
- `limit` (int, default 10); optional `context`, `graph_name`, `repo_path`.

## D. Repository, Context & Bundles

- `list_indexed_repositories`: optional `graph_name`.
- `get_repository_stats`: `repo_name` (required), `graph_name` (optional). Nodes, edges, labels, coverage.
- `list_graphs`: no params. Graph names in the backend.
- `discover_codegraph_contexts`: optional `graph_name`. Available contexts/environments.
- `switch_context`: `context_path` (required), `save` (default true). Changes the active graph for later calls.
- `search_registry_bundles`: optional `query`, `unique_only` (default false). Find pre-indexed bundles.
- `load_bundle`: `bundle_name` (required), `clear_existing` (default false), `graph_name` (optional). Set `clear_existing` only with user approval.

## E. Architecture & Reports

- `generate_report`: optional `output_path`, `repo_path`. God nodes, complexity, dependencies.
- `simulate_metrics`: optional `context`, `repo_path`. Coupling, cohesion, circular dependencies.
- `simulate_architectural_change`: optional `context`, `repo_path`. Compare a proposed change to baseline.
- `analyze_architectural_evolution`: `commits` (int, default 50); optional `context`, `repo_path`. Growth trend and tech-debt hotspots.

## F. Framework-Specific & Web

- `find_java_spring_endpoints`, `find_java_spring_beans`, `find_datasource_nodes`: optional `graph_name`, `repo_path`. Only useful for Java/Spring or datastore-heavy repos.
- `web_search`: `query` (string, required). Returns titles, snippets and URLs (max 15 results, cached 5 minutes). Use it for quick lookups; if results are an error stub, say so and do not invent sources.

## Best Practices

- Index before querying; an empty result usually means the repo is not indexed or the wrong `graph_name`/context is active.
- Check `list_indexed_repositories` before re-indexing to avoid duplicates.
- Prefer `analyze_code_relationships` over hand-written Cypher unless you need something custom.
- Confirm with the user before `delete_repository`, `load_bundle` with `clear_existing`, or write Cypher.
