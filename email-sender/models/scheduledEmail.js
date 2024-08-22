const mongoose = require('mongoose');

const scheduledEmailSchema = new mongoose.Schema({
    recordId: { type: mongoose.Schema.Types.ObjectId, ref: 'Record', required: true },
    scheduledTime: { type: Date, required: true },
    status: { type: String, enum: ['active', 'sent', 'cancelled'], default: 'active' }
});

module.exports = mongoose.model('ScheduledEmail', scheduledEmailSchema);
