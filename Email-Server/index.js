const dotenv = require("dotenv");
const path = require("path");
// Load .env from the Email-Server directory so absolute launches still pick up env vars
dotenv.config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cron = require("node-cron");
const {
  sendWelcomeEmail,
  sendScheduledEmails,
} = require("./Controller/email.controller");
const connectDB = require("./database/ConnectDb");

cron.schedule(
  "01 12 * * *",
  () => {
    //Pick data from Database and send emails to users
    async function sendMails() {
      await sendScheduledEmails();
      console.log("DOne");
    }
    sendMails();
  },
  {
    timezone: "Asia/Kolkata",
  }
);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello" });
});

app.post("/welcomeEmail", sendWelcomeEmail);
connectDB();

app.listen(8888, () => {
  console.log("Server Started");
});
