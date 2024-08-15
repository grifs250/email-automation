const express = require('express');
const { body } = require('express-validator');
const emailController = require('../controllers/emailController');

const router = express.Router();


router.get('/', emailController.index_get);
router.get('/dashboard', emailController.dashboard_list_get);
router.get('/dashboard/:id', emailController.dashboard_get);

router.post('/send', [
    body('subject')
        .trim()
        .notEmpty().withMessage('Subject is required')
        .escape(),
    body('message')
        .trim()
        .notEmpty().withMessage('Message is required')
        .escape(),
], emailController.send_emails_post);

module.exports = router;
