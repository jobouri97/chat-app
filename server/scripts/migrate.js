import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../database.js";

// Get the folder where this file is located.
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

// Get the full path of the migrations folder.
const migrationsDirectory = path.resolve(
  scriptDirectory,
  "../migrations",
);

try {
  // Get all SQL migration files.
  // Sort them so they run in order.
  const migrationFiles = (await fs.readdir(migrationsDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  // Create a table to remember which
  // migrations have already been executed.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Go through each migration file.
  for (const name of migrationFiles) {
    // Check whether this migration
    // has already been executed.
    const applied = await pool.query(
      "SELECT 1 FROM schema_migrations WHERE name = $1",
      [name],
    );

    // Skip it if it already exists.
    if (applied.rowCount > 0) {
      continue;
    }

    // Read the SQL file.
    const sql = await fs.readFile(
      path.join(migrationsDirectory, name),
      "utf8",
    );

    // Execute the SQL commands.
    await pool.query(sql);

    // Save the migration name so it
    // will not run again next time.
    await pool.query(
      "INSERT INTO schema_migrations (name) VALUES ($1)",
      [name],
    );

    console.log(`Applied migration: ${name}`);
  }
} finally {
  // Close the database connection.
  await pool.end();
}