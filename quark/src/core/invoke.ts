/**
 * Typed wrappers around `@tauri-apps/api/core.invoke`.
 *
 * All functions use snake_case command names (Rust convention) and return
 * camelCase data (serde_json handles the rename on the Rust side).
 */

import { invoke } from '@tauri-apps/api/core'
import type { CompileResult, Note, Notebook, Template } from './types'

export const notesApi = {
  list: (notebookId?: string) =>
    invoke<Note[]>('list_notes', { notebookId: notebookId ?? null }),

  get: (id: string) =>
    invoke<Note>('get_note', { id }),

  create: (title: string, sourceQd?: string, notebookId?: string) =>
    invoke<Note>('create_note', { title, sourceQd: sourceQd ?? null, notebookId: notebookId ?? null }),

  update: (id: string, title: string, sourceQd: string) =>
    invoke<Note>('update_note', { id, title, sourceQd }),

  delete: (id: string) =>
    invoke<void>('delete_note', { id }),

  pin: (id: string, pinned: boolean) =>
    invoke<void>('pin_note', { id, pinned }),

  search: (query: string) =>
    invoke<Note[]>('search_notes', { query }),
}

export const notebooksApi = {
  list: () => invoke<Notebook[]>('list_notebooks'),
  create: (name: string, icon?: string, color?: string) =>
    invoke<Notebook>('create_notebook', { name, icon: icon ?? null, color: color ?? null }),
  delete: (id: string) => invoke<void>('delete_notebook', { id }),
}

export const compileApi = {
  compile: (id: string) => invoke<CompileResult>('compile_note', { id }),
}

export const templatesApi = {
  list: () => invoke<Template[]>('list_templates'),
}
