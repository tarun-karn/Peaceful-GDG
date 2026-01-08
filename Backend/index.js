const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const router = require("./routers/router.js");
const connectDB = require("./db/connect.js");
const { setupGeminiChat } = require("./gemini/chat.js");

const app = express();

/* ================== CORS (FIXED) ================== */
const allowedOrigins = [
  "https://peaceful-gdg.vercel.app"
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, Postman, etc.
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["set-cookie", "token"],
  })
);

// Required for browser preflight on Vercel
app.options("*", cors());

/* ================== BODY PARSERS ================== */
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

/* ================== INIT (RUN ONCE) ================== */
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
    res.status(500).json({
      error: "Critical Initialization Error",
      message: err.message,
    });
  }
});

/* ================== ROUTES ================== */
// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    status: "Backend is active",
    dbInitialized: isInitialized,
  });
});

// 🔴 IMPORTANT: prefix routes with /api
app.use("/api", router);

/* ================== EXPORT ================== */
module.exports = app;
