import { cache } from './cache';

export default async function handler(req, res) {
  console.time('operation');
  
  // Check cache first
  const cached = await cache.get('key');
  if (cached) {
    return res.status(200).json(cached);
  }

  const result = await someSlowOperation();
  
  // Store in cache
  await cache.set('key', result, 3600); // Cache for 1 hour
  
  console.timeEnd('operation');
  res.status(200).json(result);
} 