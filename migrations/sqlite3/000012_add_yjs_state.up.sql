-- Add Y.js state columns to views table
ALTER TABLE `views` ADD COLUMN `yjs_state` BLOB;
ALTER TABLE `views` ADD COLUMN `yjs_state_vector` BLOB;

-- Add Y.js state column to view_objects table
ALTER TABLE `view_objects` ADD COLUMN `yjs_state` BLOB;
