import { connectToDatabase, closeDatabaseConnection } from '../utils/db';
import rateLimit from 'express-rate-limit';

// Configure the rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  trustProxy: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress;
  },
  handler: (_, res) => {
    return res.status(429).json({
      error: 'Too many requests, please try again later.'
    });
  }
});

export default async function handler(req, res) {
  // Apply rate limiting
  await new Promise((resolve) => limiter(req, res, resolve));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.time('submit-operation');
  
  try {
    // Validate input first
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

    const document = {
      email,
      name: name || '',
      createdAt: new Date(),
      status: 'pending'
    };

    // Quick insert
    const result = await db.collection('subscribers').insertOne(document);

    console.timeEnd('submit-operation');
    return res.status(200).json({ success: true, id: result.insertedId });

  } catch (error) {
    console.error('Submit error:', error.message);
    
    // Close connection on error
    await closeDatabaseConnection().catch(console.error);
    
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