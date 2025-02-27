const express = require('express');
const { body } = require('express-validator');
const appController = require('../controller/appController.js');
const emailValidator = require('deep-email-validator');

const router = express.Router();

// Routes
router.get('/', appController.index_get);
router.get('/tnx', appController.tnx_get);
router.get('/terms', (req, res) => {
    res.render('terms', { title: 'Lietošanas noteikumi' });
});

// Simplified submit route
router.post('/submit', [
    body('name').trim().escape(),
    body('email').normalizeEmail({ gmail_remove_dots: false }),
    body('consent').exists()
], appController.tnx_post);

module.exports = router;
