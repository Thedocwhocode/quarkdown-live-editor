import { useRef } from 'react'
import type { QdBlockNode } from '../../../core/ir/types'
import { useDocumentStore } from '../../../features/structured-editor/store'
import { scheduleCompile } from '../../../features/structured-editor/orchestrator'
import styles from './blocks.module.css'

interface Props {
  block: QdBlockNode
}

export function ParagraphBlock({ block }: Props) {
  const { updateBlock, document } = useDocumentStore()
  const ref = useRef<HTMLDivElement>(null)

  function handleInput() {
    const text = ref.current?.innerText ?? ''
    updateBlock(block.id, { content: text })
    scheduleCompile(document)
  }

  return (
    <div
      ref={ref}
      className={styles.paragraph}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      data-placeholder="Write something…"
      onBlur={handleInput}
    >
      {block.content}
    </div>
  )
}
