const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const db = require("../src/lib/db");

// One-off script to create/update the ADMIN and SALESMAN accounts with
// passwords you supply. Safe to re-run: existing emails get their password
// (and role/name) updated instead of a duplicate row.
//
// Passwords are read from the environment so they never live in the repo:
//
//   ADMIN_PASSWORD='...' SALESMAN_PASSWORD='...' node scripts/set-credentials.js
//
// Optional: ADMIN_EMAIL / SALESMAN_EMAIL (default to the addresses below). An
// account is skipped when its password variable is not set.
//
// Uses this project's .env (DATABASE_URL) via src/lib/db.js — run from the
// backend/ directory so it points at the right database.

const ACCOUNTS = [
  {
    email: process.env.ADMIN_EMAIL || "admin@infinitytechnohub.com",
    password: process.env.ADMIN_PASSWORD,
    name: "Admin",
    role: "ADMIN",
  },
  {
    email: process.env.SALESMAN_EMAIL || "afroj@infinitytechnohub.com",
    password: process.env.SALESMAN_PASSWORD,
    name: "Afroj",
    role: "SALESMAN",
  },
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
  const todo = ACCOUNTS.filter((a) => a.password);
  if (todo.length === 0) {
    throw new Error("Set ADMIN_PASSWORD and/or SALESMAN_PASSWORD in the environment first.");
  }
  for (const account of todo) {
    await upsertAccount(account);
  }
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  })
  .finally(() => db.end());
