ALTER TABLE notes RENAME COLUMN access_key TO lookup_id;
DROP INDEX IF EXISTS idx_notes_access_key;
CREATE INDEX IF NOT EXISTS idx_notes_lookup_id ON notes(lookup_id);