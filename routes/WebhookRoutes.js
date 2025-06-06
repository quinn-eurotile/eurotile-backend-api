const router = require('express').Router();
const { WebhookController } = require('../controllers');
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const webhookController = new WebhookController();
const bodyParser = require('body-parser');

/* webhook Management */
// router.post('/', multer().any(), webhookController.handleStripeWebhook);
router.post(
    '/',
    bodyParser.raw({ type: 'application/json' }), // 👈 required for Stripe
    webhookController.handleStripeWebhook
);

module.exports = router;
