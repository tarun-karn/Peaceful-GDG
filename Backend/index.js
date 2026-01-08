const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const router = require("./routers/router.js");
const connectDB = require("./db/connect.js");
const { setupGeminiChat } = require("./gemini/chat.js");

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
    exposedHeaders: ["set-cookie", "token"],
  })
);
// parse form data
app.use(express.urlencoded({ extended: false }));
// parse json
app.use(express.json());
// parse cookie
app.use(cookieParser());

app.use(router);

const initServer = async () => {
  try {
    const port = String(process.env.SERVER_PORT) || 8000;
    await connectDB();
    console.log("DB Connected");
    // init gemini
    try {
      await setupGeminiChat();
    } catch (geminiError) {
      console.warn("Warning: Gemini Chat setup failed. Chat features will not work.", geminiError.message);
    }

    app.listen(port, () => {
      console.log(`Backend Server Started on ${port} ...`);
    });
  } catch (err) {
    console.log(err.message);
    console.log("Server not started!");
  }
};
initServer();
