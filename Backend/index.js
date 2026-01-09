const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const VERSION = "1.1.0-diagnostic";

const connectDB = require("./db/connect.js");
const router = require("./routers/router.js");
const { setupGeminiChat } = require("./gemini/chat.js");

const app = express();
let isInitialized = false;
// Initialize Database connection
connectDB()
  .then(() => {
    console.log("Database connected successfully");
    dbError = null;
  })
  .catch((err) => {
    dbError = `[${err.name || "Error"}] ${err.message}`;
    if (err.reason) dbError += ` (Reason: ${err.reason.message})`;
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

  res.status(200).json({
    status: "Backend is active",
    version: VERSION,
    nodeVersion: process.version,
    mongooseVersion: mongoose.version,
    dbInitialized: mongoose.connection.readyState === 1,
    dbStatus: mongoose.connection.readyState,
    dbError: dbError || "None",
    fullUriMasked: maskedUri,
    timestamp: new Date().toISOString()
  });
});

app.get("/debug-db", async (req, res) => {
  try {
    console.log("Manual re-connect triggered...");
    await connectDB();
    dbError = null;
    res.json({ status: "Success", message: "Connected to MongoDB" });
  } catch (err) {
    dbError = `[${err.name || "Error"}] ${err.message}`;
    if (err.reason) dbError += ` (Reason: ${err.reason.message})`;
    res.status(500).json({ 
      status: "Failed", 
      error: dbError
    });
  }
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

