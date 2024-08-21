const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
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
app.set('views', path.join(__dirname, 'views'));

// Middleware for static files
app.use(express.static(path.join(__dirname, 'public')));

// Parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10kb' }));

// Logging
app.use(morgan('dev'));

// Security Headers with Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://www.googletagmanager.com", "'unsafe-inline'", "'unsafe-eval'"], // Allow GTM and inline scripts
            styleSrc: ["'self'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "'unsafe-inline'"], // Allow external styles and inline styles
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"], // Allow external fonts
            imgSrc: ["'self'", "data:"], // Allow images from self and data URIs
            connectSrc: ["'self'", "https://www.googletagmanager.com"], // Allow connections to GTM
            frameSrc: ["'self'"], // Default for iframes
            objectSrc: ["'none'"], // Block all object embeds
            upgradeInsecureRequests: [], // Enforces HTTPS
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// Enable trust proxy
app.set('trust proxy', true);

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: {
        status: 429,
        error: 'Too many requests from this IP, please try again later.',
    },
    headers: true,
});

// Apply rate limiting
app.use(limiter);

// Routes
app.use(appRoute);

// 404 Page
app.use((req, res) => {
    res.status(404).render('error', { title: '404', errors: []});
});

// Listen for requests
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}...`);
});
