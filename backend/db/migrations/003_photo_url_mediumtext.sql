-- photo_url was originally VARCHAR(500) (a plain URL). It now stores a
-- compressed base64 data URI instead (avoids relying on server disk storage,
-- which some hosts wipe on redeploy), which needs much more room.
-- Safe to re-run: MODIFY COLUMN is idempotent regardless of current type.

ALTER TABLE `shops` MODIFY COLUMN `photo_url` MEDIUMTEXT NULL;
