// Hostinger's Node.js panel injects DATABASE_USER / DATABASE_PASSWORD /
// DATABASE_NAME as separate variables and does not allow adding a custom
// DATABASE_URL. Prisma only understands a single connection string, so this
// script composes one from those pieces and writes it to .env, where both
// the Prisma CLI (prisma generate / migrate deploy) and the app itself will
// pick it up. Safe to run repeatedly; a no-op if DATABASE_URL is already set
// directly (e.g. in local dev).
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");

// Load any existing .env into process.env (without overriding real env vars
// the platform may have injected) so a DATABASE_URL already on disk — e.g.
// from local dev — is respected without needing to re-derive it.
require("dotenv").config({ path: envPath });

if (process.env.DATABASE_URL) {
  process.exit(0);
}

const { DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME, DATABASE_HOST } = process.env;

if (!DATABASE_USER || !DATABASE_PASSWORD || !DATABASE_NAME) {
  console.error(
    "Missing DATABASE_URL and one or more of DATABASE_USER / DATABASE_PASSWORD / DATABASE_NAME — cannot build a database connection string."
  );
  process.exit(1);
}

const host = DATABASE_HOST || "localhost";
const user = encodeURIComponent(DATABASE_USER);
const password = encodeURIComponent(DATABASE_PASSWORD);
const databaseUrl = `mysql://${user}:${password}@${host}:3306/${DATABASE_NAME}`;

const line = `DATABASE_URL="${databaseUrl}"\n`;

let existing = "";
if (fs.existsSync(envPath)) {
  existing = fs.readFileSync(envPath, "utf8");
}

if (existing.includes("DATABASE_URL=")) {
  existing = existing.replace(/^DATABASE_URL=.*$/m, line.trim());
} else {
  existing = existing.trimEnd() + (existing ? "\n" : "") + line;
}

fs.writeFileSync(envPath, existing.endsWith("\n") ? existing : existing + "\n");
console.log(`Wrote DATABASE_URL to ${envPath} (host: ${host}, db: ${DATABASE_NAME})`);
