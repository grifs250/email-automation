const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
const { checkBounces } = require('../services/imapService');
require('dotenv').config();

const Email = require('../models/email');
const Record = require('../models/record');
const EmailStatus = require('../models/emailStatus');
const ScheduledEmail = require('../models/scheduledEmail');

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

        res.status(200).json({ message: 'Record  deleted successfully' });
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
    // Validate incoming request data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('index', {
            title: 'Send Emails',
            errors: errors.array(),
            oldInput: req.body
        });
    }

    try {
        let emails;

        // Determine the list of emails to send to, based on user selection
        if (req.body.emailList === 'custom') {
            // If the user selected "Custom Emails", split the custom email input by commas
            emails = req.body.customEmails.split(',').map(email => email.trim());
        } else {
            // Otherwise, fetch the list of emails from the database based on the selected list name
            const emailList = await Email.find({ listName: req.body.emailList });
            emails = emailList.map(e => e.email);
        }

        // Create a new record of the email sending action in the database
        const record = new Record({
            subject: req.body.subject,
            message: req.body.message,
            totalEmails: emails.length
        });
        await record.save();

        // If the user has scheduled the emails, save the schedule in the database
        if (req.body.scheduleTime) {
            const scheduledEmail = new ScheduledEmail({
                recordId: record._id,
                scheduledTime: new Date(req.body.scheduleTime),
            });
            await scheduledEmail.save();
        }

        // Configure the email transporter using Nodemailer
        const EMAIL = process.env.EMAIL;
        const PASS = process.env.APP_PASS;
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: EMAIL, pass: PASS }
        });

        // Determine the email content, either custom or template-based
        let htmlContent;
        if (req.body.emailTemplate === 'custom') {
            // Use the custom message provided by the user
            htmlContent = req.body.message;
        } else {
            // Load the selected HTML template from the views directory
            htmlContent = fs.readFileSync(path.join(__dirname, `../views/${req.body.emailTemplate}.html`), 'utf-8');
        }

        // Counters to track the number of successfully sent and failed emails
        let sentEmails = 0;
        let failedEmails = 0;

        // Loop through each email address and attempt to send the email
        for (const email of emails) {
            try {
                const message = {
                    from: EMAIL,
                    to: email,
                    subject: req.body.subject,
                    html: htmlContent.replace('{{name}}', email),
                };

                // Send the email using the transporter
                await transporter.sendMail(message);
                sentEmails++;

                // Record the successful email in the database
                const emailStatus = new EmailStatus({
                    recordId: record._id,
                    email
                });
                await emailStatus.save();

            } catch (err) {
                console.error(`Failed to send email to ${email}:`, err);
                failedEmails++;

                // Record the failed email in the database
                const emailStatus = new EmailStatus({
                    recordId: record._id,
                    email,
                    status: 'failed'
                });
                await emailStatus.save();
            }
        }

        // Update the record with the final counts of sent and failed emails
        record.sentEmails = sentEmails;
        record.failedEmails = failedEmails;
        await record.save();

        // Redirect to the dashboard view of this specific record
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
