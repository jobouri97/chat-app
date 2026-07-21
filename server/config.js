import dotenv from "dotenv";

// Load variables from the .env file.
dotenv.config();

// Get an environment variable.
// Stop the program if it does not exist.
function requireEnvironmentVariable(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

// Convert a value to a positive integer.
// If no value is provided, use the fallback value instead.
function parsePositiveInteger(value, fallback, name) {
  const parsed = Number(value ?? fallback);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
}

// Check whether the application is running
// in development or production mode.
const nodeEnvironment = process.env.NODE_ENV || "development";

// Store all application settings in one object.
// Other files can import this object whenever they need a setting.
export const config = Object.freeze({
  // Current environment.
  nodeEnvironment,

  // True if running in production.
  isProduction: nodeEnvironment === "production",

  // Server port.
  port: parsePositiveInteger(
    process.env.PORT,
    3000,
    "PORT",
  ),

  // List of frontend URLs that are allowed
  // to send requests to this backend.
  clientOrigins: (process.env.CLIENT_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean),

  // Secret key used to create and verify JWT tokens.
  jwtSecret: requireEnvironmentVariable("JWT_SECRET"),

  // How long a JWT token remains valid.
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",

  // Maximum number of characters allowed in a message.
  messageMaxLength: parsePositiveInteger(
    process.env.MESSAGE_MAX_LENGTH,
    4000,
    "MESSAGE_MAX_LENGTH",
  ),

  // Number of messages returned per page.
  messagePageSize: parsePositiveInteger(
    process.env.MESSAGE_PAGE_SIZE,
    50,
    "MESSAGE_PAGE_SIZE",
  ),

  // PostgreSQL database settings.
  database: {
    host: requireEnvironmentVariable("DB_HOST"),

    port: parsePositiveInteger(
      process.env.DB_PORT,
      5432,
      "DB_PORT",
    ),

    user: requireEnvironmentVariable("DB_USER"),

    password: requireEnvironmentVariable("DB_PASSWORD"),

    database: requireEnvironmentVariable("DB_NAME"),

    // Maximum number of database connections.
    max: parsePositiveInteger(
      process.env.DB_POOL_MAX,
      10,
      "DB_POOL_MAX",
    ),

    // How long to wait while trying to connect
    // to the database.
    connectionTimeoutMillis: parsePositiveInteger(
      process.env.DB_CONNECTION_TIMEOUT_MS,
      5000,
      "DB_CONNECTION_TIMEOUT_MS",
    ),

    // How long an unused database connection
    // stays open before being closed.
    idleTimeoutMillis: parsePositiveInteger(
      process.env.DB_IDLE_TIMEOUT_MS,
      30000,
      "DB_IDLE_TIMEOUT_MS",
    ),

    // Enable SSL if DB_SSL is "true".
    ssl:
      process.env.DB_SSL === "true"
        ? {
            rejectUnauthorized:
              process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
          }
        : false,
  },
});

// Check if a frontend URL is allowed to access the backend.
export function isAllowedOrigin(origin) {
  // Requests without an Origin header are allowed.
  if (!origin) {
    return true;
  }

  // Remove a trailing "/" before comparing.
  return config.clientOrigins.includes(origin.replace(/\/$/, ""));
}