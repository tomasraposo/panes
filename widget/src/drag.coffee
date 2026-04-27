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
