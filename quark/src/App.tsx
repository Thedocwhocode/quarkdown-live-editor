import { useEffect } from 'react'
import { AppShell } from './components/layout/AppShell'
import { useNotebooksStore } from './features/notebooks/store'
import { useNotesStore } from './features/notes/store'

export default function App() {
  const loadNotes = useNotesStore(s => s.loadNotes)
  const loadNotebooks = useNotebooksStore(s => s.loadNotebooks)

  useEffect(() => {
    loadNotebooks()
    loadNotes()
  }, [loadNotebooks, loadNotes])

  return <AppShell />
}
