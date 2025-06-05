// controllers/webhookController.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'your_webhook_secret';

module.exports = class WebhookController {

    async handleStripeWebhook(req, res) {
        let event = req.body;

        if (endpointSecret) {
            const signature = req.headers['stripe-signature'];

            try {
                event = stripe.webhooks.constructEvent(
                    req.body,
                    signature,
                    endpointSecret
                );
            } catch (err) {
                console.error('⚠️  Webhook signature verification failed.', err.message);
                return res.sendStatus(400);
            }
        }

        try {
            switch (event.type) {
                case 'payment_intent.succeeded': {
                    const paymentIntent = event.data.object;
                    console.log(`✅ PaymentIntent for ${paymentIntent.amount} succeeded.`);
                    // Handle successful payment here
                    break;
                }
                case 'payment_method.attached': {
                    const paymentMethod = event.data.object;
                    console.log(`✅ Payment method attached: ${paymentMethod.id}`);
                    // Handle attachment of payment method here
                    break;
                }
                default:
                    console.log(`Unhandled event type ${event.type}`);
            }
            return res.status(200).send();
        } catch (err) {
            console.error('Webhook handling error:', err);
            return res.status(500).send('Webhook Error');
        }
    }

};