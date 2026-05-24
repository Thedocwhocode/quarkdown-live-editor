import type { QdBlockNode } from '../../core/ir/types'
import { useDocumentStore } from '../../features/structured-editor/store'
import { scheduleCompile } from '../../features/structured-editor/orchestrator'
import { toast } from '../../features/toast/store'
import styles from './BlockWrapper.module.css'

interface Props {
  block: QdBlockNode
  children: React.ReactNode
}

/** Provides selection, delete, and move controls around every block. */
export function BlockWrapper({ block, children }: Props) {
  const { selectedBlockId, setSelectedBlockId, deleteBlock, moveBlock, document } = useDocumentStore()
  const isSelected = selectedBlockId === block.id

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    // Snapshot before delete so the undo action can restore it
    const snapshot = { ...block }
    const afterId = (() => {
      const idx = document.blocks.findIndex(b => b.id === block.id)
      return idx > 0 ? document.blocks[idx - 1].id : null
    })()

    deleteBlock(block.id)
    scheduleCompile(document)

    toast.info('Block deleted', {
      label: 'Undo',
      onClick: () => {
        const { insertBlockAfter, appendBlock } = useDocumentStore.getState()
        if (afterId) {
          insertBlockAfter(afterId, snapshot)
        } else {
          appendBlock(snapshot)
        }
        scheduleCompile(useDocumentStore.getState().document)
      },
    })
  }

  function handleMoveUp(e: React.MouseEvent) {
    e.stopPropagation()
    moveBlock(block.id, 'up')
    scheduleCompile(document)
  }

  function handleMoveDown(e: React.MouseEvent) {
    e.stopPropagation()
    moveBlock(block.id, 'down')
    scheduleCompile(document)
  }

  return (
    <div
      className={`${styles.wrapper} ${isSelected ? styles.selected : ''}`}
      onClick={() => setSelectedBlockId(block.id)}
    >
      <div className={styles.actions}>
        <button className={styles.actionBtn} title="Move up" onClick={handleMoveUp}>↑</button>
        <button className={styles.actionBtn} title="Move down" onClick={handleMoveDown}>↓</button>
        <button className={styles.actionBtn} title="Delete block" onClick={handleDelete}>×</button>
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  )
}
