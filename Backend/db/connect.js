const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");

// Load .env from the Backend directory so absolute launches still pick up env vars
dotenv.config({ path: path.join(__dirname, "..", ".env") });

function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is missing from process.env");
    return Promise.reject(new Error("MONGO_URI environment variable is not set"));
  }
  
  // Extract parts for safer logging
  const maskedUri = uri.replace(/\/\/.*@/, "//****:****@");
  console.log(`Attempting to connect to MongoDB with URI: ${maskedUri}`);
  
  return mongoose.connect(String(uri), {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
}

module.exports = connectDB;
