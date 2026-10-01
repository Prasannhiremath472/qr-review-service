-- Adds structured, per-day business hours (Google Business Profile style:
-- open/close time or Closed for each day of the week), shown on the review
-- page as a weekly hours list with today highlighted and an open-now
-- status. Stored as a JSON array, same pattern as `services`/
-- `gallery_photos`. The existing free-text `open_hours` column is kept
-- as a fallback for businesses that haven't filled in structured hours.
-- Safe to re-run.

SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'business_hours'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `shops` ADD COLUMN `business_hours` MEDIUMTEXT NULL AFTER `open_hours`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
