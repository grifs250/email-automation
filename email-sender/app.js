const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const emailRoutes = require('./routes/emailRoutes');
const listRoutes = require('./routes/lists');

// Add error handling middleware import
const errorHandler = require('./middleware/errorHandler');

// Express app
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Database Connection Error:', err));

// Middleware setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());

// // Track email opens
// router.get('/track-open', async (req, res) => {
//     const { email, recordId } = req.query;

//     try {
//         await EmailStatus.findOneAndUpdate(
//             { recordId, email },
//             { $inc: { opens: 1 } }
//         );
//         res.status(200).send(); // Invisible response
//     } catch (error) {
//         console.error('Error tracking open:', error);
//         res.status(500).send();
//     }
// });

// // Track email clicks
// router.get('/track-click', async (req, res) => {
//     const { email, recordId, url } = req.query;
// });

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        status: 429,
        error: 'Too many requests, please try again later.',
    },
    headers: true,
});
app.use(limiter);

// Routes
app.use(emailRoutes);
app.use('/lists', listRoutes);

// 404 Page Not Found handler
app.use((req, res) => {
    res.status(404).render('404', { title: '404 - Page Not Found' });
});

// Global error handling middleware
app.use(errorHandler);

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}...`);
});
