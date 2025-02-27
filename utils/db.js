import { MongoClient } from 'mongodb';

const options = {
  connectTimeoutMS: 5000,
  socketTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000,
};

export async function connectToDatabase() {
  const client = await MongoClient.connect(process.env.MONGODB_URI, options);
  return client.db(process.env.MONGODB_DB);
} 