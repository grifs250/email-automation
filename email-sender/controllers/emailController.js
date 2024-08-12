const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
const { checkBounces } = require('../services/imapService');
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

    // INPUT VALIDATION
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('index', {
            title: 'Send Emails',
            errors: errors.array(),
            oldInput: req.body
        });
    }

    // MAIN
    try {
        // set up
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
        const subject = 'Send Bulk Emails'
        let sentEmails = 0;
        let failedEmails = 0;
        const failedEmailList = [];
        const emailMetadata = [];

        // email sending
        for (const emailData of emails) {
            try {
                console.log(emailData.email)
                const personalizedHtmlContent = htmlContent.replace('{{name}}', emailData.name);
                // creat message
                const message = {
                    from: EMAIL,
                    to: emailData.email,
                    subject: subject,
                    html: personalizedHtmlContent,
                };
                console.log(message);

                await transporter.sendMail(message);
                sentEmails++
                emailMetadata.push({ email: emailData.email, subject: subject, sentAt: new Date() });

            } catch (err) {
                console.error(`Failed to send email to ${emailData.email}:`, err);
                failedEmails++;
                failedEmailList.push(emailData.email);
            };
        }

        try {
            const bounces = await checkBounces(emailMetadata);
            if (bounces && bounces.length > 0) {
                failedEmails += bounces.length;
                failedEmailList.push(...bounces);
                // console.log('Bounces:', bounces);
            }
        } catch (err) {
            console.error('Failed to check bounces:', err);
        }

        // rendering the dashboard
        res.render('dashboard', {
            title: 'Dashboard',
            sentEmails,
            failedEmails,
            failedEmailList,
            emails
        });

    // ERROR
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', { title: 'Error', error: `Server Error: ${error}` });
    }
};

// EXPORTING
module.exports = {
    index_get,
    dashboard_get,
    send_emails_post
};
