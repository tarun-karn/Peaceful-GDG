const mongoose = require("mongoose");
const path = require("path");

function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    return Promise.reject(new Error("MONGO_URI is missing"));
  }
  
  const cleanUri = String(uri).trim().replace(/\s/g, '');
  return mongoose.connect(cleanUri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    autoIndex: true,
  }).catch(err => {
    // Surface the underlying reason if it exists (e.g. Authentication failed)
    if (err.reason && err.reason.error) {
      err.message += ` (Details: ${err.reason.error.message})`;
    }
    throw err;
  });
}

module.exports = connectDB;
