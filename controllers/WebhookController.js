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
                case 'payment_intent.created':
                  const paymentIntentCreated = event.data.object;
                  console.log('PaymentIntent was created!', paymentIntentCreated);
                  // Then define and call a function to handle the event payment_intent.created
                  break;
                case 'payment_intent.succeeded':
                  const paymentIntentSucceeded = event.data.object;
                  console.log('PaymentIntent was succeeded!', paymentIntentSucceeded);
                  // Then define and call a function to handle the event payment_intent.succeeded
                  break;
                // ... handle other event types
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