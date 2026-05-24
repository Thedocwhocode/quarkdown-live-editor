/** Core domain types shared between the frontend and Tauri commands. */

export type NoteStatus = 'draft' | 'compiled' | 'error' | 'archived'

export interface Note {
  id: string
  title: string
  sourceQd: string
  compiledHtml: string | null
  excerpt: string | null
  status: NoteStatus
  notebookId: string | null
  isPinned: boolean
  createdAt: string
  updatedAt: string
  lastCompiledAt: string | null
  lastError: string | null
}

export interface Notebook {
  id: string
  name: string
  icon: string | null
  color: string | null
  noteCount: number
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  name: string
}

export interface Template {
  id: string
  name: string
  category: string
  description: string
  sourceQdSeed: string
}

export interface CompileResult {
  success: boolean
  html: string | null
  error: string | null
  warnings: string[]
}

export interface ExportJob {
  id: string
  noteId: string
  format: 'txt' | 'pdf' | 'jpg' | 'docx'
  status: 'queued' | 'running' | 'done' | 'error'
  outputPath: string | null
  errorMessage: string | null
  createdAt: string
  finishedAt: string | null
}

export type ViewMode = 'edit' | 'split' | 'preview'
