const express = require('express');
const rateLimit = require('express-rate-limit');
const app = express();

// Basic express configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure rate limiter
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 5, // limit each IP to 5 submissions per window
    handler: (req, res) => {
        res.status(429).send('Pārāk daudz mēģinājumu. Lūdzu mēģiniet vēlāk.');
    },
    keyGenerator: function (req) {
        return req.connection.remoteAddress;
    }
});

// Apply rate limiter to specific routes
app.use('/submit', limiter);
app.use('/api/submit', limiter);

module.exports = app; 