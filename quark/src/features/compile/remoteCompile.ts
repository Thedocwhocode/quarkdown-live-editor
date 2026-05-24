/**
 * Remote compilation via Quark Cloud API.
 *
 * Used on Android / iOS where the JVM-based Quarkdown CLI cannot run locally.
 * The server URL is persisted in settings (key: "compileServerUrl").
 *
 * API contract (compatible with the editor's Express server.ts):
 *   POST <serverUrl>/api/compile
 *   Body: { source: string }
 *   200 → { html: string }
 *   4xx/5xx → { error: string }
 */

import type { CompileResult } from '../../core/types'
import { settingsApi } from '../../core/invoke'

export const DEFAULT_COMPILE_SERVER = 'https://cloud.quarkdown.com'

export async function getCompileServerUrl(): Promise<string> {
  const saved = await settingsApi.get('compileServerUrl').catch(() => null)
  return saved ?? DEFAULT_COMPILE_SERVER
}

export async function remoteCompile(source: string): Promise<CompileResult> {
  const serverUrl = await getCompileServerUrl()

  let res: Response
  try {
    res = await fetch(`${serverUrl}/api/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source }),
    })
  } catch (e) {
    return {
      success: false,
      html: null,
      error: `Cannot reach compile server at ${serverUrl}: ${String(e)}`,
      warnings: [],
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return {
      success: false,
      html: null,
      error: (body as { error?: string }).error ?? `HTTP ${res.status}`,
      warnings: [],
    }
  }

  const body = (await res.json()) as { html?: string; error?: string; warnings?: string[] }
  if (body.html) {
    return { success: true, html: body.html, error: null, warnings: body.warnings ?? [] }
  }
  return { success: false, html: null, error: body.error ?? 'Unknown error', warnings: [] }
}
