const mongoose = require('mongoose');

const emailStatus = new mongoose.Schema({
    bulkSendId: { type: mongoose.Schema.Types.ObjectId, ref: 'BulkEmailSend', required: true },
    email: { type: String, required: true },
    status: { type: String, enum: ['sent', 'failed', 'bounced'], default: 'sent' },
    bouncedAt: { type: Date },
    bounceType: { type: String, enum: ['hard', 'soft'] } // New field for bounce type
});

module.exports = mongoose.model('EmailStatus', emailStatus);