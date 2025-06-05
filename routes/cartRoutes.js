const express = require('express');
const router = express.Router();
const { 
  getCartController, 
  saveCartController, 
  deleteCartController,
  updateCartItemController,
  removeCartItemController,
  addToWishlistController,
  applyPromoCodeController
} = require('../controllers/cartController'); 
const auth = require("../middleware/authMiddleware");
// Get user's cart
router.get('/:userId', auth, getCartController);

// Save/Update entire cart
router.post('/', auth, saveCartController);

// Delete cart
router.delete('/:userId', auth, deleteCartController);

// Update cart item quantity
router.put('/item', auth, updateCartItemController);

// Remove item from cart
router.delete('/item/:id', auth, removeCartItemController);

// Move item to wishlist
router.post('/wishlist', auth, addToWishlistController);

// Apply promo code
router.post('/promo', auth, applyPromoCodeController);

module.exports = router;
