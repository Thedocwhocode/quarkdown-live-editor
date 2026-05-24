# Quark Notes — Rust / Tauri Backend

This directory contains the Tauri 2 application shell: Rust commands, SQLite database layer, and app configuration.

## Key Files

| File | Purpose |
|---|---|
| `src/lib.rs` | App entry point — plugin registration, command registration, `AppState` setup |
| `src/db/schema.sql` | Full SQLite schema: `notes`, `notebooks`, `tags`, `note_tags`, `attachments`, `templates`, `settings` |
| `src/db/mod.rs` | `init(app_data_dir)` — opens DB, runs schema migrations |
| `src/commands/notes.rs` | CRUD: `list_notes`, `get_note`, `create_note`, `update_note`, `delete_note`, `pin_note`, `search_notes` |
| `src/commands/notebooks.rs` | Notebook CRUD |
| `src/commands/compile.rs` | `compile_note` — spawns Quarkdown CLI subprocess; `detect_binary()` finds the binary at startup |
| `src/commands/settings.rs` | `get_setting(key)` → `Option<String>`, `set_setting(key, value)` — key/value persistence |
| `src/commands/attachments.rs` | File attachment CRUD + OCR text storage |
| `src/commands/tags.rs` | Tag management per note |
| `src/commands/templates.rs` | Built-in template listing |
| `src/commands/export.rs` | `export_note_txt` — plain text export via file dialog |
| `tauri.conf.json` | App ID, window config, plugin permissions, mobile min versions |
| `Cargo.toml` | Dependencies: `rusqlite`, `tauri`, `serde`, `tauri-plugin-*` |

## Adding a New Command

```rust
// 1. In src/commands/mymodule.rs
#[tauri::command]
pub fn my_command(
    state: State<'_, AppState>,
    param: String,
) -> Result<MyReturnType, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    // ... rusqlite query ...
    Ok(result)
}
```

```rust
// 2. In src/commands/mod.rs — add:
pub mod mymodule;
```

```rust
// 3. In src/lib.rs invoke_handler — add:
commands::mymodule::my_command,
```

```typescript
// 4. In src/core/invoke.ts — add typed wrapper:
export const myApi = {
  doThing: (param: string) => invoke<MyReturnType>('my_command', { param }),
}
```

## Patterns

### Error handling
All commands return `Result<T, String>`. Chain with `.map_err(|e| e.to_string())?`:
```rust
let db = state.db.lock().map_err(|e| e.to_string())?;
let result = db.query_row(...).map_err(|e| e.to_string())?;
```

### DB access
```rust
let db = state.db.lock().map_err(|e| e.to_string())?;
db.execute("INSERT INTO ...", rusqlite::params![...])?;
```

### AppState
```rust
pub struct AppState {
    pub db: Mutex<Connection>,
    pub quarkdown_binary: String,  // absolute path or empty string
}
```
Injected into every command via `state: State<'_, AppState>`.

### Mobile compatibility
`compile_note` uses the binary path stored in `AppState.quarkdown_binary`. On mobile this will be an empty string — the frontend detects this via `getPlatform()` and calls `remoteCompile()` instead. Do not panic on missing binary; return a descriptive `Err` string.

### Schema changes
Add new `CREATE TABLE IF NOT EXISTS` or `ALTER TABLE` statements to `src/db/schema.sql`. The `init()` function runs the full schema on every startup — use `IF NOT EXISTS` and `IF NOT EXISTS` column checks to keep it idempotent.

## Conventions

- All command functions are `pub fn`, annotated `#[tauri::command]`
- Parameter names use `snake_case` (serde serializes to camelCase for the JS side automatically via `tauri::generate_handler!`)
- Never `unwrap()` in command handlers — always propagate with `?` or explicit `map_err`
- The `Mutex<Connection>` is single-writer; keep DB operations short to avoid blocking other commands
