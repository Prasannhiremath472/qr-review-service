-- Adds business logo, a multi-photo gallery, and a public contact email to
-- `shops`, used by the customer-facing mini business landing page.
-- Safe to re-run: each ADD COLUMN is guarded so it's a no-op if already applied.

SET @db := DATABASE();

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'logo_url') = 0,
  'ALTER TABLE `shops` ADD COLUMN `logo_url` MEDIUMTEXT NULL AFTER `photo_url`',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'gallery_photos') = 0,
  'ALTER TABLE `shops` ADD COLUMN `gallery_photos` MEDIUMTEXT NULL AFTER `logo_url`',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'contact_email') = 0,
  'ALTER TABLE `shops` ADD COLUMN `contact_email` VARCHAR(255) NOT NULL DEFAULT \'\' AFTER `contact_phone`',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
