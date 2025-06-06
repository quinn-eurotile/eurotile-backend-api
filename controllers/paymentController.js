const { generateSku } = require('../_helpers/common');
const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');
const { validatePaymentIntent, validateKlarnaSession } = require('../validators/paymentValidator');


module.exports = class PaymentController {
  // Create Stripe Payment Intent
  async createPaymentIntent(req, res) {
    
    try {
      // const { error } = validatePaymentIntent(req.body);
      // if (error) {
      //   return res.status(400).json({
      //     success: false,
      //     message: error.details[0].message
      //   });
      // }
      const cartItems = req.body.cartItems;
      delete req.body.cartItems;      
      const userId =  req?.user?.id
      const result = await paymentService.createPaymentIntent(req.body);

      if (!result.success) {
        return res.status(400).json(result);
      }
      
      orderService.createOrder({ userId: userId, cartItems : cartItems, paymentIntent: result.data.paymentIntent });
      res.status(200).json(result);
    } catch (error) {
      console.error('Payment intent creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
  async verifyStripePayment(req, res) {
    try {
      const { paymentIntentId } = req.params;

      if (!paymentIntentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment intent ID is required'
        });
      }

      const result = await paymentService.verifyStripePayment(paymentIntentId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }


  // Create Klarna Session
  // exports.createKlarnaSession = async (req, res) => {
  //   try {
  //     const { error } = validateKlarnaSession(req.body);
  //     if (error) {
  //       return res.status(400).json({
  //         success: false,
  //         message: error.details[0].message
  //       });
  //     }

  //     const result = await paymentService.createKlarnaSession(req.body);

  //     if (!result.success) {
  //       return res.status(400).json(result);
  //     }

  //     res.status(200).json(result);
  //   } catch (error) {
  //     console.error('Klarna session creation error:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: 'Internal server error'
  //     });
  //   }
  // };



  // Verify Klarna Payment
  // exports.verifyKlarnaPayment = async (req, res) => {
  //   try {
  //     const { orderId } = req.params;

  //     if (!orderId) {
  //       return res.status(400).json({
  //         success: false,
  //         message: 'Klarna order ID is required'
  //       });
  //     }

  //     const result = await paymentService.verifyKlarnaPayment(orderId);

  //     if (!result.success) {
  //       return res.status(400).json(result);
  //     }

  //     res.status(200).json(result);
  //   } catch (error) {
  //     console.error('Klarna verification error:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: 'Internal server error'
  //     });
  //   }
  // };

  // Handle Klarna Push Notification
  // exports.handleKlarnaPush = async (req, res) => {
  //   try {
  //     const { klarna_order_id } = req.query;

  //     if (!klarna_order_id) {
  //       return res.status(400).json({
  //         success: false,
  //         message: 'Klarna order ID is required'
  //       });
  //     }

  //     const result = await paymentService.verifyKlarnaPayment(klarna_order_id);

  //     // Update order status based on Klarna payment status
  //     if (result.success && result.data.status === 'COMPLETED') {
  //       // Update your order status here
  //       // await orderService.updateStatus(orderId, 'PAID');
  //     }

  //     res.status(200).json({ success: true });
  //   } catch (error) {
  //     console.error('Klarna push notification error:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: 'Internal server error'
  //     });
  //   }
  // }; 

};
