import { create } from 'zustand'
import type { QdDiagnostic } from '../../core/ir/types'

interface StructuredPreviewState {
  html: string
  isCompiling: boolean
  isStale: boolean
  diagnostics: QdDiagnostic[]
  error: string | null

  setHtml(html: string): void
  setCompiling(v: boolean): void
  setStale(v: boolean): void
  setDiagnostics(d: QdDiagnostic[]): void
  setError(e: string | null): void
}

export const usePreviewStore = create<StructuredPreviewState>((set) => ({
  html: '',
  isCompiling: false,
  isStale: false,
  diagnostics: [],
  error: null,

  setHtml(html) { set({ html, isStale: false, error: null, diagnostics: [] }) },
  setCompiling(v) { set({ isCompiling: v }) },
  setStale(v) { set({ isStale: v }) },
  setDiagnostics(d) { set({ diagnostics: d }) },
  setError(e) { set({ error: e }) },
}))
