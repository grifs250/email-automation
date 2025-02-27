const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');
const Email = require('../models/email');
const fs = require('fs');
const path = require('path'); // Added path for reading email template
const ejs = require('ejs');
require('dotenv').config();

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
        // Add consent validation
        if (!req.body.consent) {
            return res.status(400).render('index', {
                title: 'Sākums',
                errors: ['Lūdzu, piekrītiet lietošanas noteikumiem']
            });
        }

        // Create and save user email data
        const user = new Email(req.body);
        await user.save();
        console.log(`${user.name}, ${user.email} saved to the DB`);

        // Email configuration
        const EMAIL = process.env.EMAIL;
        const PASS = process.env.APP_PASS;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: EMAIL,
                pass: PASS,
            },
        });

        // Render mail.ejs template
        const emailHTML = await ejs.renderFile(
            path.join(__dirname, '../views/mail.ejs'),
            { 
                name: user.name,
                programLink: "https://docs.google.com/spreadsheets/d/1oMrSgnYp54GaVxjGBW4_7Q3EmmVBs1GFg_k99bb8Y-E/edit?usp=sharing"
            }
        );

        const message = {
            from: EMAIL,
            to: user.email,
            subject: 'Treniņu programma',
            html: emailHTML,
        };

        // Send email
        await transporter.sendMail(message);
        console.log(`Message sent to: ${user.email}`);

        res.redirect('/tnx');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', { title: 'Error' });
    }
};

module.exports = {
    index_get,
    tnx_get,
    tnx_post,
};
