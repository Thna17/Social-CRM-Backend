// stats.routes.js
const express = require('express');
const router = express.Router();
const { getOverviewStats } = require('../controllers/stats.controller');
const authenticateToken = require('../middleware/authenticateToken');

router.use(authenticateToken);
router.get('/overview', getOverviewStats);

module.exports = router;