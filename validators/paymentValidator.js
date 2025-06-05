const Joi = require('joi');

// Validate Stripe Payment Intent Request
exports.validatePaymentIntent = (data) => {
  const schema = Joi.object({
    amount: Joi.number().required().min(1),
    currency: Joi.string().required().length(3),
    customerId: Joi.string().optional(),
    saveCard: Joi.boolean().default(false)
  });

  return schema.validate(data);
};

// Validate Klarna Session Request
exports.validateKlarnaSession = (data) => {
  const schema = Joi.object({
    amount: Joi.number().required().min(1),
    currency: Joi.string().required().length(3),
    order_lines: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        quantity: Joi.number().required().min(1),
        unit_price: Joi.number().required().min(0),
        total_amount: Joi.number().required().min(0)
      })
    ).required(),
    shipping_address: Joi.object({
      given_name: Joi.string().required(),
      family_name: Joi.string().required(),
      email: Joi.string().email().required(),
      street_address: Joi.string().required(),
      city: Joi.string().required(),
      postal_code: Joi.string().required(),
      country: Joi.string().length(2).required(),
      phone: Joi.string().required()
    }).required()
  });

  return schema.validate(data);
}; 