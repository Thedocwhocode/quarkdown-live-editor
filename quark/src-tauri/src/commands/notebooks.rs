/// CRUD commands for the `notebooks` table.
use chrono::Utc;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;

use crate::AppState;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Notebook {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub note_count: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[tauri::command]
pub fn list_notebooks(state: State<'_, AppState>) -> Result<Vec<Notebook>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare(
            "SELECT n.id, n.name, n.icon, n.color, \
             COUNT(notes.id) AS note_count, \
             n.created_at, n.updated_at \
             FROM notebooks n \
             LEFT JOIN notes ON notes.notebook_id = n.id AND notes.status != 'archived' \
             GROUP BY n.id ORDER BY n.name ASC",
        )
        .map_err(|e| e.to_string())?;

    stmt.query_map([], |row| {
        Ok(Notebook {
            id: row.get(0)?,
            name: row.get(1)?,
            icon: row.get(2)?,
            color: row.get(3)?,
            note_count: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })
    .map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_notebook(
    state: State<'_, AppState>,
    name: String,
    icon: Option<String>,
    color: Option<String>,
) -> Result<Notebook, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    db.execute(
        "INSERT INTO notebooks (id,name,icon,color,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?5)",
        params![id, name, icon, color, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(Notebook {
        id,
        name,
        icon,
        color,
        note_count: 0,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn delete_notebook(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    // Unassign notes before deleting
    db.execute("UPDATE notes SET notebook_id=NULL WHERE notebook_id=?1", params![id])
        .map_err(|e| e.to_string())?;
    db.execute("DELETE FROM notebooks WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Updates a notebook's metadata and returns the refreshed record with its note count.
#[tauri::command]
pub fn update_notebook(
    state: State<'_, AppState>,
    id: String,
    name: String,
    icon: Option<String>,
    color: Option<String>,
) -> Result<Notebook, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    db.execute(
        "UPDATE notebooks SET name=?1, icon=?2, color=?3, updated_at=?4 WHERE id=?5",
        params![name, icon, color, now, id],
    )
    .map_err(|e| e.to_string())?;

    db.query_row(
        "SELECT n.id, n.name, n.icon, n.color, \
         COUNT(notes.id) AS note_count, \
         n.created_at, n.updated_at \
         FROM notebooks n \
         LEFT JOIN notes ON notes.notebook_id = n.id AND notes.status != 'archived' \
         WHERE n.id = ?1 \
         GROUP BY n.id",
        params![id],
        |row| {
            Ok(Notebook {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
                color: row.get(3)?,
                note_count: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}
