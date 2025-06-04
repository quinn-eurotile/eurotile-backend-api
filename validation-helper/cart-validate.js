const Validator = require('validatorjs');

// Custom rule to check if a value is a valid MongoDB ObjectId or null/empty
Validator.register('isMongoIdOrNull', function (value) {
  if (value === null || value === undefined || value === '') return true;
  return /^[0-9a-fA-F]{24}$/.test(value);
}, 'The :attribute must be a valid MongoDB ObjectId or null.');

// Custom rule to validate each item in the cart items array
Validator.registerAsync('validateCartItems', function(items, attribute, req, passes) {
  if (!Array.isArray(items) || items.length === 0) {
    passes(false, 'The cart must have at least one item.');
    return;
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (!item.product || !/^[0-9a-fA-F]{24}$/.test(item.product)) {
      passes(false, `items[${i}].product must be a valid MongoDB ObjectId.`);
      return;
    }

    if (!item.variation || !/^[0-9a-fA-F]{24}$/.test(item.variation)) {
      passes(false, `items[${i}].variation must be a valid MongoDB ObjectId.`);
      return;
    }

    if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
      passes(false, `items[${i}].quantity must be a number and at least 1.`);
      return;
    }

    if (typeof item.price !== 'number' || item.price < 0) {
      passes(false, `items[${i}].price must be a positive number.`);
      return;
    }
  }

  passes();
});

/** Validate Cart Before Save/Update */
const validateCart = (req, res, next) => {
  const rules = {
    userId: 'required|isMongoId',
    items: 'required|validateCartItems',
  };

  const validation = new Validator(req.body, rules);

  validation.checkAsync(
    () => next(),
    () => {
      res.status(422).json({
        type: 'validation_error',
        message: 'Your form data is invalid',
        data: validation.errors.all(),
      });
    }
  );
};

module.exports = { validateCart };
