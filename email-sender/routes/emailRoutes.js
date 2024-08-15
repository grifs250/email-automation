const express = require('express');
const { body } = require('express-validator');
const emailController = require('../controllers/emailController');

const router = express.Router();

// GET Routes
router.get('/', emailController.renderEmailForm);
router.get('/dashboard', emailController.renderDashboardList);
router.get('/dashboard/:id', emailController.renderDashboardDetails);

// POST Routes
router.post('/send', [
    body('subject')
        .trim()
        .notEmpty().withMessage('Subject is required')
        .escape(),
    body('message')
        .trim()
        .notEmpty().withMessage('Message is required')
        .escape(),
], emailController.sendEmails);

// DELETE route for deleting records
router.delete('/dashboard/:id', emailController.deleteRecord);

module.exports = router;
