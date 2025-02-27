import { connectToDatabase } from '../utils/db';

export default async function handler(req, res) {
  // Secure the worker endpoint
  if (req.headers['x-worker-key'] !== process.env.WORKER_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = await connectToDatabase();
  
  // Find and process pending tasks
  const tasks = await db.collection('tasks')
    .find({ 
      status: 'pending',
      nextRetry: { $lte: new Date() },
      retries: { $lt: 3 }  // Max 3 retries
    })
    .limit(10)
    .toArray();

  const results = await Promise.allSettled(
    tasks.map(task => processTask(task, db))
  );

  return res.json({
    processed: tasks.length,
    results: results.map(r => r.status)
  });
} 