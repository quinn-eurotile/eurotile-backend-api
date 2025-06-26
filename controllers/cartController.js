// const { validationResult } = require('express-validator');
const { getCartByUser, getCartRelatedProducts, saveCart, deleteCart, updateCartItem, removeCartItem, getCartById, deleteCartWhole, deleteCartByUserId } = require('../services/cartService');
const { addToWishlist } = require('../services/wishlistService.js');
const { validatePromoCode } = require('../services/promoService');
const { sendPaymentLinkEmail } = require('../services/emailService');
const Cart = require('../models/Cart');
const User = require('../models/User');
const constants = require('../configs/constant');
const { getOrderById, updateOrderStatus } = require('../services/orderService');
// Get cart
const getCartController = async (req, res) => {
  try {
    const cart = await getCartByUser(req.user.id);
    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cart'
    });
  }
};
const getRelatedProductByIdController = async (req, res) => {
  try {
    const cart = await getCartRelatedProducts(req.params.id);
    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cart'
    });
  }
};
const getCartByIdController = async (req, res) => {
  try {
    const cart = await getCartById(req.params.id);
    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cart'
    });
  }
};

// Add to cart
const addToCartController = async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.user.id;
    if (!items) {
      return res.status(400).json({
        success: false,
        message: 'Items are required'
      });
    }

    const updatedCart = await getCartByUser(userId);
    if (!updatedCart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const updatedCartItem = await updateCartItem(items.productId, items);
    if (!updatedCartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    res.json({
      success: true,
      data: updatedCart
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add to cart'
    });
  }
};

// Save cart
const saveCartController = async (req, res) => {
  try {
    //console.log('shippingOption', req.body);
    const updatedCart = await saveCart(req);
    
    res.json({
      success: true,
      data: updatedCart
    });
  } catch (error) {
    console.error('Error saving cart:', error);
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Update cart item
const updateCartItemController = async (req, res) => {
  try {
    // const { itemId } = req.params;
    const { id ,quantity } = req.body;

    // // //console.log(req.params, req.body ,'req.bodyreq.body');
    

    const updatedCart = await updateCartItem(id, quantity);
    if (!updatedCart) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }
    return res.status(201).json({ data: updatedCart, message: 'Cart item updated successfully' });

    
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item'
    });
  }
};

// Remove cart item
const removeCartItemController = async (req, res) => {
  try {
    const { id } = req.params;
 
    const updatedCart = await removeCartItem(id);
    if (!updatedCart) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    res.json({
      success: true,
      data: updatedCart
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove cart item'
    });
  }
};

// Delete cart
const deleteCartController = async (req, res) => {
  try {
    const userId = req.user.id;

    const deletedCart = await deleteCart(userId);
    if (!deletedCart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    res.json({
      success: true,
      data: deletedCart
    });
  } catch (error) {
    console.error('Error deleting cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete cart'
    });
  }
};
const deleteCartWholeController = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCart = await deleteCartWhole(id);
    if (!deletedCart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    res.json({
      success: true,
      data: deletedCart
    });
  } catch (error) {
    console.error('Error deleting cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete cart'
    });
  }
};

const removeCartByUserIdController = async (req, res) => {

  try {
    const { userId } = req.params;
    const deletedCart = await deleteCartByUserId(userId);
    if (!deletedCart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    res.json({
      success: true,
      data: deletedCart
    });
  } catch (error) {
    console.error('Error deleting cart:', error);
    res.status(500).json({
      success: false, 
      message: 'Failed to delete cart'
    });
  }
}

  const addToWishlistController = async (req, res) => {
  try {
    const { itemId } = req.body;
    const userId = req.user.id; // Assuming user is authenticated
    
    if (!itemId) {
      return res.status(400).json({ 
        success: false,
        message: 'Item ID is required' 
      });
    }

    const wishlistItem = await addToWishlist(userId, itemId);
    
    res.json({
      success: true,
      message: 'Item added to wishlist successfully',
      data: wishlistItem
    });

  } catch (err) {
    console.error('Error adding to wishlist:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error adding to wishlist' 
    });
  }
};

