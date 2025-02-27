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

    const db = await connectToDatabase();
    
    // Queue the task first
    const task = {
      email,
      name: name || '',
      createdAt: new Date(),
      status: 'pending',
      retries: 0,
      nextRetry: new Date()
    };

    // Quick insert to tasks collection
    await db.collection('tasks').insertOne(task);

    // Send immediate response
    res.status(202).json({ 
      message: 'Task queued successfully',
      status: 'pending'
    });

    // Process in background
    try {
      await processTask(task, db);
    } catch (error) {
      console.error('Background task error:', error);
    }

    console.timeEnd('submit-operation');
    return res.status(200).json({ success: true, id: task._id });

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
      error: 'Failed to queue task', 
      details: 'Internal server error'
    });
  }
}

async function processTask(task, db) {
  try {
    // Your processing logic here
    const result = await db.collection('subscribers').insertOne({
      email: task.email,
      name: task.name,
      createdAt: new Date()
    });

    // Update task status
    await db.collection('tasks').updateOne(
      { _id: task._id },
      { 
        $set: { 
          status: 'completed',
          completedAt: new Date(),
          result: result.insertedId
        }
      }
    );

  } catch (error) {
    // Handle failure
    await db.collection('tasks').updateOne(
      { _id: task._id },
      { 
        $set: { 
          status: 'failed',
          error: error.message,
          failedAt: new Date()
        },
        $inc: { retries: 1 }
      }
    );
    throw error;
  }
} 