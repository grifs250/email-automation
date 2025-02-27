const express = require('express');
const { body, validationResult } = require('express-validator');
const appController = require('../controller/appController.js');
const rateLimit = require('express-rate-limit');
const emailValidator = require('deep-email-validator');

const router = express.Router();

// Rate limiter configuration
const submitLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 5, // limit each IP to 5 submissions per window
    message: 'Pārāk daudz mēģinājumu. Lūdzu mēģiniet vēlāk.'
});

// Routes
router.get('/', appController.index_get);
router.get('/tnx', appController.tnx_get);
router.get('/terms', (req, res) => {
    res.render('terms', { title: 'Lietošanas noteikumi' });
});

router.post('/submit', submitLimiter, [
    body('name')
        .trim()
        .isLength({ min: 2 }).withMessage('Vārdam ir jābūt vismaz 2 rakstzīmju garumā')
        .isLength({ max: 100 }).withMessage('Vārds nedrīkst būt garāks par 100 rakstzīmēm')
        .escape(),
    body('email')
        .isEmail().withMessage('Lūdzu ievadiet derīgu e-pasta adresi')
        .normalizeEmail({ gmail_remove_dots: false }),
    body('consent')
        .exists().withMessage('Jums ir jāpiekrīt lietošanas noteikumiem')
], async (req, res) => {
    try {
        // Check express-validator results first
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('index', { 
                errors: errors.array() 
            });
        }

        // Check honeypot
        if (req.body.website) {
            return res.render('index', { 
                errors: [{ msg: 'Kļūda sistēmā. Lūdzu mēģiniet vēlāk.' }] 
            });
        }

        // Validate email
        const { valid } = await emailValidator.validate(req.body.email);
        if (!valid) {
            return res.render('index', { 
                errors: [{ msg: 'Lūdzu ievadiet derīgu e-pasta adresi' }] 
            });
        }

        // If all validations pass, call the existing controller
        await appController.tnx_post(req, res);
        
    } catch (error) {
        console.error('Submission error:', error);
        res.render('index', { 
            errors: [{ msg: 'Radās kļūda. Lūdzu mēģiniet vēlāk.' }] 
        });
    }
});

module.exports = router;
