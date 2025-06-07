const router = require('express').Router();
const PaymentController = require('../controllers').PaymentController;
const paymentController = new PaymentController();
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = multer(); // If you haven't set a custom storage yet

// Stripe Routes
router.post('/stripe/create-payment-intent', auth, paymentController.createPaymentIntent);
router.get('/stripe/verify/:paymentIntentId', auth, paymentController.verifyStripePayment);
router.post('/stripe/create-payment-intent-public', paymentController.createPaymentIntentPublic);
// Klarna Routes
// router.post('/klarna/create-session', auth, paymentController.createKlarnaSession);
// router.get('/klarna/verify/:orderId', auth, paymentController.verifyKlarnaPayment);
// router.post('/klarna/push', paymentController.handleKlarnaPush); // No auth for Klarna webhooks

module.exports = router; 