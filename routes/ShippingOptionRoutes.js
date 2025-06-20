const express = require('express');
const router = express.Router();
const ShippingOptionController = require('../controllers').ShippingOptionController;
const shippingOptionController = new ShippingOptionController();
const auth = require('../middleware/authMiddleware'); // if needed
const multer = require("multer");

router.get('/', multer().any(), auth, shippingOptionController.getShippingOptions);
router.put('/:id', multer().any(), auth, shippingOptionController.updateShippingOption);

module.exports = router;