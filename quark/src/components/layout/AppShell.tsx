import { NoteEditor } from '../editor/NoteEditor'
import { PreviewPane } from '../preview/PreviewPane'
import { Toolbar } from '../toolbar/Toolbar'
import { useNotesStore } from '../../features/notes/store'
import { NoteList } from './NoteList'
import { Sidebar } from './Sidebar'
import css from './AppShell.module.css'

export function AppShell() {
  const viewMode = useNotesStore(s => s.viewMode)
  const selectedNote = useNotesStore(s => s.selectedNote())

  return (
    <div className={css.shell}>
      <Sidebar />

      <div className={css.center}>
        <NoteList />

        <div className={css.main}>
          <Toolbar />

          <div className={css.workspace} data-view={viewMode}>
            {(viewMode === 'edit' || viewMode === 'split') && (
              <div className={css.editorPane}>
                {selectedNote ? (
                  <NoteEditor note={selectedNote} />
                ) : (
                  <Empty />
                )}
              </div>
            )}

            {(viewMode === 'preview' || viewMode === 'split') && (
              <div className={css.previewPane}>
                <PreviewPane note={selectedNote} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Empty() {
  return (
    <div className={css.empty}>
      <p>Select a note or create a new one.</p>
    </div>
  )
}
