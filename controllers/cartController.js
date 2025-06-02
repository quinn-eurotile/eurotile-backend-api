// const { validationResult } = require('express-validator');
const { getCartByUser, saveCart, deleteCart } = require('../services/cartService');

 
async function getCartController(req, res) {
  try {
    const userId = req.params.userId;
    const cart = await getCartByUser(userId);
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    // Map the cart items to match the old data structure
    const items = cart.items.map(item => {
      const product = item.product || {};
      const variation = item.variation || {};
  console.log(product,'product00000000000000iiiiiiiiii');
  
      // Decide which price to use (variation price first, fallback to product)
      const price = variation.salePrice || variation.regularPriceB2C || product.minPriceB2C || 0;
      const originalPrice = variation.regularPriceB2C || product.maxPriceB2C || null;

      return {
        id: product._id, // or variation._id if needed
        productName: product.name || "Unnamed Product",
        imgSrc: product.productFeaturedImage?.url || "/images/products/default.jpg",
        imgAlt: product.name || "Product Image",
        soldBy: product.supplier?.name || "Unknown Supplier",
        inStock: (variation.stockStatus || product.stockStatus) === 'in_stock',
        price: price,
        originalPrice: originalPrice,
        count: item.quantity,
        rating: 4.0 // default or calculate based on reviews if needed
      };
    });

    // Calculate order summary
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.count), 0);
    const discount = 0;
    const shipping = 20; // Static shipping, can be dynamic
    const total = subtotal + shipping - discount;

    res.json({
      success: true,
      message: "Cart data retrieved successfully",
      data: {
        userId,
        items,
        orderSummary: {
          subtotal,
          discount,
          shipping,
          total
        }
      }
    });

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
