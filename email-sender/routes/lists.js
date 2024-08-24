const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const listController = require('../controllers/listController');

// Route to render the create list form
router.get('/', listController.renderListForm);

// Route to handle list creation
router.post('/create', [
    body('listName')
        .trim()
        .notEmpty().withMessage('List name is required')
        .escape(),
    body('emails')
        .trim()
        .notEmpty().withMessage('Emails are required')
        .custom(value => {
            const emails = value.split(',').map(email => email.trim());
            const emailRegex = /.+\@.+\..+/;
            for (let email of emails) {
                if (!emailRegex.test(email)) {
                    throw new Error(`Invalid email format: ${email}`);
                }
            }
            return true;
        }),
], listController.createList);

module.exports = router;
