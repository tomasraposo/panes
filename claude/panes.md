---
description: Refresh the Claude pane with current in-progress and up-next work, drawn from workspace project memory plus the active TaskList. Honors the recency filter at ~/.panes/filter.json.
---

You are refreshing the user's personal SRE wallboard (the `panes` widget on their macOS Desktop). Compose a concise markdown summary and write it to `~/.panes/data/30-claude.md` via the `panes write` CLI.

## Output structure

Two tables, nothing else:

```
# Current focus

## In Progress

| Title | Status | Description | Next step | Last |
| ----- | ------ | ----------- | --------- | ---- |
| ...   | ...    | ...         | ...       | ...  |

## Up Next

| Title | Description | Last |
| ----- | ----------- | ---- |
| ...   | ...         | ...  |
```

## What to read

1. **Always read** `{{MEMORY_DIR}}/MEMORY.md` — the index. (`{{MEMORY_DIR}}` is your Claude Code project-memory directory, `~/.claude/projects/<workspace-path-with-slashes-as-dashes>/memory`; the `panes refresh` CLI substitutes the concrete path before invoking this prompt. If you're reading this as the interactive `/panes` command and the token is still literal, use your own project's memory directory.) For each `project_*.md` listed under the "## Project" section, read its body briefly to extract its current state and **the latest YYYY-MM-DD date mentioned**.
2. **Read `~/.panes/filter.json`** if it exists. If it has `{"recencyDays": N}`, use it as a recency cutoff: exclude items whose latest dated mention is older than N days. If the file doesn't exist or has no `recencyDays`, include all items.
3. **Run the `TaskList` tool**. If it returns any tasks (in_progress or pending), merge them into the appropriate section. TaskList items are treated as touched today (relative date `now`).

**Do NOT** scan the codebase, run `grep`/`find` over test suites, count test matches, or read files outside `{{MEMORY_DIR}}/` and `~/.panes/`. Project memory + TaskList + filter file is the entire input.

## Computing the `Last` column

For each row, compute a relative time-since-last-touched value. Today's date is the anchor.

Source for each item's date:
- **TaskList items** → use `now`
- **`project_*.md` items** → scan the body for `YYYY-MM-DD` strings; use the **latest** one. If none found, use `?`

Format relative to today:
- ≤ 24h: `Xh` (e.g. `6h`)
- < 7 days: `Xd` (e.g. `3d`)
- < 30 days: `Xw` (e.g. `2w`)
- ≥ 30 days: `Xm` (e.g. `2m`)

The `Last` cell content is just the short relative form (e.g. `3d`), nothing else.

## How to populate the tables

### In Progress

Sources, in priority order:
- `TaskList` items with status `in_progress` (if any)
- `project_*.md` files whose body indicates active work — look for: "in progress", "in flight", "active", "current", recent dates without a terminal "DONE" / "CLOSED" / "MERGED" / "GRADUATED" marker

Columns:
- `Title` — short identifier (e.g., `Istio PoC`, `APIGW-938`, `INFRA-4982`)
- `Status` — **single keyword, standalone** (no sentence). Pick from: `DONE`, `WIP`, `LIVE`, `READY`, `IN REVIEW`, `IN PROGRESS`, `MERGED`, `CLOSED`, `BLOCKED`, `TODO`, `PENDING`. Whole-cell content only — these get rendered as colored pills, so the whole cell must be exactly the keyword.
- `Description` — 1-line current state, 5–10 words
- `Next step` — the immediate next action
- `Last` — relative date (per "Computing the Last column" rules above)

Cap at 6–8 rows. After applying the recency filter (if any), pick the most active.

### Up Next

Sources, in priority order:
- `TaskList` items with status `pending` (if any)
- `project_*.md` files with backlog markers — "next", "deferred", "follow-up", "queued", "backlog", "blocked on"

Columns:
- `Title` — short identifier
- `Description` — 1-line backlog reason or what it's blocked on
- `Last` — relative date (per the rules above)

Cap at 8–10 rows. After applying the recency filter (if any).

## How to deliver

Pipe the composed markdown through `panes write` (atomic write to `~/.panes/data/30-claude.md`):

```bash
cat <<'EOF' | panes write
# Current focus

## In Progress
…
EOF
```

Confirm with the CLI output (`wrote …/30-claude.md`). The widget picks up the change on its next refresh.

## Style

- Markdown tables (rendered as proper HTML tables in the widget)
- Keep each cell to a single line — prefer terse summaries over paragraphs
- Skip projects marked as graduated/closed unless they were closed in the last few days
- This is a glance-board, not a report
