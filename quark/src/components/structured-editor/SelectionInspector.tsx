import { useDocumentStore } from '../../features/structured-editor/store'
import { lookupByName } from '../../core/registry/index'
import styles from './SelectionInspector.module.css'

export function SelectionInspector() {
  const { selectedBlockId, document } = useDocumentStore()
  const block = document.blocks.find((b) => b.id === selectedBlockId)

  if (!block) {
    return (
      <div className={styles.empty}>
        Click a block to inspect its properties.
      </div>
    )
  }

  const entry = block.kind === 'functionCall' && block.call
    ? lookupByName(block.call.functionName)
    : null

  return (
    <div className={styles.inspector}>
      <div className="panel-heading">Block Inspector</div>
      <div className={styles.content}>
        <div className={styles.row}>
          <span className={styles.key}>Type</span>
          <span className={styles.value}>{block.kind}</span>
        </div>
        {block.kind === 'heading' && (
          <div className={styles.row}>
            <span className={styles.key}>Level</span>
            <span className={styles.value}>H{block.level}</span>
          </div>
        )}
        {block.kind === 'code' && (
          <div className={styles.row}>
            <span className={styles.key}>Language</span>
            <span className={styles.value}>{block.language || '—'}</span>
          </div>
        )}
        {block.kind === 'functionCall' && block.call && (
          <>
            <div className={styles.row}>
              <span className={styles.key}>Function</span>
              <span className={`${styles.value} ${styles.mono}`}>.{block.call.functionName}</span>
            </div>
            {entry && (
              <div className={styles.row}>
                <span className={styles.key}>Category</span>
                <span className={styles.value}>{entry.category}</span>
              </div>
            )}
            {block.call.namedArgs.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Named arguments</div>
                {block.call.namedArgs.map((arg) => (
                  <div key={arg.name} className={styles.row}>
                    <span className={styles.key}>{arg.name}</span>
                    <span className={`${styles.value} ${styles.mono}`}>
                      {JSON.stringify((arg.value as { value: unknown }).value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {entry?.description && (
          <div className={styles.description}>{entry.description}</div>
        )}
      </div>
    </div>
  )
}
