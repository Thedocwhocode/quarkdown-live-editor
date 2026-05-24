import { HttpCompilerAdapter } from '@/core/compiler-adapter/http'
import { serializeDocument } from '@/core/serializer/serialize'
import type { QdDocumentNode } from '@/core/ir/types'
import { usePreviewStore } from './store'

const adapter = new HttpCompilerAdapter()
let pendingController: AbortController | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

/** Debounce delay in milliseconds before triggering compilation. */
const DEBOUNCE_MS = 400

/**
 * Schedules a compilation of the given document.
 * Cancels any in-flight request and resets the debounce timer.
 */
export function scheduleCompile(doc: QdDocumentNode): void {
  const store = usePreviewStore.getState()

  // Mark preview as stale immediately so the user gets instant feedback
  store.setStale(true)

  if (debounceTimer !== null) clearTimeout(debounceTimer)

  debounceTimer = setTimeout(() => {
    void runCompile(doc)
  }, DEBOUNCE_MS)
}

async function runCompile(doc: QdDocumentNode): Promise<void> {
  // Cancel any existing in-flight request
  if (pendingController) pendingController.abort()
  pendingController = new AbortController()

  const store = usePreviewStore.getState()
  store.setCompiling(true)

  const source = serializeDocument(doc)
  const result = await adapter.compile({
    source,
    docType: doc.meta.docType,
    signal: pendingController.signal,
  })

  if (result.ok) {
    store.setHtml(result.html)
    store.setDiagnostics(result.diagnostics)
    store.setError(null)
  } else {
    store.setDiagnostics(result.diagnostics)
    store.setError(result.error)
  }

  store.setCompiling(false)
}

/** Runs the health check once on startup. */
export async function checkBackendHealth(): Promise<void> {
  const available = await adapter.healthCheck()
  usePreviewStore.getState().setBackendAvailable(available)
}
