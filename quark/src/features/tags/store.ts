import { create } from 'zustand'
import { tagsApi } from '../../core/invoke'
import type { Tag } from '../../core/types'

interface TagsState {
  /** Flat list of every tag in the database, with up-to-date note counts. */
  allTags: Tag[]
  /** Per-note tag cache: maps noteId to the tags attached to that note. */
  noteTags: Record<string, Tag[]>
  /** The tag currently selected for filtering the note list, or null for no filter. */
  selectedTagId: string | null

  loadAllTags: () => Promise<void>
  loadNoteTags: (noteId: string) => Promise<void>
  addTagToNote: (noteId: string, tagName: string) => Promise<void>
  removeTagFromNote: (noteId: string, tagId: string) => Promise<void>
  selectTag: (tagId: string | null) => void
}

export const useTagsStore = create<TagsState>((set, get) => ({
  allTags: [],
  noteTags: {},
  selectedTagId: null,

  loadAllTags: async () => {
    const allTags = await tagsApi.listAll()
    set({ allTags })
  },

  loadNoteTags: async (noteId) => {
    const tags = await tagsApi.getNoteTags(noteId)
    set(s => ({ noteTags: { ...s.noteTags, [noteId]: tags } }))
  },

  addTagToNote: async (noteId, tagName) => {
    const tag = await tagsApi.addToNote(noteId, tagName)
    set(s => ({
      noteTags: { ...s.noteTags, [noteId]: [...(s.noteTags[noteId] ?? []), tag] },
    }))
    // Refresh global list so note counts stay accurate.
    await get().loadAllTags()
  },

  removeTagFromNote: async (noteId, tagId) => {
    await tagsApi.removeFromNote(noteId, tagId)
    set(s => ({
      noteTags: {
        ...s.noteTags,
        [noteId]: (s.noteTags[noteId] ?? []).filter(t => t.id !== tagId),
      },
    }))
  },

  selectTag: (tagId) => set({ selectedTagId: tagId }),
}))
