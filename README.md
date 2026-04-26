# panes

Single-pane Claude wallboard for the macOS desktop. The `/panes` slash command writes a markdown summary of your current focus; an [Übersicht](https://tracesof.net/uebersicht/) widget renders it as a styled card pinned above the desktop layer.

## Features

- **Markdown rendering** (via `marked`) — bold, italic, inline code, tables, links, lists with checkboxes
- **Drag** the title bar to reposition the widget; **resize** by dragging the bottom-right corner — both persist across restarts via `localStorage`
- **Settings tooltip** (`⚙` icon) — adjust font size, accent colors (title / headings / subheadings / bold / code / links), refresh interval, and position lock. Changes apply live via CSS custom properties
- **Refresh button** (`↻` icon) — force-refresh the Claude pane on demand. Live-tails `~/.panes/cache/refresh-claude.log` so you see Claude's progress, with an elapsed-seconds counter and a 25s safety bound
- **Section reorder** — drag any `##` heading inside the pane to swap section order; ordering persists across refreshes
- **Auto-refresh** on each Claude Code session start, with a 5-minute freshness debounce

## Install

Prerequisites:
- macOS, Node.js 20+
- [Übersicht](https://tracesof.net/uebersicht/): `brew install --cask ubersicht`, then launch it once
- (For auto-refresh) the `claude` CLI on PATH

```bash
git clone <wherever> ~/panes
cd ~/panes
npm install
node ./cli.mjs install
open -a Übersicht
```

`node ./cli.mjs install` is idempotent and does three things:

1. Creates `~/.panes/data/` and `~/.panes/cache/`
2. Symlinks `widget/` → `~/Library/Application Support/Übersicht/widgets/panes.widget` and `claude/panes.md` → `~/.claude/commands/panes.md`
3. Adds a `SessionStart` hook entry to `~/.claude/settings.json` so `panes refresh` runs at each Claude Code session boot — **preserves any existing hooks and other settings keys**

## Use

- Run **`/panes`** in any Claude Code session — Claude reads project memory + TaskList, composes two markdown tables (Ongoing, Pending), and writes them via `panes write`
- Click **`↻`** in the widget title bar — same effect, but bypasses the 5-min freshness debounce
- Click **`⚙`** for settings — colors, font size, refresh interval, position lock
- Drag the **title bar** to reposition; drag the **bottom-right corner** to resize
- Drag any **`##` heading** to reorder sections within the pane
- Auto-refresh fires on each new Claude Code session

## CLI commands

| Command | Effect |
|---|---|
| `panes render` | Emit HTML for the active pane to stdout (used by the Übersicht widget) |
| `panes install` | Idempotent: creates dirs, sets up symlinks, adds the SessionStart hook |
| `panes uninstall` | Removes symlinks and the SessionStart hook (preserves `~/.panes/data/`) |
| `panes write` | Read stdin, atomically write the active pane's markdown source |
| `panes refresh [--force]` | Trigger the active pane's refresh (`ClaudePane` → spawn `claude -p`). Debounced if pane updated within last 5 min unless `--force` |

## Architecture

The codebase is built around a small `Pane` interface — designed so future pane types (a Jira pane, a custom file-backed pane) can plug in without changing the widget or the CLI dispatcher.

```
src/
  panes/
    Pane.ts          Compact interface: id, load(), and optional refresh / writeContent
    ClaudePane.ts    Concrete implementation; owns ~/.panes/data/30-claude.md and the `claude -p` spawn
  cli.ts             Generic dispatcher; instantiates ClaudePane as the active pane
  html-render.ts     Takes a Pane, calls .load(), renders an HTML article card with status pills
  settings-hook.ts   Pure helpers for SessionStart hook install/uninstall (idempotent, atomic)
  markdown.ts        Generic title/body parser (reusable across Pane implementations)
  paths.ts           ~/.panes/data and ~/.panes/cache resolution (env-overridable for tests)
widget/
  index.coffee       Übersicht widget — drag, resize, refresh button, settings tooltip, section reorder
claude/
  panes.md           /panes slash command body — instructions Claude follows when invoking /panes
tests/               vitest specs (pane parsing, html-render, settings-hook)
```

### Adding a new pane type

1. Write a class implementing `Pane`: `id`, `load()`, and (optionally) `refresh()` and/or `writeContent()`. ~80 lines for `ClaudePane` as reference
2. Swap one line in `src/cli.ts`: `const pane: Pane = new YourPane()`
3. No widget changes needed — capabilities are queried via method presence (`if (pane.refresh) ...`); HTML rendering stays generic

## How auto-refresh works

1. Each Claude Code session boot fires the `SessionStart` hook
2. The hook runs `panes refresh` (no `--force`)
3. `ClaudePane.refresh()` checks `~/.panes/data/30-claude.md` mtime — if updated in the last 5 minutes, returns immediately (debounce)
4. Otherwise, spawns `claude -p --no-session-persistence --permission-mode bypassPermissions` headless, piping the slash command body to stdin
5. Recursion guard: the child `claude -p` sets `PANES_HOOK_INVOCATION=1` in its env, so its own `SessionStart` hook detects this and exits without spawning another `claude` — preventing infinite recursion
6. Claude composes the markdown and pipes through `panes write` — atomic write to `~/.panes/data/30-claude.md`
7. Next widget render (within 60s auto-tick or via the `↻` button) picks up the new content

Logs go to `~/.panes/cache/refresh-claude.log`; the refresh button live-tails this for visible progress.

## Uninstall

```bash
node ./cli.mjs uninstall    # removes symlinks + SessionStart hook; preserves ~/.panes/ data
rm -rf ~/.panes             # if you also want to wipe the data
```

## Development

```bash
npm test                    # vitest run — 21 tests
npm run lint                # eslint + typescript-eslint
node ./cli.mjs render       # emit HTML for the current Claude pane (debugging)
```

No CI, no remote — local-only personal project.
