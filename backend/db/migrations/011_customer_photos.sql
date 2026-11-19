-- Photos customers attach on the public review page ("Add photos") are
-- stored per shop so the owner can see them in their dashboard. Stored as
-- compressed base64 JPEG data URIs, same approach as shop photos, so they
-- survive redeploys on hosts that wipe local disk. Rows are removed
-- automatically with their shop. Safe to re-run.

CREATE TABLE IF NOT EXISTS `customer_photos` (
    `id` VARCHAR(36) NOT NULL,
    `shop_id` VARCHAR(36) NOT NULL,
    `qr_code_id` VARCHAR(10) NULL,
    `photo` MEDIUMTEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `customer_photos_shop_created_idx`(`shop_id`, `created_at`),
    PRIMARY KEY (`id`),
    CONSTRAINT `customer_photos_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
