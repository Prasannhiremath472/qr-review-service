-- Admin/salesman-controlled flag that shows a "verified" tick next to the
-- business logo on the public review page. Defaults to on: every business
-- is activated by Infinity staff, so existing shops keep the tick until it
-- is switched off in the client form. Safe to re-run.

SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'is_verified'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `shops` ADD COLUMN `is_verified` BOOLEAN NOT NULL DEFAULT TRUE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
