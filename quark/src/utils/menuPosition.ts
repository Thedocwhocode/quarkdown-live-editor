/**
 * Viewport-aware positioning for floating menus (slash command, bubble menu).
 *
 * Returns fixed CSS coordinates that keep the menu within the viewport,
 * flipping above the anchor if there is insufficient space below.
 */
export function computeMenuPosition(
  anchor: DOMRect,
  menuWidth: number,
  menuHeight: number,
): { top: number; left: number } {
  const spaceBelow = window.innerHeight - anchor.bottom
  const top =
    spaceBelow >= menuHeight + 8
      ? anchor.bottom + 6
      : Math.max(8, anchor.top - menuHeight - 6)

  const left = Math.min(
    Math.max(8, anchor.left),
    window.innerWidth - menuWidth - 8,
  )

  return { top, left }
}

/** Get the viewport rect of the current cursor in a contentEditable element. */
export function getCursorRect(el: HTMLElement): DOMRect {
  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0).cloneRange()
    range.collapse(true)
    const rect = range.getBoundingClientRect()
    if (rect.width !== 0 || rect.height !== 0) return rect
  }
  return el.getBoundingClientRect()
}
