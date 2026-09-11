const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const config = require("../src/config/config");

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, "..", "db", "schema.sql"), "utf8");

  const connection = await mysql.createConnection({ uri: config.databaseUrl, multipleStatements: true });
  try {
    await connection.query(sql);
    console.log("Database schema is up to date.");
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
