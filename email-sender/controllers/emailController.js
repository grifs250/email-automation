const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
const { checkBounces } = require('../services/imapService');
require('dotenv').config();

const Email = require('../models/email');
const Record = require('../models/record');
const EmailStatus = require('../models/emailStatus');

// Render the email form
const renderEmailForm = (req, res) => {
    res.render('index', { title: 'Send Emails', errors: [] });
};

// Delete a record
const deleteRecord = async (req, res) => {
    try {
        const recordId = req.params.id;
        await Record.findByIdAndDelete(recordId);
        await EmailStatus.deleteMany({ recordId });

        res.status(200).json({ message: 'Record deleted successfully' });
    } catch (error) {
        console.error('Error deleting record:', error);
        res.status(500).json({ error: 'Failed to delete record' });
    }
};

// Render the list of dashboard records
const renderDashboardList = async (req, res) => {
    try {
        const records = await Record.find().sort({ sentAt: -1 });

        if (!records) {
            return res.status(404).render('error', { title: 'Error', error: 'No records found' });
        }

        // Check for email bounces
        await checkBounces();

        res.render('dashboard_list', {
            title: 'Dashboard Overview',
            records
        });
    } catch (error) {
        console.error('Error fetching dashboard list:', error);
        res.status(500).render('error', { title: 'Error', error: 'Failed to load dashboard list' });
    }
};

// Render the details of a specific dashboard record
const renderDashboardDetails = async (req, res) => {
    try {
        const record = await Record.findById(req.params.id);

        if (!record) {
            return res.status(404).render('error', { title: 'Error', error: 'Record not found' });
        }

        const emailStatuses = await EmailStatus.find({ recordId: req.params.id });

        res.render('dashboard', {
            title: `Dashboard - ${record.subject}`,
            record,
            emailStatuses
        });
    } catch (error) {
        console.error('Error fetching dashboard details:', error);
        res.status(500).render('error', { title: 'Error', error: 'Failed to load dashboard details' });
    }
};

// Handle sending of emails
const sendEmails = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('index', {
            title: 'Send Emails',
            errors: errors.array(),
            oldInput: req.body
        });
    }

    try {
        const emails = [
            { name: "Jolina", email: "jolina@example.com" },
            { name: "Jane", email: "jane@example.com" }
        ];

        // Create and save a record of this email send
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
                    recordId: record._id,
                    email: emailData.email,
                    status: 'failed'
                });
                await emailStatus.save();
            }
        }

        // Update the record with the results
        record.sentEmails = sentEmails;
        record.failedEmails = failedEmails;
        await record.save();

        res.redirect(`/dashboard/${record._id}`);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', { title: 'Error', error: `Server Error: ${error}` });
    }
};

module.exports = {
    renderEmailForm,
    renderDashboardList,
    renderDashboardDetails,
    sendEmails,
    deleteRecord
};
