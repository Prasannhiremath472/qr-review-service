-- Creates/updates the ADMIN and SALESMAN accounts below.
-- Paste directly into phpMyAdmin's SQL tab, on the qr_reviews database.
--
-- Passwords are pre-hashed with bcrypt (10 rounds), the same scheme the
-- app's authService.js uses — plain-text passwords cannot be written
-- directly via SQL since MySQL/MariaDB has no bcrypt function.
--
-- Safe to re-run: matches on the unique `email` index, so it inserts a new
-- row if the email doesn't exist yet, or updates the existing row's
-- password/name/role if it does.
--
-- admin@infinitytechnohub.com   / Infinity@145  (ADMIN)
-- afroj@infinitytechnohub.com   / Afroj@124     (SALESMAN)

INSERT INTO `users` (`id`, `email`, `password_hash`, `name`, `role`)
VALUES
  (
    '7121b133-2b2b-4bf9-b1de-21b7302dbd80',
    'admin@infinitytechnohub.com',
    '$2b$10$HXwHoSZn66ICANfe46zKZ.YTcMNSCu9mVtg7fI2YKYWfmKgtJqpDC',
    'Admin',
    'ADMIN'
  ),
  (
    '59ce7d02-0398-4576-a2fa-6b31b1c81e91',
    'afroj@infinitytechnohub.com',
    '$2b$10$oTg3HAK4Xe6RgTKL0ujzP.8DsOnMw5XMZhVWl0.LXxq.Vth6yKzc6',
    'Afroj',
    'SALESMAN'
  )
ON DUPLICATE KEY UPDATE
  `password_hash` = VALUES(`password_hash`),
  `name` = VALUES(`name`),
  `role` = VALUES(`role`);
