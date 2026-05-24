-- Migration 001: cloud-sync metadata on notes and notebooks.
-- Applied once via user_version pragma; never re-run.

ALTER TABLE notes ADD COLUMN sync_version  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE notes ADD COLUMN is_dirty      INTEGER NOT NULL DEFAULT 1;
ALTER TABLE notes ADD COLUMN synced_at     TEXT;

ALTER TABLE notebooks ADD COLUMN sync_version  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE notebooks ADD COLUMN is_dirty      INTEGER NOT NULL DEFAULT 1;
ALTER TABLE notebooks ADD COLUMN synced_at     TEXT;

CREATE INDEX IF NOT EXISTS idx_notes_dirty     ON notes     (is_dirty);
CREATE INDEX IF NOT EXISTS idx_notebooks_dirty ON notebooks (is_dirty);

PRAGMA user_version = 1;
