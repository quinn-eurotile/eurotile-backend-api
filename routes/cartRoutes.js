const express = require('express');
const router = express.Router();
const { 
  getCartController, 
  saveCartController, 
  deleteCartController,
  updateCartItemController,
  removeCartItemController,
  addToWishlistController,
  applyPromoCodeController,
  sendPaymentLink,
  getCartByIdController,
  updateOrderStatusController,
  getOrderByIdController,
  deleteCartWholeController,
  removeCartByUserIdController,
  getRelatedProductByIdController
} = require('../controllers/cartController'); 
const auth = require("../middleware/authMiddleware");
// Get user's cart
router.get('/:userId', auth, getCartController);

// Save/Update entire cart
router.post('/', auth, saveCartController);

// Delete cart
router.delete('/:userId', auth, deleteCartController);
router.delete('/cart/:id', deleteCartWholeController);
// Update cart item quantity
router.put('/item', auth, updateCartItemController);

// Remove item from cart
router.delete('/item/:id', auth, removeCartItemController);

// Move item to wishlist
router.post('/wishlist', auth, addToWishlistController);

// Apply promo code
router.post('/promo', auth, applyPromoCodeController);

router.post('/send-payment-link', auth, sendPaymentLink);
router.get('/cart/:id', getCartByIdController);
router.post('/update-order-status/:id', auth, updateOrderStatusController);
router.get('/order/:id', getOrderByIdController);
router.get('/related-products/:id', getRelatedProductByIdController);
router.delete('/cart/user/:userId', auth, removeCartByUserIdController);

module.exports = router;
