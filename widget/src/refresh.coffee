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
