/// SQLite initialisation and migrations.
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
    conn.execute_batch(include_str!("schema.sql"))
}
