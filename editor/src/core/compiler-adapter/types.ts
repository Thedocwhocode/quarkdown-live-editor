import type { QdDiagnostic } from '../ir/types'

export interface CompilationRequest {
  source: string
  docType?: string
  /** AbortSignal to cancel in-flight requests. */
  signal?: AbortSignal
}

export interface CompilationResult {
  html: string
  diagnostics: QdDiagnostic[]
}

export interface CompilationError {
  error: string
  diagnostics: QdDiagnostic[]
}

export type CompilationOutcome =
  | ({ ok: true } & CompilationResult)
  | ({ ok: false } & CompilationError)

/** Abstraction over the compilation backend. */
export interface CompilerAdapter {
  compile(request: CompilationRequest): Promise<CompilationOutcome>
  /** Check whether the compiler backend is reachable. */
  healthCheck(): Promise<boolean>
}
