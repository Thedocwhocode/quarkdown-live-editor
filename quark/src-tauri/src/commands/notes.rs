/// CRUD commands for the `notes` table.
use chrono::Utc;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;

use crate::AppState;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Note {
    pub id: String,
    pub title: String,
    pub source_qd: String,
    pub compiled_html: Option<String>,
    pub excerpt: Option<String>,
    pub status: String,
    pub notebook_id: Option<String>,
    pub is_pinned: bool,
    pub created_at: String,
    pub updated_at: String,
    pub last_compiled_at: Option<String>,
    pub last_error: Option<String>,
}

fn row_to_note(row: &rusqlite::Row) -> rusqlite::Result<Note> {
    Ok(Note {
        id: row.get(0)?,
        title: row.get(1)?,
        source_qd: row.get(2)?,
        compiled_html: row.get(3)?,
        excerpt: row.get(4)?,
        status: row.get(5)?,
        notebook_id: row.get(6)?,
        is_pinned: row.get::<_, i64>(7)? != 0,
        created_at: row.get(8)?,
        updated_at: row.get(9)?,
        last_compiled_at: row.get(10)?,
        last_error: row.get(11)?,
    })
}

#[tauri::command]
pub fn list_notes(
    state: State<'_, AppState>,
    notebook_id: Option<String>,
) -> Result<Vec<Note>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let (sql, id_param) = match &notebook_id {
        Some(id) => (
            "SELECT id,title,source_qd,compiled_html,excerpt,status,notebook_id,\
             is_pinned,created_at,updated_at,last_compiled_at,last_error \
             FROM notes WHERE notebook_id=?1 AND status!='archived' \
             ORDER BY is_pinned DESC,updated_at DESC",
            Some(id.clone()),
        ),
        None => (
            "SELECT id,title,source_qd,compiled_html,excerpt,status,notebook_id,\
             is_pinned,created_at,updated_at,last_compiled_at,last_error \
             FROM notes WHERE status!='archived' \
             ORDER BY is_pinned DESC,updated_at DESC",
            None,
        ),
    };

    let mut stmt = db.prepare(sql).map_err(|e| e.to_string())?;
    let rows = if let Some(id) = id_param {
        stmt.query_map(params![id], row_to_note)
    } else {
        stmt.query_map([], row_to_note)
    }
    .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_note(state: State<'_, AppState>, id: String) -> Result<Note, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.query_row(
        "SELECT id,title,source_qd,compiled_html,excerpt,status,notebook_id,\
         is_pinned,created_at,updated_at,last_compiled_at,last_error \
         FROM notes WHERE id=?1",
        params![id],
        row_to_note,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_note(
    state: State<'_, AppState>,
    title: String,
    source_qd: Option<String>,
    notebook_id: Option<String>,
) -> Result<Note, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let src = source_qd.unwrap_or_default();
    let excerpt = first_line(&src);

    db.execute(
        "INSERT INTO notes (id,title,source_qd,excerpt,status,notebook_id,is_pinned,created_at,updated_at)
         VALUES (?1,?2,?3,?4,'draft',?5,0,?6,?6)",
        params![id, title, src, excerpt, notebook_id, now],
    )
    .map_err(|e| e.to_string())?;

    db.query_row(
        "SELECT id,title,source_qd,compiled_html,excerpt,status,notebook_id,\
         is_pinned,created_at,updated_at,last_compiled_at,last_error \
         FROM notes WHERE id=?1",
        params![id],
        row_to_note,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_note(
    state: State<'_, AppState>,
    id: String,
    title: String,
    source_qd: String,
) -> Result<Note, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();
    let excerpt = first_line(&source_qd);

    db.execute(
        "UPDATE notes SET title=?1,source_qd=?2,excerpt=?3,updated_at=?4 WHERE id=?5",
        params![title, source_qd, excerpt, now, id],
    )
    .map_err(|e| e.to_string())?;

    db.query_row(
        "SELECT id,title,source_qd,compiled_html,excerpt,status,notebook_id,\
         is_pinned,created_at,updated_at,last_compiled_at,last_error \
         FROM notes WHERE id=?1",
        params![id],
        row_to_note,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_note(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute("UPDATE notes SET status='archived' WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn pin_note(state: State<'_, AppState>, id: String, pinned: bool) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute(
        "UPDATE notes SET is_pinned=?1 WHERE id=?2",
        params![if pinned { 1i64 } else { 0i64 }, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn search_notes(state: State<'_, AppState>, query: String) -> Result<Vec<Note>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let pattern = format!("%{}%", query.replace('%', "\\%").replace('_', "\\_"));
    let mut stmt = db
        .prepare(
            "SELECT id,title,source_qd,compiled_html,excerpt,status,notebook_id,\
             is_pinned,created_at,updated_at,last_compiled_at,last_error \
             FROM notes WHERE status!='archived' \
             AND (title LIKE ?1 ESCAPE '\\' OR source_qd LIKE ?1 ESCAPE '\\') \
             ORDER BY updated_at DESC LIMIT 100",
        )
        .map_err(|e| e.to_string())?;

    stmt.query_map(params![pattern], row_to_note)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

fn first_line(source: &str) -> Option<String> {
    source
        .lines()
        .find(|l| !l.trim().is_empty())
        .map(|l| l.trim_start_matches('#').trim().chars().take(120).collect())
}
