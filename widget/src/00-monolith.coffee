command: "/Users/tomasraposo/panes/cli.mjs render 2>&1"

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

setupSections: (domEl) ->
  self = @
  bodyEl = domEl.querySelector('article.pane > .pane-body')
  return unless bodyEl

  sections = []
  currentSection = null
  for child in Array.from(bodyEl.children)
    if child.tagName == 'H2'
      currentSection = { title: child.textContent.trim(), elements: [child] }
      sections.push(currentSection)
    else if currentSection
      currentSection.elements.push(child)

  return if sections.length < 2

  for section in sections
    wrapper = document.createElement('div')
    wrapper.className = 'pane-section'
    wrapper.dataset.sectionTitle = section.title
    section.elements.forEach (el) -> wrapper.appendChild(el)
    bodyEl.appendChild(wrapper)
    section.wrapper = wrapper

  savedOrder = @loadSectionOrder()
  if savedOrder and savedOrder.length > 0
    sections.sort (a, b) ->
      ai = savedOrder.indexOf(a.title)
      bi = savedOrder.indexOf(b.title)
      ai = if ai < 0 then 9999 else ai
      bi = if bi < 0 then 9999 else bi
      return ai - bi
    for section in sections
      bodyEl.appendChild(section.wrapper)

  for section in sections
    do (section) ->
      h2 = section.wrapper.querySelector('h2')
      return unless h2
      h2.draggable = true
      h2.style.cursor = 'grab'
      h2.style.userSelect = 'none'

      h2.addEventListener 'dragstart', (e) ->
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', section.title)
        section.wrapper.classList.add('dragging')
        h2.style.cursor = 'grabbing'
        return

      h2.addEventListener 'dragend', (e) ->
        section.wrapper.classList.remove('dragging')
        h2.style.cursor = 'grab'
        for s in sections
          s.wrapper.classList.remove('drop-above', 'drop-below')
        return

      section.wrapper.addEventListener 'dragover', (e) ->
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        rect = section.wrapper.getBoundingClientRect()
        midY = rect.top + rect.height / 2
        if e.clientY < midY
          section.wrapper.classList.add('drop-above')
          section.wrapper.classList.remove('drop-below')
        else
          section.wrapper.classList.add('drop-below')
          section.wrapper.classList.remove('drop-above')
        return

      section.wrapper.addEventListener 'dragleave', (e) ->
        section.wrapper.classList.remove('drop-above', 'drop-below')
        return

      section.wrapper.addEventListener 'drop', (e) ->
        e.preventDefault()
        section.wrapper.classList.remove('drop-above', 'drop-below')
        draggedTitle = e.dataTransfer.getData('text/plain')
        return unless draggedTitle
        return if draggedTitle == section.title
        dragged = bodyEl.querySelector("[data-section-title=\"#{draggedTitle}\"]")
        return unless dragged
        rect = section.wrapper.getBoundingClientRect()
        midY = rect.top + rect.height / 2
        if e.clientY < midY
          bodyEl.insertBefore(dragged, section.wrapper)
        else
          bodyEl.insertBefore(dragged, section.wrapper.nextSibling)
        self.saveSectionOrderFromDom(bodyEl)
        return
      return
  return

safeLoadJson: (key) ->
  raw = localStorage.getItem(key)
  return null unless raw
  try
    return JSON.parse(raw)
  catch
    return null

parseStat: (raw) ->
  parts = (raw or '0 -1').trim().split(/\s+/)
  size = parseInt(parts[1], 10)
  size = -1 unless Number.isFinite(size)
  mtime: parseInt(parts[0], 10) or 0
  size: size

fetchMeta: (cb) ->
  @run "/Users/tomasraposo/panes/cli.mjs meta", (err, out) ->
    return cb(null) if err or not out
    try
      cb(JSON.parse(out))
    catch
      cb(null)
    return
  return

readStat: (filePath, cb) ->
  self = @
  cmd = "stat -f \"%m %z\" \"#{filePath}\" 2>/dev/null || echo \"0 -1\""
  @run cmd, (err, out) ->
    cb(self.parseStat(out))
    return
  return

colorInput: (value, onInput) ->
  input = document.createElement('input')
  input.type = 'color'
  input.value = value
  input.addEventListener('input', onInput)
  input

selectInput: (options, currentValue, onChange) ->
  select = document.createElement('select')
  for [val, label] in options
    opt = document.createElement('option')
    opt.value = val
    opt.textContent = label
    opt.selected = true if val == currentValue
    select.appendChild(opt)
  select.addEventListener('change', onChange)
  select

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

