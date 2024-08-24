const mongoose = require('mongoose');
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

const getEmailCompatibleCollections = async () => {
    const compatibleCollections = [];

    try {
        const collections = await mongoose.connection.db.listCollections().toArray();

        for (const collection of collections) {
            try {
                const DynamicModel = mongoose.model(collection.name, Email.schema, collection.name);
                
                // Check if the collection has documents
                const sampleDocument = await DynamicModel.findOne();
                
                if (sampleDocument) {
                    // Validate the document against the schema
                    const validationError = sampleDocument.validateSync();
                    
                    if (!validationError) {
                        // Add to list only if the document is valid
                        compatibleCollections.push(collection.name);
                    }
                }
            } catch (error) {
                console.error(`Collection ${collection.name} is not compatible: ${error.message}`);
            }
        }
    } catch (error) {
        console.error('Error fetching collections:', error);
    }

    return compatibleCollections;
};

const renderEmailForm = async (req, res) => {
    try {
        const emailLists = await getEmailCompatibleCollections();

        // Load available templates from the 'views/templates' directory
        const templatesDir = path.join(__dirname, '../views/templates');
        const templates = fs.readdirSync(templatesDir).filter(file => file.endsWith('.html'));

        // Render the view and pass emailLists and templates to the frontend
        res.render('index', { 
            title: 'Send Emails', 
            errors: [],
            emailLists,
            templates
        });
    } catch (error) {
        console.error('Error fetching email form data:', error);
        res.status(500).json({ error: 'Failed to load email form data' });
    }
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

        // Calculate the bounce count dynamically
        const bouncedEmailsCount = emailStatuses.filter(status => status.status === 'bounced').length;

        // Update the record with the new bouncedEmails count
        record.bouncedEmails = bouncedEmailsCount;
        await record.save();

        res.render('dashboard', {
            title: `Dashboard - ${record.subject}`,
            record,
            emailStatuses,
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
        const selectedList = req.body.emailList;
        let emailList;

        if (selectedList === 'custom') {
            // Use custom emails provided by the user
            emailList = req.body.customEmails.split(',').map(email => email.trim());
        } else {
            // Dynamically create or retrieve a model for the selected collection
            let DynamicEmailModel;
            if (mongoose.models[selectedList]) {
                DynamicEmailModel = mongoose.model(selectedList);
            } else {
                DynamicEmailModel = mongoose.model(selectedList, Email.schema, selectedList);
            }

            const emails = await DynamicEmailModel.find({}).select('email');
            emailList = emails.map(item => item.email);
        }

        // Create a new record for the email campaign
        const record = new Record({
            subject: req.body.subject,
            totalEmails: emailList.length
        });
        await record.save();

        // Handle scheduled emails
        if (req.body.scheduleTime) {
            const scheduledEmail = new ScheduledEmail({
                recordId: record._id,
                scheduledTime: new Date(req.body.scheduleTime),
            });
            await scheduledEmail.save();
        }

        // Setup email transporter
        const EMAIL = process.env.EMAIL;
        const PASS = process.env.APP_PASS;
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: EMAIL, pass: PASS }
        });

        // Prepare email content (either custom or template)
        let htmlContent;
        if (req.body.emailTemplate === 'custom') {
            htmlContent = fs.readFileSync(path.join(__dirname, `../views/templates/template/emailNewsletter.html`), 'utf-8');
            htmlContent = htmlContent.replace('{{message}}', req.body.message);
        } else {
            htmlContent = fs.readFileSync(path.join(__dirname, `../views/templates/${req.body.emailTemplate}.html`), 'utf-8');
        }

        // Include a tracking pixel for opens
        htmlContent += `<img src="https://yourdomain.com/track-open?recordId=${record._id}&email={{email}}" width="1" height="1" style="display:none;">`;


        let sentEmails = 0;
        let bouncedEmails = 0;

        for (const email of emailList) {
            if (!email) {
                console.error('Encountered a null or undefined email, skipping.');
                continue; // Skip this iteration
            }
        
            try {
                const message = {
                    from: EMAIL,
                    to: email,
                    subject: req.body.subject,
                    html: htmlContent.replace('{{email}}', email), // Replace email placeholder
                };
        
                await transporter.sendMail(message);
                sentEmails++;
        
                const emailStatus = new EmailStatus({
                    recordId: record._id,
                    email // Ensure email is not null
                });
                await emailStatus.save();
        
            } catch (err) {
                console.error(`Failed to send email to ${email}:`, err);
                bouncedEmails++;
        
                await EmailStatus.findOneAndUpdate(
                    { email },
                    { status: 'bounced', bouncedAt: new Date(), bounceType: 'hard' }
                );
            }
        }

        // Update record with sent and bounced emails
        record.sentEmails = sentEmails;
        record.bouncedEmails = bouncedEmails;
        await record.save();

        // Redirect to the specific dashboard view for this record
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
    deleteRecord,
};