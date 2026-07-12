import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const run = async () => {
  try {
    const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    console.log("Running migration...");
    await pool.query(schema);
    console.log("✅ Migration complete.");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    await pool.end();
  }
};

run();
