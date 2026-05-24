/**
 * Structured-editor compile orchestrator.
 *
 * Replaces the HTTP adapter from the standalone editor with direct Tauri IPC.
 * Serializes the IR document, writes it to the current note via updateNote,
 * then triggers compilation via compile_note.
 */
import { serializeDocument } from '../../core/serializer/serialize'
import type { QdDocumentNode } from '../../core/ir/types'
import { compileApi, notesApi } from '../../core/invoke'
import { usePreviewStore } from './previewStore'

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let currentNoteId: string | null = null

const DEBOUNCE_MS = 400

/** Call once when a note is loaded into the structured editor. */
export function setCurrentNoteId(id: string) {
  currentNoteId = id
}

/**
 * Schedules a compile for the given document.
 * Debounces rapid changes and cancels superseded compiles.
 */
export function scheduleCompile(doc: QdDocumentNode): void {
  const store = usePreviewStore.getState()
  store.setStale(true)

  if (debounceTimer !== null) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => void runCompile(doc), DEBOUNCE_MS)
}

async function runCompile(doc: QdDocumentNode): Promise<void> {
  if (!currentNoteId) return

  const store = usePreviewStore.getState()
  store.setCompiling(true)

  try {
    const source = serializeDocument(doc)

    // Persist serialized source to SQLite via Tauri
    const title = doc.meta.title?.trim() || 'Untitled'
    await notesApi.update(currentNoteId, title, source)

    // Compile via Tauri (spawns Quarkdown CLI)
    const result = await compileApi.compile(currentNoteId)

    if (result.success && result.html) {
      store.setHtml(result.html)
      store.setDiagnostics([])
      store.setError(null)
    } else {
      store.setError(result.error ?? 'Compilation failed')
      store.setStale(true)
    }
  } catch (err) {
    store.setError(String(err))
    store.setStale(true)
  } finally {
    store.setCompiling(false)
  }
}
