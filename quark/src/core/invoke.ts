/**
 * Typed wrappers around `@tauri-apps/api/core.invoke`.
 *
 * All functions use snake_case command names (Rust convention) and return
 * camelCase data (serde_json handles the rename on the Rust side).
 */

import { invoke } from '@tauri-apps/api/core'
import type { Attachment, CompileResult, ExportResult, Note, Notebook, Tag, Template } from './types'

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
  update: (id: string, name: string, icon?: string, color?: string) =>
    invoke<Notebook>('update_notebook', { id, name, icon: icon ?? null, color: color ?? null }),
  delete: (id: string) => invoke<void>('delete_notebook', { id }),
}

export const compileApi = {
  compile: (id: string) => invoke<CompileResult>('compile_note', { id }),
}

export const templatesApi = {
  list: () => invoke<Template[]>('list_templates'),
}

export const tagsApi = {
  listAll: () => invoke<Tag[]>('list_all_tags'),
  getNoteTags: (noteId: string) => invoke<Tag[]>('get_note_tags', { noteId }),
  addToNote: (noteId: string, tagName: string) => invoke<Tag>('add_tag_to_note', { noteId, tagName }),
  removeFromNote: (noteId: string, tagId: string) => invoke<void>('remove_tag_from_note', { noteId, tagId }),
}

export const attachmentsApi = {
  list: (noteId: string) => invoke<Attachment[]>('list_attachments', { noteId }),
  add: (noteId: string, path: string, kind: string, mimeType: string) =>
    invoke<Attachment>('add_attachment', { noteId, path, kind, mimeType }),
  delete: (id: string) => invoke<void>('delete_attachment', { id }),
  setOcrText: (id: string, ocrText: string) => invoke<void>('set_ocr_text', { id, ocrText }),
}

export const exportApi = {
  toTxt: (id: string, outputPath: string) => invoke<ExportResult>('export_note_txt', { id, outputPath }),
}

export const settingsApi = {
  get: (key: string) => invoke<string | null>('get_setting', { key }),
  set: (key: string, value: string) => invoke<void>('set_setting', { key, value }),
}
