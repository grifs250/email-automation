const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Email = require('../models/email');

// Render the list creation form
const renderListForm = (req, res) => {
    res.render('lists', { title: "Lists", errors: [] });
};

// Handle the creation of a new email list
const createList = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.render('lists', { errors: errors.array() });
    }

    try {
        const { listName, emails } = req.body;
        const emailArray = emails.split(',').map(email => ({
            name: listName, // Assuming you want to use the list name as the name for each entry
            email: email.trim(),
        }));

        // Use the listName as the collection name
        const ListModel = mongoose.model(listName, Email.schema, listName);

        // Insert the emails into the collection
        await ListModel.insertMany(emailArray);

        res.redirect('/lists'); // Redirect to the lists page or a success page
    } catch (error) {
        console.error('Error creating email list:', error);
        res.status(500).render('lists', { errors: [{ msg: 'Failed to create email list' }] });
    }
};

module.exports = {
    renderListForm,
    createList
};
