import { usePreviewStore } from '@/features/preview/store'
import styles from './PreviewPane.module.css'

export function PreviewPane() {
  const { html, isCompiling, isStale, error, backendAvailable } = usePreviewStore()

  if (!backendAvailable) {
    return (
      <div className={styles.notice}>
        <div className={styles.noticeTitle}>Compiler not available</div>
        <div className={styles.noticeBody}>
          Run <code>./gradlew installDist</code> in the repo root,
          then restart <code>npm run dev</code>.
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pane}>
      {/* Status bar */}
      <div className={styles.statusBar}>
        {isCompiling && <span className={styles.spinnerLabel}>Compiling…</span>}
        {isStale && !isCompiling && <span className={styles.staleLabel}>Stale</span>}
        {!isCompiling && !isStale && html && <span className={styles.okLabel}>Live</span>}
      </div>

      {error && (
        <div className={styles.errorBar}>
          <span className="tag tag-error">Error</span>
          <span className={styles.errorMsg}>{error}</span>
        </div>
      )}

      {html ? (
        <iframe
          className={styles.frame}
          srcDoc={html}
          sandbox="allow-scripts allow-same-origin"
          title="Quarkdown preview"
        />
      ) : (
        <div className={styles.empty}>
          {isCompiling ? 'Compiling…' : 'Write something to see a preview.'}
        </div>
      )}
    </div>
  )
}
