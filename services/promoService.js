const PromoCode = require('../models/PromoCode');

async function validatePromoCode(code, cartTotal) {
  const promo = await PromoCode.findOne({ 
    code, 
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() }
  });

  if (!promo) {
    return {
      isValid: false,
      message: 'Invalid or expired promo code'
    };
  }

  // Check minimum order amount if specified
  if (promo.minOrderAmount && cartTotal < promo.minOrderAmount) {
    return {
      isValid: false,
      message: `Minimum order amount of $${promo.minOrderAmount} required`
    };
  }

  // Calculate discount
  let discount = 0;
  if (promo.discountType === 'percentage') {
    discount = (cartTotal * promo.discountValue) / 100;
    if (promo.maxDiscount) {
      discount = Math.min(discount, promo.maxDiscount);
    }
  } else {
    discount = promo.discountValue;
  }

  return {
    isValid: true,
    discount,
    message: 'Promo code applied successfully'
  };
}

module.exports = {
  validatePromoCode
}; 