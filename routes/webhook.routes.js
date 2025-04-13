// webhook.routes.js
const express = require('express');
const router = express.Router();
const { verifyWebhook, handleMessage } = require('../controllers/webhook.controller');

router.get('/', verifyWebhook);
router.post('/', handleMessage);

module.exports = router;