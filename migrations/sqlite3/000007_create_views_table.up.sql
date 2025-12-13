CREATE TABLE `views` (
    `workspace_id` text,
    `id` text,
    `name` text,
    `type` text,
    `data` text,
    `visibility` text,
    `created_at` text,
    `created_by` text,
    `updated_at` text,
    `updated_by` text,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_views_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE
);