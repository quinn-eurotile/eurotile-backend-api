const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');
const { validatePaymentIntent, validateKlarnaSession } = require('../validators/paymentValidator');
const emailService = require('../services/emailService');
const AdminSetting = require('../models/AdminSetting');
const User = require('../models/User');


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
      const orderData = req.body.orderData;
      delete req.body.cartItems;      
      const userId =  req?.user?.id
      const result = await paymentService.createPaymentIntent(req.body);

      if (!result.success) {
        return res.status(400).json(result);
      }
      
      const order = await orderService.createOrder({ userId: userId, cartItems : cartItems,orderData:orderData, paymentIntent: result.data.paymentIntent });
   
      res.status(200).json({
        ...result,
        data: {
          ...result.data,
          orderId: order._id // Include the order ID in the response
        }
      });
    } catch (error) {
      console.error('Payment intent creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
  async createPaymentIntentPublic(req, res) {
    // console.log('Starting createPaymentIntentPublic with body:', {
    //   cartItemsCount: req.body.cartItems?.length,
    //   orderData: {
    //     userId: req.body.orderData?.userId,
    //     email: req.body.orderData?.email,
    //     shipping: req.body.orderData?.shipping,
    //     total: req.body.orderData?.total
    //   }
    // });

    try {
      const cartItems = req.body.cartItems;
      const orderData = req.body.orderData;
      delete req.body.cartItems;      
      const userId = orderData?.userId;

      // Fetch user details to get email
      console.log('Fetching user details for ID:', userId);
      const user = await User.findById(userId).select('email name');
      console.log('User details fetched:', {
        userId: user?._id,
        email: user?.email,
        name: user?.name
      });

      if (!user) {
        console.error('User not found:', userId);
        return res.status(400).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log('Creating payment intent...');
      const result = await paymentService.createPaymentIntent(req.body);

      if (!result.success) {
        console.error('Payment intent creation failed:', result);
        return res.status(400).json(result);
      }

      console.log('Payment intent created successfully:', {
        intentId: result.data.paymentIntent.id,
        amount: result.data.paymentIntent.amount,
        status: result.data.paymentIntent.status
      });

      // Get admin settings for commission calculations
      console.log('Fetching admin settings...');
      const adminSettings = await AdminSetting.findOne();
      const vatOnCommission = adminSettings?.vatOnCommission || 0;
      console.log('Admin settings loaded:', { vatOnCommission });

      // Calculate commission for each item and total commission
      console.log('Calculating commissions...');
      let totalCommission = 0;
      const itemsWithCommission = cartItems.map(item => {
        const basePrice = item.variation?.regularPriceB2B || 0;
        const sellingPrice = item.price || 0;
        const itemCommission = Math.max(0, sellingPrice - basePrice);
        const itemTotalCommission = itemCommission * item.quantity;
        totalCommission += itemTotalCommission;

        console.log('Item commission calculated:', {
          productId: item.product?._id,
          basePrice,
          sellingPrice,
          itemCommission,
          itemTotalCommission
        });

        return {
          ...item,
          commission: itemCommission,
          totalCommission: itemTotalCommission
        };
      });

      // Add VAT to total commission if applicable
      const commissionWithVAT = totalCommission * (1 + (vatOnCommission / 100));
      console.log('Final commission calculation:', {
        totalCommission,
        vatRate: vatOnCommission,
        commissionWithVAT
      });
      
      console.log('Creating order...');
      // Create order with commission information
      const order = await orderService.createOrder({ 
        userId: userId, 
        cartItems: itemsWithCommission,
        orderData: {
          ...orderData,
          // commission: commissionWithVAT
          commission: totalCommission
        }, 
        paymentIntent: result.data.paymentIntent 
      });

      console.log('Order created successfully:', {
        orderId: order._id,
        total: order.total,
        // commission: commissionWithVAT
        commission: totalCommission
      });

      // Send confirmation email to both shipping address and user email
      console.log('Sending confirmation emails...');
      const shippingName = `${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}`;
     
      // Send to shipping address email
      if (user.email) {
        console.log('Sending confirmation to shipping email:', user.email);
        await emailService.sendOrderConfirmationEmail(
          order,
          user.email,
          shippingName
        );
      }

      // Send to user's registered email if different from shipping email
      if (user.email && user.email !== orderData.email) {
        console.log('Sending confirmation to user email:', user.email);
        await emailService.sendOrderConfirmationEmail(
          order,
          user.email,
          user.name || shippingName
        );
      }

      // Include order ID and commission in the response
      const response = {
        ...result,
        data: {
          ...result.data,
          orderId: order._id,
          commission: commissionWithVAT
        }
      };

      console.log('Sending successful response:', {
        orderId: order._id,
        success: true,
        commission: commissionWithVAT
      });

      res.status(200).json(response);
    } catch (error) {
      console.error('Payment intent creation error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        body: {
          cartItemsCount: req.body.cartItems?.length,
          orderData: req.body.orderData
        }
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
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
