// const { validationResult } = require('express-validator');
const { getCartByUser, saveCart, deleteCart, updateCartItem, removeCartItem } = require('../services/cartService');
const { addToWishlist } = require('../services/wishlistService.js');
const { validatePromoCode } = require('../services/promoService');

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

    const updatedCartItem = await updateCartItem(items.productId, items.quantity);
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
    const { items } = req.body;
    const userId = req.user.id;
    // console.log(userId, 'userId');
    // return false;
    const updatedCart = await saveCart(userId, items);

    res.json({
      success: true,
      data: updatedCart
    });
  } catch (error) {
    console.error('Error saving cart:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save cart'
    });
  }
};

// Update cart item
const updateCartItemController = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const updatedCart = await updateCartItem(itemId, quantity);
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
    const { itemId } = req.params;

    const updatedCart = await removeCartItem(itemId);
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

module.exports = {
  getCartController,
  saveCartController,
  deleteCartController,
  updateCartItemController,
  removeCartItemController,
  addToCartController,
  addToWishlistController,
  applyPromoCodeController
};
