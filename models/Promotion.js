const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const promotionSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['fixed', 'percentage'],
    required: true
  },
  discountValue: {
    type: Number,
    default : 0
  },
  code: { type: String, default: null },

  // Applicability
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default : []
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default : []
  }],
  minOrderValue: { type: Number, default: 0 },

  // Target audience
  targetAudience: {
    type: String,
    enum: ['all', 'trade_professionals', 'retail_customers'],
    default: 'all'
  },

  // Validity
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'scheduled', 'expired'],
    default: 'scheduled'
  },

  // Usage limits
  usageLimit: { type: Number, default: 0 }, // 0 = unlimited
  usageCount: { type: Number, default: 0 },

  isDeleted: {
    type: Boolean,
    default: false
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true
});


promotionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Promotion', promotionSchema);
