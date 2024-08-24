const express = require('express');
const { body } = require('express-validator');
const emailController = require('../controllers/emailController');
// const trackingController = require('../controllers/trackingController');

const router = express.Router();

// GET Routes
router.get('/', emailController.renderEmailForm);
router.get('/dashboard', emailController.renderDashboardList);
router.get('/dashboard/:id', emailController.renderDashboardDetails);
// router.get('/track-open', trackingController.trackOpen);
// router.get('/track-click', trackingController.trackClick);

// POST Routes
router.post('/send', [
    body('emailList')
        .trim()
        .notEmpty().withMessage('Email list selection is required')
        .escape(),
    body('emailTemplate')
        .trim()
        .notEmpty().withMessage('Email template selection is required')
        .escape(),
    body('subject')
        .trim()
        .notEmpty().withMessage('Subject is required')
        .escape(),
    body('message')
        .trim()
        .if(body('emailTemplate').equals('custom')) // Only validate message if custom template is selected
        .notEmpty().withMessage('Message is required for custom content')
        .escape(),
], emailController.sendEmails);

// DELETE route for deleting records
router.delete('/dashboard/:id', emailController.deleteRecord);

module.exports = router;
