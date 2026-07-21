import express from "express";
import pool from "./database.js"
import dotenv from "dotenv";

import userRoutes from "./routes/userRoute.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

import cors from "cors";
import { initializeSocketServer } from "./utils/sockets/socket.js";
import http from "node:http";

const PORT = process.env.PORT || 3000;

const app = express();

const server = http.createServer(app);

// Initialize Socket.IO
initializeSocketServer(server);

// Allow requests from your React app
app.use(
  cors({
    origin: "http://localhost:5173", // React (Vite) URL
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use("/", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/conversations", messageRoutes);

async function startServer() {
  try {
    // Test database connection
    await pool.query("SELECT NOW()");

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS
        users_username_case_insensitive_unique
      ON users (LOWER(BTRIM(username)))
    `);

    console.log("Connected to PostgreSQL");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Database connection failed");
    console.error(err);
  }
}

startServer();
