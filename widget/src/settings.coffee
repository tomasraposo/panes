safeLoadJson: (key) ->
  raw = localStorage.getItem(key)
  return null unless raw
  try
    return JSON.parse(raw)
  catch
    return null

loadSectionOrder: ->
  parsed = @safeLoadJson('panes-section-order')
  if Array.isArray(parsed) then parsed else []

saveSectionOrderFromDom: (bodyEl) ->
  order = []
  for el in Array.from(bodyEl.querySelectorAll('.pane-section'))
    title = el.dataset.sectionTitle
    order.push(title) if title
  localStorage.setItem('panes-section-order', JSON.stringify(order))
  return

loadSettings: ->
  parsed = @safeLoadJson('panes-settings')
  return @cloneDefaults() unless parsed
  @mergeDefaults(parsed)

saveSettings: (settings) ->
  localStorage.setItem('panes-settings', JSON.stringify(settings))
  return

cloneDefaults: ->
  d = @DEFAULT_SETTINGS
  fontSize: d.fontSize
  accentColors:
    title: d.accentColors.title
    heading: d.accentColors.heading
    subheading: d.accentColors.subheading
    bold: d.accentColors.bold
    code: d.accentColors.code
    link: d.accentColors.link
  refreshInterval: d.refreshInterval
  positionLocked: d.positionLocked
  recencyDays: d.recencyDays
  activePane: d.activePane

mergeDefaults: (parsed) ->
  defaults = @cloneDefaults()
  return defaults unless parsed
  out = defaults
  out.fontSize = parsed.fontSize if typeof parsed.fontSize == 'number'
  out.refreshInterval = parsed.refreshInterval if typeof parsed.refreshInterval == 'number'
  out.positionLocked = parsed.positionLocked if typeof parsed.positionLocked == 'boolean'
  if parsed.recencyDays == null or typeof parsed.recencyDays == 'number'
    out.recencyDays = parsed.recencyDays
  if typeof parsed.activePane == 'string'
    out.activePane = parsed.activePane
  if parsed.accentColors
    for key in ['title', 'heading', 'subheading', 'bold', 'code', 'link']
      if typeof parsed.accentColors[key] == 'string'
        out.accentColors[key] = parsed.accentColors[key]
  return out

applySettings: (domEl) ->
  s = @loadSettings()
  domEl.style.setProperty('--pane-font-size', "#{s.fontSize}px")
  for key, val of s.accentColors
    domEl.style.setProperty("--pane-color-#{key}", val)
  return

applySavedPosition: (domEl) ->
  pos = @safeLoadJson('panes-position')
  return unless pos
  if typeof pos.x == 'number'
    domEl.style.left = "#{pos.x}px"
  if typeof pos.y == 'number'
    domEl.style.top = "#{pos.y}px"
  return
