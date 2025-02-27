const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');
const Email = require('../models/email');
const path = require('path');
const ejs = require('ejs');
require('dotenv').config();

// Create transporter once with optimized settings
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.APP_PASS,
    },
    pool: true,
    maxConnections: 1,
    rateDelta: 1000,
    rateLimit: 3,
    // Add timeout settings
    connectionTimeout: 3000,
    greetingTimeout: 3000,
    socketTimeout: 3000
});

// Queue for processing emails
const emailQueue = [];
let isProcessing = false;

async function processEmailQueue() {
    if (isProcessing || emailQueue.length === 0) return;
    
    isProcessing = true;
    
    while (emailQueue.length > 0) {
        const task = emailQueue.shift();
        try {
            const emailHTML = await ejs.renderFile(
                path.join(__dirname, '../views/mail.ejs'),
                task.context
            );

            await transporter.sendMail({
                from: process.env.EMAIL,
                to: task.email,
                subject: 'Treniņu programma',
                html: emailHTML,
            });
            
            console.log(`Email sent to: ${task.email}`);
            
            // Add delay between emails
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error('Failed to send email:', error);
        }
    }
    
    isProcessing = false;
}

// Route Handlers
const index_get = (req, res) => {
    res.render('index', { title: 'Treniņprogramma', errors: [] });
};

const tnx_get = (req, res) => {
    res.render('tnx', { title: 'Paldies' });
};

const tnx_post = async (req, res) => {
    // Validate input first
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('index', {
            title: 'Treniņprogramma',
            errors: errors.array(),
            oldInput: req.body
        });
    }

    try {
        // Quick DB check for duplicate
        const existingUser = await Email.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).render('index', {
                title: 'Treniņprogramma',
                errors: [{ msg: 'Šis e-pasts jau ir reģistrēts' }]
            });
        }

        // Redirect immediately
        res.redirect('/tnx');

        // Process in background after response
        try {
            // Save to database
            const user = new Email(req.body);
            await user.save();

            // Trigger email sending
            fetch('/api/process-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: req.body.email,
                    name: req.body.name
                })
            }).catch(console.error);
        } catch (error) {
            console.error('Background processing error:', error);
        }

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
