const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
const { checkBounces } = require('../services/imapService');
require('dotenv').config();

const Email = require('../models/email');
const Record = require('../models/record');
const EmailStatus = require('../models/emailStatus');
// const Contact = require('../models/contact');


const index_get = (req, res) => {
    res.render('index', { title: 'Send Emails', errors: [] });
};


const dashboard_list_get = async (req, res) => {
    try {
        const records = await Record.find().sort({ sentAt: -1 }); // Sort by most recent
        res.render('dashboard_list', {
            title: 'Dashboard Overview',
            records
        });
    } catch (error) {
        console.error('Error fetching dashboard list:', error);
        res.status(500).render('error', { title: 'Error', error: 'Failed to load dashboard list' });
    }
};


const dashboard_get = async (req, res) => {
    try {
        const records = await Record.findById(req.params.id);
        const emailStatuses = await EmailStatus.find({ recordId: req.params.id });

        res.render('dashboard', {
            title: `Dashboard - ${records.subject}`,
            bulkSend,
            emailStatuses
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).render('error', { title: 'Error', error: 'Failed to load dashboard' });
    }
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

    try {
        // Sample email data
        const emails = [
            { name: "mikelis", email: "asdf@asdf.sdf" },
            { name: "Miķelis", email: "mikelisindex@gmail.com" }
        ];

        // Create and save a Record for the bulk email send
        const record = new Record({
            subject: req.body.subject,
            message: req.body.message,
            totalEmails: emails.length
        });
        await record.save();

        const EMAIL = process.env.EMAIL;
        const PASS = process.env.APP_PASS;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: EMAIL, pass: PASS }
        });

        const htmlContent = fs.readFileSync(path.join(__dirname, '../views/emailTemplate.html'), 'utf-8');
        let sentEmails = 0;
        let failedEmails = 0;

        // Sending emails and tracking status
        for (const emailData of emails) {
            try {
                const personalizedHtmlContent = htmlContent.replace('{{name}}', emailData.name);
                const message = {
                    from: EMAIL,
                    to: emailData.email,
                    subject: req.body.subject,
                    html: personalizedHtmlContent,
                };

                await transporter.sendMail(message);
                sentEmails++;

                // Save successful email status
                const emailStatus = new EmailStatus({
                    recordId: record._id,
                    email: emailData.email
                });
                await emailStatus.save();

            } catch (err) {
                console.error(`Failed to send email to ${emailData.email}:`, err);
                failedEmails++;

                // Save failed email status
                const emailStatus = new EmailStatus({
                    bulkSendId: record._id,
                    email: emailData.email,
                    status: 'failed'
                });
                await emailStatus.save();
            }
        }

        // Update the bulk email send record with the results
        record.sentEmails = sentEmails;
        record.failedEmails = failedEmails;
        await record.save();

        // Redirect to the dashboard for this bulk email send
        res.redirect(`/dashboard/${record._id}`);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', { title: 'Error', error: `Server Error: ${error}` });
    }
};

// EXPORTING
module.exports = {
    index_get,
    dashboard_get,
    send_emails_post,
    dashboard_list_get
};
