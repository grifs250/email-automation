const express = require('express');
const router = express.Router();
const Contact = require('../models/contact');
const { body, validationResult } = require('express-validator');

// Route to display all contacts
router.get('/contacts', async (req, res) => {
    try {
        const contacts = await Contact.find({});
        res.render('contacts', { title: 'Contacts', contacts });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).send('Error fetching contacts');
    }
});

// Route to show form for adding a new contact
router.get('/contacts/new', (req, res) => {
    res.render('new-contact', { title: 'Add New Contact', errors: [], oldInput: {} });
});

// Route to handle the creation of a new contact
router.post('/contacts', [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
    body('email').isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('new-contact', {
            title: 'Add New Contact',
            errors: errors.array(),
            oldInput: req.body
        });
    }

    try {
        const contact = new Contact(req.body);
        await contact.save();
        res.redirect('/contacts');
    } catch (error) {
        console.error('Error saving contact:', error);
        res.status(500).send('Error saving contact');
    }
});

module.exports = router;
