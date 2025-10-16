CREATE TABLE `gen_history` (
    `id` text,
    `workspace_id` text,
    `template_id` text,
    `request_prompt` text,
    `request_model` text,
    `request_modality` text,
    `request_image_urls` text,
    `response_content` text,
    `response_error` text,
    `created_at` text,
    `created_by` text,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_gen_history_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_gen_history_template` FOREIGN KEY (`template_id`) REFERENCES `gen_templates`(`id`) ON DELETE CASCADE
);
