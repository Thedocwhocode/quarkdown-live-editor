import { usePreviewStore } from '@/features/preview/store'
import styles from './DiagnosticsPanel.module.css'

export function DiagnosticsPanel() {
  const { diagnostics, error } = usePreviewStore()

  if (diagnostics.length === 0 && !error) {
    return (
      <div className={styles.empty}>
        No issues found.
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <div className="panel-heading">Issues</div>
      <div className={styles.list}>
        {diagnostics.map((d, i) => (
          <div key={i} className={`${styles.item} ${styles[d.severity]}`}>
            <span className={`tag tag-${d.severity}`}>{d.severity}</span>
            <span className={styles.message}>{d.humanMessage}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
