-- Links each shop to its subscription plan and adds a Pro-only brand color
-- used to theme the public review page. Safe to re-run.

SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'plan_id'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `shops` ADD COLUMN `plan_id` VARCHAR(36) NULL AFTER `subscription_status`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'brand_color'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `shops` ADD COLUMN `brand_color` VARCHAR(10) NULL AFTER `plan_id`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shops' AND CONSTRAINT_NAME = 'shops_plan_id_fkey'
);
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `shops` ADD CONSTRAINT `shops_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill existing shops onto the Startup plan so nothing is left unplanned.
UPDATE `shops` SET `plan_id` = 'a1a10000-0000-4000-8000-000000000001' WHERE `plan_id` IS NULL;
