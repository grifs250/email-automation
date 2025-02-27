import express from 'express';
import rateLimit from 'express-rate-limit';

const app = express();

// Configure trust proxy correctly
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

// Create rate limiter with proper configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: false, // Disable express-rate-limit's trust proxy
  keyGenerator: (req) => {
    // Use X-Forwarded-For from Vercel
    return req.headers['x-forwarded-for'] || req.ip;
  }
});

// Apply rate limiting to all routes
app.use(limiter);

// ... rest of your server code 