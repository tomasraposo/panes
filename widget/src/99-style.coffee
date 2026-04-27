style: """
  top: 60px
  left: 60px
  font-family: 'SF Mono', 'JetBrains Mono', Menlo, monospace
  font-size: var(--pane-font-size, 12px)
  line-height: 1.5
  color: #c5c8c6
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6)
  background: transparent

  article.pane
    position: relative
    width: 600px
    max-height: calc(100vh - 120px)
    overflow: auto
    resize: both
    padding: 16px 22px
    background: rgba(28, 28, 32, 0.55)
    backdrop-filter: blur(24px) saturate(180%)
    -webkit-backdrop-filter: blur(24px) saturate(180%)
    border: 1px solid rgba(255, 255, 255, 0.10)
    border-radius: 14px
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 12px 40px rgba(0, 0, 0, 0.45)
    box-sizing: border-box

  span.pane-title-icon
    display: inline-block
    width: 14px
    height: 14px
    background-color: currentColor
    mask-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAABICAYAAABV7bNHAAAEsWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS41LjAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyIKICAgIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIgogICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgdGlmZjpJbWFnZUxlbmd0aD0iNzIiCiAgIHRpZmY6SW1hZ2VXaWR0aD0iNzIiCiAgIHRpZmY6UmVzb2x1dGlvblVuaXQ9IjIiCiAgIHRpZmY6WFJlc29sdXRpb249IjcyLzEiCiAgIHRpZmY6WVJlc29sdXRpb249IjcyLzEiCiAgIGV4aWY6UGl4ZWxYRGltZW5zaW9uPSI3MiIKICAgZXhpZjpQaXhlbFlEaW1lbnNpb249IjcyIgogICBleGlmOkNvbG9yU3BhY2U9IjEiCiAgIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiCiAgIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIKICAgeG1wOk1vZGlmeURhdGU9IjIwMjQtMTAt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')
    -webkit-mask-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAABICAYAAABV7bNHAAAEsWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS41LjAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyIKICAgIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIgogICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgdGlmZjpJbWFnZUxlbmd0aD0iNzIiCiAgIHRpZmY6SW1hZ2VXaWR0aD0iNzIiCiAgIHRpZmY6UmVzb2x1dGlvblVuaXQ9IjIiCiAgIHRpZmY6WFJlc29sdXRpb249IjcyLzEiCiAgIHRpZmY6WVJlc29sdXRpb249IjcyLzEiCiAgIGV4aWY6UGl4ZWxYRGltZW5zaW9uPSI3MiIKICAgZXhpZjpQaXhlbFlEaW1lbnNpb249IjcyIgogICBleGlmOkNvbG9yU3BhY2U9IjEiCiAgIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiCiAgIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIKICAgeG1wOk1vZGlmeURhdGU9IjIwMjQtMTAt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')
    mask-size: contain
    -webkit-mask-size: contain
    mask-repeat: no-repeat
    -webkit-mask-repeat: no-repeat
    mask-position: center
    -webkit-mask-position: center
    vertical-align: -2px
    margin-right: 6px

  article.pane::-webkit-scrollbar
    width: 8px

  article.pane::-webkit-scrollbar-thumb
    background: rgba(255, 255, 255, 0.15)
    border-radius: 4px

  article.pane::-webkit-scrollbar-thumb:hover
    background: rgba(255, 255, 255, 0.25)

  article.pane > header.pane-title
    position: sticky
    top: -16px
    z-index: 10
    margin: -16px -22px 12px -22px
    padding: 16px 22px 10px 22px
    background: rgba(28, 28, 32, 0.78)
    backdrop-filter: blur(28px) saturate(180%)
    -webkit-backdrop-filter: blur(28px) saturate(180%)
    font-size: inherit
    font-weight: 600
    color: var(--pane-color-title, #82aaff)
    border-bottom: 1px solid rgba(255, 255, 255, 0.10)
    letter-spacing: 0.02em
    display: flex
    align-items: center
    gap: 8px

  span.pane-title-text
    flex: 1 1 auto

  button.pane-refresh
  button.pane-settings-toggle
    flex: 0 0 auto
    width: 22px
    height: 22px
    padding: 0
    border: 1px solid rgba(255, 255, 255, 0.18)
    border-radius: 50%
    background: transparent
    color: #c5c8c6
    font-family: inherit
    font-size: 13px
    line-height: 1
    cursor: pointer
    display: flex
    align-items: center
    justify-content: center
    user-select: none
    transition: color 120ms, border-color 120ms

  button.pane-refresh:hover
  button.pane-settings-toggle:hover
    border-color: var(--pane-color-title, #82aaff)
    color: var(--pane-color-title, #82aaff)

  button.pane-refresh:disabled
    cursor: progress

  button.pane-refresh.spinning
    animation: pane-spin 1s linear infinite
    color: var(--pane-color-title, #82aaff)
    border-color: var(--pane-color-title, #82aaff)

  @keyframes pane-spin
    from
      transform: rotate(0deg)
    to
      transform: rotate(360deg)

  .pane-refresh-status
    font-size: 10px
    color: var(--pane-color-title, #82aaff)
    font-family: inherit
    padding: 5px 10px
    margin: 0 0 10px 0
    background: rgba(130, 170, 255, 0.06)
    border-left: 2px solid var(--pane-color-title, #82aaff)
    border-radius: 2px
    white-space: nowrap
    overflow: hidden
    text-overflow: ellipsis

  .pane-settings-panel
    position: absolute
    top: 38px
    right: 16px
    z-index: 100
    background: rgba(28, 28, 32, 0.82)
    backdrop-filter: blur(28px) saturate(180%)
    -webkit-backdrop-filter: blur(28px) saturate(180%)
    border: 1px solid rgba(255, 255, 255, 0.14)
    border-radius: 12px
    padding: 12px 14px
    min-width: 240px
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 12px 40px rgba(0, 0, 0, 0.45)
    font-size: 11px

  .pane-settings-row
    display: flex
    align-items: center
    gap: 8px
    margin: 6px 0

  .pane-settings-row > label
    flex: 1 1 auto
    color: #c5c8c6

  .pane-settings-row input[type="number"]
  .pane-settings-row select
    background: rgba(0, 0, 0, 0.3)
    border: 1px solid rgba(255, 255, 255, 0.15)
    border-radius: 3px
    color: #c5c8c6
    padding: 2px 6px
    font-family: inherit
    font-size: inherit
    width: 80px

  .pane-settings-row input[type="color"]
    width: 32px
    height: 22px
    border: 1px solid rgba(255, 255, 255, 0.15)
    border-radius: 3px
    background: transparent
    padding: 0
    cursor: pointer

  .pane-settings-row input[type="checkbox"]
    margin: 0
    width: auto

  .pane-segmented
    display: inline-flex
    border: 1px solid rgba(255, 255, 255, 0.15)
    border-radius: 4px
    overflow: hidden

  .pane-segmented-option
    background: rgba(255, 255, 255, 0.04)
    border: none
    color: #c5c8c6
    font-family: inherit
    font-size: inherit
    padding: 3px 10px
    cursor: pointer
    transition: background 0.12s ease

  .pane-segmented-option + .pane-segmented-option
    border-left: 1px solid rgba(255, 255, 255, 0.15)

  .pane-segmented-option:hover
    background: rgba(255, 255, 255, 0.08)

  .pane-segmented-option[aria-pressed="true"]
    background: var(--pane-color-pill-amber-bg, rgba(244, 191, 79, 0.18))
    color: var(--pane-color-pill-amber-fg, #f4bf4f)

  .pane-settings-panel > button
    margin-top: 10px
    width: 100%
    background: rgba(255, 255, 255, 0.05)
    border: 1px solid rgba(255, 255, 255, 0.15)
    border-radius: 3px
    color: #c5c8c6
    padding: 5px 8px
    font-family: inherit
    font-size: inherit
    cursor: pointer

  .pane-settings-panel > button:hover
    background: rgba(255, 255, 255, 0.1)

  article.pane h1
  article.pane h2
    font-size: 13px
    font-weight: 600
    color: var(--pane-color-heading, #c3e88d)
    margin: 14px 0 6px 0
    letter-spacing: 0.02em

  .pane-section h2
    margin-top: 0
    padding-top: 12px
    border-top: 1px solid rgba(255, 255, 255, 0.08)

  .pane-body > .pane-section:first-child > h2
  .pane-body > h2:first-child
    border-top: none
    padding-top: 0

  .pane-section
    position: relative
    padding-top: 2px
    transition: opacity 120ms

  .pane-section.dragging
    opacity: 0.4

  .pane-section.drop-above::before
    content: ""
    position: absolute
    left: 0
    right: 0
    top: -1px
    height: 2px
    background: var(--pane-color-title, #82aaff)
    border-radius: 1px

  .pane-section.drop-below::after
    content: ""
    position: absolute
    left: 0
    right: 0
    bottom: -1px
    height: 2px
    background: var(--pane-color-title, #82aaff)
    border-radius: 1px

  article.pane h3
    font-size: inherit
    font-weight: 500
    color: var(--pane-color-subheading, #ffcb6b)
    margin: 8px 0 4px 0

  article.pane p
    margin: 4px 0

  article.pane ul
    margin: 4px 0
    padding-left: 18px

  article.pane ol
    margin: 4px 0
    padding-left: 22px

  article.pane li
    list-style: square
    margin: 2px 0

  article.pane strong
    color: var(--pane-color-bold, #ffcb6b)
    font-weight: 600

  article.pane em
    color: #c792ea
    font-style: italic

  article.pane code
    background: rgba(255, 255, 255, 0.07)
    color: var(--pane-color-code, #ff7b85)
    padding: 1px 5px
    border-radius: 3px
    font-family: inherit

  article.pane pre
    margin: 6px 0

  article.pane pre > code
    display: block
    padding: 8px 12px
    background: rgba(0, 0, 0, 0.35)
    color: #c5c8c6

  article.pane table
    border-collapse: collapse
    margin: 6px 0
    width: 100%

  article.pane th
    text-align: left
    color: var(--pane-color-title, #82aaff)
    padding: 6px 12px 6px 0
    border-bottom: 1px solid rgba(255, 255, 255, 0.14)
    font-weight: 600
    font-size: 10px
    text-transform: uppercase
    letter-spacing: 0.10em
    opacity: 0.7

  article.pane td
    padding: 4px 12px 4px 0
    vertical-align: top

  article.pane table tbody tr:nth-child(even) td
    background: rgba(255, 255, 255, 0.025)

  .pane-pill
    display: inline-block
    padding: 0 6px
    border-radius: 3px
    font-family: inherit
    font-size: 0.95em
    font-weight: 600
    letter-spacing: 0.02em

  .pane-pill-green
    background: rgba(195, 232, 141, 0.12)
    color: #c3e88d

  .pane-pill-amber
    background: rgba(255, 203, 107, 0.12)
    color: #ffcb6b

  .pane-pill-red
    background: rgba(255, 123, 133, 0.14)
    color: #ff7b85

  article.pane a
    color: var(--pane-color-link, #80cbc4)
    text-decoration: none

  article.pane a:hover
    text-decoration: underline
"""
