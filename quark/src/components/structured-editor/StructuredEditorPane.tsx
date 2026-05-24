import { useEffect, useState } from 'react'
import type { Note } from '../../core/types'
import { loadNoteIntoEditor } from '../../features/structured-editor/bridge'
import { useDocumentStore, useBlocks } from '../../features/structured-editor/store'
import { usePreviewStore } from '../../features/structured-editor/previewStore'
import { scheduleCompile } from '../../features/structured-editor/orchestrator'
import { EditorSurface } from './EditorSurface'
import { BlockLibraryPanel } from './BlockLibraryPanel'
import { SelectionInspector } from './SelectionInspector'
import '../../styles/structured-editor-bridge.css'
import css from './StructuredEditorPane.module.css'

interface Props {
  note: Note
}

/**
 * Full structured (block-based) editor pane for a Quark note.
 * Parses the note's .qd source into IR on mount, then serializes back on
 * every block change via the Tauri orchestrator.
 */
export function StructuredEditorPane({ note }: Props) {
  const [sidebarTab, setSidebarTab] = useState<'library' | 'inspector'>('library')
  const document = useDocumentStore((s) => s.document)
  const blocks = useBlocks()
  const isCompiling = usePreviewStore((s) => s.isCompiling)
  const isStale = usePreviewStore((s) => s.isStale)
  const error = usePreviewStore((s) => s.error)

  // Load the note into the editor whenever the selected note changes
  useEffect(() => {
    loadNoteIntoEditor(note)
  }, [note.id])

  // Trigger compile whenever blocks change (after initial load)
  useEffect(() => {
    if (blocks.length > 0) scheduleCompile(document)
  }, [blocks])

  return (
    <div className={css.pane}>
      {/* Left: block library + inspector */}
      <aside className={css.sidebar}>
        <div className={css.sidebarTabs}>
          <button
            className={css.tab}
            data-active={sidebarTab === 'library'}
            onClick={() => setSidebarTab('library')}
          >
            Blocks
          </button>
          <button
            className={css.tab}
            data-active={sidebarTab === 'inspector'}
            onClick={() => setSidebarTab('inspector')}
          >
            Inspector
          </button>
        </div>
        <div className={css.sidebarContent}>
          {sidebarTab === 'library' ? <BlockLibraryPanel /> : <SelectionInspector />}
        </div>
      </aside>

      {/* Center: block surface */}
      <div className={css.surface}>
        <div className={css.statusBar}>
          {isCompiling && <span className={css.compiling}>Compiling…</span>}
          {isStale && !isCompiling && <span className={css.stale}>Unsaved changes</span>}
          {error && <span className={css.error} title={error}>Compile error</span>}
        </div>
        <EditorSurface />
      </div>
    </div>
  )
}
