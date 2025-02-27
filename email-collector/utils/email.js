import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create transporter with correct Gmail settings
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL || '',  // Safer access
        pass: process.env.APP_PASS || '',  // Safer access
    },
    secure: true,  // Use SSL/TLS
    pool: true,
    maxConnections: 1,
    rateDelta: 1000,
    rateLimit: 3
});

// Verify connection configuration
transporter.verify(function(error, success) {
    if (error) {
        console.log('SMTP connection error:', error);
    } else {
        console.log('SMTP server is ready to take our messages');
    }
});

// Queue system manages the email sending
const emailQueue = [];
let isProcessing = false;

async function processEmailQueue() {
    if (isProcessing || emailQueue.length === 0) return;
    isProcessing = true;
    
    while (emailQueue.length > 0) {
        const emailData = emailQueue.shift();
        try {
            await sendEmailDirectly(emailData);
            console.log(`✉️ Email queued for processing: ${emailData.to}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('❌ Failed to send email:', error);
        }
    }
    
    isProcessing = false;
}

async function sendEmailDirectly(emailData) {
    console.log(`📧 Attempting to send email to: ${emailData.to}`);
    
    const emailHTML = await ejs.renderFile(
        path.join(process.cwd(), 'views', `${emailData.template}.ejs`),
        emailData.context
    );

    const result = await transporter.sendMail({
        from: process.env.EMAIL || '',  // Safer access
        to: emailData.to,
        subject: emailData.subject,
        html: emailHTML,
    });

    console.log(`✅ Email sent successfully to ${emailData.to}`);
    console.log(`📨 Message ID: ${result.messageId}`);
    
    return result;
}

export async function sendEmail(emailData) {
    console.log(`📥 Adding email to queue for: ${emailData.to}`);
    emailQueue.push(emailData);
    setImmediate(processEmailQueue);
} 