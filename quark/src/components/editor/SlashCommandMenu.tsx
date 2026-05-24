import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AlignLeft,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Minus,
  Zap,
} from 'lucide-react'
import { CATALOG } from '../../core/registry/catalog'
import type { FunctionRegistryItem, FunctionCategory } from '../../core/registry/types'
import { computeMenuPosition } from '../../utils/menuPosition'
import css from './SlashCommandMenu.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SlashMenuItem =
  | { kind: 'heading'; level: 1 | 2 | 3 }
  | { kind: 'paragraph' }
  | { kind: 'code' }
  | { kind: 'divider' }
  | { kind: 'catalog'; item: FunctionRegistryItem }
  | { kind: 'emoji'; char: string }

interface FlatItem extends Record<string, unknown> {
  slashItem: SlashMenuItem
  displayName: string
  description: string
  icon?: React.ReactNode
}

interface Props {
  anchorRect: DOMRect
  query: string
  onSelect: (item: SlashMenuItem) => void
  onClose: () => void
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const QUICK_BLOCKS: FlatItem[] = [
  {
    slashItem: { kind: 'paragraph' },
    displayName: 'Text',
    description: 'Plain paragraph',
    icon: <AlignLeft size={14} />,
  },
  {
    slashItem: { kind: 'heading', level: 1 },
    displayName: 'Heading 1',
    description: 'Large section heading',
    icon: <Heading1 size={14} />,
  },
  {
    slashItem: { kind: 'heading', level: 2 },
    displayName: 'Heading 2',
    description: 'Medium section heading',
    icon: <Heading2 size={14} />,
  },
  {
    slashItem: { kind: 'heading', level: 3 },
    displayName: 'Heading 3',
    description: 'Small section heading',
    icon: <Heading3 size={14} />,
  },
  {
    slashItem: { kind: 'code' },
    displayName: 'Code Block',
    description: 'Syntax-highlighted code',
    icon: <Code size={14} />,
  },
  {
    slashItem: { kind: 'divider' },
    displayName: 'Divider',
    description: 'Horizontal separator line',
    icon: <Minus size={14} />,
  },
]

const EMOJIS = [
  '😀','😂','❤️','👍','🎉','🔥',
  '✅','⭐','🚀','💡','📝','🎯',
  '🔍','💬','📊','🛠️','📌','🌟',
  '🤔','👀','🎨','📦','⚡','🏆',
]

const EMOJI_ITEMS: FlatItem[] = EMOJIS.map(char => ({
  slashItem: { kind: 'emoji', char },
  displayName: char,
  description: 'Emoji',
}))

const CATALOG_ITEMS: FlatItem[] = CATALOG
  .filter(item => item.placement === 'block')
  .map(item => ({
    slashItem: { kind: 'catalog', item },
    displayName: item.displayName,
    description: item.description,
    icon: <Zap size={14} />,
  }))

const CATEGORY_ORDER: FunctionCategory[] = [
  'text', 'layout', 'media', 'tables', 'diagrams', 'math',
  'variables', 'logic', 'slides', 'references', 'themes', 'advanced',
]

// ─── Component ────────────────────────────────────────────────────────────────

export function SlashCommandMenu({ anchorRect, query, onSelect, onClose }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  // Stable refs so the keydown effect doesn't re-bind on every render
  const activeIndexRef = useRef(activeIndex)
  const onSelectRef = useRef(onSelect)
  const onCloseRef = useRef(onClose)
  activeIndexRef.current = activeIndex
  onSelectRef.current = onSelect
  onCloseRef.current = onClose

  const lq = query.toLowerCase()

  const filteredQuick = QUICK_BLOCKS.filter(
    item =>
      !lq ||
      item.displayName.toLowerCase().includes(lq),
  )

  const filteredCatalog = CATALOG_ITEMS.filter(
    item =>
      !lq ||
      item.displayName.toLowerCase().includes(lq) ||
      (item.slashItem as { kind: 'catalog'; item: FunctionRegistryItem }).item.intentTags.some(t =>
        t.includes(lq),
      ),
  )

  const filteredEmoji = EMOJI_ITEMS.filter(item => !lq || item.displayName === lq)

  // Group catalog items by category (preserving order)
  const catalogGroups = CATEGORY_ORDER
    .map(cat => ({
      category: cat,
      items: filteredCatalog.filter(
        fi => (fi.slashItem as { kind: 'catalog'; item: FunctionRegistryItem }).item.category === cat,
      ),
    }))
    .filter(g => g.items.length > 0)

  // Flat list for keyboard navigation
  const allItems: FlatItem[] = [
    ...filteredQuick,
    ...filteredCatalog,
    ...(filteredEmoji.length > 0 ? filteredEmoji : []),
  ]

  const clampedIndex = Math.min(activeIndex, Math.max(0, allItems.length - 1))

  // Reset active index when query changes
  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  // Keyboard navigation — capture phase so we suppress keys from reaching the editor
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        setActiveIndex(i => Math.min(i + 1, allItems.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        setActiveIndex(i => Math.max(0, i - 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        const item = allItems[activeIndexRef.current]
        if (item) onSelectRef.current(item.slashItem)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onCloseRef.current()
      }
    }
    window.addEventListener('keydown', handleKey, { capture: true })
    return () => window.removeEventListener('keydown', handleKey, { capture: true })
  }, [allItems.length]) // re-bind only when total item count changes

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        onCloseRef.current()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLButtonElement>(`[data-index="${clampedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [clampedIndex])

  const { top, left } = computeMenuPosition(anchorRect, 280, 380)

  // Build a global flat index counter for rendering
  let globalIndex = 0

  const renderItem = (fi: FlatItem) => {
    const idx = globalIndex++
    const isActive = idx === clampedIndex
    return (
      <button
        key={`${fi.displayName}-${idx}`}
        data-index={idx}
        className={`${css.item} ${isActive ? css.itemActive : ''}`}
        onMouseEnter={() => setActiveIndex(idx)}
        onMouseDown={e => {
          e.preventDefault()
          onSelect(fi.slashItem)
        }}
        tabIndex={-1}
      >
        {fi.icon && <span className={css.itemIcon}>{fi.icon}</span>}
        <span className={css.itemText}>
          <span className={css.itemName}>{fi.displayName}</span>
          {fi.description && <span className={css.itemDesc}>{fi.description}</span>}
        </span>
      </button>
    )
  }

  if (allItems.length === 0) {
    return createPortal(
      <div
        ref={listRef}
        className={css.menu}
        style={{ top, left }}
        role="listbox"
      >
        <div className={css.empty}>No results for "{query}"</div>
      </div>,
      document.body,
    )
  }

  return createPortal(
    <div
      ref={listRef}
      className={css.menu}
      style={{ top, left }}
      role="listbox"
      aria-label="Command palette"
    >
      {/* Quick blocks section */}
      {filteredQuick.length > 0 && (
        <div className={css.group}>
          {!lq && <div className={css.groupLabel}>Quick blocks</div>}
          {filteredQuick.map(fi => renderItem(fi))}
        </div>
      )}

      {/* Catalog groups */}
      {catalogGroups.map(({ category, items }) => (
        <div key={category} className={css.group}>
          <div className={css.groupLabel}>{category}</div>
          {items.map(fi => renderItem(fi))}
        </div>
      ))}

      {/* Emoji grid (only when query matches emoji or is empty and no other results) */}
      {filteredEmoji.length > 0 && filteredCatalog.length === 0 && filteredQuick.length === 0 && (
        <div className={css.group}>
          <div className={css.groupLabel}>Emoji</div>
          <div className={css.emojiGrid}>
            {filteredEmoji.map(fi => {
              const idx = globalIndex++
              const isActive = idx === clampedIndex
              return (
                <button
                  key={fi.displayName}
                  data-index={idx}
                  className={`${css.emojiBtn} ${isActive ? css.itemActive : ''}`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={e => {
                    e.preventDefault()
                    onSelect(fi.slashItem)
                  }}
                  tabIndex={-1}
                >
                  {fi.displayName}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Hint bar */}
      <div className={css.hint}>
        <kbd>↑↓</kbd> navigate · <kbd>↵</kbd> select · <kbd>Esc</kbd> close
      </div>
    </div>,
    document.body,
  )
}
