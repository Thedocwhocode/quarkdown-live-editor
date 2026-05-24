import type { Note } from '../../core/types'
import { useNotesStore } from '../../features/notes/store'
import css from './PreviewPane.module.css'

interface Props {
  note: Note | null
}

export function PreviewPane({ note }: Props) {
  const compileNote = useNotesStore(s => s.compileNote)
  const isCompiling = useNotesStore(s => s.isCompiling)

  const handleCompile = async () => {
    if (!note) return
    await compileNote(note.id)
  }

  if (!note) {
    return <div className={css.placeholder}>No note selected.</div>
  }

  if (note.status === 'error' && note.lastError) {
    return (
      <div className={css.error}>
        <p className={css.errorTitle}>Compilation error</p>
        <pre className={css.errorBody}>{note.lastError}</pre>
        <button className={css.recompileBtn} onClick={handleCompile} disabled={isCompiling}>
          {isCompiling ? 'Compiling…' : 'Try again'}
        </button>
      </div>
    )
  }

  if (!note.compiledHtml) {
    return (
      <div className={css.placeholder}>
        <p>No preview yet.</p>
        <button className={css.compileBtn} onClick={handleCompile} disabled={isCompiling}>
          {isCompiling ? 'Compiling…' : '⚡ Compile & Preview'}
        </button>
      </div>
    )
  }

  return (
    <div className={css.preview}>
      <div className={css.bar}>
        <button className={css.recompileBtn} onClick={handleCompile} disabled={isCompiling}>
          {isCompiling ? '…' : '↺'}
        </button>
      </div>
      <iframe
        className={css.iframe}
        srcDoc={note.compiledHtml}
        sandbox="allow-scripts allow-same-origin"
        title="Note preview"
      />
    </div>
  )
}
