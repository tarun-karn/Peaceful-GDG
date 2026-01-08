const mongoose = require("mongoose");

async function connectDB() {
  return mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("Database Connected"))
    .catch((err) => {
      console.error(
        "Error connecting the DB:",
        err && err.message ? err.message : err
      );
      throw err;
    });
}

module.exports = connectDB;
