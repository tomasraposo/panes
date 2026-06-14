# Übersicht runs commands under launchd's minimal PATH (no asdf shims), so node
# isn't found. Prefix PATH with the brew asdf bin + shims dir; the cli.mjs shebang
# (#!/usr/bin/env node) then resolves the .tool-versions node. Repeated on every
# cli.mjs invocation across the widget sources for the same reason.
command: "PATH=/opt/homebrew/bin:$HOME/.asdf/shims:$PATH $HOME/personal/panes/cli.mjs render 2>&1"

refreshFrequency: 60000

dragging: false
refreshing: false
lastUpdate: 0

DEFAULT_SETTINGS:
  fontSize: 12
  accentColors:
    title: '#82aaff'
    heading: '#c3e88d'
    subheading: '#ffcb6b'
    bold: '#ffcb6b'
    code: '#ff7b85'
    link: '#80cbc4'
  refreshInterval: 60
  positionLocked: false
  recencyDays: null
  activePane: 'claude'

render: (output) -> output

setupUi: (domEl) ->
  @applySettings(domEl)
  @setupSections(domEl)
  @attachDrag(domEl)
  @attachRefresh(domEl)
  @attachSettings(domEl)
  return

afterRender: (domEl) ->
  @applySavedPosition(domEl)
  @setupUi(domEl)
  return

update: (output, domEl) ->
  return if @dragging or @refreshing
  settings = @loadSettings()
  now = Date.now()
  intervalMs = settings.refreshInterval * 1000
  if @lastUpdate? and @lastUpdate > 0 and (now - @lastUpdate) < intervalMs - 1500
    return
  @lastUpdate = now
  domEl.innerHTML = output
  @setupUi(domEl)
  return

