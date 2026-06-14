ALTER TABLE notes ADD COLUMN expires_at TEXT;
ALTER TABLE notes ADD COLUMN read_at TEXT;

CREATE INDEX IF NOT EXISTS idx_notes_expires_at ON notes(expires_at);