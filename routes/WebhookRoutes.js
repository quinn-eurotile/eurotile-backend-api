const router = require('express').Router();
const { WebhookController } = require('../controllers');
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const webhookController = new WebhookController();

/* webhook Management */
router.post('/webhhok', multer().any(), auth, webhookController.handleStripeWebhook);

module.exports = router;
