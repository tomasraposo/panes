# panes

See `README.md` for what this is, how to install, and the architecture overview.

## Gotchas worth flagging

- **`widget/index.coffee` is a build artifact** — never edit directly. Edit the modules in `widget/src/*.coffee` and run `npm run build:widget`. The build script just concatenates the source files alphabetically into `widget/index.coffee`.
- **Tests:** `npm test` (vitest). Lint: `npm run lint`.
- **Active pane state** lives in `~/.panes/active.json`. Query/change via `./cli.mjs active [<id>]`. Per-pane metadata via `./cli.mjs meta`.
