-- Initial schema for Quark Notes.
-- All migrations are idempotent (CREATE TABLE IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS notebooks (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    icon        TEXT,
    color       TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
    id                TEXT PRIMARY KEY,
    title             TEXT NOT NULL DEFAULT 'Untitled',
    source_qd         TEXT NOT NULL DEFAULT '',
    compiled_html     TEXT,
    excerpt           TEXT,
    status            TEXT NOT NULL DEFAULT 'draft',
    notebook_id       TEXT REFERENCES notebooks(id) ON DELETE SET NULL,
    is_pinned         INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL,
    last_compiled_at  TEXT,
    last_error        TEXT
);

CREATE TABLE IF NOT EXISTS tags (
    id    TEXT PRIMARY KEY,
    name  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS note_tags (
    note_id  TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id   TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
);

CREATE TABLE IF NOT EXISTS attachments (
    id          TEXT PRIMARY KEY,
    note_id     TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    kind        TEXT NOT NULL,      -- image | pdf | scan | file
    path        TEXT NOT NULL,
    mime_type   TEXT NOT NULL DEFAULT '',
    ocr_text    TEXT,
    created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    key    TEXT PRIMARY KEY,
    value  TEXT NOT NULL
);

-- Indices for common access patterns
CREATE INDEX IF NOT EXISTS idx_notes_notebook  ON notes (notebook_id);
CREATE INDEX IF NOT EXISTS idx_notes_status    ON notes (status);
CREATE INDEX IF NOT EXISTS idx_notes_updated   ON notes (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_note_tags_note  ON note_tags (note_id);
CREATE INDEX IF NOT EXISTS idx_attachments_note ON attachments (note_id);
