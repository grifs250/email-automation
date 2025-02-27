import { connectToDatabase, closeDatabaseConnection } from '../utils/db';
import { sendEmail } from '../utils/email';

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
    
    // Check for existing email
    const existingSubscriber = await db.collection('subscribers').findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({ 
        success: false,
        error: 'Email already registered'
      });
    }
    
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

    // Send immediate response to user
    res.status(202).json({ 
      success: true,
      message: 'Task queued successfully'
    });

    // Process in background after response is sent
    try {
      await processTask(task, db);
    } catch (error) {
      console.error('Background task error:', error);
    }

  } catch (error) {
    console.error('Submit error:', error.message);
    await closeDatabaseConnection().catch(console.error);
    
    // Handle duplicate key errors specifically
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to process request'
    });
  }
}

// Background processing function
async function processTask(task, db) {
  try {
    // Save to subscribers collection
    const subscriber = await db.collection('subscribers').insertOne({
      email: task.email,
      name: task.name,
      createdAt: new Date()
    });

    // Send email
    await sendTrainingProgramEmail(task.email, task.name);

    // Update task status on success
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
    // Update task status on failure
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