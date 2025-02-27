const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const appRoute = require('./routes/route.js');
const emailValidator = require('deep-email-validator');
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
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'",
                "'unsafe-eval'",
                "https://www.googletagmanager.com"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://cdnjs.cloudflare.com",
                "https://use.fontawesome.com",
            ],
            imgSrc: [
                "'self'",
                "data:",
                "https:",
            ],
            connectSrc: [
                "'self'",
                "https://www.googletagmanager.com"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com",
                "https://use.fontawesome.com",
                "https://use.fontawesome.com/releases/v6.0.0/webfonts/"
            ],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false
}));

// Enable trust proxy
app.set('trust proxy', true);

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minūtes
    max: 100, // Limits katrai IP adresei - 100 pieprasījumi
    message: {
        status: 429,
        error: 'Pārāk daudz pieprasījumu no šīs IP adreses. Lūdzu, mēģiniet vēlāk.',
    },
    headers: true,
});

// Apply rate limiting
app.use(limiter);

// Rate limiter configuration
const submitLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 5, // limit each IP to 5 submissions per window
    message: 'Too many attempts, please try again later'
});

// Email validation function
async function isEmailValid(email) {
    const { valid, reason, validators } = await emailValidator.validate(email);
    return {
        valid,
        reason,
        validators
    };
}

// Routes
app.use(appRoute);

// 404 Page
app.use((req, res) => {
    res.status(404).render('error', { title: '404', errors: []});
});

// Listen for requests
const port = process.env.PORT || 3000;
app.listen(port)
    .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is busy, trying ${port + 1}`);
            app.listen(port + 1);
        } else {
            console.error('Server error:', err);
        }
    })
    .on('listening', () => {
        console.log(`Server is listening on port ${port}...`);
    });
