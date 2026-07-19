import express from "express";
import pool from "./database.js"
import dotenv from "dotenv";
import router from "./routes/userRoute.js";
import cors from "cors";

const PORT = process.env.PORT || 3000;

const app = express();

// Allow requests from your React app
app.use(
  cors({
    origin: "http://localhost:5173", // React (Vite) URL
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use("/", router);

async function startServer() {
  try {
    // Test database connection
    await pool.query("SELECT NOW()");

    console.log("Connected to PostgreSQL");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Database connection failed");
    console.error(err);
  }
}

startServer();