const mongoose = require('mongoose');

const emailStatusSchema = new mongoose.Schema({
    recordId: { type: mongoose.Schema.Types.ObjectId, ref: 'Record', required: true },
    email: { type: String, required: true },
    status: { type: String, enum: ['sent', 'failed', 'bounced'], default: 'sent' },
    bouncedAt: { type: Date },
    bounceType: { type: String, enum: ['hard', 'soft'] }
});

module.exports = mongoose.model('EmailStatus', emailStatusSchema);
