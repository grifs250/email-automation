const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
require('dotenv').config();

const Email = require('../models/email');
// const Contact = require('../models/contact');

const index_get = (req, res) => {
    res.render('index', { title: 'Send Emails', errors: [] });
};

const dashboard_get = async (req, res) => {
    res.render('dashboard', { title: 'Dashboard', emails });
};

const send_emails_post = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('index', {
            title: 'Send Emails',
            errors: errors.array(),
            oldInput: req.body
        });
    }

    try {
        // sets the email list
        const emails = [
            {
                name: "mikelis",
                email: "asdf@asdf.sdf"
            },
            {
                name: "Miķelis",
                email: "mikelisindex@gmail.com"
            }

        ];
        const EMAIL = process.env.EMAIL;
        const PASS = process.env.APP_PASS;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: EMAIL,
                pass: PASS,
            },
        });

        const htmlContent = fs.readFileSync(path.join(__dirname, '../views/emailTemplete.html'), 'utf-8');
        let sentEmails = 0;
        let failedEmails = 0;
        const failedEmailList = [];


        // for (const emailData of emails) {
        //     console.log(emailData.email)
        //     const personalizedHtmlContent = htmlContent.replace('{{name}}', emailData.name);
        //     const message = {
        //         from: EMAIL,
        //         to: emailData.email,
        //         subject: 'Your Training Program',
        //         html: personalizedHtmlContent,
        //     };
        //     console.log(message);

        //     try {
        //         await transporter.sendMail(message);
        //         sentEmails++;
        //     } catch (error) {
        //         failedEmails++;
        //         failedEmailList.push(emailData.email);
        //     }
        // }

        res.render('dashboard', {
            title: 'Dashboard',
            sentEmails,
            failedEmails,
            failedEmailList,
            emails
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', { title: 'Error', error: `Server Error: ${error}` });
    }
};

module.exports = {
    index_get,
    dashboard_get,
    send_emails_post
};
