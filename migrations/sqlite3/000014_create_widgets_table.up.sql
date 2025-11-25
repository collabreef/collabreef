CREATE TABLE `widgets` (
    `workspace_id` text,
    `id` text,
    `type` text,
    `config` text,
    `position` text,
    `created_at` text,
    `created_by` text,
    `updated_at` text,
    `updated_by` text,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_widgets_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE
);

CREATE INDEX `idx_widgets_workspace_id` ON `widgets`(`workspace_id`);
CREATE INDEX `idx_widgets_type` ON `widgets`(`type`);