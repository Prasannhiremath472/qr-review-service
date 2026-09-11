-- Run this once in phpMyAdmin's "SQL" tab, on the empty database you created
-- for this app. This matches backend/prisma/migrations/20260910000000_init.
--
-- NOTE: If your backend's automatic `prisma migrate deploy` (via the
-- postinstall/prestart hooks already committed) already ran successfully,
-- these tables already exist and you do NOT need to run this manually.
-- Only use this as a fallback if that automatic step failed or you want to
-- pre-create the schema before the first deploy.

CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL DEFAULT '',
    `role` ENUM('ADMIN', 'SALESMAN', 'OWNER') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `shops` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `owner_name` VARCHAR(255) NOT NULL DEFAULT '',
    `business_type` VARCHAR(100) NOT NULL DEFAULT 'business',
    `city` VARCHAR(100) NOT NULL DEFAULT '',
    `review_url` TEXT NOT NULL,
    `organization_id` VARCHAR(36) NULL,
    `owner_user_id` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `shops_organization_id_idx`(`organization_id`),
    INDEX `shops_owner_user_id_idx`(`owner_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `qr_codes` (
    `id` VARCHAR(10) NOT NULL,
    `shop_id` VARCHAR(36) NULL,
    `label` VARCHAR(255) NOT NULL DEFAULT '',
    `scan_count` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `qr_codes_shop_id_idx`(`shop_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `feedback` (
    `id` VARCHAR(36) NOT NULL,
    `shop_id` VARCHAR(36) NOT NULL,
    `qr_code_id` VARCHAR(10) NULL,
    `rating` INTEGER NOT NULL,
    `message` VARCHAR(2000) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `feedback_shop_id_idx`(`shop_id`),
    INDEX `feedback_qr_code_id_idx`(`qr_code_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `shops` ADD CONSTRAINT `shops_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `qr_codes` ADD CONSTRAINT `qr_codes_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `feedback` ADD CONSTRAINT `feedback_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `feedback` ADD CONSTRAINT `feedback_qr_code_id_fkey` FOREIGN KEY (`qr_code_id`) REFERENCES `qr_codes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Prisma's own migration bookkeeping table, so that a later automatic
-- `prisma migrate deploy` recognizes this migration as already applied
-- and doesn't try to re-run it.
CREATE TABLE `_prisma_migrations` (
    `id` VARCHAR(36) NOT NULL,
    `checksum` VARCHAR(64) NOT NULL,
    `finished_at` DATETIME(3) NULL,
    `migration_name` VARCHAR(255) NOT NULL,
    `logs` TEXT NULL,
    `rolled_back_at` DATETIME(3) NULL,
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `applied_steps_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `_prisma_migrations`
    (`id`, `checksum`, `finished_at`, `migration_name`, `started_at`, `applied_steps_count`)
VALUES
    (UUID(), 'manual-phpmyadmin-apply', NOW(3), '20260910000000_init', NOW(3), 1);
