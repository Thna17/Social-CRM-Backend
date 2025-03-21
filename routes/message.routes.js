const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');


router.get('/pages/:pageId/messages', messageController.getMessages);
router.get('/pages/:pageId/:conversationId/message-details', messageController.getMessageDetail);

module.exports = router;