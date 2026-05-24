import { useEffect, useRef, useState } from 'react'
import type { QdBlockNode } from '../../../core/ir/types'
import { useDocumentStore } from '../../../features/structured-editor/store'
import { scheduleCompile } from '../../../features/structured-editor/orchestrator'
import {
  buildHeading,
  buildCodeBlock,
  buildBlock,
  buildFunctionCallBlock,
} from '../../../core/ir/builders'
import {
  SlashCommandMenu,
  type SlashMenuItem,
} from '../../editor/SlashCommandMenu'
import { BubbleMenu, type FormatAction } from '../../editor/BubbleMenu'
import { getCursorRect } from '../../../utils/menuPosition'
import styles from './blocks.module.css'

interface Props {
  block: QdBlockNode
}

interface SlashState {
  anchorRect: DOMRect
  query: string
}

export function ParagraphBlock({ block }: Props) {
  const { updateBlock, insertBlockAfter, document: qdDoc } = useDocumentStore()
  const ref = useRef<HTMLDivElement>(null)
  const [slashState, setSlashState] = useState<SlashState | null>(null)
  const [bubbleRect, setBubbleRect] = useState<DOMRect | null>(null)

  // ─── Input handler ──────────────────────────────────────────────────────────

  function handleInput() {
    const text = ref.current?.innerText ?? ''

    // Persist to store
    updateBlock(block.id, { content: text })
    scheduleCompile(qdDoc)

    // Slash command trigger: content starts with /
    if (text.startsWith('/')) {
      const query = text.slice(1)
      const anchorRect = getCursorRect(ref.current!)
      setSlashState({ anchorRect, query })
    } else {
      setSlashState(null)
    }
  }

  // ─── Selection → bubble menu ────────────────────────────────────────────────

  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !ref.current?.contains(sel.anchorNode)) {
        setBubbleRect(null)
        return
      }
      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      if (rect.width > 2) {
        setBubbleRect(rect)
      }
    }

    window.document.addEventListener('selectionchange', handleSelection)
    return () => window.document.removeEventListener('selectionchange', handleSelection)
  }, [])

  // Hide bubble when block loses focus
  function handleBlur() {
    // Small delay to allow bubble button clicks to fire before hiding
    setTimeout(() => setBubbleRect(null), 150)
    // Persist content on blur
    const text = ref.current?.innerText ?? ''
    updateBlock(block.id, { content: text })
  }

  // ─── Slash command selection ─────────────────────────────────────────────────

  function handleSlashSelect(item: SlashMenuItem) {
    setSlashState(null)

    // Determine replacement block
    let replacement: QdBlockNode | null = null

    switch (item.kind) {
      case 'paragraph':
        replacement = buildBlock('paragraph', { content: '' })
        break
      case 'heading':
        replacement = buildHeading(item.level)
        break
      case 'code':
        replacement = buildCodeBlock()
        break
      case 'divider':
        replacement = buildBlock('thematicBreak')
        break
      case 'catalog':
        replacement = buildFunctionCallBlock(item.item.canonicalName, { registryId: item.item.id })
        break
      case 'emoji': {
        // Insert emoji character into the paragraph content (replace /query)
        if (ref.current) {
          ref.current.innerText = item.char
          updateBlock(block.id, { content: item.char })
          scheduleCompile(qdDoc)
        }
        return
      }
    }

    if (!replacement) return

    // If current block is empty (only had /+query), replace it in-place.
    // Otherwise, insert the new block after the current one.
    const currentText = ref.current?.innerText ?? ''
    const isEmpty = currentText === '' || currentText.startsWith('/')

    if (isEmpty) {
      // Replace: preserve block id position by updating kind + clearing other fields
      updateBlock(block.id, {
        kind: replacement.kind,
        level: (replacement as QdBlockNode).level,
        language: (replacement as QdBlockNode).language,
        content: (replacement as QdBlockNode).content ?? '',
        call: (replacement as QdBlockNode).call,
        rawSource: undefined,
      })
      // Clear the DOM text
      if (ref.current) ref.current.innerText = ''
    } else {
      insertBlockAfter(block.id, replacement)
    }

    scheduleCompile({
      ...qdDoc,
      blocks: qdDoc.blocks.map(b => b.id === block.id
        ? { ...b, kind: replacement!.kind, content: '' }
        : b
      ),
    })
  }

  // ─── Bubble format application ───────────────────────────────────────────────

  function handleFormat(action: FormatAction) {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return

    const range = sel.getRangeAt(0)
    const selectedText = range.toString()
    if (!selectedText) return

    let formatted: string
    if (action === 'bold') formatted = `**${selectedText}**`
    else if (action === 'italic') formatted = `_${selectedText}_`
    else if (action === 'code') formatted = `\`${selectedText}\``
    else if (action === 'h1') formatted = `# ${selectedText}`
    else if (action === 'h2') formatted = `## ${selectedText}`
    else if (action === 'quote') formatted = `> ${selectedText}`
    else if (typeof action === 'object' && action.kind === 'link')
      formatted = `[${selectedText}](${action.url})`
    else return

    range.deleteContents()
    range.insertNode(window.document.createTextNode(formatted))

    setBubbleRect(null)

    if (ref.current) {
      const text = ref.current.innerText
      updateBlock(block.id, { content: text })
      scheduleCompile(qdDoc)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div
        ref={ref}
        className={styles.paragraph}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleBlur}
        data-placeholder={slashState ? '' : 'Write something, or type / for commands…'}
      >
        {block.content}
      </div>

      {slashState && (
        <SlashCommandMenu
          anchorRect={slashState.anchorRect}
          query={slashState.query}
          onSelect={handleSlashSelect}
          onClose={() => setSlashState(null)}
        />
      )}

      {bubbleRect && !slashState && (
        <BubbleMenu
          anchorRect={bubbleRect}
          onFormat={handleFormat}
        />
      )}
    </>
  )
}
