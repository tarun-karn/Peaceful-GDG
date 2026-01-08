// const path = require("path");
// const dotenv = require("dotenv");
// dotenv.config({ path: path.join(__dirname, ".env") });

// const express = require("express");
// const cors = require("cors");
// const cookieParser = require("cookie-parser");
// const router = require("./routers/router.js");
// const connectDB = require("./db/connect.js");
// const { setupGeminiChat } = require("./gemini/chat.js");

// const app = express();

// app.use(
//   cors({
//     origin: true,
//     credentials: true,
//     exposedHeaders: ["set-cookie", "token"],
//   })
// );
// // parse form data
// app.use(express.urlencoded({ extended: false }));
// // parse json
// app.use(express.json());
// // parse cookie
// app.use(cookieParser());

// app.use(router);

// const initServer = async () => {
//   try {
//     const port = String(process.env.SERVER_PORT) || 8000;
//     await connectDB();
//     console.log("DB Connected");
//     // init gemini
//     try {
//       await setupGeminiChat();
//     } catch (geminiError) {
//       console.warn("Warning: Gemini Chat setup failed. Chat features will not work.", geminiError.message);
//     }

//     app.listen(port, () => {
//       console.log(`Backend Server Started on ${port} ...`);
//     });
//   } catch (err) {
//     console.log(err.message);
//     console.log("Server not started!");
//   }
// };
// initServer();


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

app.get("/", (req, res) => {
  res.status(200).send("Backend is active. DB Initialized: " + isInitialized);
});

app.use(router);

/* ================== INIT ONCE ================== */
let isInitialized = false;

async function init() {
  if (isInitialized) return;

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
}

/* ================== SERVERLESS HANDLER ================== */
module.exports = async (req, res) => {
  try {
    await init();
    return app(req, res);
  } catch (error) {
    console.error("Critical Initialization Error:", error);
    res.status(500).send("Critical Initialization Error: " + error.message);
  }
};
