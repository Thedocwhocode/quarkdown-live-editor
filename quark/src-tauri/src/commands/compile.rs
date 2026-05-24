/// Quarkdown compilation command — spawns the CLI binary as a subprocess.
use chrono::Utc;
use rusqlite::params;
use serde::Serialize;
use std::path::Path;
use std::process::Command;
use tauri::State;

use crate::AppState;

/// Paths relative to the repository root (auto-detected at startup).
const BINARY_CANDIDATES: &[&str] = &[
    "build/install/quarkdown/bin/quarkdown",
    "../build/install/quarkdown/bin/quarkdown",
    "../../build/install/quarkdown/bin/quarkdown",
    "../../../build/install/quarkdown/bin/quarkdown",
];
const COMPILE_TIMEOUT_SECS: u64 = 30;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileResult {
    pub success: bool,
    pub html: Option<String>,
    pub error: Option<String>,
    pub warnings: Vec<String>,
}

/// Detect the Quarkdown binary by scanning known paths relative to CWD.
pub fn detect_binary() -> String {
    for candidate in BINARY_CANDIDATES {
        if Path::new(candidate).exists() {
            return candidate.to_string();
        }
    }
    "quarkdown".to_string() // fall back to PATH
}

#[tauri::command]
pub fn compile_note(
    state: State<'_, AppState>,
    id: String,
) -> Result<CompileResult, String> {
    // Fetch source from DB
    let source = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        db.query_row(
            "SELECT source_qd FROM notes WHERE id=?1",
            params![id],
            |row| row.get::<_, String>(0),
        )
        .map_err(|e| e.to_string())?
    };

    // Write to temp file
    let tmp = tempfile::tempdir().map_err(|e| e.to_string())?;
    let src_path = tmp.path().join("note.qd");
    std::fs::write(&src_path, &source).map_err(|e| e.to_string())?;

    // Run compiler
    let binary = &state.quarkdown_binary;
    let output = Command::new(binary)
        .args(["c", src_path.to_str().unwrap_or_default(), "--pipe"])
        .output();

    let now = Utc::now().to_rfc3339();

    match output {
        Ok(out) if out.status.success() => {
            let html = String::from_utf8_lossy(&out.stdout).into_owned();
            let warnings = parse_warnings(&String::from_utf8_lossy(&out.stderr));

            let db = state.db.lock().map_err(|e| e.to_string())?;
            db.execute(
                "UPDATE notes SET compiled_html=?1, status='compiled', \
                 last_compiled_at=?2, last_error=NULL, updated_at=?2 WHERE id=?3",
                params![html, now, id],
            )
            .map_err(|e| e.to_string())?;

            Ok(CompileResult { success: true, html: Some(html), error: None, warnings })
        }
        Ok(out) => {
            let error = String::from_utf8_lossy(&out.stderr).into_owned();
            let db = state.db.lock().map_err(|e| e.to_string())?;
            db.execute(
                "UPDATE notes SET status='error', last_error=?1, last_compiled_at=?2, updated_at=?2 WHERE id=?3",
                params![error, now, id],
            )
            .map_err(|e| e.to_string())?;
            Ok(CompileResult { success: false, html: None, error: Some(error), warnings: vec![] })
        }
        Err(e) => {
            let msg = if e.kind() == std::io::ErrorKind::NotFound {
                format!(
                    "Quarkdown binary not found ('{}').\nRun ./gradlew installDist from the repo root.",
                    binary
                )
            } else {
                e.to_string()
            };
            Ok(CompileResult { success: false, html: None, error: Some(msg), warnings: vec![] })
        }
    }
}

fn parse_warnings(stderr: &str) -> Vec<String> {
    stderr
        .lines()
        .filter(|l| l.to_uppercase().contains("WARNING"))
        .map(str::to_owned)
        .collect()
}
