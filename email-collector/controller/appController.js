const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');
const Email = require('../models/email');
const path = require('path');
const ejs = require('ejs');
require('dotenv').config();

// Create transporter once
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.APP_PASS,
    },
    pool: true, // Use pooled connections
    maxConnections: 1,
    rateDelta: 1000,
    rateLimit: 3
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('index', {
            title: 'Treniņprogramma',
            errors: errors.array(),
            oldInput: req.body
        });
    }

    try {
        // Save to database first
        const user = new Email(req.body);
        await user.save();
        
        // Queue the email task
        emailQueue.push({
            email: user.email,
            context: { 
                name: user.name,
                programLink: "https://docs.google.com/spreadsheets/d/1oMrSgnYp54GaVxjGBW4_7Q3EmmVBs1GFg_k99bb8Y-E/edit?usp=sharing"
            }
        });

        // Start processing queue in background
        setImmediate(processEmailQueue);
        
        // Redirect immediately
        res.redirect('/tnx');

    } catch (error) {
        console.error('Error:', error);
        if (error.code === 11000) {
            return res.status(400).render('index', {
                title: 'Treniņprogramma',
                errors: [{ msg: 'Šis e-pasts jau ir reģistrēts' }]
            });
        }
        res.status(500).render('error', { title: 'Error' });
    }
};

module.exports = {
    index_get,
    tnx_get,
    tnx_post,
};
