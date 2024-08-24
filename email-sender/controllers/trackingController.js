const path = require('path');
const { checkBounces } = require('../services/imapService');

const Record = require('../models/record');
const EmailStatus = require('../models/emailStatus');

// Tracking opened emails and clicks in emails
const trackOpen = async (req, res) => {
    try {
        const { recordId, email } = req.query;

        // Update the openedEmails count
        const emailStatus = await EmailStatus.findOneAndUpdate(
            { recordId, email },
            { $inc: { openedEmails: 1 } }
        );

        if (emailStatus) {
            await Record.findByIdAndUpdate(recordId, { $inc: { openedEmails: 1 } });
        }

        // Return a 1x1 transparent pixel
        const img = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');
        res.writeHead(200, {
            'Content-Type': 'image/gif',
            'Content-Length': img.length
        });
        res.end(img);
    } catch (error) {
        console.error('Error tracking open:', error);
        res.status(500).send('Error tracking open');
    }
};

const trackClick = async (req, res) => {
    try {
        const { recordId, email, url } = req.query;

        // Check if email is provided
        if (!email) {
            console.error('Error: Email is required for tracking.');
            return res.status(400).send('Error: Email is required for tracking.');
        }

        // Update the clickedEmails count
        const emailStatus = await EmailStatus.findOneAndUpdate(
            { recordId, email },
            { $inc: { clickedEmails: 1 } },
            { new: true, upsert: false } // Ensure that upsert is set to false to prevent insertion of null emails
        );

        if (emailStatus) {
            await Record.findByIdAndUpdate(recordId, { $inc: { clickedEmails: 1 } });
        }

        // Redirect to the original URL
        res.redirect(url);
    } catch (error) {
        console.error('Error tracking click:', error);
        res.status(500).send('Error tracking click');
    }
};

module.exports = {
    trackOpen,
    trackClick
};