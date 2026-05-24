import { create } from 'zustand'
import { notebooksApi } from '../../core/invoke'
import type { Notebook } from '../../core/types'

interface NotebooksState {
  notebooks: Notebook[]
  selectedNotebookId: string | null

  loadNotebooks: () => Promise<void>
  selectNotebook: (id: string | null) => void
  createNotebook: (name: string, icon?: string, color?: string) => Promise<Notebook>
  deleteNotebook: (id: string) => Promise<void>
}

export const useNotebooksStore = create<NotebooksState>((set) => ({
  notebooks: [],
  selectedNotebookId: null,

  loadNotebooks: async () => {
    const notebooks = await notebooksApi.list()
    set({ notebooks })
  },

  selectNotebook: (id) => set({ selectedNotebookId: id }),

  createNotebook: async (name, icon, color) => {
    const nb = await notebooksApi.create(name, icon, color)
    set(s => ({ notebooks: [...s.notebooks, nb] }))
    return nb
  },

  deleteNotebook: async (id) => {
    await notebooksApi.delete(id)
    set(s => ({
      notebooks: s.notebooks.filter(n => n.id !== id),
      selectedNotebookId: s.selectedNotebookId === id ? null : s.selectedNotebookId,
    }))
  },
}))
