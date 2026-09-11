-- Adds optional business-profile fields to `shops` (photo, about us, hours,
-- contact info) used by the mini business landing page on the review flow.
-- Safe to re-run: each ADD COLUMN is guarded so it's a no-op if already applied.

SET @db := DATABASE();

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'photo_url') = 0,
  'ALTER TABLE `shops` ADD COLUMN `photo_url` MEDIUMTEXT NULL AFTER `owner_user_id`',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'about_us') = 0,
  'ALTER TABLE `shops` ADD COLUMN `about_us` TEXT NULL AFTER `photo_url`',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'open_hours') = 0,
  'ALTER TABLE `shops` ADD COLUMN `open_hours` VARCHAR(500) NOT NULL DEFAULT \'\' AFTER `about_us`',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'whatsapp_number') = 0,
  'ALTER TABLE `shops` ADD COLUMN `whatsapp_number` VARCHAR(30) NOT NULL DEFAULT \'\' AFTER `open_hours`',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'contact_phone') = 0,
  'ALTER TABLE `shops` ADD COLUMN `contact_phone` VARCHAR(30) NOT NULL DEFAULT \'\' AFTER `whatsapp_number`',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'address') = 0,
  'ALTER TABLE `shops` ADD COLUMN `address` VARCHAR(500) NOT NULL DEFAULT \'\' AFTER `contact_phone`',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