const applyPromoCodeController = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id; // Assuming user is authenticated
    
    if (!code) {
      return res.status(400).json({ 
        success: false,
        message: 'Promo code is required' 
      });
    }

    // Get current cart to calculate discount
    const cart = await getCartByUser(userId);
    if (!cart) {
      return res.status(404).json({ 
        success: false,
        message: 'Cart not found' 
      });
    }

    // Validate promo code and get discount
    const promoResult = await validatePromoCode(code, cart.subtotal);
    if (!promoResult.isValid) {
      return res.status(400).json({ 
        success: false,
        message: promoResult.message 
      });
    }

    // Update cart with promo code and discount
    cart.promoCode = code;
    cart.discount = promoResult.discount;
    await cart.save();

    // Return updated cart data
    const formattedResponse = await formatCartResponse(cart);
    
    res.json({
      success: true,
      message: 'Promo code applied successfully',
      data: formattedResponse
    });

  } catch (err) {
    console.error('Error applying promo code:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error applying promo code' 
    });
  }
};

// Helper function to format cart response consistently
const formatCartResponse = async (cart) => {
  const items = cart.items.map(item => {
    const product = item.product || {};
    const variation = item.variation || {};
    const price = variation.salePrice || variation.regularPriceB2C || product.minPriceB2C || 0;
    const originalPrice = variation.regularPriceB2C || product.maxPriceB2C || null;
    
    let imgSrc = '/images/products/default.jpg';
    if (product.productFeaturedImage && product.productFeaturedImage.filePath) {
      imgSrc = product.productFeaturedImage.filePath;
    }

    return {
      id: product._id,
      productName: product.name || "Unnamed Product",
      imgSrc: imgSrc,
      imgAlt: product.name || "Product Image",
      soldBy: product.supplier?.name || "Unknown Supplier",
      inStock: (variation.stockStatus || product.stockStatus) === 'in_stock',
      price: price,
      originalPrice: originalPrice,
      count: item.quantity,
      rating: 4.0
    };
  });

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.count), 0);
  const shipping = cart.shipping || 20;
  const discount = cart.discount || 0;
  const total = subtotal + shipping - discount;

  return {
    userId: cart.userId,
    items,
    orderSummary: {
      subtotal,
      discount,
      shipping,
      total
    }
  };
};

// Send payment link to client
async function sendPaymentLink(req, res) {
  try {
    const {
      cartId,
      clientId,
      cartItems,
      shippingAddress,
      shippingMethod,
      orderSummary,
      tradeProfessionalId
    } = req.body;

    console.log(req.body,'req.body');

    // Validate required fields
    if (!cartId || !clientId || !cartItems || !orderSummary) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

   
    // Get client details from User model where role is Client
    const client = await User.findOne({ _id: clientId, roles: { $in: [constants?.clientRole.id] } });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    console.log('orderSummary=======================', {
      // cartId,
      userId:clientId,
      items: cartItems,
      // shippingAddress,
      // shippingMethod,
      total:orderSummary?.total,
      shippingOption:orderSummary?.shippingOption,
      shipping:orderSummary?.shipping,
      vat:orderSummary?.vat,
      tradeProfessionalId: tradeProfessionalId||null
      // expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    });

    // Save cart data
    const cart = new Cart({
      // cartId,
      userId:clientId,
      items: cartItems,
      // shippingAddress,
      // shippingMethod,
      total:orderSummary?.total,
      shippingOption:orderSummary?.shippingOption,
      shipping:orderSummary?.shipping,
      vat:orderSummary?.vat,
      tradeProfessionalId: tradeProfessionalId||null
      // expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    });
    await cart.save();

    // Send email
    const emailData = {
      cartId:cart._id,
      clientId,
      clientName: client.name || `${client.firstName} ${client.lastName}`,
      clientEmail: client.email,
      cartItems,
      orderSummary
    };

    const emailSent = await sendPaymentLinkEmail(emailData);
   //console.log(emailSent, 'emailSentemailSent');
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send payment link email'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment link sent successfully',
      data: {
        cartId,
        expiresAt: cart.expiresAt
      }
    });

  } catch (error) {
    console.error('Error in sendPaymentLink:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

const updateOrderStatusController = async (req, res) => { 
  try {
    
    const { id } = req.params;
    //console.log(req.body ,req.params,'req.body ,req.params');
    const updatedOrder = await updateOrderStatus(id, req.body);
    res.status(200).json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
const getOrderByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    //console.log(id,'id');
    const order = await getOrderById(id);
    //console.log(order,'order');
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error in getOrderById:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

module.exports = {
  getRelatedProductByIdController,
  getCartController,
  saveCartController,
  deleteCartController,
  updateCartItemController,
  removeCartItemController,
  addToCartController,
  addToWishlistController,
  applyPromoCodeController,
  sendPaymentLink,
  getCartByIdController,
  updateOrderStatusController,
  getOrderByIdController,
  deleteCartWholeController,
  removeCartByUserIdController
};
