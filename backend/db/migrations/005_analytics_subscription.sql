-- Adds review-page view tracking and per-shop subscription fields, used by
-- the admin Analytics and Subscription pages.
-- Safe to re-run: each ADD COLUMN is guarded so it's a no-op if already applied.

SET @db := DATABASE();

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'review_views') = 0,
  'ALTER TABLE `shops` ADD COLUMN `review_views` INTEGER NOT NULL DEFAULT 0 AFTER `address`',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'subscription_start_date') = 0,
  'ALTER TABLE `shops` ADD COLUMN `subscription_start_date` DATE NULL AFTER `review_views`',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'subscription_end_date') = 0,
  'ALTER TABLE `shops` ADD COLUMN `subscription_end_date` DATE NULL AFTER `subscription_start_date`',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'subscription_status') = 0,
  'ALTER TABLE `shops` ADD COLUMN `subscription_status` ENUM(\'ACTIVE\', \'SUSPENDED\') NOT NULL DEFAULT \'ACTIVE\' AFTER `subscription_end_date`',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
