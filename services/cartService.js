const Cart = require('../models/Cart');

async function getCartByUser(userId) {
  return Cart.findOne({ userId, isDeleted: false })
    .populate('items.product')
    .populate('items.variation')
    .exec();
}

async function saveCart(userId, items) {
  let cart = await Cart.findOne({ userId, isDeleted: false });

  if (cart) {
    cart.items = items;
  } else {
    cart = new Cart({ userId, items });
  }

  await cart.save();
  return cart;
}

async function deleteCart(userId) {
  const cart = await Cart.findOne({ userId, isDeleted: false });
  if (cart) {
    cart.isDeleted = true;
    await cart.save();
  }
  return cart;
}

module.exports = { getCartByUser, saveCart, deleteCart };
