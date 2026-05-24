import { useMeta, useDocumentStore } from '@/features/document/store'
import { scheduleCompile } from '@/features/preview/orchestrator'
import styles from './DocumentSetupPanel.module.css'

export function DocumentSetupPanel() {
  const meta = useMeta()
  const { updateMeta, document } = useDocumentStore()

  function patch(partial: Parameters<typeof updateMeta>[0]) {
    updateMeta(partial)
    scheduleCompile({ ...document, meta: { ...meta, ...partial } })
  }

  return (
    <div className={styles.panel}>
      <div className="panel-heading">Document</div>

      <div className={styles.fields}>
        <div className="field">
          <label>Type</label>
          <select
            value={meta.docType}
            onChange={(e) => patch({ docType: e.target.value as typeof meta.docType })}
          >
            <option value="plain">Plain</option>
            <option value="paged">Paged (LaTeX-like)</option>
            <option value="slides">Slides (Reveal.js)</option>
            <option value="docs">Docs / Wiki</option>
          </select>
        </div>

        <div className="field">
          <label>Title</label>
          <input
            type="text"
            value={meta.title ?? ''}
            placeholder="Untitled"
            onChange={(e) => patch({ title: e.target.value })}
          />
        </div>

        <div className="field">
          <label>Author</label>
          <input
            type="text"
            value={meta.authors?.[0] ?? ''}
            placeholder="Author name"
            onChange={(e) => patch({ authors: e.target.value ? [e.target.value] : [] })}
          />
        </div>

        <div className="field">
          <label>Description</label>
          <textarea
            value={meta.description ?? ''}
            placeholder="Brief description…"
            rows={2}
            onChange={(e) => patch({ description: e.target.value })}
          />
        </div>

        <div className="field">
          <label>Language</label>
          <input
            type="text"
            value={meta.language ?? ''}
            placeholder="en"
            onChange={(e) => patch({ language: e.target.value })}
          />
        </div>

        <div className="field">
          <label>Layout theme</label>
          <input
            type="text"
            value={meta.theme ?? ''}
            placeholder="e.g. latex"
            onChange={(e) => patch({ theme: e.target.value })}
          />
        </div>

        <div className="field">
          <label>Color theme</label>
          <input
            type="text"
            value={meta.colorTheme ?? ''}
            placeholder="e.g. darcula"
            onChange={(e) => patch({ colorTheme: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
