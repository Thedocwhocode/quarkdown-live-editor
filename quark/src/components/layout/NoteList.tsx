import { useEffect, useRef } from 'react'
import type { Note } from '../../core/types'
import { useNotesStore } from '../../features/notes/store'
import css from './NoteList.module.css'

export function NoteList() {
  const notes = useNotesStore(s => s.notes)
  const selectedNoteId = useNotesStore(s => s.selectedNoteId)
  const selectNote = useNotesStore(s => s.selectNote)
  const search = useNotesStore(s => s.search)
  const searchQuery = useNotesStore(s => s.searchQuery)
  const setSearchQuery = useNotesStore(s => s.setSearchQuery)
  const searchRef = useRef<ReturnType<typeof setTimeout>>()

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => search(q), 300)
  }

  return (
    <div className={css.list}>
      <div className={css.searchBar}>
        <input
          className={css.searchInput}
          type="search"
          placeholder="Search notes…"
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      <div className={css.notes}>
        {notes.length === 0 && (
          <p className={css.empty}>No notes yet.</p>
        )}
        {notes.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            active={note.id === selectedNoteId}
            onSelect={() => selectNote(note.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface NoteCardProps {
  note: Note
  active: boolean
  onSelect: () => void
}

function NoteCard({ note, active, onSelect }: NoteCardProps) {
  return (
    <button className={css.card} data-active={active} onClick={onSelect}>
      {note.isPinned && <span className={css.pin}>📌</span>}
      <span className={css.title}>{note.title || 'Untitled'}</span>
      {note.excerpt && <span className={css.excerpt}>{note.excerpt}</span>}
      <div className={css.meta}>
        <span className={css.date}>{formatDate(note.updatedAt)}</span>
        {note.status === 'error' && <span className={css.errorDot} title={note.lastError ?? ''} />}
        {note.status === 'compiled' && <span className={css.compiledDot} />}
      </div>
    </button>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
