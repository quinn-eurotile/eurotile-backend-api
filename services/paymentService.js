const { generateOrderId } = require('../_helpers/common');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// const Klarna = require('@klarna/node-sdk');

// Initialize Klarna client
// const klarna = new Klarna({
//   username: process.env.KLARNA_USERNAME,
//   password: process.env.KLARNA_PASSWORD,
//   environment: process.env.NODE_ENV === 'production' ? 'live' : 'playground'
// });

class PaymentService {
  // Create Stripe Payment Intent
  async createPaymentIntent({ amount, currency, customerId, saveCard }) {
    try {

      const orderId = generateOrderId();
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        setup_future_usage: saveCard ? 'off_session' : undefined,
        automatic_payment_methods: { enabled: true, },
        metadata: {
          orderId: orderId
        }
      });

      return {
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntent: paymentIntent
        }
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return {
        success: false,
        message: error.message || 'Failed to create payment intent'
      };
    }
  }

  // Verify Stripe Payment
  async verifyStripePayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        success: true,
        data: {
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        }
      };
    } catch (error) {
      console.error('Error verifying payment:', error);
      return {
        success: false,
        message: error.message || 'Failed to verify payment'
      };
    }
  }

  // Create Klarna Session
  // async createKlarnaSession({
  //   amount,
  //   currency,
  //   order_lines,
  //   shipping_address
  // }) {
  //   try {
  //     const session = await klarna.checkout.createOrder({
  //       purchase_country: "US",
  //       purchase_currency: currency,
  //       locale: "en-US",
  //       order_amount: amount,
  //       order_lines,
  //       shipping_address,
  //       merchant_urls: {
  //         terms: `${process.env.FRONTEND_URL}/terms`,
  //         checkout: `${process.env.FRONTEND_URL}/checkout`,
  //         confirmation: `${process.env.FRONTEND_URL}/confirmation?klarna_order_id={checkout.order.id}`,
  //         push: `${process.env.BACKEND_URL}/api/klarna/push?klarna_order_id={checkout.order.id}`
  //       }
  //     });

  //     return {
  //       success: true,
  //       data: {
  //         session_id: session.order_id,
  //         redirect_url: session.html_snippet
  //       }
  //     };
  //   } catch (error) {
  //     console.error('Error creating Klarna session:', error);
  //     return {
  //       success: false,
  //       message: error.message || 'Failed to create Klarna session'
  //     };
  //   }
  // }

  // Verify Klarna Payment
  // async verifyKlarnaPayment(orderId) {
  //   try {
  //     const order = await klarna.checkout.retrieveOrder(orderId);

  //     return {
  //       success: true,
  //       data: {
  //         status: order.status,
  //         order_id: order.order_id,
  //         amount: order.order_amount
  //       }
  //     };
  //   } catch (error) {
  //     console.error('Error verifying Klarna payment:', error);
  //     return {
  //       success: false,
  //       message: error.message || 'Failed to verify Klarna payment'
  //     };
  //   }
  // }
}

module.exports = new PaymentService(); 