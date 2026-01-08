const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const router = require("./routers/router.js");
const connectDB = require("./db/connect.js");
const { setupGeminiChat } = require("./gemini/chat.js");

const app = express();

/* ================== MIDDLEWARE ================== */
app.use(
  cors({
    origin: true,
    credentials: true,
    exposedHeaders: ["set-cookie", "token"],
  })
);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

/* ================== INIT MIDDLEWARE ================== */
let isInitialized = false;

app.use(async (req, res, next) => {
  if (isInitialized) return next();

  try {
    await connectDB();
    console.log("DB Connected");

    try {
      await setupGeminiChat();
    } catch (err) {
      console.warn(
        "Warning: Gemini Chat setup failed. Chat features may not work.",
        err.message
      );
    }

    isInitialized = true;
    next();
  } catch (err) {
    console.error("Critical Initialization Error:", err);
    // Explicitly send 500 with CORS headers (handled by cors middleware above)
    res.status(500).send("Critical Initialization Error: " + err.message);
  }
});

/* ================== ROUTES ================== */
// Health check
app.get("/", (req, res) => {
  res.status(200).send("Backend is active. DB Initialized: " + isInitialized);
});

app.use(router);

/* ================== EXPORT ================== */
module.exports = app;
