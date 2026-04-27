mutateSetting: (domEl, mutator) ->
  s = @loadSettings()
  mutator(s)
  @saveSettings(s)
  @applySettings(domEl)
  s

numberInput: (value, min, max, step, onInput) ->
  input = document.createElement('input')
  input.type = 'number'
  input.min = String(min)
  input.max = String(max)
  input.step = String(step)
  input.value = value
  input.addEventListener('input', onInput)
  input

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

  fontChange = (e) ->
    val = parseInt(e.target.value, 10)
    return unless Number.isFinite(val) and val >= 9 and val <= 20
    self.mutateSetting domEl, (s) -> s.fontSize = val
    return
  addRow('Font size (px)', self.numberInput(settings.fontSize, 9, 20, 1, fontChange))

  for [key, label] in [['title', 'Title'], ['heading', 'Headings'], ['subheading', 'Subheadings'], ['bold', 'Bold'], ['code', 'Code'], ['link', 'Links']]
    do (key, label) ->
      onChange = (e) ->
        self.mutateSetting domEl, (s) -> s.accentColors[key] = e.target.value
        return
      addRow(label, self.colorInput(settings.accentColors[key], onChange))
      return

  intervalOptions = [[60, '60s'], [120, '2 min'], [300, '5 min'], [600, '10 min']]
  intervalChange = (e) ->
    self.mutateSetting domEl, (s) -> s.refreshInterval = parseInt(e.target.value, 10) or 60
    return
  addRow('Refresh interval', self.selectInput(intervalOptions, settings.refreshInterval, intervalChange))

  recencyOptions = [['all', 'All time'], [7, '7 days'], [14, '14 days'], [30, '30 days'], [90, '90 days']]
  recencyCurrent = if settings.recencyDays == null then 'all' else settings.recencyDays
  recencyChange = (e) ->
    v = e.target.value
    s = self.mutateSetting domEl, (s) ->
      s.recencyDays = if v == 'all' then null else parseInt(v, 10)
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
        self.mutateSetting domEl, (s) -> s.activePane = newId
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
    self.mutateSetting domEl, (s) -> s.positionLocked = e.target.checked
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
