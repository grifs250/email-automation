const nodemailer = require('nodemailer');
const Email = require('../models/email');
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
require('dotenv').config();

const index_get = (req, res) => {
    res.render('index', { title: 'Send Emails', errors: [] });
};

const dashboard_get = async (req, res) => {
    const emails = await Email.find({});
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
        const emails = await Email.find({});
        const EMAIL = process.env.EMAIL;
        const PASS = process.env.APP_PASS;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: EMAIL,
                pass: PASS,
            },
        });

        const htmlContent = fs.readFileSync(path.join(__dirname, '../views/emailTemplate.ejs'), 'utf-8');
        let sentEmails = 0;
        let failedEmails = 0;
        const failedEmailList = [];

        for (const emailData of emails) {
            const personalizedHtmlContent = htmlContent.replace('{{name}}', emailData.name);
            const message = {
                from: EMAIL,
                to: emailData.email,
                subject: 'Your Training Program',
                html: personalizedHtmlContent,
            };

            try {
                await transporter.sendMail(message);
                sentEmails++;
            } catch (error) {
                failedEmails++;
                failedEmailList.push(emailData.email);
            }
        }

        res.render('dashboard', {
            title: 'Dashboard',
            sentEmails,
            failedEmails,
            failedEmailList,
            emails
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', { title: 'Error' });
    }
};

module.exports = {
    index_get,
    dashboard_get,
    send_emails_post
};
