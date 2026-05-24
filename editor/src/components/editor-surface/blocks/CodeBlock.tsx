import { useRef } from 'react'
import type { QdBlockNode } from '@/core/ir/types'
import { useDocumentStore } from '@/features/document/store'
import { scheduleCompile } from '@/features/preview/orchestrator'
import styles from './blocks.module.css'

interface Props {
  block: QdBlockNode
}

export function CodeBlock({ block }: Props) {
  const { updateBlock, document } = useDocumentStore()
  const ref = useRef<HTMLTextAreaElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    updateBlock(block.id, { content: e.target.value })
    scheduleCompile(document)
  }

  function handleLangChange(e: React.ChangeEvent<HTMLInputElement>) {
    updateBlock(block.id, { language: e.target.value })
    scheduleCompile(document)
  }

  function autoResize() {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = ref.current.scrollHeight + 'px'
    }
  }

  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeHeader}>
        <input
          className={styles.langInput}
          value={block.language ?? ''}
          onChange={handleLangChange}
          placeholder="language"
        />
        <span className={styles.codeLabel}>code</span>
      </div>
      <textarea
        ref={ref}
        className={styles.codeTextarea}
        value={block.content ?? ''}
        onChange={handleChange}
        onInput={autoResize}
        spellCheck={false}
        rows={3}
        placeholder="// code here"
      />
    </div>
  )
}
