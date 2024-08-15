const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    message: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    totalEmails: { type: Number, required: true },
    sentEmails: { type: Number, default: 0 },
    failedEmails: { type: Number, default: 0 },
    failedEmailList: [{ type: String }]
});

module.exports = mongoose.model('Record', recordSchema);
