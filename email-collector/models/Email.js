const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Email', emailSchema);
