import { create } from 'zustand'
import { compileApi, notesApi } from '../../core/invoke'
import { getPlatform, isMobilePlatform } from '../../utils/platform'
import { remoteCompile } from '../compile/remoteCompile'
import type { CompileResult, Note, ViewMode } from '../../core/types'

interface NotesState {
  notes: Note[]
  selectedNoteId: string | null
  viewMode: ViewMode
  isCompiling: boolean
  searchQuery: string

  // Selectors
  selectedNote: () => Note | null

  // Actions
  loadNotes: (notebookId?: string) => Promise<void>
  selectNote: (id: string | null) => void
  createNote: (title: string, sourceQd?: string, notebookId?: string) => Promise<Note>
  updateNote: (id: string, title: string, sourceQd: string) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  pinNote: (id: string, pinned: boolean) => Promise<void>
  compileNote: (id: string) => Promise<CompileResult>
  setViewMode: (mode: ViewMode) => void
  setSearchQuery: (q: string) => void
  search: (q: string) => Promise<void>
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  selectedNoteId: null,
  viewMode: 'edit',
  isCompiling: false,
  searchQuery: '',

  selectedNote: () => {
    const { notes, selectedNoteId } = get()
    return notes.find(n => n.id === selectedNoteId) ?? null
  },

  loadNotes: async (notebookId?: string) => {
    const notes = await notesApi.list(notebookId)
    set({ notes })
  },

  selectNote: (id) => {
    set({ selectedNoteId: id })
  },

  createNote: async (title, sourceQd, notebookId) => {
    const note = await notesApi.create(title, sourceQd, notebookId)
    set(s => ({ notes: [note, ...s.notes], selectedNoteId: note.id }))
    return note
  },

  updateNote: async (id, title, sourceQd) => {
    const updated = await notesApi.update(id, title, sourceQd)
    set(s => ({
      notes: s.notes.map(n => (n.id === id ? updated : n)),
    }))
  },

  deleteNote: async (id) => {
    await notesApi.delete(id)
    set(s => ({
      notes: s.notes.filter(n => n.id !== id),
      selectedNoteId: s.selectedNoteId === id ? null : s.selectedNoteId,
    }))
  },

  pinNote: async (id, pinned) => {
    await notesApi.pin(id, pinned)
    set(s => ({
      notes: s.notes.map(n => (n.id === id ? { ...n, isPinned: pinned } : n)),
    }))
  },

  compileNote: async (id) => {
    set({ isCompiling: true })
    try {
      const platform = await getPlatform()
      let result: CompileResult

      if (isMobilePlatform(platform)) {
        // On mobile the JVM CLI is unavailable — compile via remote HTTP endpoint
        const note = get().notes.find(n => n.id === id)
        result = note
          ? await remoteCompile(note.sourceQd)
          : { success: false, html: null, error: 'Note not found', warnings: [] }
      } else {
        result = await compileApi.compile(id)
      }

      if (result.success && result.html) {
        set(s => ({
          notes: s.notes.map(n =>
            n.id === id
              ? { ...n, compiledHtml: result.html, status: 'compiled', lastError: null }
              : n
          ),
        }))
      } else {
        set(s => ({
          notes: s.notes.map(n =>
            n.id === id ? { ...n, status: 'error', lastError: result.error } : n
          ),
        }))
      }
      return result
    } finally {
      set({ isCompiling: false })
    }
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  setSearchQuery: (q) => set({ searchQuery: q }),

  search: async (q) => {
    if (!q.trim()) {
      return get().loadNotes()
    }
    const notes = await notesApi.search(q)
    set({ notes })
  },
}))
