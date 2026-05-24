/// Tauri commands for cloud-sync bookkeeping.
///
/// The actual HTTP communication happens in TypeScript (`features/sync/`).
/// These Rust commands expose:
///   - Reading dirty (locally-changed) items that need to be pushed.
///   - Marking items as synced after a successful push.
///   - Applying items pulled from the cloud (last-write-wins on `updated_at`).
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::AppState;

// ─── Payload types ────────────────────────────────────────────────────────────

/// Minimal envelope sent to / received from the cloud sync API.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncNote {
    pub id: String,
    pub title: String,
    pub source_qd: String,
    pub status: String,
    pub notebook_id: Option<String>,
    pub is_pinned: bool,
    pub created_at: String,
    pub updated_at: String,
    pub sync_version: i64,
}

/// Result returned to the frontend after applying pulled items.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyResult {
    pub applied: usize,
    pub skipped: usize,
}

// ─── Commands ─────────────────────────────────────────────────────────────────

/// Returns all notes with `is_dirty = 1` (changed locally since last sync).
#[tauri::command]
pub fn get_dirty_notes(state: State<'_, AppState>) -> Result<Vec<SyncNote>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db.prepare(
        "SELECT id, title, source_qd, status, notebook_id, is_pinned,
                created_at, updated_at, sync_version
         FROM   notes
         WHERE  is_dirty = 1
         ORDER BY updated_at DESC",
    ).map_err(|e| e.to_string())?;

    let notes = stmt
        .query_map([], |row| {
            Ok(SyncNote {
                id:           row.get(0)?,
                title:        row.get(1)?,
                source_qd:    row.get(2)?,
                status:       row.get(3)?,
                notebook_id:  row.get(4)?,
                is_pinned:    row.get::<_, i32>(5)? != 0,
                created_at:   row.get(6)?,
                updated_at:   row.get(7)?,
                sync_version: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(notes)
}

/// Marks a list of note IDs as synced (`is_dirty = 0`, `synced_at = now`).
/// Called after a successful push to the cloud.
#[tauri::command]
pub fn mark_notes_synced(
    state: State<'_, AppState>,
    ids: Vec<String>,
    synced_at: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    for id in &ids {
        db.execute(
            "UPDATE notes
             SET    is_dirty  = 0,
                    synced_at = ?1
             WHERE  id = ?2",
            params![synced_at, id],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Applies notes pulled from the cloud.
/// Uses last-write-wins: the cloud version is stored only if its
/// `updated_at` is newer than the local copy.
#[tauri::command]
pub fn apply_pulled_notes(
    state: State<'_, AppState>,
    items: Vec<SyncNote>,
    synced_at: String,
) -> Result<ApplyResult, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut applied = 0usize;
    let mut skipped = 0usize;

    for item in &items {
        // Check whether the local copy is newer; if so, keep the local version.
        let local_updated: Option<String> = db
            .query_row(
                "SELECT updated_at FROM notes WHERE id = ?1",
                params![item.id],
                |row| row.get(0),
            )
            .ok();

        let should_apply = match &local_updated {
            None => true,                          // not present locally → insert
            Some(local) => item.updated_at > *local, // cloud is newer → overwrite
        };

        if should_apply {
            let excerpt: String = item
                .source_qd
                .lines()
                .find(|l| !l.trim().is_empty())
                .map(|l| l.trim_start_matches('#').trim())
                .unwrap_or("")
                .chars()
                .take(120)
                .collect();

            db.execute(
                "INSERT INTO notes
                     (id, title, source_qd, excerpt, status, notebook_id, is_pinned,
                      created_at, updated_at, sync_version, is_dirty, synced_at)
                 VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,0,?11)
                 ON CONFLICT(id) DO UPDATE SET
                     title        = excluded.title,
                     source_qd    = excluded.source_qd,
                     excerpt      = excluded.excerpt,
                     status       = excluded.status,
                     notebook_id  = excluded.notebook_id,
                     is_pinned    = excluded.is_pinned,
                     updated_at   = excluded.updated_at,
                     sync_version = excluded.sync_version,
                     is_dirty     = 0,
                     synced_at    = excluded.synced_at
                 WHERE excluded.updated_at > notes.updated_at",
                params![
                    item.id,
                    item.title,
                    item.source_qd,
                    excerpt,
                    item.status,
                    item.notebook_id,
                    item.is_pinned as i32,
                    item.created_at,
                    item.updated_at,
                    item.sync_version,
                    synced_at,
                ],
            )
            .map_err(|e| e.to_string())?;

            applied += 1;
        } else {
            skipped += 1;
        }
    }

    Ok(ApplyResult { applied, skipped })
}