attachDrag: (domEl) ->
  self = @
  title = domEl.querySelector('article.pane > header.pane-title')
  return unless title
  title.style.cursor = 'move'
  title.style.userSelect = 'none'
  title.addEventListener 'pointerdown', (e) ->
    return if e.target.closest('button')
    return if self.loadSettings().positionLocked
    e.preventDefault()
    self.dragging = true
    rect = domEl.getBoundingClientRect()
    startX = e.clientX
    startY = e.clientY
    origLeft = rect.left
    origTop = rect.top
    document.body.style.cursor = 'grabbing'

    onMove = (e2) ->
      domEl.style.left = "#{origLeft + e2.clientX - startX}px"
      domEl.style.top = "#{origTop + e2.clientY - startY}px"
      return

    onUp = ->
      document.removeEventListener 'pointermove', onMove
      document.removeEventListener 'pointerup', onUp
      document.body.style.cursor = ''
      self.dragging = false
      x = parseInt(domEl.style.left, 10)
      y = parseInt(domEl.style.top, 10)
      if Number.isFinite(x) and Number.isFinite(y)
        try
          localStorage.setItem('panes-position', JSON.stringify({ x, y }))
      return

    document.addEventListener 'pointermove', onMove
    document.addEventListener 'pointerup', onUp
    return
  return

attachSettings: (domEl) ->
  self = @
  btn = domEl.querySelector('button.pane-settings-toggle')
  return unless btn
  btn.addEventListener 'click', (e) ->
    e.stopPropagation()
    pane = domEl.querySelector('article.pane')
    return unless pane
    existing = pane.querySelector('.pane-settings-panel')
    if existing
      existing.remove()
      return
    panel = self.buildSettingsPanel(domEl)
    pane.appendChild(panel)
    setTimeout((->
      onOutside = (ev) ->
        return if panel.contains(ev.target)
        return if btn.contains(ev.target)
        panel.remove()
        document.removeEventListener 'click', onOutside
        return
      document.addEventListener 'click', onOutside
      return
    ), 0)
    return
  return

buildSettingsPanel: (domEl) ->
  self = @
  settings = @loadSettings()
  panel = document.createElement('div')
  panel.className = 'pane-settings-panel'

  addRow = (labelText, controlEl) ->
    row = document.createElement('div')
    row.className = 'pane-settings-row'
    label = document.createElement('label')
    label.textContent = labelText
    row.appendChild(label)
    row.appendChild(controlEl)
    panel.appendChild(row)
    return

  fontInput = document.createElement('input')
  fontInput.type = 'number'
  fontInput.min = '9'
  fontInput.max = '20'
  fontInput.step = '1'
  fontInput.value = settings.fontSize
  fontInput.addEventListener 'input', (e) ->
    val = parseInt(e.target.value, 10)
    return unless Number.isFinite(val) and val >= 9 and val <= 20
    s = self.loadSettings()
    s.fontSize = val
    self.saveSettings(s)
    self.applySettings(domEl)
    return
  addRow('Font size (px)', fontInput)

  for [key, label] in [['title', 'Title'], ['heading', 'Headings'], ['subheading', 'Subheadings'], ['bold', 'Bold'], ['code', 'Code'], ['link', 'Links']]
    do (key, label) ->
      onChange = (e) ->
        s = self.loadSettings()
        s.accentColors[key] = e.target.value
        self.saveSettings(s)
        self.applySettings(domEl)
        return
      addRow(label, self.colorInput(settings.accentColors[key], onChange))
      return

  intervalOptions = [[60, '60s'], [120, '2 min'], [300, '5 min'], [600, '10 min']]
  intervalChange = (e) ->
    s = self.loadSettings()
    s.refreshInterval = parseInt(e.target.value, 10) or 60
    self.saveSettings(s)
    return
  addRow('Refresh interval', self.selectInput(intervalOptions, settings.refreshInterval, intervalChange))

  recencyOptions = [['all', 'All time'], [7, '7 days'], [14, '14 days'], [30, '30 days'], [90, '90 days']]
  recencyCurrent = if settings.recencyDays == null then 'all' else settings.recencyDays
  recencyChange = (e) ->
    s = self.loadSettings()
    v = e.target.value
    s.recencyDays = if v == 'all' then null else parseInt(v, 10)
    self.saveSettings(s)
    arg = if s.recencyDays? then String(s.recencyDays) else 'clear'
    self.run "/Users/tomasraposo/panes/cli.mjs filter #{arg}", (err, _out) ->
      return if err
      refreshBtn = domEl.querySelector('button.pane-refresh')
      refreshBtn.click() if refreshBtn
      return
    return
  addRow('Recency window', self.selectInput(recencyOptions, recencyCurrent, recencyChange))

  paneToggle = document.createElement('div')
  paneToggle.className = 'pane-segmented'
  activePaneId = settings.activePane or 'claude'
  paneOptions = [
    { id: 'claude', label: 'Claude' }
    { id: 'jira', label: 'Jira' }
  ]
  for opt in paneOptions
    do (opt) ->
      btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'pane-segmented-option'
      btn.dataset.paneId = opt.id
      btn.textContent = opt.label
      btn.setAttribute('aria-pressed', if activePaneId == opt.id then 'true' else 'false')
      btn.addEventListener 'click', (e) ->
        e.stopPropagation()
        newId = opt.id
        return if newId == self.loadSettings().activePane
        s = self.loadSettings()
        s.activePane = newId
        self.saveSettings(s)
        for sib in paneToggle.querySelectorAll('button')
          sib.setAttribute('aria-pressed', if sib.dataset.paneId == newId then 'true' else 'false')
        self.run "/Users/tomasraposo/panes/cli.mjs active #{newId}", (err, _out) ->
          return if err
          refreshBtn = domEl.querySelector('button.pane-refresh')
          refreshBtn.click() if refreshBtn
          return
        return
      paneToggle.appendChild(btn)
      return
  addRow('Active pane', paneToggle)

  lockInput = document.createElement('input')
  lockInput.type = 'checkbox'
  lockInput.checked = settings.positionLocked
  lockInput.addEventListener 'change', (e) ->
    s = self.loadSettings()
    s.positionLocked = e.target.checked
    self.saveSettings(s)
    return
  addRow('Lock position', lockInput)

  resetBtn = document.createElement('button')
  resetBtn.type = 'button'
  resetBtn.textContent = 'Reset to defaults'
  resetBtn.addEventListener 'click', ->
    self.saveSettings(self.cloneDefaults())
    self.applySettings(domEl)
    panel.remove()
    return
  panel.appendChild(resetBtn)

  return panel

