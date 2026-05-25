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

  cachedConnection = await mongoose.connect(uri, {
    maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 100),
    minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE || 5),
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 8000),
    socketTimeoutMS: Number(process.env.MONGODB_SOCKET_TIMEOUT_MS || 8000),
    maxIdleTimeMS: Number(process.env.MONGODB_MAX_IDLE_TIME_MS || 60000)
  });
  return cachedConnection;
}

module.exports = connectDB;
