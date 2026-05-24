import type { QdBlockNode } from '../../../core/ir/types'
import { useDocumentStore } from '../../../features/structured-editor/store'
import { scheduleCompile } from '../../../features/structured-editor/orchestrator'
import styles from './blocks.module.css'

interface Props {
  block: QdBlockNode
}

/**
 * Renders an opaque block — source that couldn't be structured.
 * The raw source is always preserved and editable directly.
 */
export function OpaqueBlock({ block }: Props) {
  const { updateBlock, document } = useDocumentStore()

  return (
    <div className={styles.opaqueBlock}>
      <div className={styles.opaqueLabel}>Raw source</div>
      <textarea
        className={styles.opaqueTextarea}
        value={block.rawSource ?? ''}
        rows={Math.max(3, (block.rawSource ?? '').split('\n').length)}
        spellCheck={false}
        onChange={(e) => {
          updateBlock(block.id, { rawSource: e.target.value })
          scheduleCompile(document)
        }}
      />
    </div>
  )
}
