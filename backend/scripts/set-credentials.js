const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const db = require("../src/lib/db");

// One-off script to create/update specific ADMIN and SALESMAN accounts with
// known credentials. Safe to re-run: existing emails get their password
// (and role/name) updated instead of a duplicate row.
//
// Usage:
//   node scripts/set-credentials.js
//
// Uses this project's .env (DATABASE_URL) via src/lib/db.js — run from the
// backend/ directory so it points at the right database.

const ACCOUNTS = [
  { email: "admin@infinitytechnohub.com", password: "Infinity@145", name: "Admin", role: "ADMIN" },
  { email: "afroj@infinitytechnohub.com", password: "Afroj@124", name: "Afroj", role: "SALESMAN" },
];

async function upsertAccount({ email, password, name, role }) {
  const passwordHash = await bcrypt.hash(password, 10);

  const [existingRows] = await db.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);

  if (existingRows.length > 0) {
    await db.query("UPDATE users SET password_hash = ?, name = ?, role = ? WHERE id = ?", [
      passwordHash,
      name,
      role,
      existingRows[0].id,
    ]);
    console.log(`Updated existing user: ${email} (${role})`);
  } else {
    const id = crypto.randomUUID();
    await db.query("INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)", [
      id,
      email,
      passwordHash,
      name,
      role,
    ]);
    console.log(`Created new user: ${email} (${role})`);
  }
}

async function main() {
  for (const account of ACCOUNTS) {
    await upsertAccount(account);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.end());
