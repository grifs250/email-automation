import { connectToDatabase } from '../utils/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.time('submit-operation');
  
  try {
    // Validate input first before database connection
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Connect to database with shorter timeout
    const db = await Promise.race([
      connectToDatabase(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('DB Connection timeout')), 3000)
      )
    ]);

    // Prepare the document before the insert
    const document = {
      email,
      name: name || '',
      createdAt: new Date(),
      status: 'pending'
    };

    // Quick insert with shorter timeout
    const result = await Promise.race([
      db.collection('subscribers').insertOne(document),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('DB Insert timeout')), 3000)
      )
    ]);

    console.timeEnd('submit-operation');
    
    // Send immediate response
    res.status(200).json({ success: true, id: result.insertedId });

  } catch (error) {
    console.error('Submit error:', error.message);
    
    // Send specific error messages
    if (error.message.includes('timeout')) {
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        details: 'Please try again in a few moments'
      });
    }
    
    return res.status(500).json({ 
      error: 'Submission failed', 
      details: 'Internal server error'
    });
  }
} 