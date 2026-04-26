# panes

Single-pane Claude wallboard rendered via Übersicht. The `/panes` slash command writes `~/.panes/data/30-claude.md`; the widget renders it as styled markdown on the desktop.

## Quick reference

```bash
npm test                             # vitest run
npm run lint                         # eslint
node ./cli.mjs render                # HTML to stdout (used by Übersicht)
node ./cli.mjs install               # idempotent: data dir + symlinks
node ./cli.mjs uninstall             # remove symlinks; preserve ~/.panes/ data
echo "..." | node ./cli.mjs write    # atomic write to ~/.panes/data/30-claude.md
```

## Layout

```
src/
  cli.ts             Subcommand dispatcher (render / install / uninstall / claude / refresh-claude)
  html-render.ts     Reads ~/.panes/data/30-claude.md, marked.parse() → HTML article card
  markdown.ts        parseMarkdown(content, fallbackTitle) → { title, body }
  paths.ts           ~/.panes/data and ~/.panes/cache resolution (env-overridable)
widget/
  index.coffee       Übersicht widget; renders the HTML, no JS interactivity beyond CSS resize
claude/
  panes.md           /panes slash command body (symlinked to ~/.claude/commands/)
tests/               vitest specs
```

## TypeScript conventions (mirroring talkdesk-developer)

- ESM-first: `"type": "module"`, `moduleResolution: NodeNext`, target ES2022, `strict: true`
- Explicit `.ts` extensions on relative imports (NodeNext requirement)
- No `node:` prefix on built-ins (`import fs from 'fs'`)
- 2-space indent, single quotes, semicolons, trailing commas
