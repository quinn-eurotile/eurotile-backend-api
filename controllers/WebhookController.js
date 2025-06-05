// controllers/webhookController.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'your_webhook_secret';

module.exports = class WebhookController {

    async handleStripeWebhook(req, res) {

        console.log('Webhook received! endpointSecret',endpointSecret);
       
        let event = req.body;

        if (endpointSecret) {
            const signature = req.headers['stripe-signature'];
            console.log('Webhook received! signature',signature);
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
                case 'payment_intent.created':
                    const paymentIntentCreated = event.data.object;
                    console.log('PaymentIntent was created!', paymentIntentCreated);
                    return res.status(200).send({ message: 'Payment Intent Succeeded', data: paymentIntentSucceeded });
                case 'payment_intent.succeeded':
                    const paymentIntentSucceeded = event.data.object;
                    return res.status(200).send({ message: 'Payment Intent Succeeded', data: paymentIntentSucceeded });
                default:
                    return res.status(500).send({ message: `Unhandled event type ${event.type}` });
            }
            return res.status(200).send({ message: 'Webhook received successfully' });
        } catch (err) {
            console.error('Webhook handling error:', err);
            return res.status(500).send('Webhook Error');
        }
    }

};