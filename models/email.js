const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const emailSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [100, 'Name must be at most 100 characters long']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: [true, 'Email already exists'],
        trim: true,
        lowercase: true,
        match: [/.+\@.+\..+/, 'Please enter a valid email address']
    }
}, { timestamps: true });

const Email = mongoose.model('Email', emailSchema);
module.exports = Email;