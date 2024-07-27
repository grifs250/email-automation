const express = require('express');
const appController = require('../controller/appController.js');

const router = express.Router();

// routes
router.get('/', appController.index_get);

router.get('/tnx', appController.tnx_get);

router.post('/tnx', appController.tnx_post);


module.exports = router;