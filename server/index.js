import http from "node:http";
import cors from "cors";
import express from "express";

import { config, isAllowedOrigin } from "./config.js";
import pool from "./database.js";
import { securityHeaders } from "./middleware/security.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes from "./routes/userRoute.js";
import { initializeSocketServer } from "./utils/sockets/socket.js";

const app = express();

// Create one HTTP server.
// Express and Socket.IO will both use this server.
const server = http.createServer(app);

// If the app is running on a real server (production),
// trust the reverse proxy (like Nginx or Render).
if (config.isProduction) {
  app.set("trust proxy", 1);
}

// CORS decides which frontend websites
// are allowed to send requests to this backend.
const corsOptions = {
  origin(origin, callback) {
    callback(
      isAllowedOrigin(origin)
        ? null
        : new Error("Origin not allowed by CORS."),
      true,
    );
  },

  // Allow these HTTP request methods.
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],

  // Allow these request headers.
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Hide Express information from response headers.
app.disable("x-powered-by");

// Apply custom security headers.
app.use(securityHeaders);

// Enable CORS.
app.use(cors(corsOptions));

// Automatically convert JSON request bodies into JavaScript objects.
app.use(express.json({ limit: "32kb" }));

// Simple route to check if the server is running.
app.get("/health/live", (req, res) =>
  res.status(200).json({ status: "ok" }),
);

// Check if the server can connect to PostgreSQL.
app.get("/health/ready", async (req, res) => {
  try {
    // Try a very small database query.
    await pool.query("SELECT 1");

    res.status(200).json({
      status: "ready",
    });
  } catch {
    res.status(503).json({
      status: "unavailable",
    });
  }
});

// User routes.
app.use("/", userRoutes);

// Conversation routes.
app.use("/api/conversations", conversationRoutes);

// Message routes.
app.use("/api/conversations", messageRoutes);

// If no route matched the request,
// return a 404 response.
app.use((req, res) =>
  res.status(404).json({
    message: "Route not found.",
  }),
);

// Handle unexpected server errors.
app.use((error, req, res, next) => {
  // If a response was already sent,
  // let Express continue.
  if (res.headersSent) {
    return next(error);
  }

  console.error("Unhandled request error:", error.message);

  return res.status(500).json({
    message: "Internal server error.",
  });
});

// Start Socket.IO.
initializeSocketServer(server);

// Start the backend server.
async function startServer() {
  try {
    // Make sure the database is reachable first.
    await pool.query("SELECT 1");

    // Start listening for requests.
    server.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);

    // Exit because the server cannot work without the database.
    process.exitCode = 1;
  }
}

// Prevent shutdown from running more than once.
let shuttingDown = false;

// Close the server safely.
async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log(`${signal} received; shutting down.`);

  // If shutdown takes longer than 10 seconds,
  // force the application to exit.
  const forceExitTimer = setTimeout(() => {
    process.exit(1);
  }, 10000);

  // Do not keep Node.js alive just because of this timer.
  forceExitTimer.unref();

  // Stop accepting new requests.
  server.close(async () => {
    // Close all PostgreSQL connections.
    await pool.end();

    clearTimeout(forceExitTimer);

    process.exit(0);
  });
}

// Run shutdown when the operating system
// asks the application to stop.
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Also allow stopping with Ctrl + C.
process.on("SIGINT", () => shutdown("SIGINT"));

// Start the application.
startServer();