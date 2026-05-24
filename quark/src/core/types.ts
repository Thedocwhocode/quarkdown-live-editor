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
  noteCount: number
}

export interface Attachment {
  id: string
  noteId: string
  kind: 'image' | 'pdf' | 'scan' | 'file'
  path: string
  mimeType: string
  ocrText: string | null
  createdAt: string
}

export type AppTheme = 'warm-paper' | 'red-graphite' | 'toothpaste' | 'solarized' | 'bear-dark'

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

export type ViewMode = 'edit' | 'split' | 'preview' | 'structured'

export interface ExportResult {
  outputPath: string
  format: string
}

// ─── Cloud sync ──────────────────────────────────────────────────────────────

/** Minimal note payload exchanged with the cloud sync API. */
export interface SyncNote {
  id: string
  title: string
  sourceQd: string
  status: string
  notebookId: string | null
  isPinned: boolean
  createdAt: string
  updatedAt: string
  syncVersion: number
}

/** Result returned by the `apply_pulled_notes` Rust command. */
export interface ApplyResult {
  applied: number
  skipped: number
}

/** Per-run summary returned to the UI after a sync cycle completes. */
export interface SyncResult {
  pushed: number
  pulled: number
  syncedAt: string
}

export type SyncPhase = 'idle' | 'pushing' | 'pulling' | 'error'
