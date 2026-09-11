const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const config = require("../src/config/config");

async function runFile(connection, filePath) {
  const sql = fs.readFileSync(filePath, "utf8");
  await connection.query(sql);
}

async function main() {
  const connection = await mysql.createConnection({ uri: config.databaseUrl, multipleStatements: true });
  try {
    await runFile(connection, path.join(__dirname, "..", "db", "schema.sql"));

    const migrationsDir = path.join(__dirname, "..", "db", "migrations");
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
      for (const file of files) {
        await runFile(connection, path.join(migrationsDir, file));
      }
    }

    console.log("Database schema is up to date.");
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
