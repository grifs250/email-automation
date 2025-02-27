const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');
const Email = require('../models/email');
const path = require('path');
const ejs = require('ejs');
require('dotenv').config();

// Create transporter once
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.APP_PASS,
    },
});

// Route Handlers
const index_get = (req, res) => {
    res.render('index', { title: 'Treniņprogramma', errors: [] });
};

const tnx_get = (req, res) => {
    res.render('tnx', { title: 'Paldies' });
};

const tnx_post = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('index', {
            title: 'Treniņprogramma',
            errors: errors.array(),
            oldInput: req.body
        });
    }

    try {
        // Save to database first
        const user = new Email(req.body);
        await user.save();
        
        // Redirect immediately
        res.redirect('/tnx');

        // Send email in background
        try {
            const emailHTML = await ejs.renderFile(
                path.join(__dirname, '../views/mail.ejs'),
                { 
                    name: user.name,
                    programLink: "https://docs.google.com/spreadsheets/d/1oMrSgnYp54GaVxjGBW4_7Q3EmmVBs1GFg_k99bb8Y-E/edit?usp=sharing"
                }
            );

            const message = {
                from: process.env.EMAIL,
                to: user.email,
                subject: 'Treniņu programma',
                html: emailHTML,
            };

            await transporter.sendMail(message);
            console.log(`Message sent to: ${user.email}`);
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            // Don't affect user experience if email fails
        }

    } catch (error) {
        console.error('Error:', error);
        // If it's a duplicate email error
        if (error.code === 11000) {
            return res.status(400).render('index', {
                title: 'Treniņprogramma',
                errors: [{ msg: 'Šis e-pasts jau ir reģistrēts' }]
            });
        }
        res.status(500).render('error', { title: 'Error' });
    }
};

module.exports = {
    index_get,
    tnx_get,
    tnx_post,
};
