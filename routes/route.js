const express = require('express');
const { body } = require('express-validator');
const appController = require('../controller/appController.js');

const router = express.Router();

// Routes
router.get('/', appController.index_get);
router.get('/tnx', appController.tnx_get);
router.post('/tnx', [
    // Validate and sanitize inputs "provides additional security"
    body('name')
        .trim()
        .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long')
        .isLength({ max: 100 }).withMessage('Name must be at most 100 characters long')
        .escape(),
    body('email')
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),
], appController.tnx_post);

module.exports = router;
