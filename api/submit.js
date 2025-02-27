import { connectToDatabase, closeDatabaseConnection } from '../utils/db';
import rateLimit from 'express-rate-limit';
import { sendEmail } from '../utils/email';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
      nextRetry: new Date(),
      template: 'training_program',
      processed: false
    };

    // Quick insert to tasks collection
    await db.collection('tasks').insertOne(task);

    // Send JSON response instead of redirect
    res.status(202).json({ 
      success: true,
      message: 'Task queued successfully'
    });

    // Process in background
    try {
      await processTask(task, db);
    } catch (error) {
      console.error('Background task error:', error);
    }

  } catch (error) {
    console.error('Submit error:', error.message);
    await closeDatabaseConnection().catch(console.error);
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to process request'
    });
  }
}

async function processTask(task, db) {
  try {
    // Save to subscribers collection
    const subscriber = await db.collection('subscribers').insertOne({
      email: task.email,
      name: task.name,
      createdAt: new Date()
    });

    // Send email using your existing email service
    await sendTrainingProgramEmail(task.email, task.name);

    // Update task status
    await db.collection('tasks').updateOne(
      { _id: task._id },
      { 
        $set: { 
          status: 'completed',
          completedAt: new Date(),
          subscriberId: subscriber.insertedId,
          processed: true
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

async function sendTrainingProgramEmail(email, name) {
  const emailData = {
    to: email,
    subject: 'Tava treniņu programma',
    template: 'training_program',
    context: {
      name: name || 'Sportist',
      programLink: "https://docs.google.com/spreadsheets/d/1oMrSgnYp54GaVxjGBW4_7Q3EmmVBs1GFg_k99bb8Y-E/edit?usp=sharing"
    }
  };

  await sendEmail(emailData);
} 