const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/employee_task_management_db';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Could not connect to primary URI (${uri}): ${error.message}`);

    // In development or testing, fall back to mongodb-memory-server
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[MongoDB] Starting fallback MongoMemoryServer for standalone development/testing...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongod = await MongoMemoryServer.create();
        const memUri = mongod.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`[MongoDB] Connected to In-Memory MongoDB at: ${memUri}`);
        return conn;
      } catch (memErr) {
        console.error(`[MongoDB] Failed to start fallback In-Memory MongoDB: ${memErr.message}`);
      }
    }

    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
    console.log('[MongoDB] Disconnected successfully');
  } catch (err) {
    console.error(`[MongoDB] Disconnect error: ${err.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
