/// Commands for managing tags and the note–tag relationship.
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;

use crate::AppState;

/// A tag with the number of notes that reference it.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub note_count: i64,
}

/// Returns all tags ordered alphabetically, each annotated with its note count.
#[tauri::command]
pub fn list_all_tags(state: State<'_, AppState>) -> Result<Vec<Tag>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare(
            "SELECT t.id, t.name, COUNT(nt.note_id) AS note_count \
             FROM tags t \
             LEFT JOIN note_tags nt ON t.id = nt.tag_id \
             GROUP BY t.id \
             ORDER BY t.name ASC",
        )
        .map_err(|e| e.to_string())?;

    stmt.query_map([], |row| {
        Ok(Tag {
            id: row.get(0)?,
            name: row.get(1)?,
            note_count: row.get(2)?,
        })
    })
    .map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())
}

/// Returns all tags attached to the given note.
#[tauri::command]
pub fn get_note_tags(state: State<'_, AppState>, note_id: String) -> Result<Vec<Tag>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare(
            "SELECT t.id, t.name, COUNT(nt2.note_id) AS note_count \
             FROM tags t \
             JOIN note_tags nt ON t.id = nt.tag_id AND nt.note_id = ?1 \
             LEFT JOIN note_tags nt2 ON t.id = nt2.tag_id \
             GROUP BY t.id \
             ORDER BY t.name ASC",
        )
        .map_err(|e| e.to_string())?;

    stmt.query_map(params![note_id], |row| {
        Ok(Tag {
            id: row.get(0)?,
            name: row.get(1)?,
            note_count: row.get(2)?,
        })
    })
    .map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())
}

/// Attaches a tag (by name) to a note, creating the tag if it does not exist.
///
/// The tag name is normalized to lowercase and trimmed before insertion.
/// Returns the upserted tag with its global note count.
#[tauri::command]
pub fn add_tag_to_note(
    state: State<'_, AppState>,
    note_id: String,
    tag_name: String,
) -> Result<Tag, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let normalized = tag_name.trim().to_lowercase();

    // Upsert the tag, generating a new ID only on insertion.
    let new_id = Uuid::new_v4().to_string();
    db.execute(
        "INSERT INTO tags (id, name) VALUES (?1, ?2) ON CONFLICT(name) DO NOTHING",
        params![new_id, normalized],
    )
    .map_err(|e| e.to_string())?;

    // Retrieve the canonical tag row (whether newly inserted or pre-existing).
    let tag_id: String = db
        .query_row(
            "SELECT id FROM tags WHERE name = ?1",
            params![normalized],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // Link the tag to the note, ignoring duplicates.
    db.execute(
        "INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?1, ?2)",
        params![note_id, tag_id],
    )
    .map_err(|e| e.to_string())?;

    // Return the tag with its updated note count.
    db.query_row(
        "SELECT t.id, t.name, COUNT(nt.note_id) AS note_count \
         FROM tags t \
         LEFT JOIN note_tags nt ON t.id = nt.tag_id \
         WHERE t.id = ?1 \
         GROUP BY t.id",
        params![tag_id],
        |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                note_count: row.get(2)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

/// Removes a tag from a note. The tag record itself is preserved.
#[tauri::command]
pub fn remove_tag_from_note(
    state: State<'_, AppState>,
    note_id: String,
    tag_id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute(
        "DELETE FROM note_tags WHERE note_id = ?1 AND tag_id = ?2",
        params![note_id, tag_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
