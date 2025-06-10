const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ProductVariation = require('../models/ProductVariation');

// async function getCartByUser(userId) {
//   return await Cart.findOne({ userId, isDeleted: false })
//     .populate({
//       path: 'items.product',
//       populate: {
//         path: 'supplier productFeaturedImage'
//       }
//     })
//     .populate('items.variation');
// }
// async function getCartByUser(userId) {
//   return await Cart.findOne({ userId, isDeleted: false })
//     .populate([
//       {
//         path: 'items.product',
//         populate: {
//           path: 'supplier productFeaturedImage'
//         }
//       },
//       {
//       path: 'items.variation',
//       populate: {
//         path: 'variationImages' // Adjust this path to match your schema!
//       }
//     },
//     {
//       path: 'items.variation.attributeVariations',
//       populate: {
//         path: 'attributeVariations' // Adjust this path to match your schema!
//       }
//     }
//     ])
// }

async function getCartByUser(userId) {
  return await Cart.findOne({ userId, isDeleted: false })
    .populate([
      {
        path: 'items.product',
        populate: [
          { path: 'supplier' },
          { path: 'productFeaturedImage' }
        ]
      },
      {
        path: 'items.variation',
        populate: [
          { path: 'variationImages' ,
            select: 'fileName filePath _id isDeleted isFeaturedImage'
          },
          { path: 'productFeaturedImage'
         

           },
          { path: 'categories' ,
               select: 'name parent _id isDeleted'
          },
          { path: 'attributes' },
          {
            path: 'attributeVariations',
            populate: [
              { path: 'productAttribute' },
              { path: 'productMeasurementUnit' }
            ]
          }
        ]
      }
    ]);
}
async function getCartById(cartId) {
  return await Cart.findOne({ _id: cartId, isDeleted: false })
    .populate([
      {
        path: 'items.product',
        populate: [
          { path: 'supplier' },
          { path: 'productFeaturedImage' }
        ]
      },
      {
        path: 'items.variation',
        populate: [
          { path: 'variationImages' ,
            select: 'fileName filePath _id isDeleted isFeaturedImage'
          },
          { path: 'productFeaturedImage'
         

           },
          { path: 'categories' ,
               select: 'name parent _id isDeleted'
          },
          { path: 'attributes' },
          {
            path: 'attributeVariations',
            populate: [
              { path: 'productAttribute' },
              { path: 'productMeasurementUnit' }
            ]
          }
        ]
      }
    ]);
}

async function saveCart(userId, items = [], clientId = null) {
  try {
    let cart = await Cart.findOne({ userId, isDeleted: false });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
        clientId: clientId,
        isClientOrder: !!clientId
      });
    } else if (clientId) {
      cart.clientId = clientId;
      cart.isClientOrder = true;
    }

    // Ensure items is an array
    const itemsArray = Array.isArray(items) ? items : [items];

    // Skip validation if items array is empty
    if (itemsArray.length === 0) {
      cart.items = [];
      return await cart.save();
    }

    console.log('itemsArray......................', itemsArray);

    // Validate and format items before saving
    const validatedItems = [];
    for (const item of itemsArray) {
      // Skip invalid items
      if (!item || !item.productId || !item.variationId) {
        console.warn('Invalid item data:', item);
        continue;
      }

      try {
        const product = await Product.findById(item.productId);
        if (!product) {
          console.warn(`Product not found: ${item.productId}`);
          continue;
        }

        const variation = await ProductVariation.findById(item.variationId);
        if (!variation) {
          console.warn(`Product variation not found: ${item.variationId}`);
          continue;
        }

        // Check if similar item exists (same product, variation, and attributes)
        const existingItemIndex = cart.items.findIndex(cartItem =>
          cartItem.product.toString() === product._id.toString() &&
          cartItem.variation.toString() === variation._id.toString() &&
          JSON.stringify(cartItem.attributes) === JSON.stringify(item.attributes || {})
        );

        if (existingItemIndex !== -1 && !item.isNewVariation) {
          // Update existing item
          cart.items[existingItemIndex].quantity = item.quantity || 1;
          cart.items[existingItemIndex].numberOfTiles = (cart.items[existingItemIndex].numberOfTiles || 0) + (item.numberOfTiles || 0);
          cart.items[existingItemIndex].numberOfPallets = (cart.items[existingItemIndex].numberOfPallets || 0) + (item.numberOfPallets || 0);
          if (item.price || item.isSample) {
            cart.items[existingItemIndex].price = item.price;
          }
        } else {
          // Add as new item
          validatedItems.push({
            product: product._id,
            variation: variation._id,
            quantity: item.quantity || 1,
            numberOfTiles: item.numberOfTiles || 0,
            numberOfPallets: item.numberOfPallets || 0,
            attributes: item.attributes || {},
            price: item.price || (item.isSample ? 0 : (clientId ? variation.regularPriceB2B : variation.regularPriceB2C)),
            isNewVariation: item.isNewVariation || false,
            isSample: item.isSample || false,
            sampleAttributes: item.sampleAttributes || null
          });
        }
      } catch (error) {
        console.error('Error validating cart item:', error);
        continue;
      }
    }

    // Add new items to cart
    cart.items.push(...validatedItems);

    // Save cart and return populated version
    const savedCart = await cart.save();

    return await Cart.findById(savedCart._id)
      .populate({
        path: 'items.product',
        populate: {
          path: 'supplier productFeaturedImage'
        }
      })
      .populate('items.variation');

  } catch (error) {
    console.error('Error saving cart:', error);
    throw error;
  }
}

