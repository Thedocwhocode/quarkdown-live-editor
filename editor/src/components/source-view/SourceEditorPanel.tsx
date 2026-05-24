import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import type { ViewUpdate } from '@codemirror/view'
import { oneDark } from '@codemirror/theme-one-dark'
import { markdown } from '@codemirror/lang-markdown'
import { useDocumentStore } from '@/features/document/store'
import { serializeDocument } from '@/core/serializer/serialize'
import { syncFromSource } from '@/features/source-sync/sync'
import { scheduleCompile } from '@/features/preview/orchestrator'
import styles from './SourceEditorPanel.module.css'

/**
 * CodeMirror 6 source editor panel.
 * Reflects the current document IR as editable .qd source.
 * Bidirectional: edits here parse back into the IR store.
 */
export function SourceEditorPanel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const { document, setDocument } = useDocumentStore()

  // Track whether an update came from us (IR→source) to break sync cycles
  const suppressRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current) return

    const source = serializeDocument(document)

    const state = EditorState.create({
      doc: source,
      extensions: [
        basicSetup,
        markdown(),
        oneDark,
        EditorView.lineWrapping,
        EditorView.updateListener.of((update: ViewUpdate) => {
          if (!update.docChanged || suppressRef.current) return
          const newSource = update.state.doc.toString()
          const newDoc = syncFromSource(document, newSource)
          if (newDoc) {
            setDocument(newDoc)
            scheduleCompile(newDoc)
          }
        }),
        EditorView.theme({
          '&': { height: '100%', fontSize: '13px' },
          '.cm-scroller': { fontFamily: 'var(--font-mono)' },
        }),
      ],
    })

    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // Initialize once — subsequent IR changes handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync IR → CodeMirror when the document changes externally (from UI actions)
  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    const newSource = serializeDocument(document)
    const currentSource = view.state.doc.toString()
    if (newSource === currentSource) return

    suppressRef.current = true
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: newSource },
    })
    suppressRef.current = false
  }, [document])

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Source (.qd)</span>
      </div>
      <div ref={containerRef} className={styles.editor} />
    </div>
  )
}
