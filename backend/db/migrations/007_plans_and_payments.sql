-- Subscription plans (admin-editable pricing/features) and Razorpay payment
-- records. Safe to re-run.

CREATE TABLE IF NOT EXISTS `plans` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `price_monthly` INTEGER NOT NULL DEFAULT 0,
    `price_yearly` INTEGER NOT NULL DEFAULT 0,
    `standee_limit` INTEGER NOT NULL DEFAULT 1,
    `mini_web` BOOLEAN NOT NULL DEFAULT true,
    `negative_review_alerts` BOOLEAN NOT NULL DEFAULT true,
    `whatsapp_alerts` BOOLEAN NOT NULL DEFAULT false,
    `monthly_report` BOOLEAN NOT NULL DEFAULT false,
    `custom_brand_color` BOOLEAN NOT NULL DEFAULT false,
    `better_review_quality` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `plans_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Prices are stored in INR rupees (integer). `price_monthly`/`price_yearly`
-- are converted to paise only at Razorpay order-creation time.
INSERT IGNORE INTO `plans`
  (`id`, `code`, `name`, `price_monthly`, `price_yearly`, `standee_limit`,
   `mini_web`, `negative_review_alerts`, `whatsapp_alerts`, `monthly_report`,
   `custom_brand_color`, `better_review_quality`, `sort_order`)
VALUES
  ('a1a10000-0000-4000-8000-000000000001', 'startup', 'Startup', 499, 4499, 1,
   true, true, false, false,
   false, false, 1),
  ('a1a10000-0000-4000-8000-000000000002', 'pro', 'Pro', 699, 6999, 2,
   true, true, true, true,
   true, true, 2);

CREATE TABLE IF NOT EXISTS `payments` (
    `id` VARCHAR(36) NOT NULL,
    `shop_id` VARCHAR(36) NOT NULL,
    `plan_id` VARCHAR(36) NOT NULL,
    `billing_cycle` ENUM('MONTHLY', 'YEARLY') NOT NULL,
    `amount` INTEGER NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
    `razorpay_order_id` VARCHAR(64) NOT NULL,
    `razorpay_payment_id` VARCHAR(64) NULL,
    `razorpay_signature` VARCHAR(255) NULL,
    `status` ENUM('CREATED', 'PAID', 'FAILED') NOT NULL DEFAULT 'CREATED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `payments_razorpay_order_id_key`(`razorpay_order_id`),
    INDEX `payments_shop_id_idx`(`shop_id`),
    PRIMARY KEY (`id`),
    CONSTRAINT `payments_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `payments_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
