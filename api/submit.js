import { connectToDatabase } from '../utils/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.time('submit-operation');
  
  try {
    // Connect to database with timeout
    const db = await Promise.race([
      connectToDatabase(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('DB Connection timeout')), 5000)
      )
    ]);

    const { email, name } = req.body;

    // Quick validation
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Insert with timeout
    const result = await Promise.race([
      db.collection('subscribers').insertOne({ 
        email, 
        name, 
        createdAt: new Date() 
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('DB Insert timeout')), 5000)
      )
    ]);

    console.timeEnd('submit-operation');
    return res.status(200).json({ success: true, id: result.insertedId });

  } catch (error) {
    console.error('Submit error:', error);
    return res.status(500).json({ 
      error: 'Submission failed', 
      details: error.message 
    });
  }
} 