async function deleteCart(userId) {
  return await Cart.findOneAndUpdate(
    { userId },
    { isDeleted: true },
    { new: true }
  );
}
async function deleteCartWhole(id) {
  return await Cart.findOneAndUpdate(
    { _id: id },
    { isDeleted: true },
    { new: true }
  );
}

async function updateCartItem(itemId, quantity) {
  const cart = await Cart.findOne({ 'items._id': itemId });
  if (!cart) return null;

  const item = cart.items.id(itemId);
  if (!item) return null;

  item.quantity = quantity;
  return await cart.save();
}

async function removeCartItem(itemId) {
  const cart = await Cart.findOne({ 'items._id': itemId });
  // console.log(cart, itemId, 'cartcartcart');

  if (!cart) return null;

  cart.items = cart.items.filter(item => item._id.toString() !== itemId);
  return await cart.save();
}

async function addItemToCart(userId, productId, variationId, quantity, attributes = {}, price = null, isNewVariation = false) {
  try {
    // Find existing cart or create new one
    let cart = await Cart.findOne({ userId, isDeleted: false })
      .populate({
        path: 'items.product',
        populate: {
          path: 'supplier productFeaturedImage'
        }
      })
      .populate('items.variation');

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Validate product and variation
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');

    const variation = await ProductVariation.findById(variationId);
    if (!variation) throw new Error('Product variation not found');

    // Find existing item with exact same product, variation, and attributes match
    const existingItemIndex = cart.items.findIndex(item =>
      item.product._id.toString() === productId.toString() &&
      item.variation._id.toString() === variationId.toString() &&
      JSON.stringify(item.attributes) === JSON.stringify(attributes)
    );

    // Create new item object
    const newItem = {
      product: productId,
      variation: variationId,
      quantity: quantity,
      attributes: attributes,
      numberOfTiles: attributes.numberOfTiles || 0,
      numberOfPallets: attributes.numberOfPallets || 0,
      price: price || product.minPriceB2C,
      isNewVariation: isNewVariation
    };

    if (existingItemIndex !== -1 && !isNewVariation) {
      // Update existing item quantity
      cart.items[existingItemIndex].quantity += quantity;
      // Update other properties if needed
      cart.items[existingItemIndex].numberOfTiles = (cart.items[existingItemIndex].numberOfTiles || 0) + (attributes.numberOfTiles || 0);
      cart.items[existingItemIndex].numberOfPallets = (cart.items[existingItemIndex].numberOfPallets || 0) + (attributes.numberOfPallets || 0);
      if (price) {
        cart.items[existingItemIndex].price = price;
      }
    } else {
      // Add as new item
      cart.items.push(newItem);
    }

    // Save cart
    const updatedCart = await cart.save();

    // Return populated cart
    return await Cart.findById(updatedCart._id)
      .populate({
        path: 'items.product',
        populate: {
          path: 'supplier productFeaturedImage'
        }
      })
      .populate('items.variation');
  } catch (error) {
    console.error('Error adding item to cart:', error);
    throw error;
  }
}

async function updateShippingMethod(userId, method) {
  const cart = await Cart.findOne({ userId, isDeleted: false });
  if (!cart) return null;

  // Update shipping cost based on method
  switch (method) {
    case 'standard':
      cart.shipping = 0; // Free shipping
      break;
    case 'express':
      cart.shipping = 10;
      break;
    case 'overnight':
      cart.shipping = 15;
      break;
    default:
      cart.shipping = 0;
  }

  return await cart.save();
}

module.exports = {
  getCartByUser,
  saveCart,
  deleteCart,
  updateCartItem,
  removeCartItem,
  addItemToCart,
  updateShippingMethod,
  getCartById,
  deleteCartWhole
};
