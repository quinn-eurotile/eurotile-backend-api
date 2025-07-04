const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ProductVariation = require('../models/ProductVariation');
const Order = require('../models/Order');
const { AdminSetting } = require('../models');

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
          { path: 'supplier', populate: { path: 'discounts' } },
          { path: 'productFeaturedImage' }
        ]
      },
      {
        path: 'items.variation',
        populate: [
          {
            path: 'variationImages',
            select: 'fileName filePath _id isDeleted isFeaturedImage'
          },
          {
            path: 'productFeaturedImage'


          },
          {
            path: 'categories',
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


async function getCartRelatedProducts(userId) {
  const cartData = await Cart.findOne({ userId, isDeleted: false })
    .populate([
      {
        path: 'items.product',
        populate: [{ path: 'supplier' },]
      },
      // {
      //   path: 'items.variation',
      //   populate: [
      //     {
      //       path: 'variationImages',
      //       select: 'fileName filePath _id isDeleted isFeaturedImage'
      //     },
      //     {
      //       path: 'productFeaturedImage'


      //     },
      //     {
      //       path: 'categories',
      //       select: 'name parent _id isDeleted'
      //     },
      //     { path: 'attributes' },
      //     {
      //       path: 'attributeVariations',
      //       populate: [
      //         { path: 'productAttribute' },
      //         { path: 'productMeasurementUnit' }
      //       ]
      //     }
      //   ]
      // }
    ]);

  if (!cartData) return null;

  // Step 2: Extract unique supplier IDs from cart items
  const supplierIds = cartData.items.map(item => item.product?.supplier?._id).filter(Boolean).map(id => id.toString());

  const uniqueSupplierIds = [...new Set(supplierIds)];

  // Step 3: Find other products where productCollection.supplier matches
  const relatedProducts = await Product.find({ 'supplier': { $in: uniqueSupplierIds }, isDeleted: false }).limit(10)
    .select('_id name supplier productVariations').populate([
      {
        path: 'productVariations',
        populate : {
          path : 'variationImages' 
        },
        match: { isDeleted: false }
      },
      {
        path: 'supplier',
        match: { isDeleted: false }
      }
    ]);
  
  const newArray = relatedProducts.map((product, index) => {
    return {
      id: product?._id,
      supId: product?.supplier?.id,
      supName: product?.supplier?.companyName,
      relatedProducts: product
    }
  })
  // Optional: Attach relatedProducts to the cart or return separately
  return {
    cartData,
    relatedProducts
  };
}

async function getCartById(cartId) {
  return await Cart.findOne({ _id: cartId, isDeleted: false })
    .populate([
      {
        path: 'items.product',
        populate: [
          { path: 'supplier', populate: { path: 'discounts' } },
          { path: 'productFeaturedImage' }
        ]
      },
      {
        path: 'items.variation',
        populate: [
          {
            path: 'variationImages',
            select: 'fileName filePath _id isDeleted isFeaturedImage'
          },
          {
            path: 'productFeaturedImage'


          },
          {
            path: 'categories',
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

async function saveCart(req, clientId = null) {
  try {
    const { items } = req.body;
    const userId = req.user.id;
    const adminSettings = await AdminSetting.findOne();
    const vatOnOrder = adminSettings?.vatOnOrder || 0;
    console.log('req.body 123', req.body)
    //console.log('items coming here ..........................', req.body);
    // 1. Check if the cart contains a free order item
    const isAddingFreeOrder = items?.some(item => item?.isSample && parseFloat(item?.price) === 0); // adjust as per your logic

    if (isAddingFreeOrder) {
      // 2. Calculate the start and end of the current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      // 3. Count free orders for this user in the current month
      const freeOrderCount = await Order.countDocuments({
        createdBy: userId,
        isFreeOrder: true,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });

      if (freeOrderCount >= 2) {
        throw { message: 'You have already placed 2 free orders this month.', statusCode: 422 };
      }
    }

    let cart = await Cart.findOne({ userId, isDeleted: false });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
        clientId: clientId,
        isClientOrder: !!clientId,
        vat: vatOnOrder
      });
    } else if (clientId) {
      cart.clientId = clientId;
      cart.isClientOrder = true;
    }

    //console.log('req?.body?.orderSummary?.shippingOption', req?.body?.orderSummary);

    cart.shippingOption = req?.body?.orderSummary?.shippingOption;
    cart.shipping = req?.body?.orderSummary?.shipping;

    // Ensure items is an array
    const itemsArray = Array.isArray(items) ? items : [items];

    // Skip validation if items array is empty
    if (itemsArray.length === 0) {
      cart.items = [];
      return await cart.save();
    }

    //console.log('itemsArray......................', itemsArray);

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
          cart.items[existingItemIndex].numberOfBoxes = (cart.items[existingItemIndex].numberOfBoxes || 0) + (item.numberOfBoxes || 0);
          if (item.price || item.isSample) {
            cart.items[existingItemIndex].price = item.price;
          }
        } else {
          // Add as new item
          validatedItems.push({
            product: product._id,
            variation: variation._id,
            discount: item?.discount,
            quantity: item.quantity || 1,
            numberOfTiles: item.numberOfTiles || 0,
            numberOfBoxes: item.numberOfBoxes || 0,
            attributes: item.attributes || {},
            price: item.price || (item.isSample ? 0 : (clientId ? variation.regularPriceB2B : variation.regularPriceB2C)),
            isNewVariation: item.isNewVariation || false,
            isSample: item.isSample || false,
            sampleAttributes: item.sampleAttributes || null,
          });
        }
      } catch (error) {
        console.error('Error validating cart item:', error);
        continue;
      }
    }

    // Add new items to cart
    cart.items.push(...validatedItems);

    console.log(items, 'itemsitems')

    cart.totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    cart.subtotal = Number(items.reduce((sum, item) => {
      // If discount exists and is > 0, apply it
      const discount = item.discount && item.discount > 0 ? item.discount : 0;
      const discountedPrice = item.price * (1 - discount / 100);
      return sum + (discountedPrice * item.quantity);
    }, 0).toFixed(2));

    const vatAmount = Number(((cart.subtotal * vatOnOrder) / 100).toFixed(2));
    cart.total = Number((cart.subtotal + vatAmount).toFixed(2));

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

async function updateCartItem(itemId, items) {
  try {
    const cart = await Cart.findOne({ 'items._id': itemId });
    if (!cart) return null;

    const item = cart.items.id(itemId);
    if (!item) return null;

    item.quantity = items.quantity;
    item.numberOfTiles = items.numberOfTiles;
    item.numberOfBoxes = items.numberOfBoxes;
    item.discount = items.discount;
    item.price = items.price;
    const newCart = await cart.save();


    newCart.subtotal = Number(newCart?.items.reduce((sum, item) => {
      // If discount exists and is > 0, apply it
      const discount = item.discount && item.discount > 0 ? item.discount : 0;
      const discountedPrice = item.price * (1 - discount / 100);
      return sum + (discountedPrice * item.quantity);
    }, 0).toFixed(2));

    const vatAmount = Number(((newCart.subtotal * newCart?.vat) / 100).toFixed(2));
    newCart.total = Number((newCart?.subtotal + vatAmount).toFixed(2));

    await newCart.save();
    return await getCartById(cart._id);
  } catch (error) {
    console.error("Error updating cart item:", error);
    throw error;
  }
}

async function removeCartItem(itemId) {
  const cart = await Cart.findOne({ 'items._id': itemId });
  // //console.log(cart, itemId, 'cartcartcart');

  if (!cart) return null;

  cart.items = cart.items.filter(item => item._id.toString() !== itemId);
  await cart.save();
  return await getCartById(cart?._id)
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
      numberOfBoxes: attributes.numberOfBoxes || 0,
      price: price || product.minPriceB2C,
      isNewVariation: isNewVariation
    };

    if (existingItemIndex !== -1 && !isNewVariation) {
      // Update existing item quantity
      cart.items[existingItemIndex].quantity += quantity;
      // Update other properties if needed
      cart.items[existingItemIndex].numberOfTiles = (cart.items[existingItemIndex].numberOfTiles || 0) + (attributes.numberOfTiles || 0);
      cart.items[existingItemIndex].numberOfBoxes = (cart.items[existingItemIndex].numberOfBoxes || 0) + (attributes.numberOfBoxes || 0);
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

async function deleteCartByUserId(userId) {
  console.log('userId running here', userId);
  return await Cart.findOneAndDelete({ userId });
}

module.exports = {
  getCartRelatedProducts,
  getCartByUser,
  saveCart,
  deleteCart,
  updateCartItem,
  removeCartItem,
  addItemToCart,
  updateShippingMethod,
  getCartById,
  deleteCartWhole,
  deleteCartByUserId
};
