const express = require('express');
const router = express.Router();
const CmsController = require('../controllers/CmsController');

// GET /api/v1/cms/homepage-data
router.get('/homepage-data', (req, res) => CmsController.getHomePageData(req, res));

module.exports = router; 