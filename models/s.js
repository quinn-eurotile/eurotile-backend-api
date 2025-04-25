const mongoose = require('mongoose');
const { Schema } = mongoose;

const promotionSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: null },
  type: {    type: String,    enum: ['percentage', 'fixed'],    required: true  },
  value: { type: Number, required: true },
  code: { type: String, default: null },

  // Applicability
  applicableProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  applicableCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
  minOrderValue: { type: Number, default: 0 },

  // Target audience
  targetAudience: {    type: String,    enum: ['all', 'trade', 'retail'],    default: 'all'  },

  // Validity
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: {    type: String,    enum: ['active', 'scheduled', 'expired', 'cancelled'],    default: 'scheduled'  },

  // Usage limits
  usageLimit: { type: Number, default: 0 }, // 0 = unlimited
  usageCount: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Promotion', promotionSchema);
