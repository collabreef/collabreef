CREATE TABLE `widgets` (
    `workspace_id` text,
    `id` text,
    `type` text,
    `config` text,
    `position` text,
    `parent_id` text,
    `created_at` text,
    `created_by` text,
    `updated_at` text,
    `updated_by` text,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_widgets_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_widgets_parent` FOREIGN KEY (`parent_id`) REFERENCES `widgets`(`id`) ON DELETE CASCADE
);

CREATE INDEX `idx_widgets_workspace_id` ON `widgets`(`workspace_id`);
CREATE INDEX `idx_widgets_type` ON `widgets`(`type`);
CREATE INDEX `idx_widgets_parent_id` ON `widgets`(`parent_id`);