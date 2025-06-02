// const { validationResult } = require('express-validator');
const { getCartByUser, saveCart, deleteCart } = require('../services/cartService');

async function getCartController(req, res) {
  try {
    const userId = req.params.userId;
    const cart = await getCartByUser(userId);
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function saveCartController(req, res) {
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { userId, items } = req.body;

  try {
    const cart = await saveCart(userId, items);
    res.json({ message: 'Cart saved successfully', cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteCartController(req, res) {
  try {
    const userId = req.params.userId;
    const cart = await deleteCart(userId);
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    res.json({ message: 'Cart deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getCartController, saveCartController, deleteCartController };
