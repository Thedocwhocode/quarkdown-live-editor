import {
  PenLine,
  Columns2,
  Eye,
  Zap,
  Loader2,
  Pin,
  PinOff,
  Trash2,
  LayoutTemplate,
  Download,
  Paperclip,
} from 'lucide-react'
import type { ViewMode } from '../../core/types'
import { useNotesStore } from '../../features/notes/store'
import css from './Toolbar.module.css'

interface Props {
  onTemplateOpen: () => void
  onExportOpen:   () => void
  onAttachOpen:   () => void
}

const VIEW_MODES: { mode: ViewMode; icon: React.ReactNode; title: string }[] = [
  { mode: 'edit',    icon: <PenLine  size={16} strokeWidth={1.8} />, title: 'Edit mode' },
  { mode: 'split',   icon: <Columns2 size={16} strokeWidth={1.8} />, title: 'Split view' },
  { mode: 'preview', icon: <Eye      size={16} strokeWidth={1.8} />, title: 'Preview mode' },
]

export function Toolbar({ onTemplateOpen, onExportOpen, onAttachOpen }: Props) {
  const selectedNote = useNotesStore(s => s.selectedNote())
  const viewMode     = useNotesStore(s => s.viewMode)
  const setViewMode  = useNotesStore(s => s.setViewMode)
  const compileNote  = useNotesStore(s => s.compileNote)
  const deleteNote   = useNotesStore(s => s.deleteNote)
  const pinNote      = useNotesStore(s => s.pinNote)
  const isCompiling  = useNotesStore(s => s.isCompiling)

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
          {VIEW_MODES.map(({ mode, icon, title }) => (
            <button
              key={mode}
              className={css.viewBtn}
              data-active={viewMode === mode}
              onClick={() => setViewMode(mode)}
              title={title}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div className={css.right}>
        {selectedNote && (
          <>
            <button
              className={css.actionBtn}
              onClick={onTemplateOpen}
              title="Templates"
            >
              <LayoutTemplate size={16} strokeWidth={1.8} />
            </button>
            <button
              className={css.actionBtn}
              onClick={onExportOpen}
              title="Export note"
            >
              <Download size={16} strokeWidth={1.8} />
            </button>
            <button
              className={css.actionBtn}
              onClick={onAttachOpen}
              title="Attachments"
            >
              <Paperclip size={16} strokeWidth={1.8} />
            </button>
            <button
              className={css.actionBtn}
              onClick={handleCompile}
              disabled={isCompiling}
              title="Compile note (⌘R)"
            >
              {isCompiling
                ? <Loader2 size={16} strokeWidth={1.8} className={css.spinning} />
                : <Zap      size={16} strokeWidth={1.8} />
              }
            </button>
            <button
              className={css.actionBtn}
              onClick={handlePin}
              title={selectedNote.isPinned ? 'Unpin' : 'Pin'}
            >
              {selectedNote.isPinned
                ? <PinOff size={16} strokeWidth={1.8} />
                : <Pin    size={16} strokeWidth={1.8} />
              }
            </button>
            <button
              className={`${css.actionBtn} ${css.danger}`}
              onClick={handleDelete}
              title="Delete note"
            >
              <Trash2 size={16} strokeWidth={1.8} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
