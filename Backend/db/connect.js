const mongoose = require("mongoose");
const path = require("path");

function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    return Promise.reject(new Error("MONGO_URI is missing"));
  }
  
  return mongoose.connect(uri.trim());
}

module.exports = connectDB;
