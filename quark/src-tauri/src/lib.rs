/// Application entry point and Tauri setup.
use std::sync::Mutex;

use rusqlite::Connection;

pub mod commands;
pub mod db;

/// Shared application state injected into every Tauri command.
pub struct AppState {
    /// SQLite connection protected by a mutex (commands may run concurrently).
    pub db: Mutex<Connection>,
    /// Absolute path to the Quarkdown CLI binary, detected at startup.
    pub quarkdown_binary: String,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_data)?;

            let conn = db::init(&app_data).map_err(|e| e.to_string())?;
            let binary = commands::compile::detect_binary();

            app.manage(AppState {
                db: Mutex::new(conn),
                quarkdown_binary: binary,
            });
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::notes::list_notes,
            commands::notes::get_note,
            commands::notes::create_note,
            commands::notes::update_note,
            commands::notes::delete_note,
            commands::notes::pin_note,
            commands::notes::search_notes,
            commands::notebooks::list_notebooks,
            commands::notebooks::create_notebook,
            commands::notebooks::delete_notebook,
            commands::compile::compile_note,
            commands::templates::list_templates,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Quark");
}
