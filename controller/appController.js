const nodemailer = require('nodemailer');
const Email = require('../models/email');
const fs = require('fs');
require('dotenv').config();

// Route Handlers
const index_get = (req, res) => {
    res.render('index', { title: 'Treniņprogramma' });
};

const tnx_get = (req, res) => {
    res.render('tnx', { title: 'Paldies' });
};

const mail_get = (req, res) => {
    res.render('mail', { name: 'Name' });
};

const tnx_post = async (req, res) => {
    try {
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

        // Load email template and replace variables
        const htmlContent = fs.readFileSync('./views/mail.ejs', 'utf-8');
        const personalizedHtmlContent = htmlContent.replace('{{name}}', user.name);

        const message = {
            from: EMAIL,
            to: user.email,
            subject: 'Treniņprogramma',
            html: personalizedHtmlContent,
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
    mail_get,
};
