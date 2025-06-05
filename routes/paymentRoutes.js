const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// Stripe Routes
router.post('/stripe/create-payment-intent', auth, paymentController.createPaymentIntent);
router.get('/stripe/verify/:paymentIntentId', auth, paymentController.verifyStripePayment);

// Klarna Routes
router.post('/klarna/create-session', auth, paymentController.createKlarnaSession);
router.get('/klarna/verify/:orderId', auth, paymentController.verifyKlarnaPayment);
router.post('/klarna/push', paymentController.handleKlarnaPush); // No auth for Klarna webhooks

module.exports = router; 