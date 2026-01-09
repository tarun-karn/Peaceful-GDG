const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");

// Load .env from the Backend directory so absolute launches still pick up env vars
dotenv.config({ path: path.join(__dirname, "..", ".env") });

function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    return Promise.reject(new Error("MONGO_URI environment variable is not set"));
  }
  return mongoose.connect(String(uri));
}

module.exports = connectDB;
