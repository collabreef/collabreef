-- Remove Y.js state columns from views table
ALTER TABLE views DROP COLUMN IF EXISTS yjs_state;
ALTER TABLE views DROP COLUMN IF EXISTS yjs_state_vector;

-- Remove Y.js state column from view_objects table
ALTER TABLE view_objects DROP COLUMN IF EXISTS yjs_state;