attachRefresh: (domEl) ->
  self = @
  btn = domEl.querySelector('button.pane-refresh')
  return unless btn
  btn.addEventListener 'click', (e) ->
    e.stopPropagation()
    return if self.refreshing
    self.refreshing = true
    btn.classList.add('spinning')
    btn.disabled = true

    pane = domEl.querySelector('article.pane')
    status = document.createElement('div')
    status.className = 'pane-refresh-status'
    pane.querySelector('header.pane-title').insertAdjacentElement('afterend', status)

    startedAt = Date.now()
    lastLogLine = ''
    displayName = 'pane'
    dataPath = null
    done = false
    initialMtime = 0
    initialSize = -1
    timerInterval = null
    pollInterval = null
    SAFETY_SECONDS = 25

    paint = ->
      return if done
      seconds = Math.floor((Date.now() - startedAt) / 1000)
      base = lastLogLine or "Refreshing #{displayName} pane"
      status.textContent = "#{base} (#{seconds}s)"
      if seconds >= SAFETY_SECONDS
        finish()
      return

    finish = ->
      return if done
      done = true
      clearInterval(timerInterval) if timerInterval
      clearInterval(pollInterval) if pollInterval
      self.refreshing = false
      btn.classList.remove('spinning')
      btn.disabled = false
      status.remove() if status?.parentNode
      self.run "/Users/tomasraposo/panes/cli.mjs render", (err, output) ->
        unless err
          domEl.innerHTML = output
          self.setupUi(domEl)
        return
      return

    paint()
    timerInterval = setInterval(paint, 500)

    self.fetchMeta (meta) ->
      return finish() unless meta?.dataPath
      displayName = meta.displayName or displayName
      dataPath = meta.dataPath
      logCmd = "tail -n 1 \"$HOME/.panes/cache/refresh-#{meta.id}.log\" 2>/dev/null"

      self.readStat dataPath, (init) ->
        { mtime: initialMtime, size: initialSize } = init
        self.run "/Users/tomasraposo/panes/cli.mjs refresh --force", (err, _o) ->
          pollInterval = setInterval((->
            return if done
            self.run logCmd, (e1, line) ->
              return if done
              trimmed = (line or '').trim()
              if trimmed.length > 0
                lastLogLine = if trimmed.length > 80 then '…' + trimmed.slice(trimmed.length - 79) else trimmed
              return
            self.readStat dataPath, (cur) ->
              return if done
              { mtime: newMtime, size: newSize } = cur
              if newMtime > initialMtime or (newSize >= 0 and newSize != initialSize)
                finish()
              return
            return
          ), 1000)
          return
        return
      return
    return
  return

