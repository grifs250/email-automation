const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const emailSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Vārds ir obligāts'],
        trim: true,
        minlength: [2, 'Vārdam jābūt vismaz 2 rakstzīmes garam'],
        maxlength: [100, 'Vārds nedrīkst būt garāks par 100 rakstzīmēm']
    },
    email: {
        type: String,
        required: [true, 'E-pasts ir obligāts'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+\@.+\..+/, 'Lūdzu, ievadiet derīgu e-pasta adresi']
    }
}, { timestamps: true });

const Email = mongoose.model('Email', emailSchema);
module.exports = Email;
