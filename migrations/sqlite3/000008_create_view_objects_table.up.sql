CREATE TABLE `view_objects` (
    `id` text,
    `view_id` text,
    `name` text,
    `type` text,
    `data` text,
    `created_at` text,
    `created_by` text,
    `updated_at` text,
    `updated_by` text,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_view_objects_view` FOREIGN KEY (`view_id`) REFERENCES `views`(`id`) ON DELETE CASCADE
);