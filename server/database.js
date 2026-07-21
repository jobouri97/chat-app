import pg from "pg";
import { config } from "./config.js";

const { Pool } = pg;

// A Pool reuses a small number of PostgreSQL connections. Opening a brand-new
// connection for every request would be slower and could overload the database.
const pool = new Pool({
    ...config.database,
});

pool.on("error", (error) => {
  // This catches errors from idle connections that are not attached to a query.
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

export default pool;
