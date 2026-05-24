/**
 * Structured-editor compile orchestrator.
 *
 * Replaces the HTTP adapter from the standalone editor with direct Tauri IPC.
 * Serializes the IR document, writes it to the current note via updateNote,
 * then triggers compilation via compile_note.
 *
 * Debounce timers are keyed by noteId so switching notes never leaks a
 * compile for the wrong note.
 */
import { serializeDocument } from '../../core/serializer/serialize'
import type { QdDocumentNode } from '../../core/ir/types'
import { compileApi, notesApi } from '../../core/invoke'
import { usePreviewStore } from './previewStore'

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()
let currentNoteId: string | null = null

const DEBOUNCE_MS = 400

/** Call once when a note is loaded into the structured editor. */
export function setCurrentNoteId(id: string) {
  currentNoteId = id
}

/**
 * Schedules a compile for the given document.
 * Debounces rapid changes and cancels superseded compiles.
 * Timer is keyed to currentNoteId to prevent cross-note leakage.
 */
export function scheduleCompile(doc: QdDocumentNode): void {
  const store = usePreviewStore.getState()
  store.setStale(true)

  if (!currentNoteId) return

  const noteId = currentNoteId
  const existing = debounceTimers.get(noteId)
  if (existing != null) clearTimeout(existing)

  const timer = setTimeout(() => {
    debounceTimers.delete(noteId)
    void runCompile(doc, noteId)
  }, DEBOUNCE_MS)

  debounceTimers.set(noteId, timer)
}

async function runCompile(doc: QdDocumentNode, noteId: string): Promise<void> {
  const store = usePreviewStore.getState()
  store.setCompiling(true)

  try {
    const source = serializeDocument(doc)

    const title = doc.meta.title?.trim() || 'Untitled'
    await notesApi.update(noteId, title, source)

    const result = await compileApi.compile(noteId)

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
