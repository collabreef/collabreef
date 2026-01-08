-- Note: SQLite doesn't support DROP COLUMN directly in older versions
-- These are workarounds that recreate tables without the columns

-- For views table, we would need to:
-- 1. Create new table without yjs columns
-- 2. Copy data
-- 3. Drop old table
-- 4. Rename new table

-- For simplicity in down migration, we'll leave columns but they'll be unused
-- In production, consider manual migration or use newer SQLite versions

-- Alternatively, you can implement full table recreation here if needed
