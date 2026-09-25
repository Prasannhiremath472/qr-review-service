-- Adds a short marketing tagline shown on the printable standee card and
-- the customer-facing review page.
-- Safe to re-run: the ADD COLUMN is guarded so it's a no-op if already applied.

SET @db := DATABASE();

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'tagline') = 0,
  'ALTER TABLE `shops` ADD COLUMN `tagline` VARCHAR(255) NOT NULL DEFAULT \'\' AFTER `business_type`',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
