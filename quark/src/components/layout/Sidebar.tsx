import { FilePlus2, FileText, Folder, FolderOpen, Tag, Plus, Settings } from 'lucide-react'
import { useNotebooksStore } from '../../features/notebooks/store'
import { useNotesStore } from '../../features/notes/store'
import { useTagsStore } from '../../features/tags/store'
import css from './Sidebar.module.css'

interface Props {
  onSettingsOpen: () => void
}

export function Sidebar({ onSettingsOpen }: Props) {
  const notebooks           = useNotebooksStore(s => s.notebooks)
  const selectedNotebookId  = useNotebooksStore(s => s.selectedNotebookId)
  const selectNotebook      = useNotebooksStore(s => s.selectNotebook)
  const createNotebook      = useNotebooksStore(s => s.createNotebook)
  const loadNotes           = useNotesStore(s => s.loadNotes)
  const createNote          = useNotesStore(s => s.createNote)
  const allTags             = useTagsStore(s => s.allTags)
  const selectedTagId       = useTagsStore(s => s.selectedTagId)
  const selectTag           = useTagsStore(s => s.selectTag)

  const handleSelectNotebook = (id: string | null) => {
    selectNotebook(id)
    loadNotes(id ?? undefined)
  }

  const handleNewNote = async () => {
    const title = window.prompt('Note title:') ?? 'Untitled'
    await createNote(title.trim() || 'Untitled', '', selectedNotebookId ?? undefined)
  }

  const handleNewNotebook = async () => {
    const name = window.prompt('Notebook name:')
    if (name?.trim()) await createNotebook(name.trim())
  }

  const handleSelectTag = (id: string) => {
    selectTag(id)
    loadNotes()
  }

  return (
    <aside className={css.sidebar}>
      <div className={css.header}>
        <span className={css.logo}>⬡ Quark</span>
        <button className={css.newNote} onClick={handleNewNote} title="New note (⌘N)">
          <FilePlus2 size={16} />
        </button>
      </div>

      <nav className={css.nav}>
        <button
          className={css.navItem}
          data-active={selectedNotebookId === null}
          onClick={() => handleSelectNotebook(null)}
        >
          <span className={css.navIcon}><FileText size={16} /></span>
          All Notes
        </button>

        <div className={css.section}>
          <span className={css.sectionLabel}>Notebooks</span>
          <button className={css.sectionAdd} onClick={handleNewNotebook} title="New notebook">
            <Plus size={16} />
          </button>
        </div>

        {notebooks.map(nb => (
          <button
            key={nb.id}
            className={css.navItem}
            data-active={nb.id === selectedNotebookId}
            onClick={() => handleSelectNotebook(nb.id)}
          >
            <span className={css.navIcon}>
              {nb.id === selectedNotebookId
                ? <FolderOpen size={16} />
                : <Folder size={16} />
              }
            </span>
            <span className={css.navName}>{nb.name}</span>
            <span className={css.navCount}>{nb.noteCount}</span>
          </button>
        ))}

        {allTags.length > 0 && (
          <>
            <div className={css.section}>
              <span className={css.sectionLabel}>
                <Tag size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Tags
              </span>
            </div>

            {allTags.slice(0, 10).map(tag => (
              <button
                key={tag.id}
                className={css.navItem}
                data-active={tag.id === selectedTagId}
                onClick={() => handleSelectTag(tag.id)}
              >
                <span className={css.navIcon}><Tag size={16} /></span>
                <span className={css.navName}>{tag.name}</span>
                <span className={css.navCount}>{tag.noteCount}</span>
              </button>
            ))}
          </>
        )}
      </nav>

      <div className={css.footer}>
        <button className={css.footerBtn} title="Settings" onClick={onSettingsOpen}>
          <Settings size={16} />
        </button>
      </div>
    </aside>
  )
}
