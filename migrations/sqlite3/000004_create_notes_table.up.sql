CREATE TABLE `notes` (
    `workspace_id` text,
    `id` text,
    `title` text,
    `content` text,
    `visibility` text,
    `created_at` text,
    `created_by` text,
    `updated_at` text,
    `updated_by` text,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_notes_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE
);