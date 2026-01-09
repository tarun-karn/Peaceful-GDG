const mongoose = require("mongoose");
const path = require("path");

function connectDB() {
  const uri = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : null;
  if (!uri) {
    console.error("MONGO_URI is missing from process.env");
    return Promise.reject(new Error("MONGO_URI environment variable is not set"));
  }
  
  // Extract parts for safer logging
  const maskedUri = uri.replace(/\/\/.*@/, "//****:****@");
  console.log(`Attempting to connect to MongoDB with URI: ${maskedUri}`);
  
  return mongoose.connect(String(uri), {
    serverSelectionTimeoutMS: 20000, // Increased to 20s
    socketTimeoutMS: 45000,
  }).catch(err => {
    const errorDetail = {
      name: err.name,
      code: err.code,
      message: err.message,
      reason: err.reason ? err.reason.message : "No reason provided"
    };
    console.error(`MongoDB Connection Object Error: ${JSON.stringify(errorDetail)}`);
    throw err;
  });
}

module.exports = connectDB;
