import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

const options = {
  connectTimeoutMS: 5000,
  socketTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000,
  maxPoolSize: 10,
  minPoolSize: 5
};

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return cachedDb;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('Please define MONGODB_URI environment variable');
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI, options);
  const db = client.db(process.env.MONGODB_DB);

  cachedClient = client;
  cachedDb = db;

  return db;
} 