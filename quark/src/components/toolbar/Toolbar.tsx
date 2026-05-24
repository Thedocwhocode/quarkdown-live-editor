import type { ViewMode } from '../../core/types'
import { useNotesStore } from '../../features/notes/store'
import css from './Toolbar.module.css'

const VIEW_MODES: { mode: ViewMode; label: string; title: string }[] = [
  { mode: 'edit',    label: '✏',  title: 'Edit mode' },
  { mode: 'split',   label: '⊟',  title: 'Split view' },
  { mode: 'preview', label: '👁', title: 'Preview mode' },
]

export function Toolbar() {
  const selectedNote  = useNotesStore(s => s.selectedNote())
  const viewMode      = useNotesStore(s => s.viewMode)
  const setViewMode   = useNotesStore(s => s.setViewMode)
  const compileNote   = useNotesStore(s => s.compileNote)
  const deleteNote    = useNotesStore(s => s.deleteNote)
  const pinNote       = useNotesStore(s => s.pinNote)
  const isCompiling   = useNotesStore(s => s.isCompiling)

  const handleCompile = () => {
    if (selectedNote) compileNote(selectedNote.id)
  }

  const handleDelete = () => {
    if (selectedNote && window.confirm(`Delete "${selectedNote.title}"?`)) {
      deleteNote(selectedNote.id)
    }
  }

  const handlePin = () => {
    if (selectedNote) pinNote(selectedNote.id, !selectedNote.isPinned)
  }

  return (
    <div className={css.toolbar}>
      <div className={css.left}>
        {selectedNote && (
          <span className={css.noteTitle}>
            {selectedNote.title || 'Untitled'}
          </span>
        )}
      </div>

      <div className={css.center}>
        <div className={css.viewToggle} role="group" aria-label="View mode">
          {VIEW_MODES.map(({ mode, label, title }) => (
            <button
              key={mode}
              className={css.viewBtn}
              data-active={viewMode === mode}
              onClick={() => setViewMode(mode)}
              title={title}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={css.right}>
        {selectedNote && (
          <>
            <button
              className={css.actionBtn}
              onClick={handleCompile}
              disabled={isCompiling}
              title="Compile note (⌘R)"
            >
              {isCompiling ? '…' : '⚡'}
            </button>
            <button
              className={css.actionBtn}
              onClick={handlePin}
              title={selectedNote.isPinned ? 'Unpin' : 'Pin'}
            >
              📌
            </button>
            <button
              className={`${css.actionBtn} ${css.danger}`}
              onClick={handleDelete}
              title="Delete note"
            >
              🗑
            </button>
          </>
        )}
      </div>
    </div>
  )
}
