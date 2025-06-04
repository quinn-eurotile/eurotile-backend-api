const Cart = require('../models/Cart');
 
async function getCartByUser(userId) {
  return Cart.findOne({ userId, isDeleted: false })
    .populate({
      path: 'items.product',
      populate: {
        path: 'productFeaturedImage',
        model: 'ProductFile',
      },
    })
    .populate('items.variation')
    .exec();
}

 async function saveCart(userId, items) {
  // Make sure items is an array
  const formattedItems = (Array.isArray(items) ? items : [items]).map(item => ({
    product: item.productId,
    variation: item.variationId,
    quantity: item.quantity,
    numberOfTiles: item.numberOfTiles,
    numberOfPallets: item.numberOfPallets,
    attributes: item.attributes,
    price: item.price,
  }));

  let cart = await Cart.findOne({ userId, isDeleted: false });

  if (cart) {
    cart.items = formattedItems;
  } else {
    cart = new Cart({ userId, items: formattedItems });
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
