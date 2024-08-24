const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    message: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    totalEmails: { type: Number, required: true },
    sentEmails: { type: Number, default: 0 }, // Emails successfully sent
    bouncedEmails: { type: Number, default: 0 }, // Emails that bounced
    openedEmails: { type: Number, default: 0 }, // Emails that were opened
    clickedEmails: { type: Number, default: 0 }, // Emails where links were clicked
    // Removed: failedEmails, failedEmailList - redundant with bounce tracking
});

module.exports = mongoose.model('Record', recordSchema);
