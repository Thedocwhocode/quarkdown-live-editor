/// SQLite initialisation and versioned migrations.
use rusqlite::Connection;
use std::path::Path;

/// Open (or create) the database and run all pending migrations.
pub fn init(app_data_dir: &Path) -> Result<Connection, rusqlite::Error> {
    let path = app_data_dir.join("quark.db");
    let conn = Connection::open(path)?;
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
    migrate(&conn)?;
    Ok(conn)
}

fn migrate(conn: &Connection) -> Result<(), rusqlite::Error> {
    // Baseline schema — idempotent, always applied.
    conn.execute_batch(include_str!("schema.sql"))?;

    // Versioned migrations. Each migration sets PRAGMA user_version = N at the end
    // so it is skipped on subsequent startups.
    let version: i32 =
        conn.query_row("PRAGMA user_version", [], |row| row.get(0))?;

    if version < 1 {
        conn.execute_batch(include_str!("migrations/001_sync.sql"))?;
    }

    Ok(())
}
