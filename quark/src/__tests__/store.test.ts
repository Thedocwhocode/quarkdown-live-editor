import { beforeEach, describe, expect, it, vi } from 'vitest'
import { invoke } from '@tauri-apps/api/core'
import type { Note } from '../core/types'
import { useNotesStore } from '../features/notes/store'

const mockInvoke = vi.mocked(invoke)

const makeNote = (overrides?: Partial<Note>): Note => ({
  id: '1',
  title: 'Test Note',
  sourceQd: '# Test',
  compiledHtml: null,
  excerpt: 'Test',
  status: 'draft',
  notebookId: null,
  isPinned: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastCompiledAt: null,
  lastError: null,
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
  useNotesStore.setState({ notes: [], selectedNoteId: null, isCompiling: false })
})

describe('useNotesStore', () => {
  describe('loadNotes', () => {
    it('populates the notes array', async () => {
      const notes = [makeNote({ id: '1' }), makeNote({ id: '2' })]
      mockInvoke.mockResolvedValueOnce(notes)

      await useNotesStore.getState().loadNotes()

      expect(useNotesStore.getState().notes).toHaveLength(2)
    })
  })

  describe('createNote', () => {
    it('prepends the new note and selects it', async () => {
      const newNote = makeNote({ id: 'new' })
      mockInvoke.mockResolvedValueOnce(newNote)

      await useNotesStore.getState().createNote('New')

      const { notes, selectedNoteId } = useNotesStore.getState()
      expect(notes[0].id).toBe('new')
      expect(selectedNoteId).toBe('new')
    })
  })

  describe('deleteNote', () => {
    it('removes the note and clears selection', async () => {
      useNotesStore.setState({ notes: [makeNote({ id: '1' })], selectedNoteId: '1' })
      mockInvoke.mockResolvedValueOnce(undefined)

      await useNotesStore.getState().deleteNote('1')

      const { notes, selectedNoteId } = useNotesStore.getState()
      expect(notes).toHaveLength(0)
      expect(selectedNoteId).toBeNull()
    })
  })

  describe('compileNote — success', () => {
    it('updates note status to compiled', async () => {
      useNotesStore.setState({ notes: [makeNote({ id: '1' })] })
      mockInvoke.mockResolvedValueOnce({
        success: true, html: '<h1>Test</h1>', error: null, warnings: [],
      })

      await useNotesStore.getState().compileNote('1')

      const note = useNotesStore.getState().notes[0]
      expect(note.status).toBe('compiled')
      expect(note.compiledHtml).toBe('<h1>Test</h1>')
    })
  })

  describe('compileNote — failure', () => {
    it('marks note status as error', async () => {
      useNotesStore.setState({ notes: [makeNote({ id: '1' })] })
      mockInvoke.mockResolvedValueOnce({
        success: false, html: null, error: 'undefined function .bad', warnings: [],
      })

      await useNotesStore.getState().compileNote('1')

      const note = useNotesStore.getState().notes[0]
      expect(note.status).toBe('error')
      expect(note.lastError).toContain('undefined function')
    })
  })

  describe('selectedNote', () => {
    it('returns null when nothing selected', () => {
      expect(useNotesStore.getState().selectedNote()).toBeNull()
    })

    it('returns the selected note', () => {
      const n = makeNote({ id: '5' })
      useNotesStore.setState({ notes: [n], selectedNoteId: '5' })
      expect(useNotesStore.getState().selectedNote()?.id).toBe('5')
    })
  })
})
