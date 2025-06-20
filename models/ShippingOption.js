const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const ShippingOptionSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Rapid Delivery"
  cost: { type: Number, required: true }, // e.g. 6
  minDays: { type: Number, required: true },
  maxDays: { type: Number }, // optional for fixed-day options
  description: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

ShippingOptionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ShippingOption', ShippingOptionSchema);