/// Commands for managing file attachments linked to notes.
use chrono::Utc;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;

use crate::AppState;

/// A file attachment associated with a note.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Attachment {
    pub id: String,
    pub note_id: String,
    /// Attachment category: `image`, `pdf`, `scan`, or `file`.
    pub kind: String,
    /// Absolute path to the file on disk.
    pub path: String,
    pub mime_type: String,
    /// Optional OCR-extracted text content.
    pub ocr_text: Option<String>,
    pub created_at: String,
}

fn row_to_attachment(row: &rusqlite::Row) -> rusqlite::Result<Attachment> {
    Ok(Attachment {
        id: row.get(0)?,
        note_id: row.get(1)?,
        kind: row.get(2)?,
        path: row.get(3)?,
        mime_type: row.get(4)?,
        ocr_text: row.get(5)?,
        created_at: row.get(6)?,
    })
}

/// Returns all attachments for the given note, ordered by creation time.
#[tauri::command]
pub fn list_attachments(
    state: State<'_, AppState>,
    note_id: String,
) -> Result<Vec<Attachment>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare(
            "SELECT id, note_id, kind, path, mime_type, ocr_text, created_at \
             FROM attachments \
             WHERE note_id = ?1 \
             ORDER BY created_at ASC",
        )
        .map_err(|e| e.to_string())?;

    stmt.query_map(params![note_id], row_to_attachment)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

/// Inserts a new attachment record for a note and returns it.
#[tauri::command]
pub fn add_attachment(
    state: State<'_, AppState>,
    note_id: String,
    path: String,
    kind: String,
    mime_type: String,
) -> Result<Attachment, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    db.execute(
        "INSERT INTO attachments (id, note_id, kind, path, mime_type, created_at) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, note_id, kind, path, mime_type, now],
    )
    .map_err(|e| e.to_string())?;

    db.query_row(
        "SELECT id, note_id, kind, path, mime_type, ocr_text, created_at \
         FROM attachments WHERE id = ?1",
        params![id],
        row_to_attachment,
    )
    .map_err(|e| e.to_string())
}

/// Permanently removes an attachment record from the database.
///
/// This does not delete the referenced file from disk.
#[tauri::command]
pub fn delete_attachment(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute("DELETE FROM attachments WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Stores OCR-extracted text for an attachment.
#[tauri::command]
pub fn set_ocr_text(
    state: State<'_, AppState>,
    id: String,
    ocr_text: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute(
        "UPDATE attachments SET ocr_text = ?1 WHERE id = ?2",
        params![ocr_text, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
