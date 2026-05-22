const mongoose = require("mongoose");

let cachedConnection = null;

async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("MONGODB_URI is not set. Database calls will fail until it is configured.");
    return null;
  }

  cachedConnection = await mongoose.connect(uri);
  return cachedConnection;
}

module.exports = connectDB;
