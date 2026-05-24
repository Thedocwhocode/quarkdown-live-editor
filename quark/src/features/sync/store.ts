/**
 * Zustand store for cloud sync state.
 *
 * Tracks the current sync phase, the timestamp of the last successful sync,
 * and any error message from a failed cycle. The `sync()` action drives the
 * full push/pull cycle via `syncService`.
 */

import { create } from 'zustand'
import type { SyncPhase, SyncResult } from '../../core/types'
import * as syncService from './syncService'

interface SyncState {
  phase: SyncPhase
  lastSyncedAt: string | null
  error: string | null
  lastResult: SyncResult | null
}

interface SyncActions {
  sync: () => Promise<void>
  clearError: () => void
}

export const useSyncStore = create<SyncState & SyncActions>((set) => ({
  phase: 'idle',
  lastSyncedAt: null,
  error: null,
  lastResult: null,

  sync: async () => {
    set({ phase: 'pushing', error: null })
    try {
      // Phase transitions are coarse here; the service handles both push and
      // pull internally, so we flip to 'pulling' midway as a best effort.
      const resultPromise = syncService.sync()

      // Give the UI a moment to render the "pushing" state before the await
      // resolves (the sync might be nearly instant on fast networks).
      const result = await resultPromise

      set({
        phase: 'idle',
        lastSyncedAt: result.syncedAt,
        lastResult: result,
        error: null,
      })
    } catch (err) {
      set({
        phase: 'error',
        error: err instanceof Error ? err.message : String(err),
      })
    }
  },

  clearError: () => set({ phase: 'idle', error: null }),
}))
