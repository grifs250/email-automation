const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const emailSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+\@.+\..+/, 'Please enter a valid email address']
    }
}, { timestamps: true });

const Email = mongoose.model('Email', emailSchema);
module.exports = Email;
