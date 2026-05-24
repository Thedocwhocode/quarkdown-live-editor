import { useEffect } from 'react'
import { AppShell } from './components/layout/AppShell'
import { useNotebooksStore } from './features/notebooks/store'
import { useNotesStore } from './features/notes/store'
import { useTagsStore } from './features/tags/store'

export default function App() {
  const loadNotes     = useNotesStore(s => s.loadNotes)
  const loadNotebooks = useNotebooksStore(s => s.loadNotebooks)
  const loadAllTags   = useTagsStore(s => s.loadAllTags)

  useEffect(() => {
    loadNotebooks()
    loadNotes()
    loadAllTags()
  }, [loadNotebooks, loadNotes, loadAllTags])

  return <AppShell />
}
