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
const server = http.createServer(app);

if (config.isProduction) {
  app.set("trust proxy", 1);
}

const corsOptions = {
  origin(origin, callback) {
    callback(isAllowedOrigin(origin) ? null : new Error("Origin not allowed by CORS."), true);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.disable("x-powered-by");
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: "32kb" }));

app.get("/health/live", (req, res) => res.status(200).json({ status: "ok" }));
app.get("/health/ready", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
});

app.use("/", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/conversations", messageRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found." }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error("Unhandled request error:", error.message);
  return res.status(500).json({ message: "Internal server error." });
});

initializeSocketServer(server);

async function startServer() {
  try {
    await pool.query("SELECT 1");
    server.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exitCode = 1;
  }
}

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received; shutting down.`);

  const forceExitTimer = setTimeout(() => process.exit(1), 10000);
  forceExitTimer.unref();

  server.close(async () => {
    await pool.end();
    clearTimeout(forceExitTimer);
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer();
