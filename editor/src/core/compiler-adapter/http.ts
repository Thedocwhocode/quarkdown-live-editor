import type {
  CompilationOutcome,
  CompilationRequest,
  CompilerAdapter,
} from './types'
import type { QdDiagnostic } from '../ir/types'

interface ApiDiagnostic {
  severity: 'error' | 'warning'
  message: string
  humanMessage: string
}

interface ApiCompileResponse {
  html?: string
  error?: string
  diagnostics?: ApiDiagnostic[]
}

function mapDiagnostics(raw: ApiDiagnostic[] | undefined): QdDiagnostic[] {
  return (raw ?? []).map((d) => ({
    severity: d.severity,
    message: d.message,
    humanMessage: d.humanMessage,
  }))
}

/**
 * Compiler adapter that delegates to the local Express API server at `/api/compile`.
 * The server spawns the Quarkdown CLI as a subprocess.
 */
export class HttpCompilerAdapter implements CompilerAdapter {
  async compile(request: CompilationRequest): Promise<CompilationOutcome> {
    let response: Response

    try {
      response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: request.source,
          docType: request.docType ?? 'plain',
        }),
        signal: request.signal,
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return {
          ok: false,
          error: 'Compilation cancelled.',
          diagnostics: [],
        }
      }
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Network error reaching compile API.',
        diagnostics: [],
      }
    }

    const body = (await response.json()) as ApiCompileResponse

    if (!response.ok || body.error) {
      return {
        ok: false,
        error: body.error ?? 'Compilation failed.',
        diagnostics: mapDiagnostics(body.diagnostics),
      }
    }

    return {
      ok: true,
      html: body.html ?? '',
      diagnostics: mapDiagnostics(body.diagnostics),
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch('/api/health')
      return res.ok
    } catch {
      return false
    }
  }
}
