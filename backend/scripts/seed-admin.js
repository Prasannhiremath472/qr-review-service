const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const db = require("../src/lib/db");

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set, skipping admin seed.");
    return;
  }

  const [existingRows] = await db.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
  if (existingRows.length > 0) {
    console.log(`Admin user ${email} already exists, skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID();

  await db.query(
    "INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, 'Admin', 'ADMIN')",
    [id, email, passwordHash]
  );

  console.log(`Created admin user: ${email} / ${password}`);
  console.log("Log in and change this password immediately, or create a new admin and delete this one.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.end());
