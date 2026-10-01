-- Adds the list of services a business offers (set by admin/salesman when
-- adding/editing a client or activating a QR code), shown to customers on
-- the review page as selectable chips instead of a free-text field. Stored
-- as a JSON array, same pattern as `gallery_photos`. Safe to re-run.

SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'services'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `shops` ADD COLUMN `services` MEDIUMTEXT NULL AFTER `tagline`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
