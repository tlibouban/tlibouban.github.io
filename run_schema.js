const { Client } = require("pg");
const fs = require("fs");

// Utilise DATABASE_URL si défini sinon fallback
const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://tristan:n0M5hjSRolnNjTx5WF12PUESD3zIqtgw@dpg-d1b9upgdl3ps73ef3lc0-a.frankfurt-postgres.render.com/db_delivery_ho2n";

const sql = fs.readFileSync("schema.sql", "utf8");

(async () => {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  try {
    console.log("⏳ Connecting to DB...");
    await client.connect();
    console.log("📜 Running schema.sql ...");
    await client.query(sql);
    console.log("✅ Schema applied successfully");
  } catch (err) {
    console.error("❌ Error applying schema", err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
