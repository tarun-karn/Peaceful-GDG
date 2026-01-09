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
const handleDbError = (err) => {
  dbError = `[${err.name || "Error"}] ${err.message}`;
  if (err.reason) {
    const reasonDetail = err.reason.message || JSON.stringify(err.reason);
    dbError += ` (Reason: ${reasonDetail})`;
  }
  console.error("Database connection failed:", err.message);
};

// Initialize Database connection
connectDB()
  .then(() => {
    console.log("Database connected successfully");
    dbError = null;
  })
  .catch(handleDbError);

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

app.get("/", async (req, res) => {
  if (req.query.force === "true") {
    try {
      await connectDB();
      dbError = null;
    } catch (err) {
      handleDbError(err);
    }
  }

  const uri = (process.env.MONGO_URI || "").trim();
  const maskedUri = uri.replace(/\/\/.*@/, "//****:****@");
  
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
    if (err.reason) {
      dbError += ` (Reason: ${err.reason.message || "Unknown Server Status"})`;
    }
    res.status(500).json({ 
      status: "Failed", 
      error: dbError
    });
  }
});

app.get("/diagnose-network", async (req, res) => {
  const net = require("net");
  const hosts = [
    "ac-nalzxl5-shard-00-00.iphpfrm.mongodb.net",
    "ac-nalzxl5-shard-00-01.iphpfrm.mongodb.net",
    "ac-nalzxl5-shard-00-02.iphpfrm.mongodb.net"
  ];
  const results = {};
  
  for (const host of hosts) {
    try {
      const start = Date.now();
      await new Promise((resolve, reject) => {
        const socket = net.createConnection(27017, host);
        socket.setTimeout(3000);
        socket.on("connect", () => { socket.end(); resolve(); });
        socket.on("error", (err) => { socket.destroy(); reject(err); });
        socket.on("timeout", () => { socket.destroy(); reject(new Error("Timeout after 3s")); });
      });
      results[host] = `SUCCESS (${Date.now() - start}ms)`;
    } catch (err) {
      results[host] = `FIREWALL_BLOCKED: ${err.message}`;
    }
  }
  res.json({
    info: "If below says FIREWALL_BLOCKED, your Atlas IP Whitelist is NOT working.",
    results
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

