import { create } from 'zustand'
import type { QdDiagnostic } from '@/core/ir/types'

interface PreviewState {
  /** The last successfully compiled HTML. */
  html: string
  isCompiling: boolean
  /** True when the preview is out of date relative to the current source. */
  isStale: boolean
  diagnostics: QdDiagnostic[]
  error: string | null
  /** Whether the Quarkdown compile API is reachable. */
  backendAvailable: boolean

  setHtml(html: string): void
  setCompiling(v: boolean): void
  setStale(v: boolean): void
  setDiagnostics(d: QdDiagnostic[]): void
  setError(e: string | null): void
  setBackendAvailable(v: boolean): void
}

export const usePreviewStore = create<PreviewState>((set) => ({
  html: '',
  isCompiling: false,
  isStale: false,
  diagnostics: [],
  error: null,
  backendAvailable: true,

  setHtml(html) {
    set({ html, isStale: false, error: null, diagnostics: [] })
  },
  setCompiling(v) {
    set({ isCompiling: v })
  },
  setStale(v) {
    set({ isStale: v })
  },
  setDiagnostics(d) {
    set({ diagnostics: d })
  },
  setError(e) {
    set({ error: e })
  },
  setBackendAvailable(v) {
    set({ backendAvailable: v })
  },
}))
