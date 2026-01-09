const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./db/connect.js");
const router = require("./routers/router.js");
const { setupGeminiChat } = require("./gemini/chat.js");

const app = express();
let isInitialized = false;
let dbError = null;

// Initialize Database connection
connectDB()
  .then(() => {
    console.log("Database connected successfully");
    isInitialized = true;
  })
  .catch((err) => {
    dbError = err.message;
    console.error("Database connection failed:", err.message);
  });

// Initialize AI Clients
setupGeminiChat()
  .then(() => console.log("AI setup completed"))
  .catch(err => console.error("AI setup failed:", err.message));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [
  "https://peaceful-gdg.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );

  // 🔴 HANDLE PREFLIGHT
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

/* ================== ROUTES ================== */
// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    status: "Backend is active",
    dbInitialized: isInitialized,
    dbStatus: mongoose.connection.readyState, // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    dbError: dbError || "None",
    env: process.env.NODE_ENV || "development",
    mongoUriDetected: !!process.env.MONGO_URI,
    mongoUriPrefix: process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 10) + "..." : "None",
    timestamp: new Date().toISOString()
  });
});

// 🔴 IMPORTANT: prefix routes with /api
app.use("/api", router);

/* ================== EXPORT ================== */
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;

