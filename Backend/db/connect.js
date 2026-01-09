const mongoose = require("mongoose");
const path = require("path");

function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    return Promise.reject(new Error("MONGO_URI is missing"));
  }
  
  return mongoose.connect(uri.trim(), {
    serverSelectionTimeoutMS: 10000,
  }).catch(err => {
    // Surface the underlying reason if it exists (e.g. Authentication failed)
    if (err.reason && err.reason.error) {
      err.message += ` (Details: ${err.reason.error.message})`;
    }
    throw err;
  });
}

module.exports = connectDB;
