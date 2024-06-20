// routes/email.js
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Email = require('../models/Email');

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Route to handle email submission
router.post('/subscribe', async (req, res) => {
    const { name, email } = req.body;

    try {
        let existingEmail = await Email.findOne({ email });
        if (existingEmail) {
            // Email already exists, send the email without saving
            sendWelcomeEmail(name, email);
            return res.status(200).send('Email already in the list. Welcome email sent again.');
        }

        // Save new email to the database
        const newEmail = new Email({ name, email });
        await newEmail.save();

        // Send welcome email
        sendWelcomeEmail(name, email);

        res.status(200).send('Email saved and welcome email sent.');
    } catch (err) {
        res.status(500).send('Server error');
    }
});

function sendWelcomeEmail(name, email) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome!',
        text: `Hello ${name}, welcome to our service!`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}

module.exports = router;
