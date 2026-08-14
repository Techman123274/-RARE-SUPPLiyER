/**
 * One-off schema apply. Reads DATABASE_URL from the environment.
 * Never put the database password in frontend code.
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is missing");
  process.exit(1);
}

const sql = fs.readFileSync(
  path.join(__dirname, "..", "supabase", "schema.sql"),
  "utf8"
);

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  await client.connect();
  await client.query(sql);
  await client.end();
  console.log("Schema applied.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
