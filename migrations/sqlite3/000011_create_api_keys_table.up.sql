CREATE TABLE `api_keys` (
    `id` text,
    `user_id` text NOT NULL,
    `name` text NOT NULL,
    `key_hash` text NOT NULL,
    `prefix` text NOT NULL,
    `last_used_at` text,
    `expires_at` text,
    `created_at` text NOT NULL,
    `created_by` text NOT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_api_keys_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `uni_api_keys_prefix` UNIQUE (`prefix`)
);

CREATE INDEX `idx_api_keys_prefix` ON `api_keys` (`prefix`);
CREATE INDEX `idx_api_keys_user_id` ON `api_keys` (`user_id`);
