import { useNotebooksStore } from '../../features/notebooks/store'
import { useNotesStore } from '../../features/notes/store'
import css from './Sidebar.module.css'

export function Sidebar() {
  const notebooks = useNotebooksStore(s => s.notebooks)
  const selectedNotebookId = useNotebooksStore(s => s.selectedNotebookId)
  const selectNotebook = useNotebooksStore(s => s.selectNotebook)
  const createNotebook = useNotebooksStore(s => s.createNotebook)
  const loadNotes = useNotesStore(s => s.loadNotes)
  const createNote = useNotesStore(s => s.createNote)

  const handleSelectNotebook = (id: string | null) => {
    selectNotebook(id)
    loadNotes(id ?? undefined)
  }

  const handleNewNote = async () => {
    await createNote('Untitled', '', selectedNotebookId ?? undefined)
  }

  const handleNewNotebook = async () => {
    const name = window.prompt('Notebook name:')
    if (name?.trim()) await createNotebook(name.trim())
  }

  return (
    <aside className={css.sidebar}>
      <div className={css.header}>
        <span className={css.logo}>⬡ Quark</span>
        <button className={css.newNote} onClick={handleNewNote} title="New note (⌘N)">
          +
        </button>
      </div>

      <nav className={css.nav}>
        <button
          className={css.navItem}
          data-active={selectedNotebookId === null}
          onClick={() => handleSelectNotebook(null)}
        >
          <span className={css.navIcon}>📝</span> All Notes
        </button>

        <div className={css.section}>
          <span className={css.sectionLabel}>Notebooks</span>
          <button className={css.sectionAdd} onClick={handleNewNotebook} title="New notebook">
            +
          </button>
        </div>

        {notebooks.map(nb => (
          <button
            key={nb.id}
            className={css.navItem}
            data-active={nb.id === selectedNotebookId}
            onClick={() => handleSelectNotebook(nb.id)}
          >
            <span className={css.navIcon}>{nb.icon ?? '📁'}</span>
            <span className={css.navName}>{nb.name}</span>
            <span className={css.navCount}>{nb.noteCount}</span>
          </button>
        ))}
      </nav>

      <div className={css.footer}>
        <button className={css.footerBtn} title="Settings">⚙</button>
      </div>
    </aside>
  )
}
