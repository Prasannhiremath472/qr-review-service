-- Run this once in phpMyAdmin's "SQL" tab (or via `npm run db:migrate`) on
-- your app's MySQL database. Safe to re-run — every statement is idempotent.

CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL DEFAULT '',
    `role` ENUM('ADMIN', 'SALESMAN', 'OWNER') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `shops` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `owner_name` VARCHAR(255) NOT NULL DEFAULT '',
    `business_type` VARCHAR(100) NOT NULL DEFAULT 'business',
    `city` VARCHAR(100) NOT NULL DEFAULT '',
    `review_url` TEXT NOT NULL,
    `organization_id` VARCHAR(36) NULL,
    `owner_user_id` VARCHAR(36) NULL,
    `photo_url` MEDIUMTEXT NULL,
    `logo_url` MEDIUMTEXT NULL,
    `gallery_photos` MEDIUMTEXT NULL,
    `about_us` TEXT NULL,
    `open_hours` VARCHAR(500) NOT NULL DEFAULT '',
    `whatsapp_number` VARCHAR(30) NOT NULL DEFAULT '',
    `contact_phone` VARCHAR(30) NOT NULL DEFAULT '',
    `contact_email` VARCHAR(255) NOT NULL DEFAULT '',
    `address` VARCHAR(500) NOT NULL DEFAULT '',
    `review_views` INTEGER NOT NULL DEFAULT 0,
    `subscription_start_date` DATE NULL,
    `subscription_end_date` DATE NULL,
    `subscription_status` ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `shops_organization_id_idx`(`organization_id`),
    INDEX `shops_owner_user_id_idx`(`owner_user_id`),
    PRIMARY KEY (`id`),
    CONSTRAINT `shops_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `qr_codes` (
    `id` VARCHAR(10) NOT NULL,
    `shop_id` VARCHAR(36) NULL,
    `label` VARCHAR(255) NOT NULL DEFAULT '',
    `scan_count` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `qr_codes_shop_id_idx`(`shop_id`),
    PRIMARY KEY (`id`),
    CONSTRAINT `qr_codes_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `feedback` (
    `id` VARCHAR(36) NOT NULL,
    `shop_id` VARCHAR(36) NOT NULL,
    `qr_code_id` VARCHAR(10) NULL,
    `rating` INTEGER NOT NULL,
    `message` VARCHAR(2000) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `feedback_shop_id_idx`(`shop_id`),
    INDEX `feedback_qr_code_id_idx`(`qr_code_id`),
    PRIMARY KEY (`id`),
    CONSTRAINT `feedback_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `feedback_qr_code_id_fkey` FOREIGN KEY (`qr_code_id`) REFERENCES `qr_codes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
