import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bold, Italic, Code, Link, Heading1, Heading2, Quote } from 'lucide-react'
import { computeMenuPosition } from '../../utils/menuPosition'
import css from './BubbleMenu.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FormatAction =
  | 'bold'
  | 'italic'
  | 'code'
  | 'h1'
  | 'h2'
  | 'quote'
  | { kind: 'link'; url: string }

interface Props {
  anchorRect: DOMRect
  onFormat: (action: FormatAction) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BubbleMenu({ anchorRect, onFormat }: Props) {
  const [linkMode, setLinkMode] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const linkInputRef = useRef<HTMLInputElement>(null)
  const onFormatRef = useRef(onFormat)
  onFormatRef.current = onFormat

  // Focus URL input when link mode activates
  useEffect(() => {
    if (linkMode) {
      setTimeout(() => linkInputRef.current?.focus(), 0)
    }
  }, [linkMode])

  function submitLink() {
    const url = linkUrl.trim()
    if (url) onFormatRef.current({ kind: 'link', url })
    setLinkMode(false)
    setLinkUrl('')
  }

  function handleLinkKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      submitLink()
    } else if (e.key === 'Escape') {
      setLinkMode(false)
      setLinkUrl('')
    }
  }

  // Menu positioned ABOVE the selection
  const menuHeight = 36
  const menuWidth = linkMode ? 240 : 260
  const { top, left } = computeMenuPosition(
    new DOMRect(anchorRect.left, anchorRect.top - menuHeight - 8, anchorRect.width, 0),
    menuWidth,
    menuHeight,
  )

  const menu = (
    <div
      ref={containerRef}
      className={css.menu}
      style={{ top, left, width: menuWidth }}
      // Prevent focus theft from the editor on button clicks
      onMouseDown={e => e.preventDefault()}
    >
      {linkMode ? (
        <div className={css.linkRow}>
          <span className={css.linkIcon}><Link size={12} /></span>
          <input
            ref={linkInputRef}
            className={css.linkInput}
            type="url"
            placeholder="Paste URL…"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={handleLinkKeyDown}
            onMouseDown={e => e.stopPropagation()} // allow input focus
          />
          <button
            className={css.linkSubmit}
            onMouseDown={e => { e.preventDefault(); submitLink() }}
            title="Apply link"
          >
            ↵
          </button>
        </div>
      ) : (
        <>
          <button className={css.btn} onMouseDown={() => onFormat('bold')} title="Bold (Ctrl+B)">
            <Bold size={13} strokeWidth={2.2} />
          </button>
          <button className={css.btn} onMouseDown={() => onFormat('italic')} title="Italic (Ctrl+I)">
            <Italic size={13} strokeWidth={2.2} />
          </button>
          <button className={css.btn} onMouseDown={() => onFormat('code')} title="Inline code">
            <Code size={13} strokeWidth={2.2} />
          </button>
          <button
            className={css.btn}
            onMouseDown={() => { setLinkMode(true) }}
            title="Link"
          >
            <Link size={13} strokeWidth={2.2} />
          </button>

          <span className={css.sep} />

          <button className={css.btn} onMouseDown={() => onFormat('h1')} title="Heading 1">
            <Heading1 size={13} strokeWidth={2.2} />
          </button>
          <button className={css.btn} onMouseDown={() => onFormat('h2')} title="Heading 2">
            <Heading2 size={13} strokeWidth={2.2} />
          </button>

          <span className={css.sep} />

          <button className={css.btn} onMouseDown={() => onFormat('quote')} title="Quote">
            <Quote size={13} strokeWidth={2.2} />
          </button>
        </>
      )}
    </div>
  )

  return createPortal(menu, document.body)
}
