const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const appRoute = require('./routes/route.js');
require('dotenv').config();

// Express app
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to DB'))
    .catch((err) => console.error('DB Connection Error:', err));

// Register view engine
app.set('view engine', 'ejs');

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10kb' })); // Limit request body to 10KB
app.use(morgan('dev'));
app.use(helmet());

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    message: {
        status: 429,
        error: 'Too many requests from this IP, please try again later.',
    },
    headers: true, // Include rate limit information in the `RateLimit-*` headers
});

// Apply the rate limiting middleware to all requests
app.use(limiter);

// Routes
app.use(appRoute);

// 404 Page
app.use((req, res) => {
    res.status(404).render('index', { title: '404' });
});

// Listen for requests
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}...`);
});
