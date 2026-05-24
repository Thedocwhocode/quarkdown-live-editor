/**
 * Cloud sync service — pushes locally-dirty notes to the remote API and pulls
 * any updates made on other devices (last-write-wins via `updated_at`).
 *
 * The sync cycle is:
 *   1. Read credentials + server URL from SQLite settings.
 *   2. POST dirty notes to `/api/sync/push`.
 *   3. On success, mark those notes as synced in SQLite.
 *   4. GET pulled notes from `/api/sync/pull?since=<lastSyncAt>`.
 *   5. Apply them to SQLite (Rust handles conflict resolution).
 *   6. Persist the new `lastSyncAt` timestamp.
 */

import { settingsApi, syncApi } from '../../core/invoke'
import type { SyncResult } from '../../core/types'

const KEY_SERVER_URL = 'syncServerUrl'
const KEY_TOKEN = 'syncToken'
const KEY_LAST_AT = 'syncLastAt'

interface PushResponse {
  syncedAt: string
}

interface PullResponse {
  notes: Array<{
    id: string
    title: string
    source_qd: string
    status: string
    notebook_id: string | null
    is_pinned: boolean
    created_at: string
    updated_at: string
    sync_version: number
  }>
  syncedAt: string
}

/** Performs a full push + pull sync cycle and returns a summary. */
export async function sync(): Promise<SyncResult> {
  const [serverUrl, token, lastSyncAt] = await Promise.all([
    settingsApi.get(KEY_SERVER_URL),
    settingsApi.get(KEY_TOKEN),
    settingsApi.get(KEY_LAST_AT),
  ])

  if (!serverUrl) throw new Error('Sync server URL is not configured.')
  if (!token) throw new Error('Sync API token is not configured.')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  // ── Push dirty notes ────────────────────────────────────────────────────────
  const dirtyNotes = await syncApi.getDirtyNotes()
  let pushed = 0

  if (dirtyNotes.length > 0) {
    const pushRes = await fetch(`${serverUrl}/api/sync/push`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ notes: dirtyNotes }),
    })

    if (!pushRes.ok) {
      const text = await pushRes.text().catch(() => pushRes.statusText)
      throw new Error(`Push failed (${pushRes.status}): ${text}`)
    }

    const { syncedAt } = (await pushRes.json()) as PushResponse
    const ids = dirtyNotes.map((n) => n.id)
    await syncApi.markNotesSynced(ids, syncedAt)
    pushed = dirtyNotes.length
  }

  // ── Pull remote updates ─────────────────────────────────────────────────────
  const since = lastSyncAt ?? '1970-01-01T00:00:00Z'
  const pullUrl = `${serverUrl}/api/sync/pull?since=${encodeURIComponent(since)}`
  const pullRes = await fetch(pullUrl, { headers })

  if (!pullRes.ok) {
    const text = await pullRes.text().catch(() => pullRes.statusText)
    throw new Error(`Pull failed (${pullRes.status}): ${text}`)
  }

  const pullData = (await pullRes.json()) as PullResponse
  const syncedAt = pullData.syncedAt ?? new Date().toISOString()

  // Map snake_case API response to camelCase SyncNote
  const items = pullData.notes.map((n) => ({
    id: n.id,
    title: n.title,
    sourceQd: n.source_qd,
    status: n.status,
    notebookId: n.notebook_id,
    isPinned: n.is_pinned,
    createdAt: n.created_at,
    updatedAt: n.updated_at,
    syncVersion: n.sync_version,
  }))

  const { applied } = await syncApi.applyPulledNotes(items, syncedAt)

  await settingsApi.set(KEY_LAST_AT, syncedAt)

  return { pushed, pulled: applied, syncedAt }
}
