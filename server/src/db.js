const mysql = require("mysql2/promise");
require("dotenv").config();

function isDatabaseEnabled() {
  const dbUrl = process.env.DB_URL;
  return Boolean(dbUrl && dbUrl.toLowerCase() !== "null");
}

let pool = null;

if (isDatabaseEnabled()) {
  const config = process.env.DB_URL.includes("://")
    ? { uri: process.env.DB_URL }
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "online_karaoke",
      };

  pool = mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 10,
  });
}

module.exports = { pool, isDatabaseEnabled };
