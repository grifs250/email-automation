const express = require('express');
const { body, validationResult } = require('express-validator');
const appController = require('../controller/appController.js');

const router = express.Router();

// Routes
router.get('/', appController.index_get);
router.get('/tnx', appController.tnx_get);

router.post('/tnx', [
    // Validate and sanitize inputs
    body('name')
        .trim()
        .isLength({ min: 2 }).withMessage('Vārdam ir jābūt vismaz 2 rakstzīmju garumā')
        .isLength({ max: 100 }).withMessage('Vārds nedrīkst būt garāks par 100 rakstzīmēm')
        .escape(),
    body('email')
        .isEmail().withMessage('Lūdzu ievadiet derīgu e-pasta adresi')
        .normalizeEmail({ gmail_remove_dots: false }) // Preserve dots in the local part
], appController.tnx_post);

module.exports = router;
