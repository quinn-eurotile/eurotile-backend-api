// controllers/webhookController.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'your_webhook_secret';
const Order = require('../models/Order');
const PaymentDetail = require('../models/PaymentDetail');

module.exports = class WebhookController {

    async handleStripeWebhook(req, res) {
        const sig = req.headers['stripe-signature'];
        let event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err) {
            console.error('⚠️  Webhook signature verification failed.', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        try {
            switch (event.type) {
                case 'payment_intent.canceled':
                    const paymentIntentCreated = event.data.object;
                    console.log('PaymentIntent was canceled!', paymentIntentCreated);
                    await new WebhookController().updatePaymentStatus(paymentIntentCreated);
                    break;

                case 'payment_intent.succeeded':
                    const paymentIntentSucceeded = event.data.object;
                    console.log('PaymentIntent succeeded!', paymentIntentSucceeded);
                    await new WebhookController().updatePaymentStatus(paymentIntentSucceeded, true);
                    break;

                default:
                    console.log(`Unhandled event type ${event.type}`);
            }
            return res.status(200).send({ message: 'Webhook processed successfully' });
        } catch (err) {
            console.error('Webhook handling error:', err);
            return res.status(500).send('Webhook Error');
        }
    }

    async updatePaymentStatus(paymentIntent, isSucceeded = false) {
        try {
            // Find the payment detail by payment intent ID
            const paymentDetail = await PaymentDetail.findOne({ id: paymentIntent.id });
            if (!paymentDetail) {
                console.error('Payment detail not found for payment intent:', paymentIntent.id);
                return;
            }

            // Update payment detail status
            paymentDetail.status = paymentIntent.status;
            await paymentDetail.save();

            // Find and update the associated order
            const order = await Order.findById(paymentDetail.order);
            if (!order) {
                console.error('Order not found for payment detail:', paymentDetail._id);
                return;
            }

            // Update order status based on payment success
            if (isSucceeded) {
                order.paymentStatus = 'paid';
                order.orderStatus = 2; // Processing
            } else if (paymentIntent.status === 'canceled') {
                order.paymentStatus = 'failed';
                order.orderStatus = 0; // Cancelled
            }

            await order.save();
            console.log(`Updated order ${order._id} status to ${order.orderStatus}`);
        } catch (error) {
            console.error('Error updating payment status:', error);
            throw error;
        }
    }
};