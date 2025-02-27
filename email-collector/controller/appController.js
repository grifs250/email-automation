const { validationResult } = require('express-validator');
const Email = require('../models/email');
const { sendEmail } = require('../utils/email');
require('dotenv').config();

// Route Handlers
const index_get = (req, res) => {
    res.render('index', { title: 'Treniņprogramma', errors: [] });
};

const tnx_get = (req, res) => {
    res.render('tnx', { title: 'Paldies' });
};

const tnx_post = (req, res) => {
    // Basic validation only
    if (!req.body.email || !req.body.name || !req.body.consent) {
        return res.render('index', {
            title: 'Treniņprogramma',
            errors: [{ msg: 'Visi lauki ir obligāti' }]
        });
    }

    // Send to thank you page immediately
    res.redirect('/tnx');

    // Process in background
    process.nextTick(async () => {
        try {
            // Save to database
            const user = new Email({
                email: req.body.email,
                name: req.body.name
            });
            await user.save();
            console.log('✅ User saved to database:', user.email);

            // Queue email
            sendEmail({
                to: user.email,
                subject: 'Treniņu programma',
                template: 'mail',
                context: { 
                    name: user.name,
                    programLink: "https://docs.google.com/spreadsheets/d/1oMrSgnYp54GaVxjGBW4_7Q3EmmVBs1GFg_k99bb8Y-E/edit?usp=sharing"
                }
            }).catch(error => {
                console.error('❌ Email queuing error:', error);
            });

        } catch (error) {
            console.error('❌ Background processing error:', error);
        }
    });
};

module.exports = {
    index_get,
    tnx_get,
    tnx_post,
};
