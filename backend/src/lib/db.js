const mysql = require("mysql2/promise");
const config = require("../config/config");

const pool = mysql.createPool({
  uri: config.databaseUrl,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: false,
});

module.exports = pool;
