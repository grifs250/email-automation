import { MongoClient } from 'mongodb';

export const config = {
  runtime: 'edge',
  regions: ['arn1'],
};

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGODB_URI, {
    connectTimeoutMS: 3000,
    socketTimeoutMS: 3000,
  });
  return client.connect();
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { status: 405 }
    );
  }

  try {
    const body = await req.json();
    const { email, name } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }), 
        { status: 400 }
      );
    }

    const client = await connectToDatabase();
    const db = client.db(process.env.MONGODB_DB);

    const document = {
      email,
      name: name || '',
      createdAt: new Date(),
      status: 'pending'
    };

    const result = await db.collection('subscribers')
      .insertOne(document);

    await client.close();

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: result.insertedId 
      }), 
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Submission failed', 
        details: 'Service temporarily unavailable' 
      }), 
      { 
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 