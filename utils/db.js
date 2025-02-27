import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

const options = {
  connectTimeoutMS: 5000,
  socketTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000,
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 270000, // 4.5 minutes
  keepAlive: true
};

export async function connectToDatabase() {
  try {
    // Check if we have a valid cached connection
    if (cachedClient && cachedDb) {
      // Test the connection
      await cachedClient.db().admin().ping();
      return cachedDb;
    }

    // Close any existing connection if it exists
    if (cachedClient) {
      await cachedClient.close();
      cachedClient = null;
      cachedDb = null;
    }

    if (!process.env.MONGODB_URI) {
      throw new Error('Please define MONGODB_URI environment variable');
    }

    const client = await MongoClient.connect(process.env.MONGODB_URI, options);
    const db = client.db(process.env.MONGODB_DB);

    // Cache the connection
    cachedClient = client;
    cachedDb = db;

    return db;
  } catch (error) {
    console.error('Database connection error:', error);
    // Clear cache if connection fails
    cachedClient = null;
    cachedDb = null;
    throw error;
  }
}

// Optional: Add a cleanup function
export async function closeDatabaseConnection() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
} 