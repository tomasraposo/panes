setupSections: (domEl) ->
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
    @attachSectionDrag(section, sections, bodyEl)
  return

attachSectionDrag: (section, sections, bodyEl) ->
  self = @
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
