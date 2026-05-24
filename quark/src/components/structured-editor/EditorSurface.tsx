import { useBlocks, useDocumentStore } from '../../features/structured-editor/store'
import { scheduleCompile } from '../../features/structured-editor/orchestrator'
import { BlockRenderer } from './BlockRenderer'
import { buildParagraph } from '../../core/ir/builders'
import styles from './EditorSurface.module.css'

export function EditorSurface() {
  const blocks = useBlocks()
  const { appendBlock, setSelectedBlockId, document } = useDocumentStore()

  function handleSurfaceClick(e: React.MouseEvent) {
    // Click on empty space below blocks → deselect and add a paragraph
    if (e.target === e.currentTarget) {
      setSelectedBlockId(null)
    }
  }

  function handleAddParagraph() {
    const block = buildParagraph()
    appendBlock(block)
    const updated = { ...document, blocks: [...document.blocks, block] }
    scheduleCompile(updated)
  }

  return (
    <div className={styles.surface} onClick={handleSurfaceClick}>
      {blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
      <button className={styles.addBtn} onClick={handleAddParagraph}>
        + Add block
      </button>
    </div>
  )
}
