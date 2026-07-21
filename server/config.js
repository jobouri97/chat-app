import dotenv from "dotenv";

dotenv.config();

function requireEnvironmentVariable(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parsePositiveInteger(value, fallback, name) {
  const parsed = Number(value ?? fallback);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
}

const nodeEnvironment = process.env.NODE_ENV || "development";

export const config = Object.freeze({
  nodeEnvironment,
  isProduction: nodeEnvironment === "production",
  port: parsePositiveInteger(process.env.PORT, 3000, "PORT"),
  clientOrigins: (process.env.CLIENT_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean),
  jwtSecret: requireEnvironmentVariable("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
  messageMaxLength: parsePositiveInteger(
    process.env.MESSAGE_MAX_LENGTH,
    4000,
    "MESSAGE_MAX_LENGTH",
  ),
  messagePageSize: parsePositiveInteger(
    process.env.MESSAGE_PAGE_SIZE,
    50,
    "MESSAGE_PAGE_SIZE",
  ),
  database: {
    host: requireEnvironmentVariable("DB_HOST"),
    port: parsePositiveInteger(process.env.DB_PORT, 5432, "DB_PORT"),
    user: requireEnvironmentVariable("DB_USER"),
    password: requireEnvironmentVariable("DB_PASSWORD"),
    database: requireEnvironmentVariable("DB_NAME"),
    max: parsePositiveInteger(process.env.DB_POOL_MAX, 10, "DB_POOL_MAX"),
    connectionTimeoutMillis: parsePositiveInteger(
      process.env.DB_CONNECTION_TIMEOUT_MS,
      5000,
      "DB_CONNECTION_TIMEOUT_MS",
    ),
    idleTimeoutMillis: parsePositiveInteger(
      process.env.DB_IDLE_TIMEOUT_MS,
      30000,
      "DB_IDLE_TIMEOUT_MS",
    ),
    ssl: process.env.DB_SSL === "true"
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" }
      : false,
  },
});

export function isAllowedOrigin(origin) {
  return !origin || config.clientOrigins.includes(origin.replace(/\/$/, ""));
}
