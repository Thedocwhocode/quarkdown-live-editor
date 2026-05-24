import { useRef } from 'react'
import type { QdBlockNode } from '@/core/ir/types'
import { useDocumentStore } from '@/features/document/store'
import { scheduleCompile } from '@/features/preview/orchestrator'
import styles from './blocks.module.css'

interface Props {
  block: QdBlockNode
}

const headingStyle: Record<number, React.CSSProperties> = {
  1: { fontSize: '1.8em', fontWeight: 700 },
  2: { fontSize: '1.5em', fontWeight: 700 },
  3: { fontSize: '1.25em', fontWeight: 600 },
  4: { fontSize: '1.1em', fontWeight: 600 },
  5: { fontSize: '1em', fontWeight: 600 },
  6: { fontSize: '0.9em', fontWeight: 600 },
}

export function HeadingBlock({ block }: Props) {
  const { updateBlock, document } = useDocumentStore()
  const ref = useRef<HTMLDivElement>(null)
  const level = block.level ?? 1
  const levelStyle = headingStyle[level] ?? headingStyle[1]

  function handleInput() {
    const text = ref.current?.innerText ?? ''
    updateBlock(block.id, { content: text })
    scheduleCompile(document)
  }

  return (
    <div className={styles.headingWrapper}>
      <span className={styles.headingLevel}>H{level}</span>
      <div
        ref={ref}
        className={styles.heading}
        style={levelStyle}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={`Heading ${level}`}
      >
        {block.content}
      </div>
    </div>
  )
}
